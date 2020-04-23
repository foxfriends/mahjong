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
const eq = (a, b) => a.suit === b.suit && a.value === b.value;

export default class Schema {
    static concealed(basis, player) {
        const schema = new Schema(basis);
        if (!schema.completed) {
            const down = WINDS
                .map(position => schema[position])
                .filter(player => !!player)
                .map(player => [...player.discarded, ...[].concat(...player.down)]);
            const position = schema.playerWind(player);
            const revealed = [...schema[position].up, ...[].concat(...down)];

            schema.tiles = schema.tiles
                .map((tile, i) => revealed.includes(i) ? tile : null);
        }
        return schema;
    }

    static winningHand(schema, player, eye = null) {
        function allMeld(tiles) {
            function melds(a, b, c) {
                if (eq(a, b) && eq(b, c)) return true;
                if (a.suit !== b.suit && b.suit !== c.suit && typeof a.value === 'number') return false;
                const values = [a.value, b.value, c.value].sort();
                return values[0] === values[1] - 1 && values[1] === values[2] - 1;
            }

            if (tiles.length === 0) return true;
            for (let i = 0; i < tiles.length - 2; ++i) {
                for (let j = i + 1; j < tiles.length - 1; ++j) {
                    for (let k = j + 1; k < tiles.length; ++k) {
                        if (melds(tiles[i], tiles[j], tiles[k])) {
                            const rest = [...tiles];
                            rest.splice(k, 1);
                            rest.splice(j, 1);
                            rest.splice(i, 1);
                            if (allMeld(rest)) return true;
                        }
                    }
                }
            }
            return false;
        }

        const hand = player.up;

        if (hand.length % 3 !== 2) return false;
        const tiles = hand.map(tile => schema.tiles[tile]);

        if (eye) {
            const matching = tiles.filter(other => eq(schema.tiles[eye], other));
            if (matching.length < 2) return false;
            // Remove this pair from the hand
            const remaining = [...tiles];
            remaining.splice(remaining.indexOf(matching[0]), 1);
            remaining.splice(remaining.indexOf(matching[1]), 1);
            // Then check if the rest of the meld nicely.
            if (allMeld(remaining)) return true;
        } else {
            return tiles.some((tile, i) => {
                const matching = tiles.slice(i + 1).filter(other => eq(tile, other));
                if (matching.length >= 2) {
                    // Remove this pair from the hand
                    const remaining = [...tiles];
                    remaining.splice(remaining.indexOf(matching[0]), 1);
                    remaining.splice(remaining.indexOf(matching[1]), 1);
                    // Then check if the rest of the meld nicely.
                    if (allMeld(remaining)) return true;
                }
            });
        }
    }

