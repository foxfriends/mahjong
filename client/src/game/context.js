import { setContext, getContext } from 'svelte';
import { writable, get } from 'svelte/store';

const CONTEXT = Symbol();

export function init(socket) {
  setContext(CONTEXT, {
    socket,
    store: writable(null),
    timer: writable(null),
    selection: writable(new Set()),
    selectionSets: writable([]),
    currentVotes: writable({}),
    hasAction: writable(false),
  });

  window.schema = () => get(store);
}

export default function () {
  return getContext(CONTEXT);
}
