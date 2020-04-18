import Message from '../socket/message.js';

const WINDS = ['Ton', 'Shaa', 'Pei', 'Nan'];
const DRAGONS = ['Chun', 'Hatsu', 'Haku'];
const SUITS = ['Pin', 'Sou', 'Man'];

export function player(name) {
    return { name, up: [], down: [], discarded: [], ready: false };
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
    for (const wind of WINDS) {
        yield * four(tile('wind', wind));
    }
}

function * dragons(suit) {
    for (const dragon of DRAGONS) {
        yield * four(tile('dragon', dragon));
    }
}

function * tiles() {
    for (const shape of SUITS) {
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

        for (const position of WINDS) {
            this[position] = basis[position];
        }

        this.wind = basis.wind || 0;
        this.turn = basis.turn || 0;
        this.started = basis.started || false;
        this.roll = basis.roll;
        this.draw = basis.draw;

        this.tiles = basis.tiles || shuffle([...tiles()]);
        this.walls = basis.walls || [...walls(this.tiles.length)];
    }

    hasSpace() {
        return WINDS.some(position => !this[position]);
    }

    hasPlayer(name) {
        return WINDS.some(position => this[position] && this[position].name === name);
    }

    playerWind(name) {
        const position = WINDS.find(position => this[position] && this[position].name === name);
        if (!position) {
            throw new Error(`No player ${name} in game ${this.game}`);
        }
        return position;
    }

    start() {
        this.assertStarted(false);
        this.started = true;
        return new Message('start');
    }

    addPlayer(name) {
        this.assertStarted(false);
        for (const position of WINDS) {
            if (!this[position]) {
                this[position] = player(name);
                return new Message('addPlayer', { position, name });
            }
        }
        throw new Error(`The game ${this.name} is full.`);
    }

    removePlayer(name) {
        this.assertStarted(false);
        const wind = this.playerWind(name);
        delete this[wind];
    }

    readyPlayer(name, ready = true) {
        this.assertStarted(false);
        const position = this.playerWind(name);
        this[position].ready = ready;
        const allPlayers = WINDS
            .map(position => this[position])
            .filter(player => !!player);

        if (allPlayers.length >= 2 && allPlayers.every(player => player.ready)) {
            return this.start();
        }

        return new Message('readyPlayer', { position, ready });
    }

    assertStarted(started) {
        if (this.started !== started) {
            throw new Error(`The game ${this.name} has ${started ? 'not' : 'already'} started.`);
        }
    }
}
