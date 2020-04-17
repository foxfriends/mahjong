<script>
  import store from '../../game/store.js';

  export let socket;

  async function toggleReady() {
    try {
      await socket.send('ready', {
        ready: !$store[$store.playerWind(socket.name)].ready,
      });
    } catch (error) {
      console.error(error);
    }
  }
</script>

<button on:click={toggleReady}>
  {#if $store[$store.playerWind(socket.name)].ready}
    Cancel
  {:else}
    Ready
  {/if}
</button>
