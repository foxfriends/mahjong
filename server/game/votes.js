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
    const turnPriority = schema.votePriority();
    const [action, winner] = WINDS
        .filter(wind => votes[wind])
        .map(wind => [votes[wind], wind])
        .reduce((a, b) => {
            if (a[0].priority > b[0].priority) {
                return a;
            }
            if (b[0].priority > a[0].priority) {
                return b;
            }
            if (turnPriority.indexOf(a[1]) < turnPriority.indexOf(b[1])) {
                return a;
            }
            return b;
        });

    const kong = !!Object
      .values(votes)
      .find(vote => vote.method === 'Kong');

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
            const [message, reveal] = schema.exposedKong(winner);
            const winnerSocket = sockets.get(schema[winner].name);
            winnerSocket.broadcast(message);
            winnerSocket.send(message.subject, { ...message.body, reveal: [...message.body.reveal, reveal] });
            break;
        }
        case 'Eyes': {
            const message = schema.eyes(winner, kong);
            socket.emit(message);
            break;
        }
        default:
            throw new Error(`Invalid method ${action.method}`);
    }
    if (action.win) {
        socket.emit(schema.win(schema[winner].name, kong));
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

export function emitCurrentVotes(socket, schema) {
    const gameVotes = votes.get(schema);
    if (!gameVotes) return;
    Object
        .entries(gameVotes)
        .forEach(([position, vote]) => {
            socket.emit(new Message('vote', { position, vote }))
        });
}
