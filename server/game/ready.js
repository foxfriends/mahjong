export default async function ready(socket, schema, { ready }) {
    socket.emit(schema.readyPlayer(socket.name, ready));
}
