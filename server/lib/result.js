export default class Result {
    isOk() { return this instanceof Ok; }
    isErr() { return this instanceof Err; }
}

export class Ok extends Result {
    constructor(value) { super(); this.value = value; }
    unwrap() { return this.value; }
}

export class Err extends Result {
    constructor(error) { super(); this.error = error; }
    unwrap() { throw this.error; }
}
