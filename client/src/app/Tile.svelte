<script context="module">
  const pct = amt => `min(${amt}vw, ${amt}vh)`;
  const TILE_DEPTH = 1.75;
  const TILE_WIDTH = 3;
  const TILE_HEIGHT = 4;

  const STACKS_PER_WALL = 17;
  const STACKS_WIDTH = STACKS_PER_WALL * TILE_WIDTH;

  const WALL_INSET = pct(100 - STACKS_WIDTH / 8.0 * 3);
  const WALL_POSITION = [
    [
      `translate(${pct(50 - STACKS_WIDTH / 2.0)}, ${WALL_INSET})`,
      `translateX(-${(STACKS_PER_WALL - 1) * 0.75}px)`,
      // 'rotateZ(-15deg)',
    ],
    [
      `translateX(${pct(100)})`,
      'rotateZ(90deg)',
      `translate(${pct(50 - STACKS_WIDTH / 2.0)}, ${WALL_INSET})`,
      `translateX(-${(STACKS_PER_WALL - 1) * 0.75}px)`,
      // 'rotateZ(-15deg)',
    ],
    [
      `translate(${pct(100)}, ${pct(100)})`,
      'rotateZ(180deg)',
      `translate(${pct(50 - STACKS_WIDTH / 2.0)}, ${WALL_INSET})`,
      `translateX(-${(STACKS_PER_WALL - 1) * 0.75}px)`,
      // 'rotateZ(-15deg)',
    ],
    [
      `translateY(${pct(100)})`,
      'rotateZ(270deg)',
      `translate(${pct(50 - STACKS_WIDTH / 2.0)}, ${WALL_INSET})`,
      `translateX(-${(STACKS_PER_WALL - 1) * 0.75}px)`,
      // 'rotateZ(-15deg)',
    ],
  ];

  const HAND_SIZE = 13;
  const HAND_WIDTH = HAND_SIZE * TILE_WIDTH;
  const HAND_INSET = pct(100 - STACKS_WIDTH / 4);

  function handPosition(wind) {
    switch (wind) {
      case 'Ton':
        return [
          `translate(${pct(50 - HAND_WIDTH / 2.0)}, ${HAND_INSET})`,
        ];
      case 'Nan':
        return [
          `translateX(${pct(100)})`,
          'rotateZ(90deg)',
          `translate(${pct(50 - HAND_WIDTH / 2.0)}, ${HAND_INSET})`,
        ];
      case 'Shaa':
        return [
          `translate(${pct(100)}, ${pct(100)})`,
          'rotateZ(180deg)',
          `translate(${pct(50 - HAND_WIDTH / 2.0)}, ${HAND_INSET})`,
        ];
      case 'Pei':
        return [
          `translateY(${pct(100)})`,
          'rotateZ(270deg)',
          `translate(${pct(50 - HAND_WIDTH / 2.0)}, ${HAND_INSET})`,
        ];
    }
  }

  const DISCARD_INSET = pct(100 - STACKS_WIDTH / 8.0 * 3 - 2 * TILE_HEIGHT);
  function discardPosition(wind) {
    switch (wind) {
      case 'Ton':
        return [
          `translate(${pct(50 - (STACKS_WIDTH - 2 * TILE_WIDTH) / 2.0)}, ${DISCARD_INSET})`,
        ];
      case 'Nan':
        return [
          `translateX(${pct(100)})`,
          'rotateZ(90deg)',
          `translate(${pct(50 - (STACKS_WIDTH - 2 * TILE_WIDTH) / 2.0)}, ${DISCARD_INSET})`,
        ];
      case 'Shaa':
        return [
          `translate(${pct(100)}, ${pct(100)})`,
          'rotateZ(180deg)',
          `translate(${pct(50 - (STACKS_WIDTH - 2 * TILE_WIDTH) / 2.0)}, ${DISCARD_INSET})`,
        ];
      case 'Pei':
        return [
          `translateY(${pct(100)})`,
          'rotateZ(270deg)',
          `translate(${pct(50 - (STACKS_WIDTH - 2 * TILE_WIDTH) / 2.0)}, ${DISCARD_INSET})`,
        ];
    }
  }
</script>

