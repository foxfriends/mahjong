import App from "./app/App.svelte";
import IO from "socket.io-client";
import AsyncSocket from "./socket/socket.js";

const socket = new AsyncSocket(IO());
const app = new App({
  target: document.querySelector("#root"),
  props: { socket },
});
