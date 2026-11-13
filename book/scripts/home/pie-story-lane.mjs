/**
 * pie-story-lane.mjs — the story in the lanes: captions, road words, found lines, and story-to-character cues.
 * Extracted from pie-game.mjs so story pacing, road typography, and character reactions live in one readable place.
 */
import { CAPTION, captionsOf, captionSeconds, skipAhead } from './pie-pacing.mjs?v=2026_11_12.A';

/**
 * Initialize the story-in-the-lanes controller.
 * @param {object} deps
 */
export function initStoryLane({
  getCtx, W, H, record, getPanelPlan, reduced, getColors, mix, getFlowProse,
  getRun, getState, getGlassFoot, airborne, inLaneOf, lean,
  showToast, sfx, say, reactionsOn, react, meanwhile
}) {
  const laneStory = { para: -1, sentences: [], terms: new Set(), at: -1, shownAt: 0, capQ: [], cap: '', capAt: 0, capHeld: 0, stepT: 0, shown: 0, skipped: 0, roadQ: [] };

  // The passage as captions (pie-pacing.mjs captionsOf): its sentences, a long one in clauses, a long clause turned
  // at a joining word, so a line is a glance; a name with a stop in it (Boon.land) and a title (Mr.) stay whole.
  const storyInMode = () => {
    const v = record.view.storyIn;
    if (v === 'off' || v === 'caption' || v === 'road' || v === 'both') return v;
    const panelPlan = getPanelPlan();
    // Arranged for the screen: in the lanes as a caption only where the strip has folded away for it.
    if (panelPlan) return panelPlan.forms.strip === 'lanes' ? 'caption' : 'off';
    return window.matchMedia('(min-width: 62rem)').matches ? 'off' : 'caption';
  };

  function laneStoryTick(i, frac) {
    const run = getRun();
    const flowProse = getFlowProse();
    if (!run || !flowProse) return;
    if (i !== laneStory.para) {
      // What was left of the last passage is still offered: the carry moved on before its end was reached.
      if (laneStory.para >= 0 && ['caption', 'both'].includes(storyInMode())) for (let k = laneStory.at + 1; k < laneStory.sentences.length; k += 1) laneStory.capQ.push(laneStory.sentences[k]);
      const el = flowProse.children[i];
      laneStory.para = i;
      // The paragraph's words without its voice's name (the strip shows who speaks beside them; a caption would run
      // the name into the first word).
      const words = el ? el.cloneNode(true) : null;
      words?.querySelectorAll('.pie-flow-voice').forEach((n) => n.remove());
      // The passage's first line leads it: when the captions fall behind, they pick up at a passage's opening.
      laneStory.sentences = captionsOf((words?.textContent || '').replace(/\s+/g, ' ').trim()).map((line, k) => ({ ...line, leads: k === 0 }));
      laneStory.terms = new Set([...(el?.querySelectorAll('.pie-flow-term') || [])].map((m) => m.textContent.toLowerCase()));
      laneStory.at = -1;
      // The story passing on the page cues the cast: BoonWAP / BaneWAP passages fire story reactions, and
      // named characters glance in once per carry when their passage passes.
      if (reactionsOn()) {
        const cue = el?.dataset?.cue;
        if (cue === 'boon' || cue === 'bane') react(`story:${cue}`);
        else {
          const text = (words?.textContent || '').toLowerCase();
          const STORY_WHO = [['boof', /\bboof\b/], ['genie', /\bgenie\b/], ['bonewap', /\bbonewap\b/], ['porter', /\bporter\b/], ['clerk', /\bclerk\b/], ['ants', /\btorch-ants?\b/], ['clown', /\bclowns?\b/], ['mime', /\bmimes?\b/]];
          const hit = STORY_WHO.find(([who, re]) => re.test(text) && !run.storyReacted?.[who]);
          if (hit) { (run.storyReacted ||= {})[hit[0]] = true; meanwhile(hit[0], 'thinking', ''); }
        }
      }
    }
    const list = laneStory.sentences;
    if (!list.length) return;
    // Which sentence the carry is at: by how far through the passage it is, weighted by sentence length.
    const total = list.reduce((sum, x) => sum + x.text.length, 0);
    let acc = 0;
    let at = list.length - 1;
    for (let k = 0; k < list.length; k += 1) { acc += list[k].text.length; if (acc / total > frac) { at = k; break; } }
    if (at !== laneStory.at) {
      // Every piece between the last one offered and this one is offered, in order: the carry can pass several in a
      // frame, and only falling behind (skipAhead, at a sentence's start) lets any go.
      const from = at > laneStory.at ? laneStory.at + 1 : at;
      laneStory.at = at;
      const mode = storyInMode();
      if (mode === 'caption' || mode === 'both') for (let k = from; k <= at; k += 1) laneStory.capQ.push(list[k]);
      if (mode === 'road' || mode === 'both') {
        // A phrase a row: short enough to read in one look as it comes down.
        let row = '';
        list[at].text.split(/\s+/).forEach((word) => {
          if (row && row.length + word.length > 38) { laneStory.roadQ.push({ text: row, terms: laneStory.terms, sentence: list[at].text }); row = word; } else row = row ? `${row} ${word}` : word;
        });
        if (row) laneStory.roadQ.push({ text: row, terms: laneStory.terms, sentence: list[at].text });
      }
    }
  }

  /* Its words on the cobbles: packed into rows across the lanes, read top to bottom, coming down. */
  function paveSentence(text, terms = laneStory.terms, sentence = text) {
    const run = getRun();
    if (!run) return;
    const ctx = getCtx();
    run.roadWords = run.roadWords || [];
    const words = text.split(/\s+/).filter(Boolean);
    ctx.save();
    ctx.font = '600 13px Georgia, serif';
    let row = 0;
    let x = 14;
    const rows = [[]];
    words.forEach((word) => {
      const w = ctx.measureText(word).width;
      if (x + w > W - 14 && rows[row].length) { row += 1; rows[row] = []; x = 14; }
      rows[row].push({ word, w, x: x + w / 2 });
      x += w + 9;
    });
    ctx.restore();
    // Above whatever is already on the road; its rows read top to bottom, a little apart, as a line does.
    const top = -16;
    rows.forEach((line, r) => {
      const width = line.reduce((sum, item) => sum + item.w, 0) + (line.length - 1) * 9;
      const shift = (W - width) / 2 - 14;   // each row centred across the lanes
      line.forEach((item) => {
        const clean = item.word.replace(/[^\p{L}\p{N}'’-]/gu, '').toLowerCase();
        const glow = [...terms].some((term) => term.split(/\s+/).includes(clean));
        run.roadWords.push({ word: item.word, w: item.w, x: item.x + shift, y: top - (rows.length - 1 - r) * 34, glow, read: false, sentence });
      });
    });
    if (run.roadWords.length > 90) run.roadWords.splice(0, run.roadWords.length - 90);
  }

  /* Each frame: the caption turns when it has been read; the road lays its next phrase when the last
   * one has come onto the screen. */
  function laneStoryStep() {
    const run = getRun();
    if (!run) return;
    const L = laneStory;
    // The story waits for the road: while something is about to hit, or the pie is rattled, the caption is not
    // counted as read (a few seconds at most, CAPTION.waitsForRoad), so a line is not lost to the dodge it came with.
    const busy = run.hurtT > 0 || run.wobble > 0.62 || run.things.some((th) => th.fatal && !th.wapped && th.y < run.y && run.y - th.y < 150 && inLaneOf(th));
    const since = Math.max(0, run.t - L.stepT);
    L.stepT = run.t;
    if (busy && L.cap && L.capHeld < CAPTION.waitsForRoad) L.capHeld += Math.min(since, 0.1);
    const need = L.cap ? captionSeconds(L.cap) + L.capHeld : 0;
    if (L.capQ.length && (!L.cap || run.t - L.capAt >= need)) {
      // Fallen behind: let go back to where the newest sentence opens, never into the middle of one.
      const skip = skipAhead(L.capQ);
      if (skip) L.capQ.splice(0, skip);
      L.skipped += skip;
      L.shown += 1;
      L.cap = `${skip ? '… ' : ''}${L.capQ.shift().text}`;
      L.capAt = run.t;
      L.capHeld = 0;
      L.shownAt = run.t;
    }
    if (L.roadQ.length) {
      const highest = run.roadWords?.length ? Math.min(...run.roadWords.map((w) => w.y)) : Infinity;
      if (highest >= 84) {   // a phrase every ~100 px: five or so on the road at once, the lanes still clear
        // The road is a stream of glimpses (the carry outruns it); it keeps up by dropping the oldest.
        if (L.roadQ.length > 4) L.roadQ.splice(0, L.roadQ.length - 2);
        const next = L.roadQ.shift();
        paveSentence(next.text, next.terms, next.sentence);
      }
    }
  }

  /* The road's words can be had more ways than one: any word walked over is trodden (it dims, the way
   * a read line does); a glowing word underfoot is read; a hop that lands on a word marks it; a slice
   * that comes down on a word, at the end of its flight, feeds it; and in ? Ask a tap on a word says the
   * sentence it came from. Read, marked or fed, a word is kept, in order, and every fifth kept word
   * makes a found line: said in the caption, steadying the pie, and kept for the end of the carry. */
  const wordUnder = (x, y, slack = 12) => getRun()?.roadWords?.find((rw) => Math.abs(rw.y - y) < 14 && Math.abs(rw.x - x) < rw.w / 2 + slack) || null;

  function keepWord(rw, how) {
    const run = getRun();
    if (!run || !rw || rw.kept) return;
    rw.kept = how;
    const clean = rw.word.replace(/[^\p{L}\p{N}'’-]/gu, '');
    if (!clean) return;
    run.found = run.found || [];
    run.found.push(clean.toLowerCase());
    run.tags.push({ x: rw.x, y: rw.y - 18, t: 0, text: `${{ read: 'READ', marked: 'MARKED', fed: 'FED' }[how] || 'KEPT'}: ${clean.toUpperCase()}` });
    if (run.found.length % 5 === 0) {
      const line = run.found.slice(-5).join(' ');
      run.foundLines = run.foundLines || [];
      run.foundLines.push(line);
      showToast('A found line', `«${line}» — taken from the road, word by word.`, 3600, 'wonder', 2);
      sfx('wonder', 'saying', rw.x, rw.y);
      run.aura = Math.min(1, run.aura + 0.05);
      run.wobble = Math.max(0, run.wobble - 0.08);
    }
  }

  function tellWord(rw) {
    const clean = rw.word.replace(/[^\p{L}\p{N}'’ -]/gu, '');
    rw.asked = true;
    showToast(`“${clean}”`, rw.sentence ? `On the road from: ${rw.sentence}` : 'A word of the passage, on the road.', 4200, '');
    say(`${clean}. From the passage: ${rw.sentence || clean}`);
  }

  function roadWordsStep(dt) {
    const run = getRun();
    if (!run?.roadWords?.length) return;
    const grounded = !airborne();
    run.roadWords.forEach((rw) => {
      rw.y += run.speed * dt;
      if (!grounded || Math.abs(rw.y - (run.y + 10)) >= 13 || Math.abs(rw.x - run.x) >= rw.w / 2 + 12) return;
      rw.trod = true;
      // A glowing word underfoot, on the ground (not in a hop), is read.
      if (rw.glow && !rw.read) {
        rw.read = true;
        lean('read');
        run.aura = Math.min(1, run.aura + 0.03);
        sfx('catch', 0, rw.x);
        keepWord(rw, 'read');
      }
    });
    run.roadWords = run.roadWords.filter((rw) => rw.y < H + 24);
  }

  /* Painted on the road, under everything that comes down it. */
  const drawRoadWords = () => {
    const run = getRun();
    if (!run?.roadWords?.length) return;
    const ctx = getCtx();
    const colors = getColors();
    ctx.save();
    ctx.font = '600 13px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    run.roadWords.forEach((rw) => {
      if (rw.y < -20) return;
      const live = rw.glow && !rw.read;
      ctx.shadowBlur = 0;
      if (live) {
        ctx.shadowColor = 'rgba(242, 193, 78, 0.9)';
        ctx.shadowBlur = 10;
        ctx.fillStyle = mix(colors.gold, colors.ink, 0.35);
        ctx.globalAlpha = 1;
      } else if (rw.kept) {
        // Kept: read in gold, marked in a box of ink, fed with a berry's stain beside it.
        ctx.fillStyle = rw.kept === 'fed' ? mix(colors.berry, colors.ink, 0.2) : mix(colors.gold, colors.ink, 0.3);
        ctx.globalAlpha = 0.95;
      } else {
        ctx.fillStyle = colors.ink;
        ctx.globalAlpha = rw.trod ? 0.28 : 0.55;
      }
      ctx.fillText(rw.word, rw.x, rw.y);
      ctx.shadowBlur = 0;
      if (live) ctx.fillRect(rw.x - rw.w / 2, rw.y + 8, rw.w, 1.5);
      if (rw.kept === 'marked') {
        ctx.strokeStyle = colors.ink;
        ctx.lineWidth = 1.2;
        ctx.strokeRect(rw.x - rw.w / 2 - 3, rw.y - 9, rw.w + 6, 18);
      } else if (rw.kept === 'fed') {
        ctx.fillStyle = colors.berry;
        ctx.beginPath();
        ctx.arc(rw.x + rw.w / 2 + 5, rw.y - 6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      if (rw.asked) {
        ctx.globalAlpha = 0.6;
        ctx.setLineDash([2, 2]);
        ctx.strokeStyle = colors.ink;
        ctx.beginPath();
        ctx.moveTo(rw.x - rw.w / 2, rw.y + 9);
        ctx.lineTo(rw.x + rw.w / 2, rw.y + 9);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
    ctx.restore();
  };

  /* The subtitle: the sentence the carry is at, at the top of the screen under the HUD. */
  const drawLaneCaption = () => {
    const run = getRun();
    const mode = storyInMode();
    if (!run || getState() !== 'running' || (mode !== 'caption' && mode !== 'both') || !laneStory.cap) return;
    const text = laneStory.cap;
    if (!text) return;
    const ctx = getCtx();
    const colors = getColors();
    ctx.save();
    ctx.font = '500 13.5px Georgia, serif';
    const maxW = W - 34;
    const lines = [];
    let line = '';
    text.split(/\s+/).forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = word; } else line = next;
    });
    if (line) lines.push(line);
    const shown = lines.slice(0, 3);
    if (lines.length > 3) shown[2] = `${shown[2].replace(/[,;:]?$/, '')}…`;
    const age = run.t - laneStory.shownAt;
    const y0 = Math.max(92, getGlassFoot() + 6);
    const h = shown.length * 17 + 12;
    ctx.globalAlpha = reduced?.matches ? 1 : Math.min(1, age / 0.25);
    ctx.fillStyle = mix(colors.paper, 'rgb(255, 255, 255)', 0.25).replace('rgb(', 'rgba(').replace(')', ', 0.88)');
    ctx.strokeStyle = mix(colors.ink, colors.paper, 0.7);
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.roundRect(10, y0, W - 20, h, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = colors.gold;
    ctx.fillRect(10, y0 + 4, 2.5, h - 8);
    ctx.fillStyle = colors.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    shown.forEach((l, k) => ctx.fillText(l, 19, y0 + 7 + k * 17));
    ctx.restore();
  };

  return {
    laneStory,
    storyInMode,
    laneStoryTick,
    laneStoryStep,
    paveSentence,
    wordUnder,
    keepWord,
    tellWord,
    roadWordsStep,
    drawRoadWords,
    drawLaneCaption
  };
}
