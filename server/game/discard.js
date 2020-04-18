export default async function discard(socket, schema, { tile }) {
    socket.emit(schema.discard(socket.name, tile));
}
