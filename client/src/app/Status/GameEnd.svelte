<script>
  import context from '../../game/context';

  const { store, socket } = context();
</script>

<div class="container">
  <h1 class="title">{$store[$store.turn].name} wins</h1>

  <div class="scores">
    Scores will be counted here... when I get around to building it!
  </div>

  <button class="play-again">Play Again (does not work yet either)</button>
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: absolute;
    left: 50vw;
    top: 15vh;
    width: 800px;
    height: 70vh;
    transform: translateX(-50%);
    background: rgba(255, 255, 255, 0.20);
    color: white;
  }

  .title {
    font-family: var(--font-chinese);
    text-align: center;
    margin: 0;
    padding: 10px;
    width: 80%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.25);
  }

  .scores {
    margin: 20px;
    font-family: var(--font-english);
  }

  .title {
    font-size: 24pt;
  }

  .play-again {
    margin-top: auto;
    font-family: var(--font-english);
    font-size: 14pt;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-top: 1px solid rgba(255, 255, 255, 0.75);
    padding: 8px;
    cursor: pointer;
    width: 100%;
  }
</style>
