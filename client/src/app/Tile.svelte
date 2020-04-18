<script>
  import store from '../game/store.js';
  import images from '../tiles/Regular/*.svg';
  export let tile, index;

  let frontStyle = '';
  $: {
    if (tile) {
      if (typeof tile.value === 'number') {
        frontStyle = `background-image: url(${images[tile.suit+tile.value]})`;
      } else if (typeof tile.value === 'number') {
        frontStyle = `background-image: url(${images[tile.value]})`;
      }
    }
  };

  const pct = amt => `min(${amt}vw, ${amt}vh)`;
  const STACKS_PER_WALL = 17;
  const WIDTH_PER_STACK = 3;
  const STACKS_WIDTH = STACKS_PER_WALL * WIDTH_PER_STACK;
  const WALL_WIDTH = `(${pct(STACKS_WIDTH)} - ${(STACKS_PER_WALL - 1) * 1.5}px)`;
  const WALL_INSET = `calc(${pct(100 - STACKS_WIDTH)} / 4)`;

  const WALL_POSITION = [
    [
      `translate(calc(${pct(50)} - ${WALL_WIDTH} / 2), ${WALL_INSET})`,
    ],
    [
      `translateX(${pct(98.5)})`,
      'rotateZ(90deg)',
      `translate(calc(${pct(50)} - ${WALL_WIDTH} / 2), ${WALL_INSET})`,
    ],
    [
      `translate(${pct(98.5)}, ${pct(98.5)})`,
      'rotateZ(180deg)',
      `translate(calc(${pct(50)} - ${WALL_WIDTH} / 2), ${WALL_INSET})`,
    ],
    [
      `translateY(${pct(98.5)})`,
      'rotateZ(270deg)',
      `translate(calc(${pct(50)} - ${WALL_WIDTH} / 2), ${WALL_INSET})`,
    ],
  ];

  function calcPosition(store) {
    for (const [wall, i] of store.walls.map((wall, i) => [wall, i])) {
      const position = [
        ...WALL_POSITION[i],
      ];
      for (const [stack, j] of wall.map((stack, j) => [stack, j])) {
        const k = stack.indexOf(index);
        if (k === -1) continue;
        const depth = k * 1.75;
        const horizontal = j * 3;
        position.push(`translateZ(min(${depth}vw, ${depth}vh))`);
        position.push(`translateX(${j * 3}px)`)
        position.push(`translateX(min(${horizontal}vw, ${horizontal}vh))`);
        position.push('rotateY(180deg)');
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
  <div class="back" />
</div>

<style>
  .tile {
    position: absolute;
    top: 0;
    left: 0;
    width: min(3vw, 3vh);
    height: min(4vw, 4vh);

    transform-style: preserve-3d;
    transform-origin: 50% 50% min(0.875vw, 0.875vh);
    transition: transform 1s;
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
    transform: translateZ(min(1.75vw, 1.75vh));
    transform-style: preserve-3d;
  }

  .front::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: white;
    transform: translateZ(-1px);
  }

  .back {
    background-color: #ffad00;
  }

  .top {
    top: 0;
    left: 0;
    transform-origin: top;
    transform: rotateX(90deg);

    border-top: 10px solid #e89f05;
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
