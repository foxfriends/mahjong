<script>
  import store from '../../game/store.js';
</script>

<div class="container">
  <div class="player north">
    {#if $store.north}
      <span class="name">{$store.north.name}</span>
    {/if}
  </div>
  <div class="player east">
    {#if $store.east}
      <span class="name">{$store.east.name}</span>
    {/if}
  </div>
  <div class="player west">
    {#if $store.west}
      <span class="name">{$store.west.name}</span>
    {/if}
  </div>
  <div class="player south">
    {#if $store.south}
      <span class="name">{$store.south.name}</span>
    {/if}
  </div>
</div>

<style>
  .container {
    position: absolute;
    left: 50%;
    top: 50%;
    display: grid;
    grid-template-rows: 1fr 1fr;
    grid-template-columns: 1fr 1fr;
    width: min(50vw, 50vh);
    height: min(50vw, 50vh);
    transform: translate(-50%, -50%) rotateZ(45deg);
    transform-origin: center;
  }

  .player {
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .name {
    transform: rotateZ(-45deg);
    transform-origin: center;
    font-family: var(--font-english);
    font-size: 16pt;
    color: white;
  }
</style>
