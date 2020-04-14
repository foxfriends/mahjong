import Channel from '../lib/channel.js';
import Message from './message.js';

export default class AsyncSocket {
    constructor(socket) {
        this.socket = socket;
        this.channel = new Channel();

        this.socket.on('message', ({ subject, body }, response) => {
            this.channel.send(new Message(subject, body, response));
        });

        this.socket.on('error', error => {
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

    send(subject, body, response) {
        this.socket.send({ subject, body }, response);
    }
}
