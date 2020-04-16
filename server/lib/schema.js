import Message from '../socket/message.js';

function player(name) {
    return { name, up: [], down: [], discarded: [] };
}

function tile(suit, value) {
    return { suit, value };
}

function * four(tile) {
    for (let i = 0; i < 4; ++i) {
        yield { ...tile };
    }
}

function * suit(suit) {
    for (let i = 1; i <= 9; ++i) {
        yield * four(tile(suit, i));
    }
}

function * winds(suit) {
    for (const wind of ['north', 'east', 'south', 'west']) {
        yield * four(tile('wind', wind));
    }
}

function * dragons(suit) {
    for (const dragon of ['red', 'green', 'white']) {
        yield * four(tile('dragon', dragon));
    }
}

function * tiles() {
    for (const shape of ['circles', 'sticks', 'words']) {
        yield * suit(shape);
    }
    yield * winds();
    yield * dragons();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; --i) {
        const j = Math.floor(Math.random() * i);
        const temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
    return array;
}

function * wall(low, high) {
    while (low < high) {
        yield [low++, low++];
    }
}

function * walls(length) {
    const size = length / 4;
    for (let start = 0; start < length; start += size) {
        yield [...wall(start, start + size)];
    }
}

export default class Schema {
    constructor(basis = {}) {
        this.name = basis.name;

        this.east = basis.east;
        this.west = basis.west;
        this.north = basis.north;
        this.south = basis.south;

        this.wind = basis.wind || 0;
        this.turn = basis.turn || 0;
        this.started = basis.started || false;
        this.roll = basis.roll;
        this.draw = basis.draw;

        this.tiles = basis.tiles || shuffle([...tiles()]);
        this.walls = basis.walls || [...walls(tiles.length)];
    }

    hasSpace() {
        return !this.east || !this.west || !this.north || !this.south;
    }

    hasPlayer(name) {
        return (this.east && this.east.name == name) ||
            (this.west && this.west.name == name) ||
            (this.north && this.north.name == name) ||
            (this.south && this.south.name == name);
    }

    addPlayer(name) {
        if (this.started) {
            throw new Error(`The game ${this.name} has already started.`);
        }
        if (!this.east) {
            this.east = player(name);
            return new Message('addPlayer', { position: 'east', name });
        }
        if (!this.west) {
            this.west = player(name);
            return new Message('addPlayer', { position: 'west', name });
        }
        if (!this.north) {
            this.north = player(name);
            return new Message('addPlayer', { position: 'north', name });
        }
        if (!this.south) {
            this.south = player(name);
            return new Message('addPlayer', { position: 'south', name });
        }
        throw new Error(`The game ${this.name} is full.`);
    }
}
