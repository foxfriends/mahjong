import Vote, { cast } from './votes.js';

class Ignore extends Vote {
    constructor() { super('Ignore', 0); }
}

export default async function ignore(socket, schema, {}) {
    cast(socket, schema, new Ignore);
}
