<script>
  import context from '../../game/context';
  import Schema from '../../lib/schema';

  const { store, socket } = context();

  $: winner = $store[$store.turn];
  $: winningHand = [...winner.up, ...winner.down.flat()]
    .filter(tile => typeof tile === 'number')
    .map(tile => $store.tiles[tile]);
  $: winningSuits = new Set(winningHand.map(tile => tile.suit));

  const eq = ({ ...lhs }, { ...rhs }, ctx = {}) => {
    if (typeof lhs.suit === 'symbol') {
      if (!ctx[lhs.suit]) ctx[lhs.suit] = rhs.suit;
      lhs.suit = ctx[lhs.suit];
    } else if (typeof lhs.suit === 'undefined') {
      delete rhs.suit;
    }
    if (typeof lhs.value === 'symbol') {
      if (!ctx[lhs.value]) ctx[lhs.value] = rhs.value;
      lhs.value = ctx[lhs.value];
    } else if (typeof lhs.value === 'undefined') {
      delete rhs.value;
    }
    return lhs.suit === rhs.suit && lhs.value === rhs.value;
  };

  $: includes = (tiles, hand = [...winningHand], context = {}) => {
    if (tiles.length === 0) return true;
    const [tile, ...rest] = tiles;
    return hand.some((t, i) => {
      const ctx = { ...context };
      if (eq(tile, t, ctx)) {
        if (includes(rest, [...hand.slice(0, i), ...hand.slice(i + 1)], ctx)) {
          return true;
        }
      }
    });
  }

  const tiles = (suit, ...values) => values.map(value => ({ suit, value }));
  const pong = (suit, value) => tiles(suit, value, value, value);

  const ch = (i) => ['一', '二', '三', '四', '五', '六', '七', '八', '九'][i];
  const ro = (i) => ['Ya', 'E', 'San', 'Sei', 'M', '6', 'Tsut', 'Ba', '9'][i];

  // TODO: Will this be sufficient, or will going all Prolog be easier?
  $: awards = {
    1: {
      '白板': {
        romanized: 'Ba Ban',
        description: 'Pong ba ban',
        matched: includes(pong('dragon', 'Haku')),
      },
      '全求人': {
        romanized: 'Chun Cao Yun',
        description: 'All outside',
        matched: winner.up.length === 0,
      },
      '獨聽': {
        romanized: 'Doc Ting',
        description: 'Calling one card',
        matched: false, // TODO: this one is harder, requires analyzing the hand
      },
      '發財': {
        romanized: 'Fa Tsai',
        description: 'Pong fa tsai',
        matched: includes(pong('dragon', 'Hatsu')),
      },
      '槓上花': {
        romanized: 'Gong Tsern Fa',
        description: 'Win off gong (pick up gong, win off of card picked up as a result of gong)',
        matched: $store.source === 'back',
      },
      '紅中': {
        romanized: 'Hong Tsong',
        description: 'Pong hong tsong',
        matched: includes(pong('dragon', 'Chun')),
      },
      '圈風': {
        romanized: 'Hyun Feng',
        description: 'Pong the round wind',
        matched: includes(pong('wind', $store.wind)),
      },
      '缺一门': {
        romanized: 'Ku Ye Mun',
        description: 'Two numerical suits',
        matched: winningSuits.size === 2 && !winningSuits.has('dragon') && !winningSuits.has('wind'),
      },
      '老小': {
        romanized: 'Lo Siu',
        description: 'Chow of ends of same suit',
        matched: includes(tiles(Symbol('A'), 1, 2, 3, 7, 8, 9)),
      },
      '門風': {
        romanized: 'Mun Feng',
        description: 'Pong the wind depending on where you sit (jong is 東)',
        matched: includes(tiles('wind', $store.turn)),
      },
      '没字没花': {
        romanized: 'Mo Zi Mo Fa',
        description: 'No flowers, no winds',
        matched: false, // TODO: we don't have flowers, so I don't think this one is fair
      },
      '門前清': {
        romanized: 'Mun Tsing Tsing',
        description: 'All inside but win off of a played card',
        matched: winner.down.length === 1 && $store.source === 'discard',
      },
      '平糊': {
        romanized: 'Ping Wu',
        description: 'All chows',
        matched: false, // TODO: better matching
      },
      '爵': {
        romanized: 'Tsern',
        description: 'Pair of eyes (2, 5, 8)',
        matched: false, // TODO: better matching
      },
      '自摸': {
        romanized: 'Tsi Mo',
        description: 'Self touch',
        matched: $store.source !== 'discard',
      },
      '姐妹': {
        romanized: 'Tsi Mui',
        description: 'Pair of same chow of different suits',
        matched: false, // TODO: better matching
      },
      '断优': {
        romanized: 'Tsun Yu',
        description: 'No ends',
        matched: !includes([{ suit: Symbol('A'), value: 1 }]) && !includes([{ suit: Symbol('A'), value: 9 }]),
      },
      '搶槓': {
        romanized: 'Tsurng Gong',
        description: 'Steal from another person\'s gong to win',
        matched: false, // TODO: this will require tracking much more information
      },
    },
    2: {
      '混优': {
        romanized: 'Wan Yu',
        description: 'All ends with winds',
        matched: false, // TODO: better matching
      },
      '一班高': {
        romanized: 'Ye Ban Go',
        description: 'Two chows of the same suit',
        matched: false, // TODO: better matching
      },
    },
    3: {
      '對對糊': {
        romanized: 'De De Wu',
        description: 'All pongs',
        matched: false, // TODO: better matching
      },
      '雞糊': {
        romanized: 'Gai Wu',
        description: 'Chicken hand, zero fans',
        matched: false, // TODO: this rule depends on all the other ones, maybe it can be special cased
      },
      '五门齐': {
        romanized: 'M Mun Tsai',
        description: 'All five suits',
        matched: winningSuits.size === 5,
      },
      '四相凤': {
        romanized: 'San Tsern Vong',
        description: 'Same chow of all three suits (can pong three sequential numbers for 1 limit)',
        matched: false, // TODO: better matching
      },
      '全带优': {
        romanized: 'Tsun Dai Yu',
        description: 'All ends without winds',
        matched: false, // TODO: better matching
      },
      '混一色': {
        romanized: 'Wan Ya Se',
        description: 'All one suit with winds',
        matched: winningSuits.size === 2 && winningSuits.has('wind') && !winningSuits.has('dragon'),
      },
      '一条龙': {
        romanized: 'Ya Tiu Long',
        description: 'Dragon (1 suit for 3 fan, 2 suit for 1 fan, 3 suit for 2 fan)',
        matched: false, // TODO: not sure what this one requests
      },
      '一摸三': {
        romanized: 'Ya Mo San',
        description: 'All inside with self touch',
        matched: winner.down.length === 0,
      },
    },
    5: {
      '小三元': {
        romanized: 'Siu San Yu',
        description: 'Pong of any two of tsong, fa, ba ban with the third as eyes',
        matched: false, // TODO: better matching
      },
      '小七对': {
        romanized: 'Siu Tsut Doi',
        description: 'All pairs',
        matched: false, // TODO: special case?
      },
    },
    8: {
      '坎坎糊': {
        romanized: 'Can Can Wu',
        description: 'All pongs but all inside, must be calling eyes unless you self touch',
        matched: false, // TODO: better matching
      },
      '大三元': {
        romanized: 'Da San Yu',
        description: 'Pong tsong, fa, and ban',
        matched: includes([...pong('dragon', 'Haku'), ...pong('dragon', 'Hatsu'), ...pong('dragon', 'Chun')]),
      },
      '大七对': {
        romanized: 'Dai Tsut Doi',
        description: 'Two ya ban go\'s',
        matched: false, // TODO: better matching
      },
      '小四喜': {
        romanized: 'Siu Sei Hei',
        description: 'Pong 3 winds with last as eyes',
        matched: false, // TODO: better matching
      },
      '清一色': {
        romanized: 'Ting Ya Se',
        description: 'All one numerical suit',
        matched: winningSuits.size === 1 && !winningSuits.has('wind') && !winningSuits.has('dragon'),
      },
      ...Object.fromEntries([1, 2, 3, 4, 5, 6, 7, 8, 9].map(value => [`全带${ch(value)}`, {
        romanized: `Tsun Dai ${ro(value)}`,
        description: `All ${value}`,
        matched: includes(tiles(undefined, value, value, value, value, value, value, value, value, value, value, value, value, value, value, value)),
      }])),
    },
    'Maximum': { // TODO: what does "Maximum" mean, numerically?
      '全绿': {
        romanized: 'Chuen Lo',
        description: 'All green',
        matched: false, // TODO: what qualifies as green?
      },
      '大四喜': {
        romanized: 'Da Sei Hei',
        description: 'Pong all winds (东 南 西 北)',
        matched: includes([...pong('wind', 'Ton'), ...pong('wind', 'Nan'), ...pong('wind', 'Shaa'), ...pong('wind', 'Pei')]),
      },
      '地糊': {
        romanized: 'Dei Wu',
        description: 'Win off first card played',
        matched: false, // TODO: count how many cards have been played
      },
      '二五八': {
        romanized: 'E M Ba',
        description: 'Pong any and only the following combinations: 1, 4, 7; 2, 5, 8; 3, 6, 9',
        matched: false, // TODO: is this 3 separate rules too?
      },
      '十三不答': {
        romanized: 'Sap Sam Ba Da',
        description: 'Start the hand with zero connections, first card played cannot connect to anything in the hand',
        matched: false, // TODO: special case
      },
      '十三大优': {
        romanized: 'Sap Sam Dai Yu',
        description: 'Have 1 and 9 of all suits, one of each wind and a pair of anything',
        matched: false, // TODO: special case
      },
      '天糊': {
        romanized: 'Tian Wu',
        description: 'Be the starter (jong) and win off the very start',
        matched: false, // TODO: count how many cards have been played
      },
      '字一色': {
        romanized: 'Zi Ya Se',
        description: 'Pong all winds (东 南 四 北 + tsong, fa, ba ban)',
        matched: false, // TODO: not sure how you can manage this one
      },
    },
    '-Maximum': {
      '詐糊': {
        romanized: 'Za Wu',
        description: 'Falsely claim that you have won, must pay everyone the maximum',
        matched: false, // TODO: foxfriends/mahjong#7
      },
    },
  };

  async function playAgain() {
    const { schema } = await socket.send('playAgain');
    $store = new Schema(schema);
  }
</script>

<div class="container">
  <h1 class="title">{$store[$store.turn].name} wins</h1>

  <div class="warning">
    Not all scores can be counted automatically at this time. This is very work in progress.
    I will eventually try to make this fancier
  </div>

  <div class="scores">
    {#each Object.entries(awards) as [fan, rules]}
      {#each Object.entries(rules) as [name, { romanized, description, matched }]}
        {#if matched}
          <div class='rule'>
            {name} ({romanized}: {description}): {fan} 番
          </div>
        {/if}
      {/each}
    {/each}
  </div>

  <button
    class="play-again"
    on:click={playAgain}>
    Play Again
  </button>
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

  .warning {
    margin: 20px;
    font-family: var(--font-english);
  }

  .scores {
    margin: 20px;
    font-size: 24pt;
    font-family: var(--font-chinese);
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
