import AsyncSocket, { Disconnect } from '../socket/socket.js';
import Schema from '../lib/schema.js';
import Fs from 'fs';

const sockets = new Map();

export default (io, stateDirectory) => {
    async function loadSchema(name) {
        const path = `${stateDirectory}/${name}`;
        try {
            await Fs.promises.access(path);
        } catch (e) {
            return new Schema({ name });
        }

        await Fs.promises.access(path, Fs.constants.R_OK);
        const schema = JSON.parse(await Fs.promises.readFile(path));
        return new Schema(schema);
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

            socket.join(room);
            if (!schema.hasPlayer(name)) {
                socket.broadcast(schema.addPlayer(name));
            }

            location.success({ schema });
            return { room, schema };
        }
    }

    return async rawSocket => {
        const socket = new AsyncSocket(rawSocket);
        let name;
        try {
            name = await identification(socket);
            const { room, schema } = await location(socket, name);

            console.log(`${name} has joined ${room}`);
            for (;;) {
                let msg = await socket.recv();
            }
        } catch (error) {
            if (error instanceof Disconnect) {
                if (name) {
                    console.log(`${name} has left`);
                }
            }
        } finally {
            if (name) {
                sockets.delete(name);
            }
        }
    };
}
