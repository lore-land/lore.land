/**
 * pie-panels.mjs — where the lanes' panels go: decided by the shape of the window, for the story.
 *
 * The page is a comic page with one moving panel, the lanes. Around them:
 *   caption   the narrator: where you are, and what the pies let slip
 *   strip     the book's own prose, passing as the carry passes it
 *   heights   the lane from the side: how high everything stands, and what a hop does about it
 *   show      what just happened, again, in a window
 * Each has forms, from most to least room: full; compact (fewer lines, a narrower strip); on the
 * screen (the caption as glass over the top of the lanes, the prose as a caption in the lanes, the
 * show in the screen's corner); folded (the heights to their title line). And each has a weight for
 * the story: the prose most (it is the book), then the caption (it says what is happening in it), then
 * the heights (tactics), then the show (a replay).
 *
 * Windows have their own physics, so the plan tries every arrangement the window can hold:
 *   spread   the prose on one side of the lanes and the panels on the other (a desk: wide)
 *   side     the panels in one column beside the lanes (a tablet held either way; a short desk)
 *   stack    the panels under the lanes, each as small as it must be to stay in view (a phone held up)
 *   glass    a stack whose caption rides the screen and whose prose is in the lanes (a phone on its side)
 * and keeps the one that serves the story best: how tall the lanes can be (they are where the story
 * happens, though each further pixel is worth a little less), plus each panel's weight times how well it
 * reads where it lands, less a little when two things ride the lanes at once (the caption as glass and
 * the prose in the lanes would both sit over their top). The lanes have a floor (half the window's
 * height, and 300 px, or nearly all there is on a short window): a panel shrinks, moves onto the screen
 * or folds before the lanes go under it. A column beside the lanes is sized to the window's height too.
 * Controls nobody has placed go under the screen when the window is held up, and to its edges when a
 * touch screen is held on its side (thumbs are at the sides then).
 *
 * Story beats change emphasis, never size: nothing moves under a thumb during a carry (beatOf).
 */

const REM = 16;
const ASPECT = 360 / 560;   // the lanes' own shape
export const STORY_WEIGHT = Object.freeze({ strip: 3, caption: 2.5, heights: 1.5, show: 1 });
// How well each form reads, panel by panel: half a heights strip is harder to read than two lines of prose.
const READS = Object.freeze({
  caption: { full: 1, compact: 0.8, glass: 0.65, off: 0 },
  strip: { full: 1, compact: 0.8, verge: 0.9, lanes: 0.45, off: 0 },
  heights: { full: 1, compact: 0.6, folded: 0.15, off: 0 },
  show: { inset: 1, pip: 0.75, off: 0 }
});

/** Heights in px of a panel's form, under the lanes, for a cabinet `cab` px wide. */
const tallness = (panel, form, cab, stripRem) => {
  if (form === 'off' || form === 'glass' || form === 'lanes' || form === 'pip' || form === 'inset') return 0;
  if (panel === 'caption') return (form === 'full' ? 4.8 : 3.1) * REM;
  if (panel === 'strip') return (form === 'full' ? stripRem + 1.9 : 4.9) * REM;
  if (panel === 'heights') return 2.6 * REM + (form === 'full' ? cab * 0.373 : form === 'compact' ? cab * 0.5 * 0.373 : 0);
  return 0;
};

/**
 * The plan for a window: { arrangement, place, forms: { caption, strip, heights, show }, screenH, floor, share, why }.
 * vw, vh: the window; room: the width the page actually gives the game (a page's column may be narrower
 * than its window), which is what every width here is budgeted from. want: which panels are wanted at
 * all ({ caption, strip, heights, show, lanesStory }); controls: where the player put the controls, if
 * they did ('under' | 'edges' | 'over').
 */
