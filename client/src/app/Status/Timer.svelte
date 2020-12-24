<script context="module">
  import { readable } from 'svelte/store';

  const time = readable(Date.now(), (set) => {
    function update() {
      set(Date.now());
      window.requestAnimationFrame(update);
    }
    window.requestAnimationFrame(update);
  });
</script>

<script>
  import context from '../../game/context.js';

  const { timer } = context();
</script>

{#if $timer}
  <div
    class="timer"
    class:paused={$timer.paused}
    style='width: {Math.min(100, (($timer.paused || $time) - $timer.start) / $timer.duration * 100)}vw;' />
{/if}

<style>
  .timer {
    position: absolute;
    top: 0;
    left: 0;
    height: 16px;
    background-color: #89abe3;
    pointer-events: none;
  }

  .timer.paused {
    background-color: #7bc77e;
  }
</style>
