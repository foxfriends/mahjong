import Vote, { cast } from './votes.js';

class Kong extends Vote {
    constructor() { super('Kong', 2); }
}

export default async function kong(socket, schema, { mode, tile }) {
    if (mode === 'exposed') {
        cast(socket, schema, new Kong);
    } else if (mode === 'concealed') {
        const [message, reveal] = schema.concealedKong(socket.name, tile);
        socket.broadcast(message);
        socket.send(message.subject, { ...message.body, reveal: [...message.body.reveal, reveal] });
    } else {
        throw new Error('Unimplemented');
    }
}
