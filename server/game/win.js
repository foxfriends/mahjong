import Vote, { cast } from "./votes.js";

class Win extends Vote {
  constructor(method, tiles) {
    super(method, 3);
    this.tiles = tiles;
    this.win = true;
  }
}

export default async function win(socket, schema, { method, tiles }) {
  cast(socket, schema, new Win(method, tiles));
}