    constructor(basis = {}) {
        this.name = basis.name;

        for (const position of WINDS) {
            this[position] = basis[position];
        }

        this.wind = basis.wind || 'Ton';
        this.turn = basis.turn || 'Ton';
        this.previousTurn = basis.previousTurn || 'Ton';
        this.started = basis.started || false;
        this.completed = basis.completed || false;
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
        if (position !== this.turn || this.drawn !== undefined) {
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

    pong(position) {
        if (position === this.previousTurn) {
            throw new Error('You may not pick up your own discard.');
        }
        const hand = this[position].up;
        const discard = this.tiles[this.discarded];

        const matching = hand.filter(tile => this.tiles[tile].suit === discard.suit && this.tiles[tile].value === discard.value);
        if (matching.length < 2) {
            throw new Error('You must have two matching tiles to pong.');
        }
        hand.splice(hand.indexOf(matching[0]), 1);
        hand.splice(hand.indexOf(matching[1]), 1);
        const tiles = [matching[0], matching[1], this.discarded];
        this[position].down.push(tiles);
        this[this.previousTurn].discarded.pop();
        this.turn = position;
        this.drawn = this.discarded;
        delete this.discarded;
        return new Message('take', { position, tiles, reveal: [[matching[0], this.tiles[matching[0]]], [matching[1], this.tiles[matching[1]]]] });
    }

    exposedKong(position) {
        if (position === this.previousTurn) {
            throw new Error('You may not pick up your own discard.');
        }
        const hand = this[position].up;
        const discard = this.tiles[this.discarded];

        const matching = hand.filter(tile => this.tiles[tile].suit === discard.suit && this.tiles[tile].value === discard.value);
        if (matching.length < 3) {
            throw new Error('You must have three matching tiles to kong.');
        }
        hand.splice(hand.indexOf(matching[0]), 1);
        hand.splice(hand.indexOf(matching[1]), 1);
        hand.splice(hand.indexOf(matching[2]), 1);
        const tiles = [matching[0], matching[1], matching[2], this.discarded, 'exposed'];
        this[position].down.push(tiles);
        this[this.previousTurn].discarded.pop();
        this.turn = position;
        const [wall, stack] = this.reverseDraw();
        this.drawn = this.walls[wall][stack].pop();
        this[position].up.push(this.drawn);
        delete this.discarded;
        return [
            new Message('take', { position, tiles, wall, stack, reveal: [[matching[0], this.tiles[matching[0]]], [matching[1], this.tiles[matching[1]]], [matching[2], this.tiles[matching[2]]]] }),
            [this.drawn, this.tiles[this.drawn]],
        ];
    }

    chow(position, matching) {
        if (position === this.previousTurn) {
            throw new Error('You may not pick up your own discard.');
        }

        if (matching.length !== 2) {
            throw new Error('You must choose two tiles to chow with.');
        }
        const hand = this[position].up;
        for (const tile of matching) {
            console.log(hand, tile);
            if (!hand.includes(tile)) {
                throw new Error('You do not own these tiles.');
            }
            hand.splice(hand.indexOf(tile), 1);
        }
        const tiles = [...matching, this.discarded];
        this[position].down.push(tiles);
        this[this.previousTurn].discarded.pop();
        this.turn = position;
        this.drawn = this.discarded;
        delete this.discarded;
        return new Message('take', { position, tiles, reveal: [[matching[0], this.tiles[matching[0]]], [matching[1], this.tiles[matching[1]]]] });
    }

    eyes(position) {
        if (position === this.previousTurn) {
            throw new Error('You may not pick up your own discard.');
        }
        const discard = this.tiles[this.discarded];
        const player = { ...this[position] };
        player.up = [...player.up, this.discarded];
        if (!Schema.winningHand(this, player, this.discarded)) {
            throw new Error('You may not pick up eyes if it does not win the game');
        }
        const tile = this.discarded;

        this[this.previousTurn].discarded.pop();
        this[position].up.push(this.discarded);
        this.drawn = this.discarded;
        this.turn = position;
        delete this.discarded;
        this.completed = true;
        return new Message('win', { position, tile, reveal: this.tiles });
    }

    win(position) {
        if (position !== this.turn) {
            throw new Error('You can only win on your own turn.');
        }
        if (!Schema.winningHand(this, this[position])) {
            throw new Error('You do not have a valid winning hand');
        }
        this.completed = true;
        return new Message('win', { position, reveal: this.tiles });
    }

    discard(name, tile) {
        const position = this.playerWind(name);
        if (position !== this.turn || this.discarded !== undefined) {
            throw new Error(`It is not ${name}'s turn to discard.`);
        }
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
        this.previousTurn = this.turn;
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

    reverseDraw() {
        if (this.walls.every(wall => wall.every(stack => stack.length === 0))) {
            throw new Error('There are no more tiles to be drawn.');
        }
        let wall = 3 - ((sum(this.roll) + 2) % 4);
        let stack = sum(this.roll);
        for (;;) {
            if (stack >= this.walls[wall].length) {
                stack %= this.walls[wall].length;
                wall = (wall + 1) % 4;
            }
            if (stack < 0) {
                wall = (wall + 3) % 4;
                stack = this.walls[wall].length - 1;
            }
            if (this.walls[wall][stack].length !== 0) {
                break;
            }
            stack -= 1;
        }
        return [wall, stack];
    }
}
