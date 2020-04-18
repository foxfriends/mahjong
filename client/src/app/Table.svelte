<script>
  export let angle = 0, rotation = 0;
</script>

<div class="world">
  <div class="table" style="transform: rotateX({angle}deg) rotateZ({rotation}deg)">
    <div class="top-edge" />
    <div class="left-edge" />
    <div class="right-edge" />
    <div class="bottom-edge" />
    <slot />
  </div>
</div>

<style>
.world {
  position: relative;
  perspective: 120vh;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.table {
  width: min(100vw, 100vh);
  height: min(100vw, 100vh);
  margin: 0 auto;
  transform: rotateX(50deg);
  background-image: var(--image-table);
  transform-style: preserve-3d;
  transition: transform 2s;
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
