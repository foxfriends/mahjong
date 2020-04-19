import { writable, get } from 'svelte/store';
const store = writable(null);

store.reveal = ({ index, reveal }) => {
    const schema = get(store);
    schema.tiles[index] = reveal;
    store.set(schema);
}

export default store;

window.schema = () => get(store);
