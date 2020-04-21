import Vote, { cast } from './votes.js';

class Chow extends Vote {
    constructor(tiles) {
        super('Chow', 1);
        this.tiles = tiles;
    }
}

export default async function chow(socket, schema, { tiles }) {
    cast(socket, schema, new Chow(tiles));
}
