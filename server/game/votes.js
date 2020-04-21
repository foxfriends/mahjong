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

export function handle(schema, socket, votes) {
    console.log(votes);
    const [action, winner] = WINDS
        .filter(wind => votes[wind])
        .map(wind => [votes[wind], wind])
        .reduce((a, b) => a[0].priority > b[0].priority ? a : b);
    console.log(action, winner);
    switch (action.method) {
        case 'Draw': {
            const [message, reveal] = schema.draw(winner);
            const winnerSocket = sockets.get(schema[winner].name);
            winnerSocket.broadcast(message);
            winnerSocket.send(message.subject, { ...message.body, reveal });
            break;
        }
        default:
            throw new Error(`Unknown method ${action.methd}`);
    }
}

export function cast(socket, schema, vote) {
    let gameVotes = votes.get(schema);
    if (vote.method === 'Ignore' && !gameVotes) return; // ignore cannot be the first vote
    gameVotes = gameVotes || {};
    const position = schema.playerWind(socket.name);
    if (gameVotes[position]) return; // cannot vote twice
    gameVotes[position] = vote;

    const allCast = WINDS
        .filter(wind => schema[wind])
        .every(wind => gameVotes[wind]);

    if (allCast) {
        votes.delete(schema);
        handle(schema, socket, gameVotes);
    } else {
        votes.set(schema, gameVotes);
        socket.emit(new Message('vote', { position, vote }));
    }
}
