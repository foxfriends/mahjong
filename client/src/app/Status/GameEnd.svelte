<script>
  import pl from 'tau-prolog';
  import lists from 'tau-prolog/modules/lists.js';
  import context from '../../game/context';
  import Schema from '../../lib/schema';
  import RULES from '../../scoring/scoring.pl';

  lists(pl);

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

  const is = (type) => (v) => typeof v === type;
  const lower = (v) => typeof v === 'string' ? v.toLowerCase() : v;
  const ch = (i) => ['一', '二', '三', '四', '五', '六', '七', '八', '九'][i];
  const ro = (i) => ['Ya', 'E', 'Sam', 'Sei', 'M', 'Lok', 'Tsut', 'Ba', 'Gao'][i];

  const promisify = (session) => ({
    consult: src => new Promise((resolve, reject) => {
      session.consult(src, { success: resolve, error: reject });
    }),
    query: src => new Promise((resolve, reject) => {
      session.query(src, { success: resolve, error: reject })
    }),
    answer: () => new Promise((resolve, reject) => {
      session.answer({ success: resolve, error: reject, fail: () => resolve(false), limit: reject });
    }),
    check(src) {
      return this
        .query(src)
        .then(() => this.answer())
        .then((a) => (console.log(session.format_answer(a)), a))
        .then(Boolean)
        .catch((error) => {
          console.error(src, session.format_answer(error));
          return false;
        });
    },
  });

  let awards = {};
  $: (async () => {
    const rs = pl.create(100000);
    const session = promisify(rs);
    try {
      await session.consult(RULES);
    } catch (error) {
      console.error(rs.format_answer(error));
    }
    const suits  = $store.tiles
      .map((tile, i) => `suit(${i}, ${lower(tile.suit)}).`)
      .join('\n');
    const values = $store.tiles
      .map((tile, i) => `value(${i}, ${lower(tile.value)}).`)
      .join('\n');
    const up     = $store[$store.turn].up
      .map(tile => `up(${tile}).`)
      .join('\n') || 'up(_) :- false.';
    const down   = $store[$store.turn].down
      .flat()
      .filter(is('number'))
      .map(tile => `down(${tile}).`)
      .join('\n') || 'down(_) :- false.';
    const melded = $store[$store.turn].down
      .map(meld => `melded([${meld.filter(is('number')).join(', ')}]).`)
      .join('\n') || 'melded(_) :- false.';
    const wind   = `prevailing(${lower($store.wind)}). turn(${lower($store.turn)}).`;
    const source = `source(${lower($store.source)}). drawn(${$store.drawn}).`;
    const state = [suits, values, up, down, melded, wind, source].join('\n');
    try {
      await session.consult(state);
    } catch (error) {
      console.error(rs.format_answer(error));
    }

    console.log(state);

    const awards_ = {
      1: {
        '白板': {
          romanized: 'Ba Ban',
          description: 'Pong ba ban',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removePong(dragon, haku, M, _).
          `),
        },
        '全求人': {
          romanized: 'Chun Cao Yun',
          description: 'All outside',
          matched: winner.up.length === 0,
        },
        '獨聽': {
          romanized: 'Doc Ting',
          description: 'Calling one card',
          // this code is way too slow (the rest of the code is also very slow, but this is worst)
          matched: false, // await session.check('findall(T, hand(T), Hs), drawn(D), remove(D, Hs, H), findall(T, calling(H, T), Ts), length(Ts, 1).'),
        },
        '發財': {
          romanized: 'Fa Tsai',
          description: 'Pong fa tsai',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removePong(dragon, hatsu, M, _).
          `),
        },
        '槓上花': {
          romanized: 'Gong Tsern Fa',
          description: 'Win off gong (pick up gong, win off of card picked up as a result of gong)',
          matched: $store.source === 'back',
        },
        '紅中': {
          romanized: 'Hong Tsong',
          description: 'Pong hong tsong',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removePong(dragon, chun, M, _).
          `),
        },
        '圈風': {
          romanized: 'Hyun Feng',
          description: 'Pong the round wind',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            prevailing(W),
            removePong(wind, W, M, _).
          `),
        },
        '缺一门': {
          romanized: 'Ku Ye Mun',
          description: 'Two numerical suits',
          matched: await session.check(`
            findall(S, (hand(T), suit(T, S)), Ss),
            list_to_set(Ss, S),
            length(S, 2).
          `),
        },
        '老小': {
          romanized: 'Lo Siu',
          description: 'Chow of ends of same suit',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(S, 1, M, M2),
            removeChow(S, 7, M2, _).
          `),
        },
        '門風': {
          romanized: 'Mun Feng',
          description: 'Pong the wind depending on where you sit (jong is 東)',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            turn(W),
            removePong(wind, W, M, _).
          `),
        },
        '没字没花': {
          romanized: 'Mo Zi Mo Fa',
          description: 'No flowers, no winds',
          matched: false, // TODO: we don't have flowers, so I don't think this one is fair
        },
        '門前清': {
          romanized: 'Mun Tsing Tsing',
          description: 'All inside but win off of a played card',
          matched: winner.down.length === 1 && ($store.source === 'discard' || $store.source === 'kong'),
        },
        '平糊': {
          romanized: 'Ping Wu',
          description: 'All chows',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(_, _, M, M2),
            removeChow(_, _, M2, M3),
            removeChow(_, _, M3, M4),
            removeChow(_, _, M4, _).
          `),
        },
        '爵': {
          romanized: 'Tsern',
          description: 'Pair of eyes (2, 5, 8)',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            member([X, Y], M),
            (eyes(_, 2, [X, Y]) ; eyes(_, 5, [X, Y]) ; eyes(_, 8, [X, Y])).
          `),
        },
        '自摸': {
          romanized: 'Tsi Mo',
          description: 'Self touch',
          matched: $store.source === 'front' || $store.source === 'back',
        },
        '姐妹': {
          romanized: 'Tsi Mui',
          description: 'Pair of same chow of different suits',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(S1, V, M, M2),
            removeChow(S2, V, M2, _),
            S1 \\= S2.
          `),
        },
        '断优': {
          romanized: 'Tsun Yu',
          description: 'No ends',
          matched: await session.check(`\\+((hand(T), (value(T, 1); value(T, 9)))).`),
        },
        '搶槓': {
          romanized: 'Tsurng Gong',
          description: 'Steal from another person\'s gong to win',
          matched: $store.source === 'kong',
        },
        '一条龙': {
          romanized: 'Ya Tiu Long',
          description: 'Dragon (2 suits)',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(S1, 1, M, M2),
            removeChow(S2, 4, M2, M3),
            removeChow(S3, 7, M3, _),
            list_to_set([S1, S2, S3], Ss),
            length(Ss, 2).
          `),
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
          description: 'Two of the same chow, in the same suit',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(S, V, M, M2),
            removeChow(S, V, M2, _).
          `),
        },
        '一条龙': {
          romanized: 'Ya Tiu Long',
          description: 'Dragon (3 suits)',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(S1, 1, M, M2),
            removeChow(S2, 4, M2, M3),
            removeChow(S3, 7, M3, _),
            S1 \\= S2,
            S2 \\= S3,
            S3 \\= S1.
          `),
        },
      },
      3: {
        '對對糊': {
          romanized: 'De De Wu',
          description: 'All pongs',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removePong(_, _, M, M2),
            removePong(_, _, M2, M3),
            removePong(_, _, M3, M4),
            removePong(_, _, M4, _).
          `),
        },
        '五门齐': {
          romanized: 'M Mun Tsai',
          description: 'All five suits',
          matched: winningSuits.size === 5,
        },
        '四相凤': {
          romanized: 'Sam Tsern Vong',
          description: 'Same chow of all three suits',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(pin, V, M, M2),
            removeChow(man, V, M2, M3),
            removeChow(sou, V, M3, _).
          `),
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
          description: 'Dragon (1 suit)',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removeChow(S, 1, M, M2),
            removeChow(S, 4, M2, M3),
            removeChow(S, 7, M3, _).
          `),
        },
        '一摸三': {
          romanized: 'Ya Mo Sam',
          description: 'All inside with self touch',
          matched: winner.down.length === 0,
        },
      },
      5: {
        '小三元': {
          romanized: 'Siu Sam Yu',
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
          romanized: 'Da Sam Yu',
          description: 'Pong tsong, fa, and ba ban',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removePong(dragon, haku, M, M2),
            removePong(dragon, hatsu, M2, M3),
            removePong(dragon, chun, M3, _).
          `),
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
        ...Object.fromEntries(await Promise.all([1, 2, 3, 4, 5, 6, 7, 8, 9].map(async (value) => [`全带${ch(value)}`, {
          romanized: `Tsun Dai ${ro(value)}`,
          description: `All ${value}`,
          matched: await session.check(`\\+((hand(T), value(T, V), V \\= ${value})).`),
        }]))),
      },
      11: {
        '全绿': {
          romanized: 'Chuen Lo',
          description: 'All green',
          matched: await session.check(`\\+((hand(T), \\+(green(T)))).`)
        },
        '大四喜': {
          romanized: 'Da Sei Hei',
          description: 'Pong all winds (东 南 西 北)',
          matched: await session.check(`
            findall(T, hand(T), H),
            meldings(H, M),
            removePong(wind, ton, M, M2),
            removePong(wind, shaa, M2, M3),
            removePong(wind, nan, M3, M4),
            removePong(wind, pei, M4, _).
          `),
        },
        '地糊': {
          romanized: 'Dei Wu',
          description: 'Win off first card played',
          matched: false, // TODO: count how many cards have been played
        },
        '一四七': {
          romanized: 'Ya Sei Tsut',
          description: 'Pong any and only 1, 4, 7',
          matched: false, // TODO: better matching
        },
        '二五八': {
          romanized: 'E M Ba',
          description: 'Pong any and only 2, 5, 8',
          matched: false, // TODO: better matching
        },
        '三六九': {
          romanized: 'Sam Lok Gao',
          description: 'Pong any and only 3, 6, 9',
          matched: false, // TODO: better matching
        },
        '十三不答': {
          romanized: 'Sap Sam Ba Da',
          description: 'Start the hand with zero connections, first card played cannot connect to anything in the hand',
          matched: false, // TODO: special case
        },
        '十三大优': {
          romanized: 'Sap Sam Dai Yu',
          description: 'Have 1 and 9 of all suits, one of each wind and a pair of anything',
          matched: false, // TODO: better matching
        },
        '天糊': {
          romanized: 'Tian Wu',
          description: 'Be the starter (jong) and win off the very start',
          matched: false, // TODO: count how many cards have been played
        },
        '字一色': {
          romanized: 'Zi Ya Se',
          description: 'Pong all winds (东 南 四 北 + tsong, fa, ba ban)',
          matched: !winningSuits.has('Pin') && !winningSuits.has('Sou') && !winningSuits.has('Man'),
        },
      },
      [-11]: {
        '詐糊': {
          romanized: 'Za Wu',
          description: 'Falsely claim that you have won, must pay everyone the maximum',
          matched: false, // TODO: foxfriends/mahjong#7
        },
      },
    };

    // Chicken hand is special!
    const chicken = Object.values(awards_)
      .flatMap(rules => Object.values(rules))
      .every(rule => !rule.matched);
    awards_[3]['雞糊'] = {
      romanized: 'Gai Wu',
      description: 'Chicken hand',
      matched: chicken,
    };

    awards = awards_;
  })();

  async function playAgain() {
    const { schema } = await socket.send('playAgain');
    $store = new Schema(schema);
  }

  function check(value) {
    if (typeof value === 'function') return value();
    return value;
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
        {#await check(matched) then matched}
          {#if matched}
            <div class='rule'>
              {name} ({romanized}: {description}): {fan} 番
            </div>
          {/if}
        {/await}
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
