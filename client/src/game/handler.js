import Schema from '../lib/schema.js';
import { get } from 'svelte/store';
import store from './store.js';

export default async function handler(schema, socket) {
    store.set(schema);
    for (;;) {
        const message = await socket.recv();

        const schema = new Schema(get(store));
        switch (message.subject) {
            case 'addPlayer': {
                const { position, name } = message.body;
                schema[position] = name;
                store.set(schema);
                break;
            }
            case 'start': {
                schema.start();
                store.set(schema);
            }
            default:
                console.log(`Unhandled message: ${JSON.stringify(message)}`);
        }
    }
}
