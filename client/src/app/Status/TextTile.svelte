<script>
  import images from '../images.js';
  import context from '../../game/context.js';

  const { store } = context();

  export let tile;

  let style;
  $: {
    const info = $store.tiles[tile];
    if (typeof info.value === 'number') {
      style = `background-image: url(${images[info.suit+info.value]})`;
    } else {
      style = `background-image: url(${images[info.value]})`;
    }
  };
</script>

<span class="tile" {style} />

<style>
  .tile {
    display: inline-block;
    width: 23px;
    height: 44px;
    border-radius: 3px;
    background-position: center;
    background-size: 20px 40px;
    background-repeat: no-repeat;
    background-color: white;
  }
</style>
