/**
 * story-loom.mjs — user stories as Spw spells, woven side by side (/scriptorium/#loom).
 *
 * Each story in .spw/surfaces/stories.spw is one spell, @who{ … }, its atoms the dimensions of
 * what that person needs: ? asks · ~ might · ! does · = tunes · % measures · ^ becomes · & with ·
 * .at[…] where · $ made of · * values. The loom lays them in rows, one column a dimension, and
 * shows where they rhyme: touch a value and every story that shares it lights, and the pattern
 * they share is written back as a spell (what they all have, and ~_ where they differ), which
 * can be played like any spell. Rhymes (pairs sharing two or more dimensions) are listed; each
 * column says how much its stories rhyme. A pattern found here is one thing a maker can build
 * once and serve many times.
 */
import { renderSpell, SIGIL_ROLES } from './spw-spell.mjs?v=2026_11_09.Q';

const STORIES_URL = '/.spw/surfaces/stories.spw';
export const DIMENSIONS = Object.freeze([
  ['?', 'asks'], ['~', 'might'], ['!', 'does'], ['=', 'tunes'], ['%', 'measures'], ['^', 'becomes'],
  ['&', 'with'], ['.', 'where'], ['$', 'made of'], ['*', 'values']
]);

/** Stories from the canon text: each line of the ^stories[ … ] block that is a spell @who{ … }. */
export function readStories(text) {
  const block = /\^stories\[([\s\S]*?)\n\]/.exec(String(text))?.[1] || '';
  return block.split('\n').map((line) => line.trim()).filter((line) => /^@[a-z_]+\{.*\}$/.test(line)).map((spell) => {
    const who = /^@([a-z_]+)/.exec(spell)[1];
    const says = (/#says\["([^"]*)"\]/.exec(spell) || [])[1] || '';
    const body = spell.replace(/#says\["[^"]*"\]/, '').replace(/^@[a-z_]+\{/, '').replace(/\}$/, '');
    const values = {};
    [...body.matchAll(/([?~!=%^&.$*])([a-z_]+)(?:\[([^\]]*)\])?/g)].forEach(([, sigil, label, arg]) => {
      const value = sigil === '.' && label === 'at' ? arg : (arg ? `${label} ${arg}` : label);
      (values[sigil] ||= []).push(value.replace(/_/g, ' '));
    });
    return { who, says, spell, values };
  });
}

/** What a set of stories share, as a spell: the atoms all of them have, and ~_ where they part. */
export function patternOf(stories) {
  if (!stories.length) return '';
  const atoms = DIMENSIONS.map(([sigil]) => {
    const sets = stories.map((s) => new Set(s.values[sigil] || []));
    const shared = [...sets[0]].filter((v) => sets.every((set) => set.has(v)));
    if (shared.length) return shared.map((v) => (sigil === '.' ? `.at[${v.replace(/ /g, '_')}]` : `${sigil}${v.split(' ')[0]}${v.includes(' ') ? `[${v.split(' ').slice(1).join('_')}]` : ''}`)).join(' ');
    return sets.some((set) => set.size) ? `${sigil}_` : '';
  }).filter(Boolean);
  const who = stories.length === 1 ? stories[0].who : '_';
  return `@${who}{ ${atoms.join(' ')} }`;
}

/** Pairs of stories that share two or more values, strongest first. */
export function rhymes(stories) {
  const out = [];
  stories.forEach((a, i) => stories.slice(i + 1).forEach((b) => {
    const shared = DIMENSIONS.flatMap(([sigil]) => (a.values[sigil] || []).filter((v) => (b.values[sigil] || []).includes(v)).map((v) => `${sigil}${v}`));
    if (shared.length >= 2) out.push({ a: a.who, b: b.who, shared });
  }));
  return out.sort((x, y) => y.shared.length - x.shared.length);
}

/* How much a column rhymes: the share of its stories whose value there is shared with another. */
function rhymeOf(stories, sigil) {
  const counts = new Map();
  stories.forEach((s) => (s.values[sigil] || []).forEach((v) => counts.set(v, (counts.get(v) || 0) + 1)));
  const have = stories.filter((s) => (s.values[sigil] || []).length);
  if (!have.length) return 0;
  return have.filter((s) => (s.values[sigil] || []).some((v) => counts.get(v) > 1)).length / have.length;
}

const el = (tag, className, text) => { const n = document.createElement(tag); if (className) n.className = className; if (text != null) n.textContent = text; return n; };
const words = (who) => who.replace(/_/g, ' ');

export async function initStoryLoom(mount) {
  if (!mount) return;
  let text = '';
  try { text = await (await fetch(STORIES_URL)).text(); } catch { /* the loom stays empty */ }
  const stories = readStories(text);
  if (!stories.length) { mount.textContent = 'The stories could not be read just now.'; return; }

  const grid = el('div', 'loom-grid');
  const head = el('div', 'loom-row loom-head');
  head.append(el('span', 'loom-who', 'who'));
  DIMENSIONS.forEach(([sigil, name]) => {
    const cell = el('span', `loom-dim op-${SIGIL_ROLES[sigil].role}`);
    const r = rhymeOf(stories, sigil);
    cell.style.setProperty('--rhyme', r.toFixed(2));
    cell.append(el('b', '', sigil), el('small', '', name));
    cell.title = `${sigil} ${name}: ${Math.round(r * 100)}% of the stories that have one share it with another`;
    head.append(cell);
  });
  grid.append(head);

  const rows = stories.map((story) => {
    const row = el('div', 'loom-row');
    row.dataset.who = story.who;
    const who = el('button', 'loom-who', words(story.who));
    who.type = 'button';
    who.title = story.says;
    row.append(who);
    DIMENSIONS.forEach(([sigil]) => {
      const cell = el('span', `loom-cell op-${SIGIL_ROLES[sigil].role}`);
      (story.values[sigil] || []).forEach((v) => {
        const chip = el('button', 'loom-value', v);
        chip.type = 'button';
        chip.dataset.sigil = sigil;
        chip.dataset.value = v;
        cell.append(chip);
      });
      row.append(cell);
    });
    grid.append(row);
    return { row, story };
  });

  const panel = el('div', 'loom-panel');
  const panelTitle = el('p', 'loom-panel-title', 'Touch a value to see which stories share it, or a person to read their story.');
  const panelBody = el('div', 'loom-panel-body');
  panel.append(panelTitle, panelBody);

  const show = (selected, title, lede) => {
    rows.forEach(({ row, story }) => row.classList.toggle('is-lit', selected.includes(story)));
    grid.classList.toggle('is-selecting', selected.length > 0);
    panelTitle.textContent = title;
    const pattern = patternOf(selected);
    panelBody.replaceChildren(
      ...(lede ? [el('p', 'loom-lede', lede)] : []),
      ...(pattern ? [renderSpell(pattern, { play: true, cast: true, explain: (atom, sigil) => `${sigil} ${DIMENSIONS.find(([s]) => s === sigil)?.[1] || ''}${/_$/.test(atom) ? ': they differ here' : ': they all share this'}` })] : [])
    );
  };
  grid.addEventListener('click', (event) => {
    const chip = event.target.closest('.loom-value');
    if (chip) {
      const { sigil, value } = chip.dataset;
      const selected = stories.filter((s) => (s.values[sigil] || []).includes(value));
      grid.querySelectorAll('.loom-value').forEach((c) => c.classList.toggle('is-picked', c.dataset.sigil === sigil && c.dataset.value === value));
      show(selected, `${sigil}${value}: ${selected.length} ${selected.length === 1 ? 'story' : 'stories'}`, selected.length > 1 ? `What ${selected.map((s) => words(s.who)).join(', ')} share, written as one spell; ~_ marks where they part.` : 'Only one story has this. It is a need of its own.');
      return;
    }
    const who = event.target.closest('.loom-who');
    if (who && who.closest('.loom-row')?.dataset.who) {
      const story = stories.find((s) => s.who === who.closest('.loom-row').dataset.who);
      grid.querySelectorAll('.loom-value').forEach((c) => c.classList.remove('is-picked'));
      rows.forEach(({ row, story: s }) => row.classList.toggle('is-lit', s === story));
      grid.classList.add('is-selecting');
      panelTitle.textContent = words(story.who);
      panelBody.replaceChildren(el('p', 'loom-lede', story.says), renderSpell(story.spell, { play: true, cast: true }));
    }
  });

  const rhymeList = el('ol', 'loom-rhymes');
  rhymes(stories).slice(0, 8).forEach((r) => {
    const li = el('li', '');
    li.append(el('b', '', `${words(r.a)} & ${words(r.b)}`), ` rhyme in ${r.shared.join(', ')}`);
    rhymeList.append(li);
  });

  mount.replaceChildren(
    el('div', 'loom-scroll'),
    panel,
    el('h3', 'loom-rhymes-title', 'Where the stories rhyme'),
    rhymeList
  );
  mount.querySelector('.loom-scroll').append(grid);
}

// On a page with a loom (the scriptorium), weave it.
if (typeof document !== 'undefined') {
  const mount = document.querySelector('[data-story-loom]');
  if (mount) initStoryLoom(mount);
}
