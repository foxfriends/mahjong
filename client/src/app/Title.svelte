<div class="container">
  <h1 class="title">朋友一起打麻将</h1>
  <h2 class="subtitle">Mahjong with Friends</h2>
  <slot />
</div>

<style>
  .container {
    margin: 100px;
  }
  
  .title, .subtitle {
    font-family: var(--font-chinese);
    text-align: center;
    margin: 0;
  }
  
  .title {
    font-size: 48pt;
  }

  .subtitle {
    font-size: 24pt;
  }
</style>
