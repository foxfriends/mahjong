import Channel from '../lib/channel.js';
import Message from './message.js';

export class Disconnect extends Error {}

export default class AsyncSocket {
    constructor(socket) {
        this.raw = socket;
        this.channel = new Channel();
        this.game = null;

        this.raw.on('message', ({ subject, body }, response) => {
            this.channel.send(new Message(subject, body, response));
        });

        this.raw.on('disconnect', error => {
            this.channel.throw(new Disconnect());
        });

        this.raw.on('error', error => {
            this.channel.throw(error);
        });
    }

    async recv() {
        return this.channel.recv();
    }

    async expect(subject) {
        let message;
        do {
            message = await this.recv();
        } while (message.subject !== subject);
        return message;
    }

    async send(subject, body) {
        return new Promise((resolve, reject) => {
            this.raw.send({ subject, body }, ({ error, body }) => {
                if (!error) {
                    resolve(body);
                } else {
                    reject(error);
                }
            });
        });
    }

    broadcast(message) {
        this.raw.broadcast.to(this.game).send(message);
    }

    join(room) {
        this.game = room;
        this.raw.join(room);
    }
}
