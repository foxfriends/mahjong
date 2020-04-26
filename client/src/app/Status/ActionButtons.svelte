<script>
  import TextTile from './TextTile.svelte';
  import Schema from '../../lib/schema.js';
  import store from '../../game/store.js';
  import selectionSets from '../../game/selectionSets.js';
  import selection from '../../game/selection.js';

  export let socket;

  let actions = []
  $: actions = $selectionSets
    .filter(selectionSet => {
      return selectionSet.tiles.every(tile => $selection.has(tile)) &&
        selectionSet.tiles.length === $selection.size;
    });

  $: myWind = $store && $store.playerWind(socket.name);
  $: kongs = $store[myWind].up
    .filter((tile, i, tiles) =>
      tiles
        .slice(i + 1)
        .map(tile => $store.tiles[tile])
        .filter(info => info.suit === $store.tiles[tile].suit && info.value === $store.tiles[tile].value)
        .length === 3
    );

  async function kong(tile) {
    try {
      await socket.send('kong', { mode: 'concealed', tile });
    } catch (error) {
      console.log(error);
    }
  }

  async function win() {
    try {
      await socket.send('declare');
    } catch (error) {
      console.log(error);
    }
  }
</script>

<div class="container">
  <div class="actions">
    {#each actions as action}
      <button class="action" on:click={action.handler}>
        {action.label}
      </button>
    {/each}

    {#if $store && Schema.winningHand($store, $store[myWind]) && $store.turn === myWind}
      <button class="action" on:click={win}>
        Win
      </button>
    {/if}

    {#if $store && $store.drawn !== undefined && $store.turn === myWind}
      {#each kongs as tile}
        <button class="action" on:click={() => kong(tile)}>
          Kong (<TextTile {tile} />)
        </button>
      {/each}
    {/if}
  </div>
</div>

<style>
  .container {
    position: absolute;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
  }
    
  .actions {
    position: absolute;
    bottom: 50px;
    left: 50px;

    display: flex;
    flex-direction: column;
    min-width: 120px;
    pointer-events: none;
  }

  .action {
    background-color: rgb(255, 255, 255);
    border: rgba(255, 255, 255, 0.75);
    border-radius: 4px;
    padding: 8px;
    margin: 16px;
    pointer-events: auto;
    font-size: 18pt;
    cursor: pointer;

    display: flex;
    align-items: center;
    justify-content: center;
    word-wrap: no-wrap;
  }
</style>
