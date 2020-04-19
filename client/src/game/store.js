import { writable, get } from 'svelte/store';
const store = writable(null);
export default store;

window.schema = () => get(store);
