export default class Message {
    constructor(subject, body, response) {
        this.subject = subject;
        this.body = body;
        this.response = response;
    }

    success(body) {
        this.response && this.response({ body });
    }

    fail(error) {
        this.response && this.response({ error });
    }
}
