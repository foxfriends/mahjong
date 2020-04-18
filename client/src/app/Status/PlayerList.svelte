<script>
  import store from '../../game/store.js';
</script>

<div class="container">
  <div class="player north">
    {#if $store.Pei}
      <span class="name">{$store.Pei.name}</span>
      {#if $store.Pei.ready && !$store.started}
        <div class="ready" />
      {/if}
    {/if}
    <span class="icon">北</span>
  </div>
  <div class="player east">
    {#if $store.Ton}
      <span class="name">{$store.Ton.name}</span>
      {#if $store.Ton.ready && !$store.started}
        <div class="ready" />
      {/if}
    {/if}
    <span class="icon">东</span>
  </div>
  <div class="player west">
    {#if $store.Shaa}
      <span class="name">{$store.Shaa.name}</span>
      {#if $store.Shaa.ready && !$store.started}
        <div class="ready" />
      {/if}
    {/if}
    <span class="icon">西</span>
  </div>
  <div class="player south">
    {#if $store.Nan}
      <span class="name">{$store.Nan.name}</span>
      {#if $store.Nan.ready && !$store.started}
        <div class="ready" />
      {/if}
    {/if}
    <span class="icon">南</span>
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
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.25);
    background: rgba(255, 255, 255, 0.12);
  }

  .name, .icon, .ready {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%) rotateZ(-45deg);
    transform-origin: center;
  }

  .name {
    font-family: var(--font-english);
    font-size: 16pt;
    font-weight: bold;
    color: white;
  }

  .icon {
    font-family: var(--font-chinese);
    font-size: min(12vw, 12vh);
    color: rgba(255, 255, 255, 0.07);
  }

  .ready {
    width: min(15vw, 15vh);
    height: min(15vw, 15vh);
    border: 3px solid white;
    border-radius: 100%;
  }
</style>
