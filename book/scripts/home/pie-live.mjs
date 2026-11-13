// @ts-check
/**
 * pie-live.mjs — gifts from a live stream, carried into Exactly One Pie. Off unless the address asks (?live).
 *
 * A gift is something the land does in the lanes, never a word from anyone. Dolphins come up the lanes, the Ring
 * Tide's own (pie-seasons.mjs), and carry the pie a while; donuts lie warm on the road, a boost for whoever passes
 * through; hand hearts level the pie and forgive the next knock; a rose shows the clear way ahead. Any other gift
 * feeds the aura a little. A gift to your own side never hurts a carry; one to the other side, in a battle, is an
 * obstacle that can always be steered round. Every number a gift sets is held to the ranges pie-powers.mjs allows,
 * so twenty-two donuts are a long trail and not a broken game.
 *
 * Gifts arrive two ways:
 *   typed on the gift desk by whoever is streaming, as they would say it:  {11 donuts and 2 dolphins} twice
 *   from a feed on the streamer's own machine, ?live=ws://127.0.0.1:21213, sending events shaped as
 *   TikTok-Live-Connector sends them: { event: 'gift', data: { giftName, repeatCount, repeatEnd, giftType, nickname } }
 * Only a loopback address is ever opened. A name is shown while it is thanked and is never kept.
 */

const VISIT_KEY = 'lore.pie.live.visit';
const FOUND_KEY = 'lore.pie.live.finds';

/** Whether a find was made on this stream (this visit), so it deepens that gift for everyone's gifts. @param {string} id */
export function liveFound(id) {
  try { return sessionStorage.getItem(VISIT_KEY) !== null && (JSON.parse(sessionStorage.getItem(FOUND_KEY) || '[]') || []).includes(id); } catch { return false; }
}
/** A find made on this stream. @param {string} id */
export function markLiveFound(id) {
  try {
    const had = JSON.parse(sessionStorage.getItem(FOUND_KEY) || '[]') || [];
    if (!had.includes(id)) sessionStorage.setItem(FOUND_KEY, JSON.stringify([...had, id]));
  } catch { /* found for this carry */ }
}
const LIKES_KEY = 'lore.pie.live.likes';

/* The most of one gift a line can hold: likes come by the thousand. */
const MOST = 99999;
const NUMBERS = Object.freeze({ a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20 });
const TIMES = Object.freeze({ once: 1, twice: 2, thrice: 3 });
const ALIASES = Object.freeze({ doughnut: 'donut', 'heart hand': 'hand heart', 'hands heart': 'hand heart', 'hand': 'hand heart' });

