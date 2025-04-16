import AsyncSocket, { Disconnect } from "../socket/socket.js";
import Schema from "../lib/schema.js";
import Fs from "fs";
import sockets from "./sockets.js";
import * as handlers from "./handlers.js";
import { emitCurrentVotes } from "./votes.js";

const games = new Map();
const playersInGame = new WeakMap();

export default (io, stateDirectory) => {
  const filename = (name) => `${stateDirectory}/${name}`;

  async function loadSchema(name) {
    // Use the cached games first, so all players share one instance.
    if (games.has(name)) {
      return games.get(name);
    }

    // Load from file if this game is not in memory already.
    const path = filename(name);
    let exists = true;
    try {
      await Fs.promises.access(path);
    } catch (e) {
      exists = false;
    }

    let data = { name };
    if (exists) {
      await Fs.promises.access(path, Fs.constants.R_OK);
      data = JSON.parse(await Fs.promises.readFile(path));
    }
    if (!Array.isArray(data)) {
      data = [data];
    }
    const schemas = data.map((data) => new Schema(data));
    games.set(name, schemas);
    playersInGame.set(schemas, 0);
    return schemas;
  }

  async function identification(socket) {
    for (;;) {
      const identification = await socket.expect("identification");
      const name = identification.body.name;
      if (!name) {
        identification.fail("Required parameter `name` is missing.");
        continue;
      }
      if (sockets.has(name)) {
        identification.fail(`The name ${name} is already in use.`);
        continue;
      }
      socket.identify(name);
      sockets.set(name, socket);
      identification.success();
      return name;
    }
  }

  async function location(socket, name) {
    for (;;) {
      const location = await socket.expect("location");
      const room = location.body.room;
      if (!room) {
        location.fail("Required parameter `room` is missing.");
        continue;
      }

      let schemas, schema;
      try {
        schemas = await loadSchema(room);
        schema = schemas[schemas.length - 1];
      } catch (error) {
        location.fail(error);
        continue;
      }

      if (!schema.hasPlayer(name)) {
        if (schema.started || schemas.length > 1) {
          location.fail(`The game ${room} has started without you.`);
          continue;
        }
        if (!schema.hasSpace()) {
          location.fail(`The game ${room} is already full.`);
          continue;
        }
      }

      socket.join(room);
      playersInGame.set(schemas, playersInGame.get(schemas) + 1);
      if (!schema.hasPlayer(name)) {
        socket.broadcast(schema.addPlayer(name));
      }

      location.success({ schema: Schema.concealed(schema, name) });
      return [room, schemas];
    }
  }

  return async (rawSocket) => {
    const socket = new AsyncSocket(rawSocket, io);
    let name, room, schemas, schema;
    try {
      name = await identification(socket);
      [room, schemas] = await location(socket, name);
      let n = schemas.length - 1;
      schema = schemas[n];
      emitCurrentVotes(socket, schema);

      for (;;) {
        const message = await socket.recv();
        if (schema.completed && message.subject === "playAgain") {
          ++n;
          if (schemas.length === n) {
            schemas.push(Schema.nextGame(schema, schemas[0]));
          }
          schema = schemas[n];
          message.success({ schema: Schema.concealed(schema, name) });
          await handlers.ready(socket, schema, { ready: true });
        } else {
          try {
            message.success(
              await handlers[message.subject](
                socket,
                schema,
                message.body || {},
              ),
            );
          } catch (error) {
            console.error(error);
            message.fail(error.message);
          }
        }
      }
    } catch (error) {
      if (error instanceof Disconnect) {
        if (name) {
          console.log(`${name} has left`);
        }
      } else {
        console.error("Unexpected error:", error);
      }
    } finally {
      if (name) {
        sockets.delete(name);
      }
      if (schemas) {
        playersInGame.set(schemas, playersInGame.get(schemas) - 1);
        if (!schema.started) {
          if (schemas.length === 1) {
            socket.broadcast(schema.removePlayer(name));
          } else {
            await handlers.ready(socket, schema, { ready: false });
          }
        }
        if (playersInGame.get(schemas) == 0) {
          games.delete(room);
          if (schema.started || schemas.length >= 1) {
            try {
              await Fs.promises.writeFile(
                filename(room),
                JSON.stringify(schemas),
              );
            } catch (error) {
              console.error(error);
            }
          }
        }
      }
    }
  };
};
