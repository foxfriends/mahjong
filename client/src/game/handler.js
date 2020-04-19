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
                store.set(new Schema(message.body));
                break;
            }
            case 'reveal': {
                const { reveal } = message.body;
                for (const [index, info] of reveal) {
                    schema.tiles[index] = info;
                }
                store.set(schema);
                break;
            }
            case 'discard': {
                const { position, tile, reveal } = message.body;
                schema.tiles[tile] = reveal;
                const index = schema[position].up.indexOf(tile);
                schema[position].up.splice(index, 1);
                schema[position].discarded.push(tile);
                schema.discard = tile;
                schema.nextTurn();
                store.set(schema);
                break;
            }
            default:
                console.warn(`Message went unhandled!`);
        }
    }
}
