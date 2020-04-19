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

<button class='button' on:click={toggleReady}>
  {#if $store[$store.playerWind(socket.name)].ready}
    Cancel
  {:else}
    Ready
  {/if}
</button>

<style>
  .button {
    position: absolute;
    left: 50vw;
    top: 95vh;
    width: 300px;
    height: 50px;
    transform: translateX(-50%);

    border: 1px solid rgba(255, 255, 255, 0.25);
    border-radius: 28px;
    background: rgba(255, 255, 255, 0.12);
    font-family: var(--font-english);
    font-size: 16pt;
    color: white;
    cursor: pointer;
  }
</style>
