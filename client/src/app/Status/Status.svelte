<script>
  import PlayerList from './PlayerList.svelte';
  import store from '../../game/store.js';
</script>

{#if !$store.started}
  <PlayerList />
{/if}
