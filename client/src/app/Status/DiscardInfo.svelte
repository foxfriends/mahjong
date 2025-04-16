<script>
  import images from '../images.js';

  export let tile;

  let style;
  $: {
    if (typeof tile.value === 'number') {
      style = `background-image: url(${images[tile.suit+tile.value]})`;
    } else {
      style = `background-image: url(${images[tile.value]})`;
    }
  };
</script>

<div class="tile" {style} />

<style>
  .tile {
    position: absolute;
    top: 32px;
    left: 32px;
    width: 4vh;
    height: 6vh;
    border-radius: 0.5vh;
    padding: 5%;
    background-position: center;
    background-size: contain;
    background-repeat: no-repeat;
    background-color: white;
  }
</style>
