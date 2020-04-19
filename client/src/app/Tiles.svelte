<script>
  import Tile from './Tile.svelte';
  import store from '../game/store.js';

  export let socket;

  let handlers = [];
  $: {
    if ($store) {
      const myTurn = $store.turn === $store.playerWind(socket.name);
      let toDraw = -1;
      if ($store.roll !== undefined) {
        const [wall, stackIndex] = $store.nextDraw();
        const stack = $store.walls[wall][stackIndex];
        toDraw = stack[stack.length - 1];
      }
      handlers = $store.tiles.map((tile, index) => {
        if (myTurn) {
          // My turn
          if (typeof $store.drawn === 'number') {
            if ($store[$store.turn].up.includes(index)) {
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
                const reveal = await socket.send('draw', {});
                store.reveal(reveal);
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
