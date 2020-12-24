<script>
  export let wind;

  const CHARACTER = {
    Pei: '北',
    Nan: '南',
    Shaa: '西',
    Ton: '东',
  };
</script>

<div class="wind">
  {CHARACTER[wind]}
</div>

<style>
  .wind {
    position: absolute;
    top: 0;
    left: 100vw;
    padding: 32px;
    transform: translateX(-100%);
    font-size: 24pt;
    color: white;
    font-family: var(--font-chinese);
  }
</style>