export function planPanels({ vw, vh, room = vw, coarse = false, want = {}, controls = null, stripRem = 6.4, rail = false, fill = false }) {
  const wants = {
    caption: want.caption !== false,
    strip: want.strip !== false,
    heights: want.heights !== false,
    show: Boolean(want.show),
    lanesStory: want.lanesStory !== false
  };
  const landscape = vw > vh * 1.15;
  // Filling the screen (pie-frame.mjs): the lanes have all of it. The caption rides as glass in the haze over
  // the road's far end, the prose is a caption in the lanes, the show is in a corner, the buttons stand on the
  // ground; the heights wait until the screen is given back.
  if (fill) {
    // A screen on its side leaves a verge either side of the road; one wide enough for a column of words holds the story.
    const verge = (vw - Math.min(vw, vh * ASPECT)) / 2;
    const forms = {
      caption: wants.caption ? 'glass' : 'off',
      strip: wants.strip && verge >= 11 * REM ? 'verge' : wants.strip && wants.lanesStory ? 'lanes' : 'off',
      heights: 'off',
      show: wants.show ? 'pip' : 'off'
    };
    const plan = { arrangement: 'fill', forms, screenH: vh, score: 0, place: 'over', floor: 0, wants, share: 100, ctx: { vw, vh, coarse, landscape } };
    return { ...plan, why: describePlan(plan, plan.ctx) };
  }
  const place = controls || (coarse && landscape ? 'edges' : 'under');
  const desk = vw >= 992;
  const top = desk ? 72 : 8;
  // On a short window the switches stand in a rail beside the screen, so they take width instead of height.
  const tools = rail ? 0 : 2.9 * REM;
  const ctrlH = place !== 'under' ? 0 : coarse ? 9.5 * REM : 3 * REM;
  const ctrlW = (place === 'edges' ? (coarse ? 10 : 8) * REM : 0) + (rail ? 4.6 * REM : 0);
  const pad = 1.6 * REM;
  const gap = 0.7 * REM;
  const pageGap = 1.5 * REM;
  const column = 15 * REM;   // the narrowest a column of panels reads well at
  const tallest = Math.max(0, vh - top - tools - ctrlH - pad - 12);
  const floor = Math.min(Math.max(300, vh * 0.5), tallest * 0.92);
  const widest = (room) => Math.max(0, (room - pad - ctrlW) / ASPECT);
  const best = Math.max(1, Math.min(tallest, widest(room)));   // the lanes with nothing else on the page
  const screenScore = (h) => 7 * Math.min(1, h / best) ** 0.8;
  const overlap = (forms) => (forms.caption === 'glass' && forms.strip === 'lanes' ? 0.6 : 0);
  const score = (h, forms) => screenScore(h) - overlap(forms) + Object.entries(forms).reduce((sum, [panel, form]) => sum + (wants[panel] ? STORY_WEIGHT[panel] * (READS[panel][form] ?? 0) : 0), 0);
  const offIfUnwanted = (forms) => Object.fromEntries(Object.entries(forms).map(([panel, form]) => [panel, wants[panel] ? form : 'off']));
  const plans = [];
  // A column is worth having only if something would stand in it; a spread needs the prose on its own side.
  const anyBeside = wants.strip || wants.caption || wants.heights || wants.show;

  // spread: the prose in its own column on one side, the panels in a column on the other.
  {
    const h = Math.min(tallest, widest(room - 2 * (column + pageGap)));
    if (desk && wants.strip && h >= floor) {
      const forms = offIfUnwanted({ caption: 'full', strip: 'full', heights: 'full', show: 'inset' });
      plans.push({ arrangement: 'spread', forms, screenH: h, score: score(h, forms) + 0.3 });
    }
  }
  // side: every panel in one column beside the lanes, the prose at its head, each as large as the
  // column's height allows (the column is as tall as the window, under the page's head).
  {
    const h = Math.min(tallest, widest(room - column - pageGap));
    const colW = room - (h * ASPECT + pad + ctrlW) - pageGap;
    if (anyBeside && h >= floor && colW >= column) {
      const colH = vh - top - 8;
      let pick = null;
      (wants.strip ? ['full', 'compact'] : ['off']).forEach((strip) => (wants.heights ? ['full', 'compact', 'folded'] : ['off']).forEach((heights) => {
        const forms = offIfUnwanted({ caption: 'full', strip, heights, show: 'inset' });
        const used = ['caption', 'strip', 'heights'].reduce((sum, panel) => sum + (wants[panel] ? tallness(panel, forms[panel], colW, stripRem) + gap : 0), 0)
          + (wants.show ? colW * 0.3 / ASPECT * 0.5 : 0);
        const fits = used <= colH;
        const value = score(h, forms) - (fits ? 0 : 3);
        if (!pick || value > pick.score) pick = { arrangement: 'side', forms, screenH: h, score: value };
      }));
      if (pick) plans.push(pick);
    }
  }
  // stack (and glass): under the lanes, every combination of forms, kept if the lanes stay over their floor.
  const CAPTION = wants.caption ? ['full', 'compact', 'glass'] : ['off'];
  const STRIP = wants.strip ? ['full', 'compact', ...(wants.lanesStory ? ['lanes'] : [])] : ['off'];
  const HEIGHTS = wants.heights ? ['full', 'compact', 'folded'] : ['off'];
  const SHOW = wants.show ? ['pip'] : ['off'];
  let fallback = null;
  CAPTION.forEach((caption) => STRIP.forEach((strip) => HEIGHTS.forEach((heights) => SHOW.forEach((show) => {
    const forms = { caption, strip, heights, show };
    // The cabinet's width depends on the screen's, which depends on what is under it: settle it twice.
    let h = Math.min(tallest, widest(room));
    for (let pass = 0; pass < 2; pass += 1) {
      const cab = h * ASPECT + pad + ctrlW;
      const used = ['caption', 'strip', 'heights'].reduce((sum, p) => {
        const t = tallness(p, forms[p], cab, stripRem);
        return sum + (t ? t + gap : 0);
      }, 0);
      h = Math.min(tallest - used, widest(room));
    }
    const plan = { arrangement: caption === 'glass' && (strip === 'lanes' || strip === 'off') ? 'glass' : 'stack', forms, screenH: h, score: score(h, forms) - (caption === 'glass' ? 0.05 : 0) };
    if (h >= floor) plans.push(plan);
    else if (!fallback || h > fallback.screenH) fallback = plan;
  }))));
  const chosen = plans.sort((a, b) => b.score - a.score)[0] || fallback;
  const plan = { ...chosen, place, floor, wants, share: Math.round((chosen.screenH / Math.max(1, vh)) * 100), ctx: { vw, vh, coarse, landscape } };
  return { ...plan, why: describePlan(plan, plan.ctx) };
}

