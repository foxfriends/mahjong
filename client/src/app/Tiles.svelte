<script>
  import Tile from './Tile.svelte';
  import store from '../game/store.js';

  export let socket;

  let handlers = [];
  $: {
    const store = $store;
    if (store) {
      const myWind = store.playerWind(socket.name);
      const myDiscard = store.previousTurn === myWind;
      const myTurn = store.turn === myWind;
      let toDraw = -1;
      if (store.roll !== undefined) {
        const [wall, stackIndex] = store.nextDraw();
        const stack = store.walls[wall][stackIndex];
        toDraw = stack[stack.length - 1];
      }
      handlers = store.tiles.map((tile, index) => {
        if (myTurn) {
          // My turn
          if (typeof store.drawn === 'number') {
            if (store[store.turn].up.includes(index)) {
              return async () => {
                try {
                  await socket.send('discard', { tile: index });
                } catch (error) {
                  console.error(error);
                }
              };
            }
          } else if (index === toDraw) {
            return async () => {
              try {
                await socket.send('draw', {});
              } catch (error) {
                console.error(error);
              }
            };
          }
        }

        if (index === store.discarded && !myDiscard) {
          const discarded = store.tiles[index];

          const canPong = store[myWind].up.filter(tile => store.tiles[tile].suit === discarded.suit && store.tiles[tile].value === discarded.value).length >= 2;
          const ofSuit = typeof discarded.value === 'number' && store[myWind].up.filter(tile => store.tiles[tile].suit === discarded.suit);
          let canChow = false;
          if (ofSuit) {
            const required = [
              ofSuit.find(tile => store.tiles[tile].value === discarded.value - 2),
              ofSuit.find(tile => store.tiles[tile].value === discarded.value - 1),
              true,
              ofSuit.find(tile => store.tiles[tile].value === discarded.value + 1),
              ofSuit.find(tile => store.tiles[tile].value === discarded.value + 2),
            ];
            canChow = [
              required.slice(0, 3).every(x => x),
              required.slice(1, 4).every(x => x),
              required.slice(2, 5).every(x => x),
            ].some(x => x);
          }

          if (canPong && !canChow) {
            return async () => {
              try {
                await socket.send('pong');
              } catch (error) {
                console.error(error);
              }
            };
          }
        }
      });
    }
  }
</script>

{#if $store}
  {#each $store.tiles as tile, index}
    <Tile {tile} {index} clickable={!!handlers[index]} on:click={handlers[index]}/>
  {/each}
{/if}
