import Koa from "koa";
import KoaStatic from "koa-static";
import Http from "http";
import Router from "@koa/router";
import IO from "socket.io";
import SocketHandler from "./game/handler.js";
const { mahjong_port, mahjong_dist, mahjong_state } = process.env;

const router = new Router();
router.get("/health", async (ctx) => {
  ctx.status = 200;
  ctx.body = "Ok";
});

const app = new Koa();
app.use(KoaStatic(mahjong_dist));
app.use(router.routes());
app.use(router.allowedMethods());

const server = Http.createServer(app.callback());

const io = IO(server);
io.on("connection", SocketHandler(io, mahjong_state));

console.log(`Starting Mahjong on port ${mahjong_port}`);
server.listen(mahjong_port || 1234);