/* Each panel's forms, from most room to least, and what the story loses at each step down. */
const LADDER = Object.freeze({
  caption: ['full', 'compact', 'glass'],
  strip: ['full', 'compact', 'lanes'],
  heights: ['full', 'compact', 'folded']
});

/**
 * Settle a plan against the page as laid out: the estimates chose it, the measured lanes judge it. If the
 * lanes came out under their floor, the panel whose next form costs the story least steps down one form
 * (and a stack whose caption and prose both end up on the lanes is called glass). Returns the settled
 * plan, or null when nothing is left to give: then the lanes take what there is, and the rest runs below.
 */
export function settlePlan(plan, measuredH) {
  if (!plan || !['stack', 'glass'].includes(plan.arrangement) || measuredH >= plan.floor - 4) return null;
  const steps = Object.entries(LADDER).map(([panel, ladder]) => {
    const at = ladder.indexOf(plan.forms[panel]);
    const next = ladder[at + 1];
    if (at < 0 || !next || !plan.wants?.[panel] || (next === 'lanes' && !plan.wants.lanesStory)) return null;
    return { panel, next, loss: STORY_WEIGHT[panel] * ((READS[panel][plan.forms[panel]] ?? 0) - (READS[panel][next] ?? 0)) };
  }).filter(Boolean).sort((x, y) => x.loss - y.loss);
  if (!steps.length) return null;
  const forms = { ...plan.forms, [steps[0].panel]: steps[0].next };
  const settled = { ...plan, forms, arrangement: forms.caption === 'glass' && ['lanes', 'off'].includes(forms.strip) ? 'glass' : 'stack', screenH: measuredH, settled: (plan.settled || 0) + 1 };
  return { ...settled, why: describePlan(settled, plan.ctx) };
}

const FORM_WORDS = Object.freeze({
  caption: { full: 'the caption', compact: 'the caption in two lines', glass: 'the caption over the top of the lanes' },
  strip: { full: 'the story strip', compact: 'the story strip, two lines', verge: 'the story on the verge beside the road', lanes: 'the story as a caption in the lanes' },
  heights: { full: 'the heights', compact: 'the heights, narrower', folded: 'the heights folded to a line' },
  show: { inset: 'the show beside the caption', pip: 'the show in the screen’s corner' }
});

/** The plan in plain words, for ⚙ Setup: what the window is, and where each panel went. */
export function describePlan(plan, { vw, vh, coarse, landscape }) {
  const shape = `${vw >= 992 ? 'A wide' : vw >= 600 && vh >= 600 ? 'A tablet-sized' : 'A small'}${landscape ? ', short' : ', tall'} ${coarse ? 'touch screen' : 'window'}`;
  const where = { spread: 'the story on one side of the lanes, the panels on the other', side: 'the panels in a column beside the lanes', stack: 'the panels under the lanes', glass: 'the caption on the lanes, the rest under them', fill: 'the lanes fill it, with haze over the far end of the road and ground under the carrier for the buttons' }[plan.arrangement];
  if (plan.arrangement === 'fill') {
    const parts = Object.entries(plan.forms).filter(([, form]) => form !== 'off').map(([panel, form]) => FORM_WORDS[panel]?.[form]).filter(Boolean);
    return `${shape}, full screen: ${where}${parts.length ? `; ${parts.join(', ')}` : ''}. The heights come back when the screen is given back.`;
  }
  const parts = Object.entries(plan.forms).filter(([, form]) => form !== 'off').map(([panel, form]) => FORM_WORDS[panel]?.[form]).filter(Boolean);
  const controls = plan.place === 'edges' ? ' The buttons sit at the screen’s edges, under the thumbs.' : plan.place === 'over' ? ' The buttons sit over the screen.' : '';
  return `${shape}: ${where}. The lanes keep ${plan.share}% of the height${plan.screenH < plan.floor ? ' (less than they would like: some panels run below)' : ''}; ${parts.join(', ')}.${controls}`;
}

/**
 * The beat a carry is at, which sets emphasis only: 'establish' as a room or passage opens (the
 * narrator and the prose come forward), 'action' while danger is close (the panels over the lanes
 * thin so the lanes show through), and '' between.
 */
export function beatOf({ sinceRoom = 99, danger = false }) {
  if (danger) return 'action';
  if (sinceRoom < 2.4) return 'establish';
  return '';
}
