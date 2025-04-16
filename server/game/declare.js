export default async function declare(socket, schema, {}) {
  socket.emit(schema.win(socket.name));
}
