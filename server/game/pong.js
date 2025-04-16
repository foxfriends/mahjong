import Vote, { cast } from "./votes.js";

class Pong extends Vote {
  constructor() {
    super("Pong", 2);
  }
}

export default async function pong(socket, schema, {}) {
  cast(socket, schema, new Pong());
}
