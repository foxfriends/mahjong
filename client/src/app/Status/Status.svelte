<script>
  import PlayerList from './PlayerList.svelte';
  import ReadyButton from './ReadyButton.svelte';
  import store from '../../game/store.js';

  export let socket;
</script>

{#if !$store.started}
  <PlayerList />
  <ReadyButton {socket} />
{/if}
