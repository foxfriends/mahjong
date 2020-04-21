import Vote, { cast } from './votes.js';

class Kong extends Vote {
    constructor() { super('Kong', 2); }
}

export default async function kong(socket, schema, {}) {
    cast(socket, schema, new Kong);
}
