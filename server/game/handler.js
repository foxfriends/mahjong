import AsyncSocket from '../socket/socket.js';

const sockets = new Map();

export default stateDirectory => async rawSocket => {
    const socket = new AsyncSocket(rawSocket);
    let name, room;
    try {
        ({ body: { name }} = await socket.expect('identification'));
        sockets.set(name, rawSocket);
        ({ body: { room }} = await socket.expect('location'));
        rawSocket.join(room);
        console.log(`${name} has joined ${room}`);
    } catch (exception) {
        sockets.delete(name);
    }
};
