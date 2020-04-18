export default async function draw(socket, schema, {}) {
    socket.emit(schema.draw(socket));
}
