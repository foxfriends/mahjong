<script>
  import Table from './Table.svelte';
  import Title from './Title.svelte';

  export let socket;
  let name, room;

  let request, errorMessage;

  const PLAY = Symbol();

  async function location() {
    if (!room) { return; }
    errorMessage = undefined;

    try {
      await socket.send('location', { room });
      state = PLAY;
    } catch (error) {
      errorMessage = error;
    }
  }
  
  async function identification() {
    if (!name) { return; }
    errorMessage = undefined;

    try {
      await socket.send('identification', { name });
      state = location;
    } catch (error) {
      errorMessage = error;
    }
  }

  let state = identification;

  function submit(event) {
    if (event.key == 'Enter') { request = state(); }
  }
</script>

<div class="layer">
  <Table>
  </Table>
</div>

{#if state !== PLAY}
  <div class="layer">
    <Title>
      <div class="form">
        {#if state === identification}
          <input class="input" placeholder="Enter your name" bind:value={name} on:keydown={submit} autofocus />
        {/if}
        {#if state === location}
          <div class="info">Welcome, <b>{name}</b>.</div>
          <input class="input" placeholder="Enter a game name" bind:value={room} on:keydown={submit} autofocus />
        {/if}
        <button class="button" disabled={!name} on:click={() => request = state()}>Confirm</button>
        {#if errorMessage}
          <div class="error">{errorMessage}</div>
        {/if}
      </div>
    </Title>
  </div>
{/if}

<style>
.layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.form {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 600px;
  margin: 50px auto;
}

.input {
  font-size: 16pt;
  border: none;
  background: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);

  font-family: var(--font-english);
  width: 100%;
}

.button {
  background: none;
  cursor: pointer;
  border: 1px solid rgba(0, 0, 0, 0.12);

  margin: 8px 0;
  padding: 8px 16px;
  margin-left: auto;

  font-family: var(--font-english);
}

.error, .info {
  padding: 8px 0;
  font-size: 14pt;
  font-family: var(--font-english);
}
</style>
