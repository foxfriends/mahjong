export default async function draw(socket, schema, {}) {
    const [message, reveal] = schema.draw(socket);
    socket.emit(message);
    return reveal;
}
