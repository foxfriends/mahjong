<script>
  export let angle = 0, rotation = 0, scrollable = false;


  let adjustment = 0;
  $: displayAngle = Math.min(90, Math.max(0, angle + adjustment));
  const SPEED = 5;
  function scroll(event) {
    if (!scrollable) return;
    const direction = event.deltaY / Math.abs(event.deltaY);
    if (displayAngle + direction * SPEED <= 90 && displayAngle + direction * SPEED >= 0) {
      adjustment += direction * SPEED;
    }
  }

</script>

<div class="world">
  <div class="table" style="transform: rotateX({displayAngle}deg) rotateZ({rotation}deg)">
    <div class="top-edge" />
    <div class="left-edge" />
    <div class="right-edge" />
    <div class="bottom-edge" />
    <slot />
  </div>
</div>

<svelte:window on:wheel={scroll} />

<style>
.world {
  position: relative;
  perspective: 120vh;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.table {
  position: relative;
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
  margin: 0 auto;
  background-image: var(--image-table);
  transform-style: preserve-3d;
  transition: transform 2s;
  will-change: transform;
}

.top-edge, .bottom-edge {
  position: absolute;
  left: 0;
  width: 100%;
  height: 0.5cm;
  background-color: #2c4730;
}

.top-edge {
  bottom: 100%;
  transform-origin: bottom;
  transform: rotateX(-90deg);
}

.bottom-edge {
  top: 100%;
  transform-origin: top;
  transform: rotateX(90deg);
}

.left-edge, .right-edge {
  position: absolute;
  top: 0;
  width: 0.5cm;
  height: 100%;
  background-color: #264231;
}

.left-edge {
  right: 100%;
  transform-origin: right;
  transform: rotateY(90deg);
}
.right-edge {
  left: 100%;
  transform-origin: left;
  transform: rotateY(-90deg);
}
</style>
