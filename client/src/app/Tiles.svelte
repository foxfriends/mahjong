<script>
  import { get } from 'svelte/store';
  import Tile from './Tile.svelte';
  import store from '../game/store.js';
  import selection from '../game/selection.js';

  export let socket;

  let discarded;
  $: discarded = $store && $store.tiles[$store.discarded];

  let myWind;
  $: myWind = $store && $store.playerWind(socket.name);

  let myTurn;
  $: myTurn = $store && $store.turn === myWind;
  let myDiscard;
  $: myDiscard = $store && $store.previousTurn === myWind;

  let toDraw = -1;
  $: {
      const store = $store;
      if (store) {
        if (store.roll !== undefined) {
          const [wall, stackIndex] = store.nextDraw();
          const stack = store.walls[wall][stackIndex];
          toDraw = stack[stack.length - 1];
        } else {
          toDraw = -1;
        }
     }
  }

  let exactMatches = [];
  let canPong = false;
  let canKong = false;
  $: {
    const store = $store;
    if (discarded) {
      exactMatches = store[myWind].up.filter(tile => store.tiles[tile].suit === discarded.suit && store.tiles[tile].value === discarded.value);
      canPong = exactMatches.length >= 2;
      canKong = exactMatches.length >= 3;
    }
  };

  let canMatchSelection;
  $: canMatchSelection = selectionSet => [...$selection].every(tile => selectionSet.tiles.includes(tile));

  let canWin = false; // TODO: win condition
  let canChow = [];
  $:{
    const store = $store;
    if (discarded) {
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
    }
  }

  let selectionSets = [];
  $: {
    selectionSets = []
    if (exactMatches.length === 2) {
      selectionSets.push({
        tiles: exactMatches,
        label: 'Pong',
        async handler() {
          try {
            await socket.send('pong');
          } catch (error) {
            console.error(error);
          }
        },
      });
    } else if (exactMatches.length === 3) {
      selectionSets.push(...[
        [exactMatches[0], exactMatches[1]],
        [exactMatches[1], exactMatches[2]],
        [exactMatches[2], exactMatches[0]],
      ].map(tiles => ({
        tiles,
        label: 'Pong',
        async handler() {
          try {
            await socket.send('pong');
          } catch (error) {
            console.error(error);
          }
        },
      })));
      selectionSets.push({
        tiles: exactMatches,
        label: 'Kong',
        async handler() {
          try {
            await socket.send('kong');
          } catch (error) {
            console.error(error);
          }
        },
      });
    }

    if (myTurn) {
      selectionSets.push(...canChow.map(tiles => ({
        tiles,
        label: 'Chow',
        async handler() {
          try {
            await socket.send('chow', { tiles });
          } catch (error) {
            console.error(error);
          }
        },
      })));
    }

    const willWin = () => false; // TODO
    selectionSets.push(...canChow.filter(willWin).map(tiles => ({
      tiles,
      label: 'Win',
      async handler() {
        try {
          await socket.send('win', { method: 'Chow', tiles });
        } catch (error) {
          console.error(error);
        }
      },
    })));
  }

  let handlers;
  let selecting = false;
  $: {
    const store = $store;
    if (store) {
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

        if ([].concat(...selectionSets.filter(canMatchSelection).map(set => set.tiles)).includes(index) && selecting) {
          return () => {
            const selected = get(selection);
            if (selected.has(index)) {
              selected.delete(index);
            } else {
              selected.add(index);
            }
            selection.set(selected);
          };
        }

        if (index === store.discarded && !myDiscard) {
          if (!canPong && !canKong && !canChow.length && canWin) {
              return async () => {
                try {
                  await socket.send('win', { method: 'Eyes' });
                } catch (error) {
                  console.error(error);
                }
              };
          } else if (canPong && !canKong && !canChow.length && !canWin) {
            return async () => {
              try {
                await socket.send('pong');
              } catch (error) {
                console.error(error);
              }
            };
          } else if (!canPong && !canKong && (canChow.length === 1 && myTurn) && !canWin) {
            return async () => {
              try {
                await socket.send('chow', { tiles: canChow[0] });
              } catch (error) {
                console.error(error);
              }
            };
          } else {
            return () => {
              selecting = !selecting;
              if (!selecting) selection.set(new Set());
            };
          }
        }
      });
    }
  }
</script>

{#if $store}
  {#each $store.tiles as tile, index}
    <Tile {tile} {index} clickable={!!handlers[index]} on:click={handlers[index]} selected={$selection.has(index)} />
  {/each}
{/if}
