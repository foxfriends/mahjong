import Vote, { cast } from "./votes.js";

class Draw extends Vote {
  constructor() {
    super("Draw", 1);
  }
}

export default async function draw(socket, schema, {}) {
  cast(socket, schema, new Draw());
}
