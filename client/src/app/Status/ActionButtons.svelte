<script>
  import selectionSets from '../../game/selectionSets.js';
  import selection from '../../game/selection.js';

  let actions = []
  $: actions = $selectionSets
    .filter(selectionSet => {
      return selectionSet.tiles.every(tile => $selection.has(tile)) &&
        selectionSet.tiles.length === $selection.size;
    });
</script>

<div class="container">
  <div class="actions">
    {#each actions as action}
      <button class="action" on:click={action.handler}>
        {action.label}
      </button>
    {/each}
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
    width: 120px;
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
  }
</style>
