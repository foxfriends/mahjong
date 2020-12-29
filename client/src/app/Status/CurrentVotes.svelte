<script>
  import context from '../../game/context.js';

  const { store, currentVotes, timer } = context();
</script>

{#if $timer}
  <div class='votes'>
      {#each Object.entries($currentVotes) as [position, vote]}
        {#if vote && vote.method !== 'Discard' && vote.method !== 'Ignore'}
          <div class='vote'>
            {$store[position].name}: {vote.method}
          </div>
        {/if}
      {/each}
  </div>
{/if}

<style>
  .votes {
    pointer-events: none;
    position: absolute;
    top: 100vh;
    left: 100vw;
    padding: 32px;
    transform: translate(-100%, -100%);

    display: flex;
    flex-direction: column;
    align-items: flex-start;
  }

  .vote {
    white-space: nowrap;
    font-size: 18pt;
    color: white;
    font-family: var(--font-english);
    margin-left: auto;
  }
</style>
