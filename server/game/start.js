export default async function start(socket, schema, {}) {
    socket.broadcast(schema.start());
}
