<script>
  export let angle = 0, rotation = 0, scrollable = false;
  export let topLabel = '', leftLabel = '', rightLabel = '', bottomLabel = '';
  export let highlightSide = null;

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
    {#if topLabel}
      <div class="top-label {highlightSide === 'top' ? 'highlight' : ''}">{topLabel}</div>
    {/if}
    {#if leftLabel}
      <div class="left-label {highlightSide === 'left' ? 'highlight' : ''}">{leftLabel}</div>
    {/if}
    {#if rightLabel}
      <div class="right-label {highlightSide === 'right' ? 'highlight' : ''}">{rightLabel}</div>
    {/if}
    {#if bottomLabel}
      <div class="bottom-label {highlightSide === 'bottom' ? 'highlight' : ''}">{bottomLabel}</div>
    {/if}
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

.top-label, .bottom-label, .right-label, .left-label {
  padding: 40px 0;
  color: white;
  font-size: 60pt;
  font-family: var(--font-english);
  text-align: center;
}

.right-edge {
  left: 100%;
  transform-origin: left;
  transform: rotateY(-90deg);
}

.left-label {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  transform-origin: bottom left;
  transform: rotateZ(-90deg);
}

.right-label {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 100%;
  transform-origin: bottom right;
  transform: rotateZ(90deg);
}

.top-label {
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
}

.bottom-label {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  transform-origin: center;
  transform: rotateZ(180deg);
}

.highlight {
  text-decoration: underline;
}
</style>
