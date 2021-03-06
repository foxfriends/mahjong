<script>
  import { get } from 'svelte/store';
  import Tile from './Tile.svelte';
  import Schema from '../lib/schema.js';
  import context from '../game/context.js';

  export let tableAngle;

  const { selection, selectionSets, socket, store, timer, hasAction } = context();

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
  $: {
    const store = $store;
    if (discarded) {
      exactMatches = store[myWind].up.filter(tile => store.tiles[tile].suit === discarded.suit && store.tiles[tile].value === discarded.value);
    } else {
      exactMatches = [];
    }
  };

  let canMatchSelection;
  $: canMatchSelection = selectionSet => [...$selection].every(tile => selectionSet.tiles.includes(tile));

  let canWin = false;
  $: {
    const store = $store;
    if (discarded) {
      const player = { ...store[myWind] };
      player.up = [...player.up, store.discarded];
      canWin = Schema.winningHand(store, player, store.discarded);
    } else {
      canWin = false;
    }
  }

  let canChow = [];
  $: {
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
    } else {
      canChow = [];
    }
  }

  let selecting = false;
  $: {
    const list = [];
    const store = $store;
    if (myWind) {
      const pongs = [];
      if (exactMatches.length === 2) {
        pongs.push(exactMatches);
      } else if (exactMatches.length === 3) {
        pongs.push(...[
          [exactMatches[0], exactMatches[1]],
          [exactMatches[1], exactMatches[2]],
          [exactMatches[2], exactMatches[0]],
        ]);
        list.push({
          tiles: exactMatches,
          label: 'Kong',
          async handler() {
            try {
              await socket.send('kong', { mode: 'exposed' });
              selection.set(new Set);
              selecting = false;
            } catch (error) {
              console.error(error);
            }
          },
        });
      }

      for (const tiles of pongs) {
        list.push({
          tiles,
          label: 'Pong',
          async handler() {
            try {
              await socket.send('pong');
              selection.set(new Set);
              selecting = false;
            } catch (error) {
              console.error(error);
            }
          },
        });

        const player = { ...store[myWind] };
        player.up = player.up.filter(tile => !tiles.includes(tile));
        player.down = [...player.down, [...tiles, store.discarded]];
        if (Schema.winningHand(store, player)) {
          list.push({
            tiles,
            label: 'Win',
            async handler() {
              try {
                await socket.send('win', { method: 'Pong' });
                selection.set(new Set);
                selecting = false;
              } catch (error) {
                console.error(error);
              }
            },
          });
        }
      }

      if (myTurn) {
        list.push(...canChow.map(tiles => ({
          tiles,
          label: 'Chow',
          async handler() {
            try {
              await socket.send('chow', { tiles });
              selection.set(new Set);
              selecting = false;
            } catch (error) {
              console.error(error);
            }
          },
        })));
      }

      if (canWin) {
        list.push({
          tiles: [exactMatches[0]],
          label: 'Win',
          async handler() {
            try {
              await socket.send('win', { method: 'Eyes' });
              selection.set(new Set);
              selecting = false;
            } catch (error) {
              console.error(error);
            }
          },
        });
      }

      const willWin = tiles => {
        const player = { ...store[myWind] };
        player.up = player.up.filter(tile => !tiles.includes(tile));
        player.down = [...player.down, [...tiles, store.discarded]];
        return Schema.winningHand(store, player);
      }
      list.push(...canChow.filter(willWin).map(tiles => ({
        tiles,
        label: 'Win',
        async handler() {
          try {
            await socket.send('win', { method: 'Chow', tiles });
            selection.set(new Set);
            selecting = false;
          } catch (error) {
            console.error(error);
          }
        },
      })));
    }
    selectionSets.set(list);
  }

  let handlers;
  $: {
    const store = $store;
    if (store) {
      if (store.completed) {
        handlers = [];
      } else {
        handlers = store.tiles.map((tile, index) => {
          if (myTurn) {
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

          if ([].concat(...$selectionSets.filter(canMatchSelection).map(set => set.tiles)).includes(index) && selecting) {
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
            if ($selectionSets.length === 1) {
              return async () => {
                await $selectionSets[0].handler();
              };
            } else if ($selectionSets.length > 1) {
              return async () => {
                try {
                  if (selecting) {
                    selection.set(new Set());
                    selecting = !selecting;
                    await socket.send('ignore');
                  } else {
                    // Clear the timeout so we don't get penalized for slow clicking, but let's leave the timer value so it
                    // doesn't get reset
                    const { handle } = get(timer) || {};
                    if (handle) {
                      window.clearTimeout(handle);
                    }
                    selecting = !selecting;
                  }
                } catch (error) {
                  console.error(error);
                }
              };
            }
          }
        });
      }
    }
  }

  $: $hasAction = !myTurn && $selectionSets.length;
</script>

{#if $store}
  {#each $store.tiles as tile, index}
    <Tile {tableAngle} {tile} {index} clickable={!!handlers[index]} on:click={handlers[index]} selected={$selection.has(index)} />
  {/each}
{/if}
