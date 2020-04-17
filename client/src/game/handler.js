import Schema, { player } from '../lib/schema.js';
import { get } from 'svelte/store';
import store from './store.js';

export default async function handler(schema, socket) {
    store.set(new Schema(schema));
    for (;;) {
        const message = await socket.recv();
        console.log(message);

        const schema = new Schema(get(store));
        switch (message.subject) {
            case 'addPlayer': {
                console.log(message);
                const { position, name } = message.body;
                schema[position] = player(name);
                store.set(schema);
                break;
            }
            case 'removePlayer': {
                const { position } = message.body;
                delete schema[position];
                store.set(schema);
                break;
            }
            case 'readyPlayer': {
                const { position, ready } = message.body;
                schema[position].ready = ready;
                store.set(schema);
                break;
            }
            case 'start': {
                schema.start();
                store.set(schema);
                break;
            }
            default:
                console.warn(`Message went unhandled!`);
        }
    }
}
