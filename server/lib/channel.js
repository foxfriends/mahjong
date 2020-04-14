import { Ok, Err } from './result.js';

export default class Channel {
    constructor() {
        this.buffer = [];
        this.receivers = [];
    }

    send(message) {
        const receiver = this.receivers.shift();
        if (receiver) {
            receiver[0](message);
        } else {
            this.buffer.push(new Ok(message));
        }
    }

    throw(exception) {
        const receiver = this.receivers.shift();
        if (receiver) {
            receiver[1](exception);
        } else {
            this.buffer.push(new Err(exception));
        }
    }

    async recv() {
        const message = this.buffer.shift();
        if (message) {
            return message.unwrap();
        } else {
            return new Promise((resolve, reject) => {
                this.receivers.push([resolve, reject]);
            });
        }
    }
}
