export default class Message {
    constructor(subject, body, response) {
        this.subject = subject;
        this.body = body;
        this.response = response;
    }

    respond(subject, body) {
        this.response({ subject, body });
    }
}
