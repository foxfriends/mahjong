<script>
  import TextTile from './TextTile.svelte';
  import Schema, { eq } from '../../lib/schema.js';
  import context from '../../game/context.js';
  import selectionSets from '../../game/selectionSets.js';
  import selection from '../../game/selection.js';

  const { socket, store } = context();

  let actions = []
  $: actions = $selectionSets
    .filter(selectionSet => {
      return selectionSet.tiles.every(tile => $selection.has(tile)) &&
        selectionSet.tiles.length === $selection.size;
    });

  $: myWind = $store && $store.playerWind(socket.name);
  $: concealedKongs = $store[myWind].up
    .filter((tile, i, tiles) =>
      tiles
        .slice(i + 1)
        .map(tile => $store.tiles[tile])
        .filter(info => eq(info, $store.tiles[tile]))
        .length === 3
    );
  $: exposedKongs = $store[myWind].up
    .filter(tile =>
      $store[myWind].down
        .filter(meld => meld.length === 3)
        .some(meld => meld
          .map(tile => $store.tiles[tile])
          .every(info => eq(info, $store.tiles[tile]))
        )
    );

  async function kong(mode, tile) {
    try {
      await socket.send('kong', { mode, tile });
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
      {#each concealedKongs as tile}
        <button class="action" on:click={() => kong('concealed', tile)}>
          Kong (<TextTile {tile} />)
        </button>
      {/each}

      {#each exposedKongs as tile}
        <button class="action" on:click={() => kong('augmented', tile)}>
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
