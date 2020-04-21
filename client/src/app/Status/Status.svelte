<script>
  import PlayerList from './PlayerList.svelte';
  import ReadyButton from './ReadyButton.svelte';
  import Timer from './Timer.svelte';
  import store from '../../game/store.js';

  export let socket;
  const ORDER = {
    Ton: ['Shaa', 'Nan', 'Pei', 'Ton'],
    Shaa: ['Ton', 'Pei', 'Nan', 'Shaa'],
    Nan: ['Pei', 'Shaa', 'Ton', 'Nan'],
    Pei: ['Nan', 'ton', 'Shaa', 'Pei'],
  };
</script>

{#if $store.started}
  <Timer />
{:else}
  <PlayerList order={ORDER[$store.playerWind(socket.name)]} />
  <ReadyButton {socket} />
{/if}

