<script>
  import Tile from './Tile.svelte';
  import store from '../game/store.js';

  export let socket;

  let handlers = [];
  $: {
    if ($store) {
      const myTurn = $store.turn === $store.playerWind(socket.name) && typeof $store.draw === 'number';
      handlers = $store.tiles.map((tile, index) => {
        if (myTurn) {
          // My turn
          if ($store[$store.turn].up.includes(index)) {
            return async () => {
              try {
                await socket.send('discard', { tile: index });
              } catch (error) {
                console.error(error);
              }
            }
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
