import Schema, { player } from '../lib/schema.js';
import { get } from 'svelte/store';
import store from './store.js';
import timer from './timer.js';

let currentVotes = {};
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
            case 'discard': {
                const { position, tile, reveal } = message.body;
                currentVotes = { [position]: { method: 'Discard', priority: 0 }};
                schema.tiles[tile] = reveal;
                const index = schema[position].up.indexOf(tile);
                schema[position].up.splice(index, 1);
                schema[position].discarded.push(tile);
                schema.discarded = tile;
                delete schema.drawn;
                schema.nextTurn();
                store.set(schema);
                break;
            }
            case 'draw': {
                window.clearTimeout(get(timer));
                timer.set(null);
                const { tile, wall, stack, reveal } = message.body;
                if (reveal) {
                    schema.tiles[tile] = reveal;
                }
                schema.walls[wall][stack].pop();
                schema[schema.turn].up.push(tile);
                schema.drawn = tile;
                delete schema.discard;
                store.set(schema);
                break;
            }
            case 'take': {
                const { position, tiles, reveal } = message.body;
                window.clearTimeout(get(timer));
                timer.set(null);
                schema[position].down.push(tiles);
                schema[schema.previousTurn].discarded.pop();
                for (const [index, tile] of reveal) {
                    schema.tiles[index] = tile;
                }
                for (const tile of tiles) {
                    const index = schema[position].up.indexOf(tile);
                    if (index !== -1) schema[position].up.splice(index, 1);
                }
                schema.drawn = schema.discarded;
                delete schema.discarded;
                schema.turn = position;
                store.set(schema);
                break;
            }
            case 'vote': {
                const { position, vote } = message.body;
                currentVotes[position] = vote;
                if (!get(timer)) {
                    const myWind = schema.playerWind(socket.name);
                    timer.set({
                        start: (new Date).getTime(),
                        duration: 3000,
                        handle: window.setTimeout(async () => {
                            if (currentVotes[myWind]) return; // don't bother voting again
                            try {
                                await socket.send('ignore');
                                timer.set(null);
                            } catch (error) {
                                console.error(error);
                            }
                        }, 3000),
                    });
                }
                break;
            }
            case 'win': {
                window.clearTimeout(get(timer));
                timer.set(null);
                schema.complete = true;
                // TODO: same as take?
                //       but then show everything and end the game?
            }
            default:
                console.warn(`Message went unhandled!`);
        }
    }
}
