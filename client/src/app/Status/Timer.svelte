<script context="module">
  import { readable } from 'svelte/store';

  const time = readable((new Date).getTime(), (set) => {
    function update() {
      set((new Date).getTime());
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
  <div class="timer" style='width: {Math.min(100, ($time - $timer.start) / $timer.duration * 100)}vw;' />
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
</style>