const round = (/** @type {number} */ n) => Math.round(n * 100) / 100;
/** An amount that grows with the count, held to what the spell reader allows anyway. */
const grow = (/** @type {number} */ each, /** @type {number} */ n, /** @type {number} */ most) => round(Math.min(most, each * n));
const plural = (/** @type {number} */ n, /** @type {string} */ word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/**
 * @typedef {{ icon: string, art?: string, kind?: 'dolphin' | 'donut' | 'berry' | 'boonrose', most?: number, per?: number, spell?: (n: number) => string, lands: (n: number) => string }} GiftKind
 * @typedef {{ key: string, name: string, count: number, who: string, icon: string, kind: string, most: number, per: number, spell: string, lands: string, side: 'mine' | 'rival', art: string, things?: number, moment?: string }} Gift
 */

/** What each gift does. Keyed by the gift's name, singular, in lower case. @type {Readonly<Record<string, GiftKind>>} */
export const GIFTS = Object.freeze({
  dolphin: { icon: '🐬', kind: 'dolphin', most: 4, lands: () => 'up the lanes. Steer into one and it carries the pie a while.' },
  donut: { icon: '🍩', kind: 'donut', most: 9, lands: () => 'on the road ahead. Pass through one for a boost.' },
  // Likes are the crowd tapping along: a boonberry up the lanes for every thousand.
  like: { icon: '❤️', art: 'heart', kind: 'berry', most: 6, per: 1000, lands: (n) => `${n >= 2000 ? 'boonberries' : 'a boonberry'} up the lanes, one for every thousand.` },
  'hand heart': {
    icon: '🫶',
    art: 'hearthands',
    spell: (n) => `*hand_hearts{ !level !forgive %crust[${grow(0.06, n, 0.5)}] #says["Hands held up in a heart, from the crowd. The pie levels, the next knock is forgiven, and the crust is fed."] }`,
    lands: () => 'the pie levels and the next knock is forgiven.'
  },
  'boxing glove': {
    icon: '🥊',
    art: 'glove',
    spell: (n) => `*boxing_gloves{ !honk %crust[${grow(0.04, n, 0.5)}] #says["A boxing glove from the crowd punches the way clear: what was ahead swings out of the road, and the crust is fed."] }`,
    lands: () => 'the way ahead is punched clear.'
  },
  'heart puff': {
    icon: '💞',
    art: 'puff',
    spell: (n) => `*heart_puff{ ~warm[${grow(1.5, n + 2, 10)}] %filling[${grow(0.04, n, 0.5)}] #says["A puff of hearts drifts over the lanes. The pie settles faster, and the filling is fed."] }`,
    lands: () => 'the pie settles faster, and the filling is fed.'
  },
  "you're awesome": {
    icon: '⭐',
    art: 'cat',
    spell: (n) => `*youre_awesome{ !ready %crust[${grow(0.06, n, 0.5)}] #says["Somebody in the crowd thinks the carrier is awesome. A slice is ready, and the crust is fed."] }`,
    lands: () => 'a slice is ready, and the crust is fed.'
  },
  'paper crane': {
    icon: '🕊️',
    art: 'crane',
    spell: (n) => `*paper_crane{ ~lag[${grow(1, n + 2, 8)}] ~glimpse[${grow(1, n + 2, 8)}] #says["A paper crane folds itself out of the crowd and flies up the lanes ahead. The land runs slow behind it, and the clear way shows."] }`,
    lands: () => 'the land runs slow, and the clear way shows.'
  },
  'love you so much': {
    icon: '💗',
    art: 'love',
    spell: (n) => `*love_you{ !forgive %filling[${grow(0.06, n, 0.5)}] ~warm[${grow(1.5, n + 2, 10)}] #says["Love, sent from the crowd in so many words. The next knock is forgiven, the filling is fed, and the pie settles faster."] }`,
    lands: () => 'the next knock is forgiven, and the pie settles faster.'
  },
  'wink wink': {
    icon: '😉',
    art: 'wink',
    spell: (n) => `*wink{ ~true_aim[${grow(1.5, n + 3, 10)}] ~glimpse[${grow(1, n + 2, 8)}] #says["A wink from the crowd, as if it knows something. The needle finds the nearest face, and the clear way shows."] }`,
    lands: () => 'the needle finds the nearest face, and the clear way shows.'
  },
  "it's corn": {
    icon: '🌽',
    art: 'corn',
    spell: (n) => `*corn{ %crust[${grow(0.08, n, 0.5)}] ~fed[${grow(2, n + 2, 10)}] #says["It is corn: a big lump with knobs, a whole meal on a cob. Steps tilt less for a while, and the crust is fed."] }`,
    lands: () => 'a whole meal on a cob: steps tilt less, and the crust is fed.'
  },
  'heart me': {
    icon: '💗',
    art: 'heart',
    spell: (n) => `*heart_me{ %filling[${grow(0.03, n, 0.5)}] #says["A heart from the crowd. The filling is fed."] }`,
    lands: () => 'the filling is fed.'
  },
  // A rose on my side is a boon rose, laid by the road; one sent to the other side grows as a bane rose (pie-game.mjs).
  rose: { icon: '🌹', art: 'rose', kind: 'boonrose', most: 6, lands: (n) => `${n === 1 ? 'a boon rose' : 'boon roses'} laid by the road: steer into one, and the clear way shows.` }
});

/** What a boon rose does when the carrier steers into it. */
export const BOON_ROSE = '*boon_rose{ %filling[0.08] ~glimpse[3] #says["A boon rose laid by the road. The filling is fed, and the clear way shows a breath ahead."] }';

/** A gift the lanes have no word for still feeds the aura a little. @type {GiftKind} */
const ANY = {
  icon: '🎁',
  spell: (n) => `*gift{ %crust[${grow(0.03, n, 0.5)}] %filling[${grow(0.03, n, 0.5)}] #says["Something sent from the crowd. The aura is fed, crust and filling."] }`,
  lands: () => 'the aura is fed, crust and filling.'
};

/* Gifts whose names hold an "and", kept whole before a list is split on its ands. */
const WHOLE = Object.freeze([['hat and mustache', 'hat_and_mustache'], ['rock and roll', 'rock_and_roll']]);
const ICONS = Object.freeze({ hat_and_mustache: '🥸', galaxy: '🌌', lion: '🦁', universe: '🪐', 'finger heart': '🫰', 'heart me': '💗', 'tiktok': '🎵' });

/* A rival's side, as a streamer would say it: my enemy was given …, the rival got …, rival: … */
const RIVAL = /\b(enemy|enemies|rival|opponent|other side)\b/i;
const PREAMBLE = /^\s*(?:(?:i|we|you)\s+(?:just\s+)?got|someone\s+(?:just\s+)?sent(?:\s+(?:me|us))?|(?:my|our|the)\s+(?:enemy|rival|opponent)\s+(?:was\s+given|got|was\s+sent)|(?:the\s+)?(?:enemy|rival|opponent|other side)\s*:)\s*/i;

/* Icy Clash, in a battle: the other side is frozen for a while. */
const FROZEN = /\b(icy\s+clash|frozen|freeze)\b/i;

/** Which side a line of gifts is for, and the gifts without the words around them. @param {string} text */
export function readSide(text) {
  const src = String(text || '');
  /** @type {'mine' | 'rival'} */
  const side = RIVAL.test(src) ? 'rival' : 'mine';
  const brace = src.indexOf('{');
  const body = brace > 0 && !/[\d,]/.test(src.slice(0, brace)) ? src.slice(brace) : src.replace(PREAMBLE, '');
  return { side, body };
}

/** A name as it may be shown: letters, numbers and a little punctuation, and short. */
const clean = (/** @type {unknown} */ text, most = 28) => String(text ?? '').replace(/[\u0000-\u001f\u007f<>{}[\]"`]/g, '').replace(/\s+/g, ' ').trim().slice(0, most);

/** A gift's name, singular. @param {string} name */
export function singular(name) {
  const words = name.trim().toLowerCase().split(/\s+/).filter(Boolean);
  let last = words.pop() || '';
  if (/ies$/.test(last)) last = `${last.slice(0, -3)}y`;
  else if (/(ch|sh|x|ss)es$/.test(last)) last = last.slice(0, -2);
  else if (/s$/.test(last) && !/ss$/.test(last)) last = last.slice(0, -1);
  const one = [...words, last].join(' ');
  return /** @type {Record<string, string>} */ (ALIASES)[one] || one;
}

/** How many times: once, twice, x3, 3 times, ×3. @param {string | undefined} said */
function timesOf(said) {
  if (!said) return 1;
  const s = said.trim();
  if (s in TIMES) return /** @type {Record<string, number>} */ (TIMES)[s];
  const n = /(\d+)/.exec(s);
  return n ? Math.max(1, Math.min(99, Number(n[1]))) : 1;
}

const TIMES_AT_END = /\s+(once|twice|thrice|x\s*\d+|\d+\s*x|\d+\s*times)\s*$/;

/** One item: "11 donuts", "a dolphin", "donut x11", "2 hand hearts twice". @param {string} part @returns {[string, number] | null} */
function readItem(part) {
  let s = part.trim();
  if (!s) return null;
  let times = 1;
  const tail = TIMES_AT_END.exec(` ${s}`);
  if (tail) { times = timesOf(tail[1]); s = ` ${s}`.slice(0, tail.index).trim(); }
  let count = 1;
  // A couple is two and a few is three, as a streamer counts them aloud.
  s = s.replace(/^(?:a\s+)?couple(?:\s+of)?\s+/, '2 ').replace(/^(?:a\s+)?few\s+/, '3 ');
  const head = /^(\d+(?:\.\d+)?k?|[a-z]+)\s+/.exec(s);
  if (head && (/^\d/.test(head[1]) || head[1] in NUMBERS)) {
    // 6.2k likes: a thousand to a k.
    count = /^\d/.test(head[1]) ? Math.round(parseFloat(head[1]) * (head[1].endsWith('k') ? 1000 : 1)) : /** @type {Record<string, number>} */ (NUMBERS)[head[1]];
    s = s.slice(head[0].length);
  }
  const name = s.replace(/[^a-z\s'_-]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!name) return null;
  return [singular(name), Math.max(1, Math.min(MOST, count * times))];
}

const items = (/** @type {string} */ text) => text.split(/,|;|\+|&|\band\b|\n/).map(readItem).filter((x) => x !== null);

/**
 * Gifts as someone would say them, totalled by name: "{11 donuts and 2 dolphins} twice, 2 hand hearts twice".
 * A count in braces is multiplied by what follows the braces. @param {string} text @returns {Array<[string, number]>}
 */
export function parseGifts(text) {
  /** @type {Map<string, number>} */
  const tally = new Map();
  const add = (/** @type {string} */ name, /** @type {number} */ n) => tally.set(name, Math.min(MOST, (tally.get(name) || 0) + n));
  let src = readSide(text).body.toLowerCase().replace(/×/g, 'x');
  WHOLE.forEach(([said, kept]) => { src = src.replace(new RegExp(said.replace(/ /g, '\\s+'), 'g'), kept); });
  src = src.replace(/\{([^{}]*)\}\s*(once|twice|thrice|x\s*\d+|\d+\s*x|\d+\s*times)?/g, (_, inner, times) => {
    const k = timesOf(times);
    items(inner).forEach(([name, n]) => add(name, n * k));
    return ' , ';
  });
  items(src).forEach(([name, n]) => add(name, n));
  return [...tally.entries()];
}

/* A gift to the other side is an obstacle in the road and feeds Mr. BaneWAP, the lanes' own schemer; it never names anyone. */
const TO_THE_RIVAL = 'obstacles in the road, ringed in violet: steer round or hop them. Mr. BaneWAP is fed, and comes sooner with a longer scheme; find his off switch.';

/**
 * A gift, made ready for the lanes. @param {string} name @param {number} count @param {string} [who]
 * @param {'mine' | 'rival'} [side] @returns {Gift}
 */
export function giftOf(name, count, who = '', side = 'mine') {
  const key = singular(clean(name, 40).toLowerCase().replace(/\s+and\s+/g, '_and_'));
  const known = GIFTS[key];
  const kind = known || ANY;
  const n = Math.max(1, Math.min(MOST, Math.round(count) || 1));
  return {
    key,
    name: (known ? key : clean(name, 28).toLowerCase() || 'gift').replace(/_/g, ' '),
    count: n,
    who: clean(who),
    icon: /** @type {Record<string, string>} */ (ICONS)[key] || kind.icon,
    kind: side === 'rival' ? '' : kind.kind || '',
    most: kind.most || 0,
    per: kind.per || 1,
    spell: side === 'rival' || !kind.spell ? '' : kind.spell(n),
    lands: side === 'rival' ? TO_THE_RIVAL : kind.lands(n),
    side,
    art: side === 'rival' ? '' : kind.art || (key === 'hat_and_mustache' ? 'mustache' : kind.kind ? '' : 'box')
  };
}

/** Whether this visit asked for live gifts, and from where. null when it did not. */
export function liveWanted() {
  /** @type {string | null} */
  let asked = null;
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.has('live')) {
      asked = q.get('live') || 'desk';
      if (asked === 'off') { sessionStorage.removeItem(VISIT_KEY); return null; }
      sessionStorage.setItem(VISIT_KEY, asked);
    } else asked = sessionStorage.getItem(VISIT_KEY);
  } catch { /* no storage: the address alone decides */ }
  return asked;
}

/** A feed address, if it is one this page may open: ws:// on this machine only. @param {string} asked */
export function feedAddress(asked) {
  try {
    const url = new URL(asked);
    if (url.protocol !== 'ws:') return null;
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

/**
 * The gift desk and the gift line: a place to type gifts, a feed if one was asked for, and a line over the lanes
 * that thanks each gift as it comes and says what it does. onGift is handed each gift; landed() is called back
 * when the lanes have it. @param {{ screen: Element | null, onGift: (gift: Gift) => void }} opts
 */
export function initLive({ screen, onGift }) {
  const asked = liveWanted();
  if (!asked) return null;

  const line = document.createElement('div');
  line.className = 'pie-live-line';
  line.setAttribute('aria-live', 'polite');
  (screen || document.body).append(line);

  /** @param {Gift} gift @param {'waiting' | 'landed'} phase */
  const show = (gift, phase) => {
    const pill = document.createElement('p');
    pill.className = 'pie-live-gift';
    pill.dataset.phase = phase;
    pill.dataset.side = gift.side;
    const head = document.createElement('strong');
    head.textContent = `${gift.icon} ${plural(gift.count, gift.name)}${gift.who ? ` from ${gift.who}` : ''}${gift.side === 'rival' ? ' to the other side' : ''}`;
    const says = document.createElement('span');
    says.textContent = phase === 'waiting' ? 'kept for the next carry' : gift.lands;
    pill.append(head, ' ', says);
    line.prepend(pill);
    [...line.children].slice(4).forEach((old) => old.remove());
    window.setTimeout(() => pill.classList.add('is-going'), phase === 'waiting' ? 4200 : 6500);
    window.setTimeout(() => pill.remove(), phase === 'waiting' ? 5000 : 7300);
  };

  const desk = document.createElement('details');
  desk.className = 'pie-live-desk';
  desk.open = true;
  const summary = document.createElement('summary');
  summary.textContent = '🎁 Gifts';
  const form = document.createElement('form');
  const input = document.createElement('input');
  input.type = 'text';
  input.name = 'gifts';
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.placeholder = '{11 donuts and 2 dolphins} twice';
  input.setAttribute('aria-label', 'Gifts, as you would say them');
  const send = document.createElement('button');
  send.type = 'submit';
  send.textContent = 'Send up';
  const rival = document.createElement('button');
  rival.type = 'submit';
  rival.value = 'rival';
  rival.className = 'pie-live-rival';
  rival.textContent = 'To the rival';
  rival.title = 'Gifts sent to the other side feed Mr. BaneWAP';
  const status = document.createElement('p');
  status.className = 'pie-live-status';
  status.textContent = 'Type gifts as they come; they go up the lanes.';
  form.append(input, send, rival);
  desk.append(summary, form, status);
  // On the root element: the page's body has perspective and a container type, which would hold a fixed desk to it.
  document.documentElement.append(desk);

  /* Likes are a running total (now 6.2k): a boonberry for each thousand passed since the last total told. */
  let likesTold = 0;
  try { likesTold = Number(sessionStorage.getItem(LIKES_KEY)) || 0; } catch { /* counted from here */ }
  /** @param {number} total @param {'mine' | 'rival'} side */
  const likes = (total, side) => {
    const crossed = Math.floor(total / 1000) - Math.floor(likesTold / 1000);
    if (total > likesTold) {
      likesTold = total;
      try { sessionStorage.setItem(LIKES_KEY, String(total)); } catch { /* kept for this page */ }
    }
    if (crossed <= 0) return `${total} likes told; the next boonberry comes at ${(Math.floor(likesTold / 1000) + 1) * 1000}.`;
    onGift({ ...giftOf('like', total, '', side), things: crossed });
    return '';
  };

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    // A moment in a battle, not a gift: Icy Clash freezes the other side.
    if (FROZEN.test(input.value)) {
      onGift({ ...giftOf('icy clash', 1), icon: '🧊', name: 'icy clash', art: 'ice', moment: 'freeze', lands: 'the other side is frozen: what they set in the road turns to frost, and for half a minute what they are sent comes as frost.' });
      status.textContent = 'Icy Clash: the other side is frozen.';
      input.value = '';
      input.blur();
      return;
    }
    const said = parseGifts(input.value);
    if (!said.length) { status.textContent = 'No gift read there. Try: {11 donuts and 2 dolphins} twice'; return; }
    // The rival button, or the words (my enemy was given …), send a line to the other side.
    const submitter = /** @type {SubmitEvent} */ (event).submitter;
    const side = submitter?.getAttribute('value') === 'rival' || readSide(input.value).side === 'rival' ? 'rival' : 'mine';
    const notes = [];
    said.forEach(([name, n]) => { if (name === 'like') notes.push(likes(n, side)); else onGift(giftOf(name, n, '', side)); });
    status.textContent = `${side === 'rival' ? 'To the other side' : 'Sent up'}: ${said.map(([name, n]) => plural(n, name.replace(/_/g, ' '))).join(', ')}. ${notes.join(' ')}`.trim();
    input.value = '';
    input.blur();
  });

  /* A feed on this machine, if one was asked for: reconnects quietly, never anywhere else. */
  const feed = feedAddress(asked);
  if (feed) {
    let wait = 1000;
    const open = () => {
      let socket;
      try { socket = new WebSocket(feed); } catch { status.textContent = 'The feed could not be opened.'; return; }
      socket.addEventListener('open', () => { wait = 1000; status.textContent = 'Feed on: gifts come straight up the lanes.'; });
      socket.addEventListener('message', (event) => {
        let msg = null;
        try { msg = JSON.parse(String(event.data)); } catch { return; }
        const type = msg?.event || msg?.type;
        const data = msg?.data || msg;
        if (type === 'like' && Number(data?.totalLikeCount) > 0) { likes(Number(data.totalLikeCount), 'mine'); return; }
        if (type !== 'gift' || !data) return;
        // A streak counts once, when it ends.
        if (Number(data.giftType) === 1 && data.repeatEnd === false) return;
        onGift(giftOf(String(data.giftName || data.name || 'gift'), Number(data.repeatCount) || 1, data.nickname || data.uniqueId || ''));
      });
      socket.addEventListener('close', () => {
        status.textContent = 'Feed off; trying again. Typed gifts still go up.';
        window.setTimeout(open, wait);
        wait = Math.min(15000, wait * 2);
      });
    };
    open();
  }

  /** A find, said over the lanes for the room: what it opens for everyone's gifts tonight. @param {{ name: string, live: string }} find */
  const found = (find) => {
    const pill = document.createElement('p');
    pill.className = 'pie-live-gift';
    pill.dataset.phase = 'found';
    const head = document.createElement('strong');
    head.textContent = `✧ ${find.name}, found`;
    const says = document.createElement('span');
    says.textContent = `: ${find.live}`;
    pill.append(head, says);
    line.prepend(pill);
    window.setTimeout(() => pill.classList.add('is-going'), 9000);
    window.setTimeout(() => pill.remove(), 9800);
  };

  return {
    found,
    /** @param {Gift} gift */ waiting: (gift) => show(gift, 'waiting'),
    /** @param {Gift} gift */ landed: (gift) => show(gift, 'landed')
  };
}

/* ─── The gifts, drawn as themselves ───
 * Each is drawn at the origin about 30 units across, plain and high in contrast, so it can be known at a glance on a
 * phone across a room: the cat with its thumb up is You're Awesome, as TikTok draws it. The game rises, scales and
 * fades them (pie-game.mjs drawGiftArt). Every drawer takes the context and the gift's age in seconds. */
const TAU = Math.PI * 2;
/** A heart centred on x, y, s units from middle to lobe. @param {CanvasRenderingContext2D} c @param {number} x @param {number} y @param {number} s */
function heartPath(c, x, y, s) {
  c.beginPath();
  c.moveTo(x, y + s * 0.95);
  c.bezierCurveTo(x - s * 1.5, y - s * 0.05, x - s * 0.75, y - s * 1.25, x, y - s * 0.45);
  c.bezierCurveTo(x + s * 0.75, y - s * 1.25, x + s * 1.5, y - s * 0.05, x, y + s * 0.95);
  c.closePath();
}
/** @param {CanvasRenderingContext2D} c */
const outline = (c, colour = 'rgba(28, 20, 14, 0.85)', width = 1.4) => { c.strokeStyle = colour; c.lineWidth = width; c.stroke(); };

/** @type {Readonly<Record<string, (c: CanvasRenderingContext2D, age: number) => void>>} */
export const GIFT_ART = Object.freeze({
  heart: (c) => { heartPath(c, 0, 0, 10); c.fillStyle = '#e63950'; c.fill(); outline(c); },
  love: (c, age) => {
    heartPath(c, 0, 0, 13); c.fillStyle = '#ff5c8a'; c.fill(); outline(c, '#7a1030', 1.8);
    for (let i = 0; i < 3; i += 1) {
      const a = age * 2.4 + (i * TAU) / 3;
      heartPath(c, Math.cos(a) * 18, Math.sin(a) * 12 - 2, 4); c.fillStyle = '#ffb3c8'; c.fill(); outline(c, '#7a1030', 0.9);
    }
  },
  puff: (c, age) => {
    c.fillStyle = 'rgba(255, 240, 248, 0.85)';
    [[-6, 2, 8], [5, 0, 9], [0, -5, 8]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
    for (let i = 0; i < 7; i += 1) {
      const a = (i * TAU) / 7 - Math.PI / 2;
      const d = 6 + Math.min(1, age) * 14;
      heartPath(c, Math.cos(a) * d, Math.sin(a) * d, 3.6);
      c.fillStyle = i % 2 ? '#ff7eb6' : '#c77dff'; c.fill(); outline(c, 'rgba(60, 20, 50, 0.8)', 0.8);
    }
  },
  hearthands: (c) => {
    heartPath(c, 0, 0, 12); c.lineWidth = 5.5; c.strokeStyle = '#f0c49a'; c.stroke(); outline(c, '#7a4a28', 1.2);
    heartPath(c, 0, 0.5, 6); c.fillStyle = '#e63950'; c.fill();
    c.fillStyle = '#f0c49a'; [[-3.5, 12], [3.5, 12]].forEach(([x, y]) => { c.beginPath(); c.ellipse(x, y, 2.6, 4, 0, 0, TAU); c.fill(); outline(c, '#7a4a28', 1); });
  },
  cat: (c) => {
    // A cat with its thumb up: You're Awesome.
    c.fillStyle = '#f2a541';
    c.beginPath(); c.moveTo(-9, -4); c.lineTo(-10, -15); c.lineTo(-3, -9); c.closePath(); c.fill(); outline(c);
    c.beginPath(); c.moveTo(9, -4); c.lineTo(10, -15); c.lineTo(3, -9); c.closePath(); c.fill(); outline(c);
    c.beginPath(); c.arc(0, 0, 10.5, 0, TAU); c.fill(); outline(c);
    c.strokeStyle = '#2a1c10'; c.lineWidth = 1.5;
    c.beginPath(); c.arc(-4, -1, 2.2, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.beginPath(); c.arc(4, -1, 2.2, Math.PI * 1.1, Math.PI * 1.9); c.stroke();
    c.fillStyle = '#e8728a'; c.beginPath(); c.moveTo(-1.6, 2); c.lineTo(1.6, 2); c.lineTo(0, 3.8); c.closePath(); c.fill();
    c.lineWidth = 0.8; [[-1, 4], [1, 4]].forEach(([s]) => { c.beginPath(); c.moveTo(s * 4, 3.5); c.lineTo(s * 12, 2.5); c.moveTo(s * 4, 5); c.lineTo(s * 12, 6); c.stroke(); });
    c.fillStyle = '#f2a541';
    c.beginPath(); c.roundRect(10, 4, 9, 8, 3); c.fill(); outline(c);
    c.beginPath(); c.roundRect(12, -5, 4, 10, 2); c.fill(); outline(c);
  },
  wink: (c) => {
    c.beginPath(); c.arc(0, 0, 12, 0, TAU); c.fillStyle = '#ffd23f'; c.fill(); outline(c);
    c.fillStyle = '#2a1c10'; c.beginPath(); c.ellipse(-4.5, -3, 1.8, 2.6, 0, 0, TAU); c.fill();
    c.strokeStyle = '#2a1c10'; c.lineWidth = 1.8;
    c.beginPath(); c.moveTo(2, -3); c.quadraticCurveTo(4.5, -5, 7, -3); c.stroke();
    c.beginPath(); c.arc(0, 2, 6, 0.25, Math.PI - 0.25); c.stroke();
  },
  corn: (c) => {
    c.fillStyle = '#5c9a3c';
    c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(-12, 6, -8, -6); c.quadraticCurveTo(-5, 4, 0, 10); c.closePath(); c.fill(); outline(c, '#2d5a1c', 1);
    c.beginPath(); c.moveTo(0, 14); c.quadraticCurveTo(12, 6, 8, -6); c.quadraticCurveTo(5, 4, 0, 10); c.closePath(); c.fill(); outline(c, '#2d5a1c', 1);
    c.beginPath(); c.ellipse(0, -2, 6, 13, 0, 0, TAU); c.fillStyle = '#f4c430'; c.fill(); outline(c, '#8a6410', 1.2);
    c.fillStyle = '#d99a14';
    for (let y = -12; y <= 8; y += 4) for (let x = -3; x <= 3; x += 3) { c.beginPath(); c.arc(x + ((y / 4) % 2 ? 1.5 : 0) - 0.75, y, 0.9, 0, TAU); c.fill(); }
  },
  rose: (c) => {
    c.strokeStyle = '#3f7d3a'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(0, 5); c.quadraticCurveTo(-2, 12, 0, 19); c.stroke();
    c.fillStyle = '#4f9a48'; c.beginPath(); c.ellipse(-4.5, 12, 4.5, 2, -0.6, 0, TAU); c.fill();
    c.fillStyle = '#d62f4a';
    [[0, -2, 7.5], [-4.5, 0.5, 5], [4.5, 0.5, 5], [0, 3, 5]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); });
    c.beginPath(); c.arc(0, -1, 9, 0, TAU); outline(c, 'rgba(90, 14, 30, 0.8)', 1);
    c.strokeStyle = '#8f1c30'; c.lineWidth = 1.3; c.beginPath(); c.arc(0, -1, 3.2, 0.3, 5.2); c.stroke();
  },
  glove: (c) => {
    c.fillStyle = '#d7263d';
    c.beginPath(); c.ellipse(0, -4, 10, 11, 0, 0, TAU); c.fill(); outline(c);
    c.beginPath(); c.ellipse(-8, 0, 4, 6, -0.4, 0, TAU); c.fill(); outline(c);
    c.fillStyle = '#fbf6ec'; c.beginPath(); c.roundRect(-7, 6, 14, 8, 2); c.fill(); outline(c);
    c.strokeStyle = '#d7263d'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(-6, 10); c.lineTo(6, 10); c.stroke();
    c.strokeStyle = 'rgba(255, 255, 255, 0.6)'; c.lineWidth = 2; c.beginPath(); c.arc(-2, -8, 5, Math.PI * 1.1, Math.PI * 1.6); c.stroke();
  },
  crane: (c, age) => {
    const flap = Math.sin(age * 9) * 4;
    c.fillStyle = '#fbf8f0';
    c.beginPath(); c.moveTo(-14, 2); c.lineTo(0, -2); c.lineTo(14, 2); c.lineTo(0, 6); c.closePath(); c.fill(); outline(c, '#5a5a6a', 1.1);
    c.fillStyle = '#e6e6f0';
    c.beginPath(); c.moveTo(-2, 0); c.lineTo(-10, -12 - flap); c.lineTo(4, -1); c.closePath(); c.fill(); outline(c, '#5a5a6a', 1.1);
    c.beginPath(); c.moveTo(2, 0); c.lineTo(12, -11 - flap); c.lineTo(-2, -1); c.closePath(); c.fill(); outline(c, '#5a5a6a', 1.1);
    c.fillStyle = '#d62f4a'; c.beginPath(); c.moveTo(14, 2); c.lineTo(17, -3); c.lineTo(15.5, 2.5); c.closePath(); c.fill();
  },
  mustache: (c) => {
    c.fillStyle = '#2a1c10';
    c.beginPath(); c.moveTo(0, 0);
    c.bezierCurveTo(-4, -6, -12, -6, -15, 1); c.bezierCurveTo(-11, -1, -7, 4, 0, 2);
    c.bezierCurveTo(7, 4, 11, -1, 15, 1); c.bezierCurveTo(12, -6, 4, -6, 0, 0); c.fill();
  },
  ice: (c, age) => {
    c.fillStyle = 'rgba(178, 228, 248, 0.92)'; c.beginPath(); c.roundRect(-11, -11, 22, 22, 4); c.fill(); outline(c, '#2e6f8e', 1.6);
    c.strokeStyle = 'rgba(255, 255, 255, 0.85)'; c.lineWidth = 2; c.beginPath(); c.moveTo(-6, -7); c.lineTo(-1, -7); c.moveTo(-7, -6); c.lineTo(-7, -1); c.stroke();
    c.strokeStyle = '#2e6f8e'; c.lineWidth = 1.2;
    for (let i = 0; i < 6; i += 1) {
      const a = (i * TAU) / 6 + age;
      c.beginPath(); c.moveTo(Math.cos(a) * 15, Math.sin(a) * 15); c.lineTo(Math.cos(a) * 19, Math.sin(a) * 19); c.stroke();
    }
  },
  box: (c) => {
    c.fillStyle = '#7e57c2'; c.beginPath(); c.roundRect(-10, -6, 20, 16, 2); c.fill(); outline(c);
    c.fillStyle = '#9575cd'; c.beginPath(); c.roundRect(-12, -10, 24, 6, 2); c.fill(); outline(c);
    c.fillStyle = '#ffd666'; c.fillRect(-2, -10, 4, 20);
    c.beginPath(); c.ellipse(-5, -12, 5, 3, -0.4, 0, TAU); c.ellipse(5, -12, 5, 3, 0.4, 0, TAU); c.fill(); outline(c, '#8a6410', 1);
  }
});
