<script context="module">
  const pct = amt => `min(${amt}vw, ${amt}vh)`;
  const TILE_DEPTH = 1.75;
  const TILE_WIDTH = 3;
  const TILE_HEIGHT = 4;

  const STACKS_PER_WALL = 17;
  const STACKS_WIDTH = STACKS_PER_WALL * TILE_WIDTH;

  const WALL_WIDTH = `(${pct(STACKS_WIDTH)} - ${(STACKS_PER_WALL - 1) * 1.5}px)`;
  const WALL_INSET = pct(100 - STACKS_WIDTH / 8 * 3);
  const WALL_POSITION = [
    [
      `translate(${pct(50 - STACKS_WIDTH / 2)}, ${WALL_INSET})`,
      // 'rotateZ(-15deg)',
    ],
    [
      `translateX(${pct(100)})`,
      'rotateZ(90deg)',
      `translate(${pct(50 - STACKS_WIDTH / 2)}, ${WALL_INSET})`,
      // 'rotateZ(-15deg)',
    ],
    [
      `translate(${pct(100)}, ${pct(100)})`,
      'rotateZ(180deg)',
      `translate(${pct(50 - STACKS_WIDTH / 2)}, ${WALL_INSET})`,
      // 'rotateZ(-15deg)',
    ],
    [
      `translateY(${pct(100)})`,
      'rotateZ(270deg)',
      `translate(${pct(50 - STACKS_WIDTH / 2)}, ${WALL_INSET})`,
      // 'rotateZ(-15deg)',
    ],
  ];

  const HAND_SIZE = 13;
  const HAND_INSET = pct(100 - STACKS_WIDTH / 4);
</script>

<script>
  import store from '../game/store.js';
  import { WINDS } from '../lib/schema.js';
  import images from '../tiles/Regular/*.svg';
  export let tile, index;

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

  function handPosition(wind) {
    switch (wind) {
      case 'Ton':
        return [
          `translate(${pct(50 - TILE_WIDTH * HAND_SIZE / 2)}, ${HAND_INSET})`,
        ];
      case 'Nan':
        return [
          `translateX(${pct(100)})`,
          'rotateZ(90deg)',
          `translate(${pct(50 - TILE_WIDTH * HAND_SIZE / 2)}, ${HAND_INSET})`,
        ];
      case 'Shaa':
        return [
          `translate(${pct(100)}, ${pct(100)})`,
          'rotateZ(180deg)',
          `translate(${pct(50 - TILE_WIDTH * HAND_SIZE / 2)}, ${HAND_INSET})`,
        ];
      case 'Pei':
        return [
          `translateY(${pct(100)})`,
          'rotateZ(270deg)',
          `translate(${pct(50 - TILE_WIDTH * HAND_SIZE / 2)}, ${HAND_INSET})`,
        ];
    }
  }

  function calcPosition(store) {
    for (const [wall, i] of store.walls.map((wall, i) => [wall, i])) {
      for (const [stack, j] of wall.map((stack, j) => [stack, j])) {
        const k = stack.indexOf(index);
        if (k === -1) continue;
        const position = [...WALL_POSITION[i]];
        const depth = k * TILE_DEPTH;
        const horizontal = (STACKS_PER_WALL - j) * TILE_WIDTH;
        position.push(`translateZ(${pct(depth)})`);
        position.push(`translateX(${(STACKS_PER_WALL - j) * 3}px)`)
        position.push(`translateX(${pct(horizontal)})`);
        position.push('rotateY(180deg)');
        return `transform: ${position.join(' ')}`;
      }
    }

    for (const wind of WINDS) {
      if (store[wind] && store[wind].up.includes(index)) {
        const position = handPosition(wind);
        const i = store[wind].up.indexOf(index);
        const horizontal = i * TILE_WIDTH;
        position.push(`translateZ(${pct((TILE_HEIGHT - TILE_DEPTH) / 2)})`);
        position.push(`translateX(${i * 3}px)`);
        position.push(`translateX(${pct(horizontal)})`);
        position.push(`rotateX(-90deg)`);
        return `transform: ${position.join(' ')}`;
      }
    }

    return '';
  }

  let position;
  $: position = calcPosition($store);
</script>

<div class="tile" style={position}>
  <div class="top" />
  <div class="bottom" />
  <div class="left" />
  <div class="right" />
  <div class="front" style={frontStyle} />
  <div class="back">{ index }</div>
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
  }

  .front, .back, .left, .right, .top, .bottom {
    position: absolute;
    background-size: contain;
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
    transform: translateZ(min(1.75vw, 1.75vh)) translateZ(-1px);
    background-color: white;
  }

  .back {
    background-color: #ffad00;
  }

  .top {
    top: 0;
    left: 0;
    transform-origin: top;
    transform: rotateX(90deg);

    border-top: min(0.5vw, 0.5vh) solid #e89f05;
    background-color: white;
  }

  .left {
    top: 0;
    left: 0;
    transform-origin: left;
    transform: rotateY(-90deg);

    border-left: min(0.5vw, 0.5vh) solid #e89f05;
    background-color: white;
  }

  .right {
    top: 0;
    right: 0;
    transform-origin: right;
    transform: rotateY(90deg);

    border-right: min(0.5vw, 0.5vh) solid #e89f05;
    background-color: white;
  }

  .bottom {
    bottom: 0;
    left: 0;
    transform-origin: bottom;
    transform: rotateX(-90deg);

    border-bottom: min(0.5vw, 0.5vh) solid #e89f05;
    background-color: white;
  }
</style>
