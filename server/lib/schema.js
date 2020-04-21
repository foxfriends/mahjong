import Message from '../socket/message.js';

export const WINDS = ['Ton', 'Shaa', 'Pei', 'Nan'];
const DRAGONS = ['Chun', 'Hatsu', 'Haku'];
const SUITS = ['Pin', 'Sou', 'Man'];

const NEXT_TURN = { Ton: 'Nan', Nan: 'Shaa', Shaa: 'Pei', Pei: 'Ton' };

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

const sum = arr => arr.reduce((a, b) => a + b);

export default class Schema {
    static concealed(basis, player) {
        const schema = new Schema(basis);
        const down = WINDS
            .map(position => schema[position])
            .filter(player => !!player)
            .map(player => [...player.discarded, ...[].concat(...player.down)]);
        const position = schema.playerWind(player);
        const revealed = [...schema[position].up, ...[].concat(...down)];

        schema.tiles = schema.tiles
            .map((tile, i) => revealed.includes(i) ? tile : null);

        return schema;
    }
    
    constructor(basis = {}) {
        this.name = basis.name;

        for (const position of WINDS) {
            this[position] = basis[position];
        }

        this.wind = basis.wind || 'Ton';
        this.turn = basis.turn || 'Ton';
        this.started = basis.started || false;
        this.roll = basis.roll;
        this.drawn = basis.drawn;
        this.discarded = basis.discarded;

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
        this.roll = [
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
            Math.floor(Math.random() * 6) + 1,
        ];

        let [wall, stack] = this.nextDraw();
        const winds = ['Ton', 'Nan', 'Shaa', 'Pei'].filter(position => this[position]);
        for (let i = 0; i < 3; ++i) {
            for (const position of winds) {
                for (let j = 0; j < 2; ++j) {
                    if (stack >= this.walls[wall].length) {
                        stack %= this.walls[wall].length;
                        wall = (wall + 1) % 4;
                    }

                    const tiles = this.walls[wall][stack].splice(0, 2);
                    this[position].up.push(...tiles);
                    stack += 1;
                }
            }
        }

        for (const position of winds) {
            if (stack >= this.walls[wall].length) {
                stack %= this.walls[wall].length;
                wall = (wall + 1) % 4;
            }

            const tile = this.walls[wall][stack].pop();
            this[position].up.push(tile);
            if (this.walls[wall][stack].length === 0) {
                stack += 1;
            }
        }

        const draw = this.walls[wall][stack].pop();
        this.drawn = draw;
        this[winds[0]].up.push(draw);
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

    draw(position) {
        if (position !== this.turn) {
            throw new Error(`It is not ${name}'s turn to draw.`);
        }
        const [wall, stack] = this.nextDraw();
        const tile = this.walls[wall][stack].pop();
        this.drawn = tile;
        delete this.discarded;
        this[position].up.push(tile);
        return [
            new Message('draw', { tile, wall, stack }),
            this.tiles[tile],
        ];
    }

    discard(name, tile) {
        const position = this.playerWind(name);
        const tileIndex = this[position].up.indexOf(tile);
        if (tileIndex === -1) {
            throw new Error(`Player ${name} does not hold tile ${tile}`);
        }
        this[position].up.splice(tileIndex, 1);
        this[position].discarded.push(tile);
        this.discarded = tile;
        delete this.drawn;
        this.nextTurn();
        return new Message('discard', { position, tile, reveal: this.tiles[tile] });
    }

    nextTurn() {
        do { this.turn = NEXT_TURN[this.turn]; } while (!this[this.turn]);
    }

    nextDraw() {
        if (this.walls.every(wall => wall.every(stack => stack.length === 0))) {
            throw new Error('There are no more tiles to be drawn.');
        }
        let wall = 3 - ((sum(this.roll) + 2) % 4);
        let stack = sum(this.roll) + 1;
        for (;;) {
            if (stack >= this.walls[wall].length) {
                stack %= this.walls[wall].length;
                wall = (wall + 1) % 4;
            }
            if (this.walls[wall][stack].length !== 0) {
                break;
            }
            stack += 1;
        }
        return [wall, stack];
    }
}
