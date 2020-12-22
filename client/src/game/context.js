import { setContext, getContext } from 'svelte';
import { writable, get } from 'svelte/store';

const CONTEXT = Symbol();

export function init(socket) {
  setContext(CONTEXT, {
    socket,
    store: writable(null),
  });

  window.schema = () => get(store);
}

export default function () {
  return getContext(CONTEXT);
}
