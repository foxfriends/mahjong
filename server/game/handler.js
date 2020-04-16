import AsyncSocket, { Disconnect } from '../socket/socket.js';

const sockets = new Map();

export default stateDirectory => async rawSocket => {
    const socket = new AsyncSocket(rawSocket);
    let name, room;
    try {
        for (;;) {
            const identification = await socket.expect('identification');
            name = identification.body.name;
            if (!name) {
                identification.fail('Required parameter `name` is missing.');
                continue;
            }
            if (sockets.has(name)) {
                identification.fail(`The name ${name} is already in use.`);
                continue;
            }
            sockets.set(name, rawSocket);
            identification.success();
            break;
        }

        for (;;) {
            const location = await socket.expect('location');
            room = location.body.room;
            if (!room) {
                identification.fail('Required parameter `room` is missing.');
                continue;
            }
            location.success();
            rawSocket.join(room);
            break;
        }
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
