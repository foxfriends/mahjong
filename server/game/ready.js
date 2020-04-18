import sockets from './sockets.js';
import { WINDS } from '../lib/schema.js';

export default async function ready(socket, schema, { ready }) {
    const message = schema.readyPlayer(socket.name, ready);
    if (message) {
        socket.emit(message);
    } else {
        for (const position of WINDS) {
            if (!schema[position]) continue;
            sockets.get(schema[position].name).send('start', schema);
        }
    }
}
