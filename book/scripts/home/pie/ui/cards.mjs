/**
 * pie/ui/cards.mjs — sprite legend previews, pie lore shelf, almanac/QA cards,
 * live card reveal queue, Ask mode inspection & canvas tags, and start card modes
 * for Exactly One Pie.
 */

export const SPRITES = Object.freeze({
  post: { scale: 1.5 }, snail: { scale: 1.7 }, spool: { scale: 1.7 }, pigeon: { scale: 1.6 }, clerk: { scale: 1.4 },
  wasps: { scale: 1.5 }, chair: { scale: 1.5 }, throne: { scale: 1.3 }, subject: { scale: 1.4 }, sack: { scale: 1.1 },
  puddle: { scale: 1 }, pile: { scale: 1.2 }, beaver: { scale: 1.4 }, baneberry: { scale: 1.9 }, berry: { scale: 2 },
  clown: { scale: 1.4 }, switch: { scale: 1.5 }, dividers: { scale: 0.42 }, table: { scale: 0.18 }, banner: { scale: 0.18 },
  stone: { scale: 1.5 }, hole: { scale: 1.4 }, mime: { scale: 1.4 }, mimewall: { scale: 1.1 }, march: { scale: 0.18 },
  ditch: { scale: 0.18 }, pane: { scale: 1.4 }, frost: { scale: 1.1 }, furrow: { scale: 1 }, egg: { scale: 1.3 }, wonder: { scale: 1.6 }
});

const CARD_SECTIONS = Object.freeze([
  ['pie-cardface-type', 'kind'], ['pie-cardface-sprite', 'sprite'], ['pie-cardface-name', 'name'], ['pie-cardface-story', 'story'],
  ['pie-cardface-lanes', 'lanes'], ['pie-cardface-chips', 'chips'], ['pie-cardface-book', 'book'], ['pie-cardface-spell', 'spell'],
  ['pie-cardface-moment', 'moment'], ['pie-cardface-qa', 'qa']
]);

const CARD_POWER = Object.freeze({ berry: 'boonberry', boneberry: 'boneberry', beaver: 'beaver', wonder: 'creature' });

const WORTH = Object.freeze({
  clown: ['satisfied', 'perfect', 'wap:satisfied'], wonder: ['kept'], egg: ['egg'], boof: ['boof'], berry: ['boonberry'],
  boneberry: ['boneberry'], furrow: ['furrow'], baneberry: ['sweetened', 'wap:sweetened', 'bane_fed', 'let_past'],
  boon: ['boonwap'], bane: ['foiled', 'wap:foiled', 'scheme_ran'], arrow: ['aimed'], vane: ['aimed'], horn: ['alley', 'parade', 'long_view'],
  mime: ['knocked', 'maw:mime_knock', 'boxed', 'maw:boxed', 'over_mimes', 'wap:over_mimes'],
  mimewall: ['knocked', 'maw:mime_knock', 'boxed', 'maw:boxed', 'over_mimes', 'wap:over_mimes'],
  march: ['knocked', 'maw:mime_knock', 'maw:march_past', 'maw:march_ran', 'over_mimes', 'wap:over_mimes'],
  clerk: ['knocked', 'shared'], subject: ['knocked', 'shared']
});

const firstSentence = (text) => /^.*?[.!?](?=\s|$)/.exec(String(text || ''))?.[0] || String(text || '');

/**
 * Initialize sprite previews, lore shelf, card renderer, Ask mode, and deck UI.
 * @param {object} deps
 */
