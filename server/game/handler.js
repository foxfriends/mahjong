import AsyncSocket, { Disconnect } from '../socket/socket.js';
import Schema from '../lib/schema.js';
import Fs from 'fs';
import * as handlers from './handlers.js';

const sockets = new Map();
const games = new Map();
const playersInGame = new WeakMap();

export default (io, stateDirectory) => {
    const filename = name => `${stateDirectory}/${name}`;
    
    async function loadSchema(name) {
        // Use the cached games first, so all players share one instance.
        if (games.has(name)) { return games.get(name); }

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
        const schema = new Schema(data);
        games.set(schema.name, schema);
        playersInGame.set(schema, 0);
        return schema;
    }

    async function identification(socket) {
        for (;;) {
            const identification = await socket.expect('identification');
            const name = identification.body.name;
            if (!name) {
                identification.fail('Required parameter `name` is missing.');
                continue;
            }
            if (sockets.has(name)) {
                identification.fail(`The name ${name} is already in use.`);
                continue;
            }
            socket.identify(name);
            sockets.set(name, socket.raw);
            identification.success();
            return name;
        }
    }

    async function location(socket, name) {
        for (;;) {
            const location = await socket.expect('location');
            const room = location.body.room;
            if (!room) {
                location.fail('Required parameter `room` is missing.');
                continue;
            }

            let schema;
            try {
                schema = await loadSchema(room);
            } catch (error) {
                location.fail(error);
                continue;
            }

            if (!schema.hasPlayer(name)) {
                if (schema.started) {
                    location.fail(`The game ${room} has started without you.`);
                    continue;
                }
                if (!schema.hasSpace()) {
                    location.fail(`The game ${room} is already full.`);
                    continue;
                }
            }

            socket.join(schema.name);
            playersInGame.set(schema, playersInGame.get(schema) + 1);
            if (!schema.hasPlayer(name)) {
                socket.broadcast(schema.addPlayer(name));
            }

            location.success({ schema });
            return schema;
        }
    }

    return async rawSocket => {
        const socket = new AsyncSocket(rawSocket, io);
        let name, schema;
        try {
            name = await identification(socket);
            schema = await location(socket, name);

            for (;;) {
                const message = await socket.recv();
                try {
                    console.log(message);
                    message.success(await handlers[message.subject](socket, schema, message.body));
                } catch (error) {
                    console.error(error);
                    message.fail(error);
                }
            }
        } catch (error) {
            if (error instanceof Disconnect) {
                if (name) {
                    console.log(`${name} has left`);
                }
            } else {
                console.log(`Unexpected error: ${error}`);
            }
        } finally {
            if (name) {
                sockets.delete(name);
            }
            if (schema) {
                playersInGame.set(schema, playersInGame.get(schema) - 1);
                if (!schema.started) {
                    socket.broadcast(schema.removePlayer(name));
                }
                if (playersInGame.get(schema) == 0) {
                    games.delete(schema.name);
                    if (schema.started) {
                        try {
                            await Fs.promises.writeFile(filename(schema.name), JSON.stringify(schema));
                        } catch (error) {
                            console.error(error);
                        }
                    }
                }
            }
        }
    };
}
