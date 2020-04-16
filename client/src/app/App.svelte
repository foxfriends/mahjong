<script>
  import Table from './Table.svelte';

  export let socket;

  let name, room;
</script>

<div class="layer">
  <Table>
    Hello world
  </Table>
</div>
<div class="layer">
</div>

<style>
.layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>
