import { WINDS } from '../lib/schema.js';
import Message from '../socket/message.js';
import sockets from './sockets.js';
const votes = new WeakMap();

export default class Vote {
    constructor(method, priority) {
        this.method = method;
        this.priority = priority;
        this.win = false;
    }
}

export function handle(socket, schema, votes) {
    const [action, winner] = WINDS
        .filter(wind => votes[wind])
        .map(wind => [votes[wind], wind])
        .reduce((a, b) => a[0].priority > b[0].priority ? a : b);
    switch (action.method) {
        case 'Draw': {
            const [message, reveal] = schema.draw(winner);
            const winnerSocket = sockets.get(schema[winner].name);
            winnerSocket.broadcast(message);
            winnerSocket.send(message.subject, { ...message.body, reveal });
            break;
        }
        case 'Pong': {
            const message = schema.pong(winner);
            socket.emit(message);
            break;
        }
        case 'Chow': {
            const message = schema.chow(winner, action.tiles);
            socket.emit(message);
            break;
        }
        case 'Kong': {
            throw new Error('Unimplemented');
        }
        case 'Eyes': {
            throw new Error('Unimplemented');
        }
        default:
            throw new Error(`Invalid method ${action.method}`);
    }
}

export function cast(socket, schema, vote) {
    let gameVotes = votes.get(schema);
    if (vote.method === 'Ignore' && !gameVotes) return; // discard must be the first vote
    gameVotes = gameVotes || {};
    const position = schema.playerWind(socket.name);
    if (gameVotes[position]) return; // cannot vote twice
    gameVotes[position] = vote;

    const allCast = WINDS
        .filter(wind => schema[wind] && schema.previousTurn !== wind)
        .every(wind => gameVotes[wind]);

    if (allCast) {
        votes.delete(schema);
        handle(socket, schema, gameVotes);
    } else {
        votes.set(schema, gameVotes);
        socket.emit(new Message('vote', { position, vote }));
    }
}