<script>
  import { createEventDispatcher } from 'svelte';
  import store from '../game/store.js';
  import { WINDS } from '../lib/schema.js';
  import images from '../tiles/Regular/*.svg';
  export let tile, index, clickable = false;
  const dispatch = createEventDispatcher();

  let frontStyle;
  $: {
    if (tile) {
      if (typeof tile.value === 'number') {
        frontStyle = `background-image: url(${images[tile.suit+tile.value]})`;
      } else {
        frontStyle = `background-image: url(${images[tile.value]})`;
      }
    } else {
      frontStyle = '';
    }
  };

  function calcPosition(store) {
    for (const [wall, i] of store.walls.map((wall, i) => [wall, i])) {
      for (const [stack, j] of wall.map((stack, j) => [stack, j])) {
        const k = stack.indexOf(index);
        if (k === -1) continue;
        const position = [...WALL_POSITION[i]];
        const depth = k * TILE_DEPTH;
        const horizontal = (STACKS_PER_WALL - j - 1) * TILE_WIDTH;
        position.push(`translateZ(${pct(depth)})`);
        position.push(`translateX(${(STACKS_PER_WALL - j) * 3}px)`)
        position.push(`translateX(${pct(horizontal)})`);
        position.push('rotateY(180deg)');
        return `transform: ${position.join(' ')}`;
      }
    }

    for (const wind of WINDS.filter(wind => store[wind])) {
      if (store[wind].up.includes(index)) {
        const position = handPosition(wind);
        let i = store[wind].up.indexOf(index);
        if (store.drawn === index) { i = HAND_SIZE + 1; }
        const horizontal = i * TILE_WIDTH;
        position.push(`translateZ(${pct((TILE_HEIGHT - TILE_DEPTH) / 2)})`);
        position.push(`translateX(${i * 3}px)`);
        position.push(`translateX(${pct(horizontal)})`);
        position.push(`rotateX(-90deg)`);
        return `transform: ${position.join(' ')}`;
      } else if (store[wind].discarded.includes(index)) {
        const position = discardPosition(wind);
        const i = store[wind].discarded.indexOf(index);
        const j = i % HAND_WIDTH;
        const k = Math.floor(i / HAND_WIDTH);
        const horizontal = j * TILE_WIDTH;
        const vertical = k * TILE_WIDTH;
        position.push(`translate(${j * 3}px, ${k * 3}px)`);
        position.push(`translate(${pct(horizontal)}, ${pct(vertical)})`);
        return `transform: ${position.join(' ')}`;
      }
    }

    return '';
  }

  let position;
  $: position = calcPosition($store);
</script>

<div class="tile" style={position}>
  <div class="top {clickable ? 'clickable' : ''}" on:click={() => clickable && dispatch('click', { tile, index })} />
  <div class="bottom {clickable ? 'clickable' : ''}" on:click={() => clickable && dispatch('click', { tile, index })} />
  <div class="left {clickable ? 'clickable' : ''}" on:click={() => clickable && dispatch('click', { tile, index })} />
  <div class="right {clickable ? 'clickable' : ''}" on:click={() => clickable && dispatch('click', { tile, index })} />
  <div class="front {clickable ? 'clickable' : ''}" on:click={() => clickable && dispatch('click', { tile, index })}>
    <div class="image" style={frontStyle} />
  </div>
  <div class="back {clickable ? 'clickable' : ''}" on:click={() => clickable && dispatch('click', { tile, index })} />
</div>

<style>
  .tile {
    position: absolute;
    left: max(-1.5vw, -1.5vh);
    top: max(-2vw, -2vh);
    width: min(3vw, 3vh);
    height: min(4vw, 4vh);

    transform-style: preserve-3d;
    transform-origin: 50% 50% min(0.875vw, 0.875vh);
    transition: transform 1s;
    will-change: transform;
    pointer-events: none;

    --color-back: #ffad00;
    --color-side: #e89f05;
  }

  .front, .back, .left, .right, .top, .bottom {
    position: absolute;
    transform-style: preserve-3d;
  }

  .clickable {
    cursor: pointer;
    pointer-events: auto;
    --color-back: #8dc8e8;
    --color-side: #5c9eed;
  }

  .image {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }

  .front, .back {
    top: 0;
    left: 0;
    width: min(3vw, 3vh);
    height: min(4vw, 4vh);
  }

  .left, .right {
    width: min(1.25vw, 1.25vh);
    height: min(4vw, 4vh);
  }

  .top, .bottom {
    width: min(3vw, 3vh);
    height: min(1.25vw, 1.25vh);
  }

  .front {
    box-sizing: border-box;
    padding: 5%;
    transform: translateZ(min(1.75vw, 1.75vh)) translateZ(-1px);
    background-color: #fefefe;
  }

  .back {
    background-color: var(--color-back);
  }

  .top {
    top: 0;
    left: 0;
    transform-origin: top;
    transform: rotateX(90deg);

    border-top: min(0.5vw, 0.5vh) solid var(--color-side);
    background-color: #fcfcfc;
  }

  .left {
    top: 0;
    left: 0;
    transform-origin: left;
    transform: rotateY(-90deg);

    border-left: min(0.5vw, 0.5vh) solid var(--color-side);
    background-color: #fcfcfc;
  }

  .right {
    top: 0;
    right: 0;
    transform-origin: right;
    transform: rotateY(90deg);

    border-right: min(0.5vw, 0.5vh) solid var(--color-side);
    background-color: #fcfcfc;
  }

  .bottom {
    bottom: 0;
    left: 0;
    transform-origin: bottom;
    transform: rotateX(-90deg);

    border-bottom: min(0.5vw, 0.5vh) solid var(--color-side);
    background-color: #fcfcfc;
  }
</style>
