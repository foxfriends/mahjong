<script>
  import ActionButtons from './ActionButtons.svelte';
  import GameEnd from './GameEnd.svelte';
  import PlayerList from './PlayerList.svelte';
  import ReadyButton from './ReadyButton.svelte';
  import DiscardInfo from './DiscardInfo.svelte';
  import CurrentWind from './CurrentWind.svelte';
  import CurrentVotes from './CurrentVotes.svelte';
  import Timer from './Timer.svelte';
  import context from '../../game/context.js';

  const { socket, store } = context();

  const ORDER = {
    Ton: ['Shaa', 'Nan', 'Pei', 'Ton'],
    Shaa: ['Ton', 'Pei', 'Nan', 'Shaa'],
    Nan: ['Pei', 'Shaa', 'Ton', 'Nan'],
    Pei: ['Nan', 'Ton', 'Shaa', 'Pei'],
  };
</script>

{#if $store.started}
  <Timer />
  {#if !$store.completed}
    <ActionButtons />
  {:else}
    <GameEnd />
  {/if}
  {#if $store.discarded !== undefined}
    <DiscardInfo tile={$store.tiles[$store.discarded]} />
  {/if}
  {#if $store.wind}
    <CurrentWind wind={$store.wind} />
  {/if}
  <CurrentVotes />
{:else}
  <PlayerList order={ORDER[$store.playerWind(socket.name)]} />
  <ReadyButton />
{/if}