export function initPieCards({
  root, card, cardAction, loreOut, record, reduced,
  W, H, LANE_W, PLAYER_Y, PRESENCE_Y, ROWS,
  CARDS, CARD_TYPES, KNOCKS, LOW, HIGH_CLEARS, SLIPS, WIDE, Z,
  POWER_SPELLS, WORDS, TUNE, TUNE_RANGE, LEAN_DEFAULTS, LEAN_WORDS, LEAN_ONE, LEAN_GLYPH, LEAN_NAMES, CONTEST,
  ANT_KINDS, SEASON_KINDS, ROOM_TOTALS,
  carrierById, carrierStats, pad2, chapterWords, mimesHold, shelveCard, cardsTurned,
  writePower, renderSpell, tropeEmblemSVG, biased, formerWords, reasonFor,
  laneX, nodeOf, pct, round2, fmtPts, roomsReadIn, discoveriesNow, isUnlocked, pieParts,
  tropeOfKind, withCanvasTarget, fresh, makeThing,
  drawFigure, drawBoonWAP, drawBaneWAP, drawBoof, drawThing, drawPie,
  getCtx, getRun, getState, setState, setLastTime, getBookRules, getKnockRules, getLeanRules, getPlay,
  getLore, getLikenessMod, getChosenStartChapter, setChosenStartChapter, getIntroMode, setIntroMode,
  setting, writeRecord, introOf, cobbles, mimesOn, shelvesOn,
  passing, passageHref, wordUnder, tellWord, showToast, say,
  prepareLeg, paintFlows, paintCardChapters, loop
}) {
  const introOut = root.querySelector('[data-pie-intro]');
  const cardModes = card.querySelector('[data-pie-card-modes]');
  const deckOut = document.querySelector('[data-pie-deck]');
  const qaAll = (() => { try { return new URLSearchParams(location.search).has('qa'); } catch { return false; } })();
  const designMode = (() => { try { return new URLSearchParams(location.search).has('design'); } catch { return false; } })();
  const buildId = document.documentElement.dataset.cacheRelease || 'local';

  function drawSprite(target, kind, size = 64) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    target.width = size * ratio;
    target.height = size * ratio;
    const c = target.getContext('2d');
    const tempRun = fresh(carrierById(kind.replace('carrier-', '')));
    tempRun.t = 0.6;
    withCanvasTarget(c, tempRun, 'title', () => {
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      c.clearRect(0, 0, size, size);
      const at = (x, y, k) => { c.translate(size / 2 - x * k, size / 2 - y * k); c.scale(k, k); };
      if (kind.startsWith('carrier-')) {
        at(tempRun.x, PLAYER_Y - 26, 0.62);
        drawFigure();
      } else if (kind === 'boon') {
        tempRun.boon = { t: 1, dur: 9 };
        at(W / 2, PRESENCE_Y - 4, 0.72);
        drawBoonWAP();
      } else if (kind === 'bane') {
        tempRun.bane = { t: 1, dur: 9, id: 'tax', nextBeat: 9 };
        at(W / 2, PRESENCE_Y - 6, 0.72);
        drawBaneWAP();
      } else if (kind === 'boof') {
        tempRun.boof = { x: 180, y: 300, vx: 70, touched: false };
        at(186, 296, 1.25);
        drawBoof();
      } else {
        const thing = makeThing(kind, 2);
        thing.y = 300;
        if (kind === 'wonder') thing.wonder = { kind: 'creature', name: '' };
        if (kind === 'dividers') {
          thing.lanes = [1, 2];
          thing.x = (laneX(1) + laneX(2)) / 2;
          thing.w = LANE_W * 2 - 14;
          thing.h = 22;
        }
        if (WIDE.has(kind)) {
          thing.gap = 2;
          thing.x = W / 2;
          thing.w = W;
          thing.h = kind === 'table' ? 34 : kind === 'march' ? 30 : kind === 'ditch' ? 20 : 18;
          if (kind === 'ditch') thing.gap = -1;
          if (kind === 'march') thing.y = 320;
        }
        at(thing.x, thing.y, SPRITES[kind]?.scale || 1.4);
        drawThing(thing);
      }
    });
  }

  function drawRecipeSprite(target, recipeId, size = 64) {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    target.width = size * ratio;
    target.height = size * ratio;
    const c = target.getContext('2d');
    const tempRun = fresh(carrierById('figure'));
    tempRun.t = 0.6;
    if (recipeId === 'thin') {
      tempRun.aura = 0.2;
      tempRun.filling = 0.25;
      tempRun.recipe = { id: 'warm', charges: 0 };
    } else {
      tempRun.aura = recipeId === 'royal' ? 0.94 : 0.84;
      tempRun.filling = recipeId === 'royal' ? 0.94 : 0.84;
      tempRun.warm = recipeId === 'blistered' || recipeId === 'warm' || recipeId === 'royal' ? 4 : 0;
      tempRun.recipe = { id: recipeId, charges: recipeId === 'royal' ? 5 : 3 };
    }
    withCanvasTarget(c, tempRun, 'title', () => {
      c.setTransform(ratio, 0, 0, ratio, 0, 0);
      c.clearRect(0, 0, size, size);
      c.translate(size / 2, size / 2 + 5);
      c.scale(1.15, 1.15);
      const tilt = recipeId === 'blistered' ? 0.14 : recipeId === 'tempered' ? -0.14 : 0;
      drawPie(0, 0, tilt, 1);
    });
  }

  const paintLegend = () => {
    document.querySelectorAll('canvas[data-pie-sprite]').forEach((target) => drawSprite(target, target.dataset.pieSprite));
  };
  document.querySelectorAll('canvas[data-pie-sprite]').forEach((target) => target.addEventListener('contextrestored', () => drawSprite(target, target.dataset.pieSprite)));
  document.querySelectorAll('a[href="#pie-assets"]').forEach((link) => link.addEventListener('click', () => {
    const sheet = document.getElementById('pie-assets');
    if (sheet && !sheet.open) sheet.open = true;
  }));

  function paintLore() {
    const lore = getLore();
    if (!loreOut || !lore) return;
    const found = discoveriesNow();
    const said = lore.lines.filter((line) => record.lore.includes(line.id)).length;
    const count = loreOut.querySelector('[data-pie-lore-count]');
    if (count) count.textContent = `${said} of ${lore.lines.length} lines let slip.`;
    ['boon', 'bane'].forEach((speaker) => {
      const list = loreOut.querySelector(`[data-pie-lore-list="${speaker}"]`);
      if (!list) return;
      list.replaceChildren(...lore.lines.filter((line) => line.speaker === speaker).map((line) => {
        const li = document.createElement('li');
        if (record.lore.includes(line.id)) {
          const hushed = line.ground && mimesHold(line.ground.chapter);
          li.className = `pie-lore-line is-said${hushed ? ' is-mimed' : ''}`;
          const quote = document.createElement('q');
          if (hushed) quote.append(...pieParts(line.line));
          else quote.textContent = line.line;
          li.append(quote);
          if (line.ground) {
            const a = document.createElement('a');
            const base = `/book/chapter/${String(line.ground.chapter).padStart(2, '0')}/`;
            a.href = line.ground.anchor ? `${base}#${line.ground.anchor}` : base;
            a.className = 'pie-lore-ground';
            a.textContent = `${line.ground.label}, ${chapterWords(line.ground.chapter)} →`;
            li.append(a);
          }
        } else if (isUnlocked(line, found)) {
          li.className = 'pie-lore-line is-ready';
          li.textContent = speaker === 'boon' ? 'Ready to be said, next time he holds court.' : 'Ready to slip out, next time he is foiled.';
        } else {
          li.className = 'pie-lore-line is-locked';
          li.textContent = `${line.hint || 'Not yet.'}${line.ground?.chapter ? ` Or read every room of ${chapterWords(line.ground.chapter)}${ROOM_TOTALS[line.ground.chapter] ? ` (${roomsReadIn(line.ground.chapter)} of ${ROOM_TOTALS[line.ground.chapter]} read)` : ''}.` : ''}`;
        }
        return li;
      }));
    });
  }

  function designable(face, kind) {
    face.classList.add('is-designable');
    CARD_SECTIONS.forEach(([cls, name]) => {
      const part = face.querySelector(`:scope > .${cls}`);
      if (!part) return;
      part.classList.add('is-design-part');
      const tag = nodeOf('button', 'pie-design-tag', `${name} ⧉`);
      tag.type = 'button';
      tag.title = `Copy a design note for this card's ${name}`;
      tag.addEventListener('click', async () => {
        const now = (part.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160).replace(/"/g, "'");
        const note = `?design[card.${kind.replace(/-/g, '_')}.${name}]{ #now["${now}"] #note[""] @by[you] }\n#from["lore.land/pie?design#card:${kind}"]`;
        try { await navigator.clipboard.writeText(note); tag.textContent = `${name} ✓`; } catch { tag.textContent = `${name} !`; }
        setTimeout(() => { tag.textContent = `${name} ⧉`; }, 1400);
      });
      part.before(tag);
    });
  }

  function momentOf() {
    const run = getRun();
    if (!run) return null;
    return { chapter: run.chapter, carrier: run.carrier.id, row: run.row + 1, lane: run.lane + 1, speed: Math.round(run.speed), tilt: round2(run.wobble), crust: round2(run.aura), filling: round2(run.filling), cobbles: cobbles() };
  }

  function turnCard(kind) {
    const run = getRun();
    if (!run || !CARDS[kind] || run.seenCards.has(kind)) return;
    run.seenCards.add(kind);
    const isNew = !record.cards.includes(kind);
    if (isNew) {
      record.cards.push(kind);
      writeRecord(record);
      shelveCard(kind, { chapter: run.chapter, how: 'lanes' });
      paintDeck();
    }
    const pace = run.intro ? 'at-once' : setting('cardPace');
    const crowded = pace === 'breath' && run.revealQueue.length >= 2;
    const pause = record.view.story && !record.view.zen && (run.intro || isNew) && pace !== 'quiet' && !crowded;
    if (pause) {
      run.revealQueue.push({ kind, isNew, moment: momentOf(), waited: 0 });
      if (pace === 'breath') run.tags.push({ x: W / 2, y: 98, t: 0, text: `✦ NEW CARD · ${CARDS[kind].name.toUpperCase()} · AT THE NEXT BREATH` });
    } else if (isNew) run.tags.push({ x: W / 2, y: 98, t: 0, text: `✦ CARD · ${CARDS[kind].name.toUpperCase()}` });
  }

  function chipsFor(kind) {
    const chips = [];
    const knock = KNOCKS[kind];
    if (knock) {
      chips.push(`tilt +${pct(knock.tilt)}`);
      if (knock.crust) chips.push(`− crust ${knock.crust}`);
      if (knock.filling) chips.push(`− filling ${knock.filling}`);
      if (knock.shove) chips.push('trips a lane');
      if (knock.drop) chips.push('a step back');
    }
    if (LOW.has(kind)) chips.push('⤒ a hop clears it');
    else if (HIGH_CLEARS.has(kind)) chips.push('⤒⤒ only a high hop clears it');
    else if (KNOCKS[kind] && (Z[kind] ?? 2) >= 3) chips.push('in the air: step aside');
    else if (KNOCKS[kind]) chips.push('▮ too tall to hop');
    if (SLIPS.has(kind)) chips.push('slips');
    const from = introOf(kind) || introOf(kind.replace('carrier-', ''));
    if (from) chips.push(`in the lanes from Chapter ${from}`);
    return chips;
  }

  function qaNote(kind, feel = null, moment = null) {
    const run = getRun();
    const knock = KNOCKS[kind];
    const lines = [
      '^"qa_note"{',
      `  $build[${buildId}]`,
      `  .card[${kind}]`,
      `  #feel[${feel || 'unrated'}]@tester`,
      moment ? `  %moment{ ${Object.entries(moment).map(([k, v]) => `${k}: ${v}`).join(' ')} }@game` : null,
      `  %mechanics{ ${[knock ? `tilt: ${knock.tilt}` : null, knock?.crust ? `crust: -${knock.crust}` : null, knock?.filling ? `filling: -${knock.filling}` : null, `low: ${LOW.has(kind) ? 'yes' : 'no'}`, `slip: ${SLIPS.has(kind) ? 'yes' : 'no'}`].filter(Boolean).join(' ')} }`,
      `  =view{ story: ${record.view.story ? 'on' : 'off'} zen: ${record.view.zen ? 'on' : 'off'} intro: ${run?.intro ? 'on' : 'off'} }`,
      '  #note: ""',
      '}'
    ];
    return lines.filter(Boolean).join('\n');
  }

  async function copyText(text, status) {
    try {
      await navigator.clipboard.writeText(text);
      if (status) status.textContent = 'Copied as Spw. Paste it into the thread; the numbers are the game’s own.';
    } catch {
      if (status) status.textContent = text;
    }
  }

  function spellFor(kind) {
    const bookRules = getBookRules();
    const knock = bookRules?.knockSpells?.[kind];
    if (knock) return { text: knock, kind: 'knock' };
    if (KNOCKS[kind]) {
      const k = { ...KNOCKS[kind], ...(getKnockRules()[kind] || {}) };
      const parts = [`%tilt[${k.tilt}]`, k.crust && `%crust[${k.crust}]`, k.filling && `%filling[${k.filling}]`, k.drop && '!drop', k.tax && '!tax', k.shove && '!shove', k.label && `#says["${k.label}"]`].filter(Boolean);
      return { text: `*${kind}{ ${parts.join(' ')} }`, kind: 'knock' };
    }
    const id = CARD_POWER[kind];
    const spells = bookRules?.spells || POWER_SPELLS;
    if (id && spells[id]) return { text: spells[id], kind: 'power' };
    const play = getPlay();
    if (id && play.powers[id]) return { text: writePower(play.powers[id]), kind: 'power' };
    return null;
  }

  function identitySpell(kind) {
    const c = CARDS[kind];
    const parts = [`.type[${c.type}]`, c.chapter ? `.first[chapter_${c.chapter}]` : '.first[the_lanes]', c.sprite ? `^sprite[${c.sprite}]` : '', `#name["${String(c.name).replace(/"/g, "'")}"]`].filter(Boolean);
    return `@${kind.replace(/-/g, '_')}{ ${parts.join(' ')} }`;
  }

  const explainAtom = (context) => (text, sigil, label) => {
    const n = Number((/\[(-?\d+(?:\.\d+)?)\]/.exec(text) || [])[1]);
    const arg = (/\[([^\]]*)\]/.exec(text) || [])[1];
    const pctText = Number.isFinite(n) ? `${Math.round(n * 100)}%` : '';
    if (context === 'knock') {
      if (label === 'tilt') return `It tilts the pie ${pctText}.`;
      if (label === 'crust' || label === 'filling') return `It takes ${pctText} of the ${label}.`;
      if (label === 'drop') return 'It drops you a step back down the lanes.';
      if (label === 'tax') return 'It taxes the next steps: they tilt more.';
      if (label === 'shove') return 'It trips you a lane over.';
    }
    if (label === 'says') return `Said under the screen: ${arg || ''}`;
    if (label === 'card') return `It turns the ${arg} card.`;
    if (label === 'sound') return `It sounds like a ${arg}.`;
    if (label === 'voice') return `Said in the ${arg} voice.`;
    if (label === 'with') return `The land answers: ${arg} comes up the lanes.`;
    if (label === 'without') return `The land answers: ${arg} ahead goes quiet.`;
    if (label && WORDS[label]) return sigil === '~' ? `For ${n} s, ${WORDS[label]}.` : sigil === '%' ? `+${pctText} ${WORDS[label]}.` : sigil === '*' ? `${WORDS[label]}, ×${n}.` : `${WORDS[label]}.`;
    if (sigil === '~' && /^"/.test(text.slice(1))) return 'Where the book has it.';
    if (label === 'type') return `It is a ${arg}.`;
    if (label === 'first') return arg === 'the_lanes' ? 'Only in the lanes, so far.' : `First met in ${String(arg).replace('_', ' ')}.`;
    if (label === 'sprite') return 'Drawn by the game itself.';
    if (label === 'name') return `Called ${arg}.`;
    if (label === 'pop') return `It says ${arg} when it lands.`;
    if (label === 'bits') return `It flings ${arg}.`;
    if (label === 'drama') return `Drama ×${n}.`;
    if (sigil === '=' && TUNE_RANGE[label]) return `Tunes ${label.replace(/_/g, ' ')}: now ${TUNE[label]}, held between ${TUNE_RANGE[label][0]} and ${TUNE_RANGE[label][1]}.`;
    if (sigil === '%' && LEAN_WORDS[label]) return `${LEAN_WORDS[label]} lean their way by ${n}.`;
    if (sigil === '$') return `Made of ${label}: it sounds and looks like it.`;
    if (sigil === '*') return `${label || 'This'}: a thing with a spell of its own.`;
    return '';
  };

  const bookLink = (path) => `/${String(path).replace(/(chapter\/\d+)(#|$)/, '$1/$2')}`;

  function interpretCard(spellNode, context, box) {
    const atoms = [...spellNode.querySelectorAll('.spell-atom')];
    if (!atoms.length) return;
    const reading = nodeOf('ol', 'pie-cardface-reading');
    reading.setAttribute('aria-label', 'Read aloud by the lanes');
    box.append(nodeOf('span', 'pie-cardface-spell-label', 'Read aloud by the lanes'), reading);
    const explain = explainAtom(context);
    const lines = atoms.map((a) => explain(a.textContent.trim(), a.dataset.sigil, a.dataset.label) || `${a.dataset.sigil}${a.dataset.label || ''}`);
    const all = reduced?.matches;
    atoms.forEach((a, i) => {
      const show = () => {
        atoms.forEach((x) => x.classList.toggle('is-read', x === a));
        reading.append(nodeOf('li', '', lines[i]));
      };
      if (all) show(); else setTimeout(show, 260 + i * 420);
    });
    if (!all) setTimeout(() => atoms.forEach((x) => x.classList.remove('is-read')), 260 + atoms.length * 420 + 600);
  }

  function sendToBench(text) {
    const area = document.querySelector('[data-pie-bench-spells]');
    if (!area) return;
    const label = (/^[!*]([a-z_]+)\{/.exec(text.trim()) || [])[1];
    const kept = label ? area.value.replace(new RegExp(`\\*${label}\\s*\\{[^{}]*\\}`, 'g'), '').trim() : area.value.trim();
    const entry = /^\*/.test(text.trim()) && KNOCKS[label] ? `!knocks{ ${text.trim()} }` : text.trim();
    area.value = [kept, entry].filter(Boolean).join('\n');
    area.dispatchEvent(new Event('input'));
    area.closest('section')?.scrollIntoView({ block: 'start', behavior: reduced?.matches ? 'auto' : 'smooth' });
    area.focus({ preventScroll: true });
  }

  function worthOf(kind) {
    const leanRules = getLeanRules();
    const events = WORTH[kind] || (KNOCKS[kind] ? ['knocked', ...(LOW.has(kind) || HIGH_CLEARS.has(kind) ? ['hop_clear'] : [])] : []);
    const lines = new Map();
    events.forEach((event) => {
      const [side, why] = event.includes(':') ? event.split(':') : [null, event];
      let part = null;
      let words = LEAN_ONE[why] || why.replace(/_/g, ' ');
      if (side) {
        const rule = CONTEST[side].find(([id]) => id === why);
        if (rule) { part = { cat: side, text: `${side === 'wap' ? 'pie' : 'mimes'} +${fmtPts(rule[1])}` }; if (!LEAN_ONE[why]) words = rule[2]; }
      } else {
        const rule = leanRules[why] || LEAN_DEFAULTS[why];
        if (rule) part = { cat: rule[0], text: `${LEAN_GLYPH[rule[0]]} +${fmtPts(rule[1])} ${LEAN_NAMES[rule[0]]}` };
      }
      if (!part) return;
      const line = lines.get(why) || { cat: part.cat, words, parts: [] };
      line.parts.push(part.text);
      lines.set(why, line);
    });
    return [...lines.values()].map((line) => ({ cat: line.cat, text: `${line.words}: ${line.parts.join(' · ')}` }));
  }

  function renderCard(kind, { moment = null, isNew = false, live = false, compact = false, ask = null } = {}) {
    const c = CARDS[kind];
    const likenessMod = getLikenessMod();
    const face = nodeOf('article', `pie-cardface type-${c.type}${compact ? ' is-compact' : ''}${live ? ' is-live' : ''}`);
    const sprite = document.createElement('canvas');
    sprite.className = 'pie-cardface-sprite';
    sprite.setAttribute('aria-hidden', 'true');
    drawSprite(sprite, c.sprite, compact ? 64 : 96);
    const chips = nodeOf('p', 'pie-cardface-chips');
    chipsFor(kind).forEach((chip) => chips.append(nodeOf('span', '', chip)));
    const book = nodeOf('p', 'pie-cardface-book');
    if (c.chapter) {
      const a = nodeOf('a', '', `Chapter ${chapterWords(c.chapter).replace('Chapter ', '')}`);
      a.href = `/book/chapter/${pad2(c.chapter)}/`;
      if (live) { a.target = '_blank'; a.rel = 'noopener'; }
      book.append('First in the book: ', a);
    } else {
      book.textContent = 'Only in the lanes, so far.';
    }
    const registerLine = live ? biased('reveal.line', '', { who: c.name, seed: c.name.length }) : '';
    face.append(
      (() => {
        const p = nodeOf('p', 'pie-cardface-type', CARD_TYPES[c.type]);
        if (isNew) p.append(' ', nodeOf('span', 'pie-cardface-new', 'new to your deck'));
        const likeId = likenessMod && [`card:${kind}`, `character:${kind.replace(/^carrier-/, '')}`].find((id) => likenessMod.likenessItem(id));
        if (likeId) p.append(likenessMod.findSimilar(likeId, { label: 'Like it', n: 6 }));
        return p;
      })(),
      sprite,
      nodeOf('h3', 'pie-cardface-name', c.name),
      ...(registerLine ? [nodeOf('p', 'pie-cardface-register', registerLine)] : []),
      (() => { const p = nodeOf('p', 'pie-cardface-story'); p.append(nodeOf('span', '', 'In the story'), ` ${c.story}`); return p; })(),
      (() => { const p = nodeOf('p', 'pie-cardface-lanes'); p.append(nodeOf('span', '', 'In the lanes'), ` ${c.lanes}`); return p; })(),
      ...(() => {
        const trope = tropeOfKind.get(kind);
        if (!trope) return [];
        const p = nodeOf('p', 'pie-cardface-trope');
        const emblem = tropeEmblemSVG(trope.id, { size: 40, sigil: trope.sigil });
        if (emblem) { const mark = nodeOf('i', 'pie-cardface-emblem'); mark.innerHTML = emblem; p.append(mark); }
        p.append(nodeOf('span', '', 'The trope'), ` ${trope.name}`, ...(trope.bends?.length ? [nodeOf('em', '', ` (${trope.bends.join(', ')})`)] : []), compact || !trope.crossings?.into_lanes?.says ? '' : ` — ${trope.crossings.into_lanes.says}`);
        return [p];
      })(),
      chips,
      book
    );
    const carrier = kind.startsWith('carrier-') ? carrierById(kind.replace('carrier-', '')) : null;
    if (carrier?.knack && !compact) {
      const box = nodeOf('div', 'pie-cardface-carrier');
      const knack = nodeOf('p', 'pie-cardface-knack');
      knack.append(nodeOf('b', '', `Knack · ${carrier.knack.name}`), ` ${carrier.knack.says}`);
      const bars = nodeOf('ul', 'pie-cardface-stats');
      bars.setAttribute('aria-label', `How ${carrier.name} carries`);
      carrierStats(carrier).forEach(([label, v]) => {
        const li = nodeOf('li', '');
        const bar = nodeOf('span', 'pie-stat-bar');
        bar.style.setProperty('--v', v.toFixed(2));
        li.append(nodeOf('span', 'pie-stat-label', label), bar);
        li.setAttribute('aria-label', `${label}: ${Math.round(v * 10)} of 10`);
        bars.append(li);
      });
      box.append(knack, bars);
      face.append(box);
    }
    const worth = worthOf(kind);
    if (worth.length && !compact) {
      const box = nodeOf('div', 'pie-cardface-worth');
      box.append(nodeOf('span', 'pie-cardface-spell-label', 'What it can be worth'));
      const ul = nodeOf('ul', '');
      worth.forEach((w) => ul.append(nodeOf('li', `pie-points-chip is-${w.cat}`, w.text)));
      box.append(ul);
      face.append(box);
    }
    const spell = spellFor(kind) || { text: identitySpell(kind), kind: 'identity' };
    const box = nodeOf('div', 'pie-cardface-spell');
    const rendered = renderSpell(spell.text, { explain: explainAtom(spell.kind), link: bookLink, cast: !compact && !live, label: `The spell for ${c.name}`, play: true, copy: `lore.land/pie#card:${kind}` });
    box.append(nodeOf('span', 'pie-cardface-spell-label', spell.kind === 'identity' ? 'Who it is, as a spell' : 'Its spell'), rendered);
    if (spell.kind !== 'identity') {
      const change = nodeOf('button', 'pie-cardface-change', '✎ change it on the bench');
      change.type = 'button';
      change.addEventListener('click', () => sendToBench(spell.text));
      box.append(change);
    }
    face.append(box);
    if (live && !ask) interpretCard(rendered, spell.kind, box);
    if (ask) {
      const inBook = nodeOf('div', 'pie-cardface-ask');
      inBook.append(nodeOf('span', 'pie-cardface-spell-label', 'In the book, as you met it'));
      if (ask.former) inBook.append(nodeOf('p', 'pie-cardface-ask-wonder', `This one: ${ask.former}.`));
      if (ask.reason) {
        const why = nodeOf('p', 'pie-cardface-ask-wonder');
        why.append(nodeOf('b', '', 'Whose · '), ask.reason.whose, nodeOf('b', '', ' · Why here · '), ask.reason.why, nodeOf('small', '', ` (${ask.reason.shelf} · ${ask.reason.dimension})`));
        inBook.append(why);
      }
      if (ask.wonder) {
        const w = ask.wonder;
        const p = nodeOf('p', 'pie-cardface-ask-wonder');
        const name = nodeOf(w.id ? 'a' : 'b', '', w.name || 'A wonder');
        if (w.id) Object.assign(name, { href: `/almanac/#wonder-${w.id}`, target: '_blank', rel: 'noopener' });
        p.append(name, w.note ? ` — ${w.note}` : '');
        inBook.append(p);
      }
      if (ask.passage) {
        const p = nodeOf('p', 'pie-cardface-ask-passage');
        const a = nodeOf('a', '', `${chapterWords(ask.passage.chapter)}${ask.passage.title ? `, ${ask.passage.title}` : ''} →`);
        a.href = ask.passage.href;
        a.target = '_blank';
        a.rel = 'noopener';
        p.append(`“${ask.passage.words}…” `, a);
        inBook.append(p);
        if (ask.passage.room) inBook.append(renderSpell(ask.passage.room, { cast: false, play: true, label: 'The room it was met in' }));
      }
      face.append(inBook);
    }
    const tableFold = live ? nodeOf('details', 'pie-cardface-table') : null;
    if (tableFold) tableFold.append(nodeOf('summary', '', 'For the table: the moment, and how it felt'));
    const tableHost = tableFold || face;
    if (moment) {
      tableHost.append(nodeOf('p', 'pie-cardface-moment', `Met in ${chapterWords(moment.chapter)}, under ${carrierById(moment.carrier).name}, row ${moment.row} of ${ROWS}, lane ${moment.lane}, at ${moment.speed} px/s, tilt ${pct(moment.tilt)}.`));
    }
    const qa = nodeOf('div', 'pie-cardface-qa');
    const status = nodeOf('p', 'pie-cardface-status');
    status.setAttribute('role', 'status');
    let chosen = null;
    qa.append(nodeOf('span', 'pie-cardface-qa-label', 'How did it feel?'));
    ['too easy', 'just right', 'too hard', 'unclear', 'delightful'].forEach((feel) => {
      const b = nodeOf('button', 'pie-cardface-feel', feel);
      b.type = 'button';
      b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => {
        chosen = feel.replace(' ', '-');
        qa.querySelectorAll('.pie-cardface-feel').forEach((other) => other.setAttribute('aria-pressed', other === b ? 'true' : 'false'));
        record.qa.push({ kind, feel: chosen, moment, view: { ...record.view, intro: Boolean(getRun()?.intro) }, build: buildId, at: new Date().toISOString() });
        record.qa = record.qa.slice(-200);
        writeRecord(record);
        status.textContent = `Noted in this browser: ${feel}.`;
      });
      qa.append(b);
    });
    const copy = nodeOf('button', 'pie-cardface-copy', 'Copy a QA note');
    copy.type = 'button';
    copy.addEventListener('click', () => copyText(qaNote(kind, chosen, moment), status));
    qa.append(copy);
    tableHost.append(qa, status);
    if (tableFold) face.append(tableFold);
    if (live) {
      const front = new Set(['pie-cardface-type', 'pie-cardface-sprite', 'pie-cardface-name', 'pie-cardface-register', 'pie-cardface-chips', 'pie-cardface-carrier', 'pie-cardface-ask']);
      const more = nodeOf('details', 'pie-cardface-more');
      more.append(nodeOf('summary', '', 'More: its story, its trope and its spell'));
      [...face.children].forEach((child) => { if (![...front].some((cls) => child.classList.contains(cls))) more.append(child); });
      const brief = nodeOf('p', 'pie-cardface-front');
      brief.append(nodeOf('span', 'pie-cardface-is', firstSentence(c.story)));
      if (!carrier) brief.append(' ', nodeOf('span', 'pie-cardface-does', firstSentence(c.lanes)));
      face.querySelector('.pie-cardface-name')?.after(brief);
      more.open = record.view.cardMore === true;
      more.addEventListener('toggle', () => { record.view.cardMore = more.open; writeRecord(record); });
      face.append(more);
      const foot = nodeOf('div', 'pie-cardface-foot');
      const go = nodeOf('button', 'pie-intro-go', 'Play on ▸');
      go.type = 'button';
      go.addEventListener('click', closeReveal);
      foot.append(nodeOf('span', 'pie-cardface-key', 'Space or Enter'), go);
      face.append(foot);
    }
    if (designMode) designable(face, kind);
    return face;
  }

  let askMode = false;
  const askBtn = root.querySelector('[data-pie-ask]');
  const labelsBtn = root.querySelector('[data-pie-labels]');
  const paintAsk = () => {
    askBtn?.setAttribute('aria-pressed', askMode ? 'true' : 'false');
    labelsBtn?.setAttribute('aria-pressed', record.view.labels ? 'true' : 'false');
    root.classList.toggle('is-asking', askMode);
  };
  labelsBtn?.addEventListener('click', () => {
    record.view.labels = !record.view.labels;
    writeRecord(record);
    paintAsk();
    say(record.view.labels ? 'Labels on: every thing in the lanes wears its name and where the book first has it.' : 'Labels off.');
  });
  askBtn?.addEventListener('click', () => {
    askMode = !askMode;
    paintAsk();
    say(askMode ? 'Ask: the lanes slow; tap anything to learn what it is in the story.' : 'Ask is off.');
  });

  const cardKindOf = (thing) => (thing.kind === 'wonder' ? 'wonder' : CARDS[thing.kind] ? thing.kind : null);

  function inspect(at) {
    const run = getRun();
    if (!run) return false;
    let kind = null;
    let found = null;
    if (Math.hypot(at.x - run.x, at.y - (run.y - 20)) < 30) kind = `carrier-${run.carrier.id}`;
    else if (run.boof && Math.hypot(at.x - run.boof.x, at.y - run.boof.y) < 34) kind = 'boof';
    else {
      found = run.things
        .filter((t) => !t.wapped && (cardKindOf(t) || ANT_KINDS.has(t.kind) || SEASON_KINDS.has(t.kind)))
        .map((t) => ({ t, d: Math.hypot(t.x - at.x, t.y - at.y) }))
        .filter((o) => o.d < 40)
        .sort((a, b) => a.d - b.d)[0]?.t || null;
      if (found && ANT_KINDS.has(found.kind)) {
        const why = reasonFor(found.kind);
        const sc = found.scrap;
        showToast(found.kind === 'anthill' ? 'An anthill' : 'Ants, carrying', `${why ? `${why.why.charAt(0).toUpperCase()}${why.why.slice(1)}.` : ''}${sc ? ` ${found.kind === 'anthill' ? 'They gossiped' : 'They carry'} ${sc.text}, from ${chapterWords(sc.chapter)}${sc.title ? `, ${sc.title}` : ''}.` : ''}`, 5200, 'wonder', 1);
        return true;
      }
      if (found && SEASON_KINDS.has(found.kind)) {
        const why = reasonFor(found.kind);
        const title = found.kind === 'donut' ? 'A donut, from the Ring Tide'
          : found.kind === 'dolphin' ? (found.gift ? 'A dolphin, sent up the lanes' : found.faint ? `Still coming up, from ${run.season?.season.from || 'a season'}` : 'A dolphin of the Ring Tide')
            : found.faint ? `Still set, from ${run.season?.season.from || 'a season'}` : 'A place, set early';
        showToast(title, why ? `${why.why.charAt(0).toUpperCase()}${why.why.slice(1)}. It is ${why.whose}.` : '', 5200, 'wonder', 1);
        return true;
      }
      if (found) kind = cardKindOf(found);
      else if (wordUnder(at.x, at.y, 10)) { tellWord(wordUnder(at.x, at.y, 10)); return true; }
      else if (run.boon && at.y < PRESENCE_Y + 50) kind = 'boon';
      else if (run.bane && at.y < PRESENCE_Y + 50) kind = 'bane';
    }
    if (!kind || !CARDS[kind]) return false;
    const now = passing();
    openReveal({
      kind,
      moment: momentOf(),
      isNew: false,
      ask: {
        wonder: found?.wonder || null,
        former: found?.former && mimesOn() ? formerWords(found.former) : null,
        reason: shelvesOn() ? reasonFor(found?.kind || kind) : null,
        passage: now ? { chapter: now.leg.n, title: now.para.title, room: now.para.room, words: now.para.text.split(/\s+/).slice(0, 12).join(' '), href: passageHref(now) } : null
      }
    });
    return true;
  }

  function drawAskTags() {
    const ctx = getCtx();
    const run = getRun();
    if (!(askMode || record.view.labels) || !run) return;
    ctx.save();
    ctx.font = '700 8px "JetBrainsMono", ui-monospace, monospace';
    ctx.textAlign = 'center';
    run.things.forEach((t) => {
      const kind = cardKindOf(t);
      if (!kind || t.wapped || t.y < 20 || t.y > H) return;
      const c = CARDS[kind];
      const from = c.chapter || introOf(t.kind) || null;
      const label = t.former && mimesOn() ? `Mime · ${t.former.bakes ? 'bakes' : `once a ${t.former.id.replace(/_/g, ' ')}`}` : `${(t.wonder?.name || c.name).replace(/^(A|An|The) /, '').slice(0, 16)}${from ? ` · ${from}` : ''}`;
      const w = ctx.measureText(label).width + 8;
      ctx.fillStyle = 'rgba(20, 18, 24, 0.78)';
      ctx.beginPath(); ctx.roundRect(t.x - w / 2, t.y - t.h / 2 - 18, w, 12, 4); ctx.fill();
      ctx.fillStyle = '#ffe36b';
      ctx.fillText(label, t.x, t.y - t.h / 2 - 9);
    });
    ctx.restore();
  }
  paintAsk();

  function openReveal(item) {
    if (!introOut || !CARDS[item.kind]) return;
    setState('revealing');
    introOut.replaceChildren(renderCard(item.kind, { moment: item.moment, isNew: item.isNew, live: true, ask: item.ask || null }));
    introOut.hidden = false;
    introOut.querySelector('.pie-intro-go')?.focus({ preventScroll: true });
    const c = CARDS[item.kind];
    say(`${CARD_TYPES[c.type]}: ${c.name}. ${firstSentence(c.story)} In the lanes: ${firstSentence(c.lanes)} More is on the card.`);
  }

  function closeReveal() {
    if (getState() !== 'revealing') return;
    introOut.hidden = true;
    introOut.replaceChildren();
    setState('running');
    setLastTime(performance.now());
    loop();
  }

  function paintDeck() {
    if (!deckOut) return;
    const body = deckOut.querySelector('[data-pie-deck-body]');
    const lede = deckOut.querySelector('[data-pie-deck-lede]');
    const kinds = Object.keys(CARDS);
    const shelf = cardsTurned();
    const isTurned = (k) => record.cards.includes(k) || shelf.has(k);
    const turned = kinds.filter(isTurned).length;
    if (lede) lede.textContent = `${turned} of ${kinds.length} cards turned${qaAll ? ' · QA view: every card face-up' : ''}. ${record.qa.length ? `${record.qa.length} QA note${record.qa.length === 1 ? '' : 's'} kept in this browser.` : ''}`;
    if (!body) return;
    const grid = nodeOf('ul', 'pie-deck-grid');
    kinds.forEach((kind) => {
      const li = nodeOf('li', 'pie-deck-slot');
      if (qaAll || isTurned(kind)) li.append(renderCard(kind, { compact: true }));
      else {
        const back = nodeOf('div', `pie-cardback type-${CARDS[kind].type}`);
        back.append(nodeOf('span', 'pie-cardback-mark', '?'), nodeOf('span', 'pie-cardback-type', CARD_TYPES[CARDS[kind].type]), nodeOf('span', 'pie-cardback-hint', 'Not met yet'));
        li.append(back);
      }
      grid.append(li);
    });
    const copyAll = nodeOf('button', 'pie-deck-copy', 'Copy every QA note');
    copyAll.type = 'button';
    const status = nodeOf('p', 'pie-deck-status');
    copyAll.addEventListener('click', () => copyText(record.qa.length ? record.qa.map((n) => qaNote(n.kind, n.feel, n.moment)).join('\n\n') : '# no QA notes yet', status));
    body.replaceChildren(grid, nodeOf('p', 'pie-deck-actions'), status);
    body.querySelector('.pie-deck-actions').append(copyAll);
  }

  function paintCardModes() {
    if (!cardModes) return;
    const introMode = getIntroMode();
    const make = (intro, label) => {
      const b = nodeOf('button', `pie-card-mode${introMode === intro ? ' is-active' : ''}`, label);
      b.type = 'button';
      b.setAttribute('aria-pressed', introMode === intro ? 'true' : 'false');
      b.addEventListener('click', (event) => {
        event.stopPropagation();
        setIntroMode(intro);
        if (intro) setChosenStartChapter(1);
        const startCh = getChosenStartChapter();
        paintCardModes();
        paintCardChapters(startCh);
        cardAction.textContent = intro ? '▶ Play from the beginning' : startCh > 1 ? `▶ Play from ${chapterWords(startCh)}` : '▶ Play';
        prepareLeg(startCh).then((leg) => {
          const st = getState();
          if (st === 'title' || st === 'over') paintFlows(leg);
        });
      });
      return b;
    };
    cardModes.replaceChildren(make(false, 'Play'), make(true, 'From the beginning, with introductions'));
    cardModes.hidden = false;
  }

  return {
    buildId,
    drawSprite,
    drawRecipeSprite,
    paintLegend,
    paintLore,
    turnCard,
    explainAtom,
    bookLink,
    renderCard,
    inspect,
    drawAskTags,
    openReveal,
    closeReveal,
    paintDeck,
    paintCardModes,
    isAsking: () => askMode,
    setAskMode: (v) => { askMode = Boolean(v); paintAsk(); }
  };
}
