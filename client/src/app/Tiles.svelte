<script>
  import Tile from './Tile.svelte';
  import store from '../game/store.js';

  export let socket;

  let handlers = [];
  $: {
    const store = $store;
    if (store) {
      const myWind = store.playerWind(socket.name);
      const myDiscard = store.previousTurn === myWind;
      const myTurn = store.turn === myWind;
      let toDraw = -1;
      if (store.roll !== undefined) {
        const [wall, stackIndex] = store.nextDraw();
        const stack = store.walls[wall][stackIndex];
        toDraw = stack[stack.length - 1];
      }
      handlers = store.tiles.map((tile, index) => {
        if (myTurn) {
          // My turn
          if (typeof store.drawn === 'number') {
            if (store[store.turn].up.includes(index)) {
              return async () => {
                try {
                  await socket.send('discard', { tile: index });
                } catch (error) {
                  console.error(error);
                }
              };
            }
          } else if (index === toDraw) {
            return async () => {
              try {
                await socket.send('draw', {});
              } catch (error) {
                console.error(error);
              }
            };
          }
        }

        if (index === store.discarded && !myDiscard) {
          const discarded = store.tiles[index];

          const exactMatches = store[myWind].up.filter(tile => store.tiles[tile].suit === discarded.suit && store.tiles[tile].value === discarded.value);
          const canPong = exactMatches.length >= 2;
          const canKong = exactMatches.length >= 3;
          const canWin = false; // TODO: win condition
          let canChow = [];
          if (typeof discarded.value === 'number') {
            const ofSuit = store[myWind].up.filter(tile => store.tiles[tile].suit === discarded.suit);
            const required = [
              ofSuit.find(tile => store.tiles[tile].value === discarded.value - 2),
              ofSuit.find(tile => store.tiles[tile].value === discarded.value - 1),
              ofSuit.find(tile => store.tiles[tile].value === discarded.value + 1),
              ofSuit.find(tile => store.tiles[tile].value === discarded.value + 2),
            ];
            canChow = [
              required.slice(0, 2).every(x => typeof x === 'number') ? [required[0], required[1]] : null,
              required.slice(1, 3).every(x => typeof x === 'number') ? [required[1], required[2]] : null,
              required.slice(2, 4).every(x => typeof x === 'number') ? [required[2], required[3]] : null,
            ].filter(x => x);
          }

          console.log(canChow);

          if (canWin) {
            if (canPong && !canKong && !canChow.length) {
              return async () => {
                try {
                  await socket.send('win', { method: 'Pong' });
                } catch (error) {
                  console.error(error);
                }
              };
            } else if (!canPong && !canKong && canChow.length === 1) {
              return async () => {
                try {
                  await socket.send('win', { method: 'Chow', tiles: canChow[0] });
                } catch (error) {
                  console.error(error);
                }
              };
            } else if (!canPong && !canKong && !canChow.length) {
              return async () => {
                try {
                  await socket.send('win', { method: 'Eyes' });
                } catch (error) {
                  console.error(error);
                }
              };
            } else {
              // TODO: If there are multiple options, we need a lot of work
            }
          } else {
            if (canPong && !canKong && !canChow.length) {
              return async () => {
                try {
                  await socket.send('pong');
                } catch (error) {
                  console.error(error);
                }
              };
            } else if (!canPong && !canKong && (canChow.length === 1 && myTurn)) {
              return async () => {
                try {
                  await socket.send('chow', { tiles: canChow[0] });
                } catch (error) {
                  console.error(error);
                }
              };
            } else {
              // TODO: If there are multiple options, we need a lot of work
            }
          }
        }
      });
    }
  }
</script>

{#if $store}
  {#each $store.tiles as tile, index}
    <Tile {tile} {index} clickable={!!handlers[index]} on:click={handlers[index]}/>
  {/each}
{/if}
