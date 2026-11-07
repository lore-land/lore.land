/**
 * bindery.mjs — the home page's look, told as a scene (PLAN.E L26).
 *
 * The theme is not a setting at the top of the page; it is a cover the
 * binder at the folio house puts on your copy. One sentence holds every
 * choice, and each choice is a phrase you can turn (the same gesture as the
 * book's other tellings):
 *
 *   She binds it in [rag], sets the lamp [low, at a slant], and leaves the
 *   shutters [open].
 *
 *   cover     data-theme   paper (rag) · glass · salt · ember (oven clay) · slate · night (night cloth)
 *   lamp      data-lighting  still · raking · live
 *   shutters  data-wonder    quiet · rich · deep
 *
 * The six covers also hang on pegs above the bench, to be taken down by
 * hand. The binder answers each choice in her own words. A cover chosen
 * here binds the chapters too (lore.nook.v1 binding, reading-nook.mjs), and
 * a cover chosen in a chapter's nook binds this page (lore.monument.theme):
 * one book, one binding. The top bar only says what it is bound in.
 */

export const COVERS = Object.freeze([
  { theme: 'paper', binding: 'rag', words: 'rag', name: 'Rag paper', from: 'from the mill', says: 'Rag, then. It was a miller’s shirt once; it has heard worse than anything in here.' },
  { theme: 'glass', binding: 'glass', words: 'Bonk glass', name: 'Bonk glass', from: 'from Bonk City', says: 'Mind it. Bonk glass remembers every knock, and forgives it, slowly.' },
  { theme: 'salt', binding: 'salt', words: 'salt crust', name: 'Salt flat', from: 'off the flats', says: 'Salt crust. Read it in the glare; it was made for squinting.' },
  { theme: 'ember', binding: 'ember', words: 'oven clay', name: 'Hearth clay', from: 'from the oven wall', says: 'Oven clay. Still warm on the back. That isn’t me; that’s the clay.' },
  { theme: 'slate', binding: 'slate', words: 'slate', name: 'Slate & chalk', from: 'from the schoolroom', says: 'Slate. Chalk is cheaper than oak, and it rubs out kinder.' },
  { theme: 'night', binding: 'starfield', words: 'night cloth', name: 'Starfield', from: 'off the loom at dusk', says: 'Night cloth. Take it outside; it reads best under the real thing.' }
]);

const LAMPS = Object.freeze([
  { value: 'still', words: 'down on the bench', says: 'She sets the lamp down. “It stays where it is. So will the shadows.”' },
  { value: 'raking', words: 'low, at a slant', says: 'She holds it low across the page. “Light from the side shows the grain.”' },
  { value: 'live', words: 'in your hand', says: 'She hands you the lamp. “Wherever you look, it looks.”' }
]);

const SHUTTERS = Object.freeze([
  { value: 'quiet', words: 'drawn', says: 'She draws the shutters. “Just you and the page.”' },
  { value: 'rich', words: 'open', says: 'She opens the shutters, and the field comes in a little.' },
  { value: 'deep', words: 'off their hinges', says: 'She lifts the shutters off their hinges. The whole land leans in.' }
]);

const CHOICES = Object.freeze({ theme: COVERS.map((c) => ({ ...c, value: c.theme })), lighting: LAMPS, wonder: SHUTTERS });
const LABELS = Object.freeze({ theme: 'Cover', lighting: 'Lamp', wonder: 'Shutters' });
const NOOK_KEY = 'lore.nook.v1';

export const coverForTheme = (theme) => COVERS.find((cover) => cover.theme === theme) || COVERS[0];
export const coverForBinding = (binding) => COVERS.find((cover) => cover.binding === binding) || null;

/** The binding a chapter's nook chose, when there is one to honour. */
export function nookBinding() {
  try {
    const nook = JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}');
    return coverForBinding(nook.binding) && nook.binding !== 'rag' ? nook.binding : null;
  } catch {
    return null;
  }
}

/** One book, one binding: the cover chosen here binds the chapters too. */
function bindChapters(cover) {
  try {
    const nook = JSON.parse(window.localStorage.getItem(NOOK_KEY) || '{}');
    window.localStorage.setItem(NOOK_KEY, JSON.stringify({ ...nook, binding: cover.binding }));
  } catch { /* the chapters keep their own cover */ }
}

/**
 * @param {{ state: {theme: string, lighting: string, wonder: string}, choose: (name: string, value: string) => void, announce?: (text: string) => void }} options
 */
export function initBindery({ state, choose, announce } = {}) {
  const section = document.getElementById('bindery');
  // Every page with the top bar says what the copy is bound in; elsewhere it leads home to the binder.
  let mark = document.querySelector('.bindery-mark');
  const topbar = document.querySelector('.hub-topbar');
  if (!mark && topbar) {
    mark = document.createElement('a');
    mark.className = 'bindery-mark';
    mark.href = '/#bindery';
    mark.title = 'How your copy is bound';
    const lede = document.createElement('span');
    lede.className = 'bindery-mark-lede';
    lede.textContent = 'Bound in';
    const words = document.createElement('span');
    words.className = 'bindery-mark-words';
    mark.append(lede, ' ', words);
    const nav = topbar.querySelector('.hub-nav');
    if (nav) nav.insertAdjacentElement('afterend', mark);
    else topbar.append(mark);
  }
  const paintMark = () => {
    if (mark) mark.querySelector('.bindery-mark-words').textContent = coverForTheme(state.theme).words;
  };
  paintMark();
  if (!section) return () => {};

  const says = section.querySelector('.bindery-says');
  const pegs = [...section.querySelectorAll('.bindery-cover')];
  const phrases = [...section.querySelectorAll('.bindery-phrase')];

  const paint = () => {
    phrases.forEach((phrase) => {
      const name = phrase.dataset.choice;
      const options = CHOICES[name];
      const current = options.find((option) => option.value === state[name]) || options[0];
      const index = options.indexOf(current);
      phrase.querySelector('.bindery-phrase-words').textContent = current.words;
      phrase.dataset.told = `${index + 1} of ${options.length}`;
      phrase.setAttribute('aria-label', `${LABELS[name]}: ${current.words}. Turn to the next.`);
    });
    pegs.forEach((peg) => {
      const on = peg.dataset.value === state.theme;
      peg.setAttribute('aria-checked', on ? 'true' : 'false');
      peg.tabIndex = on ? 0 : -1;
    });
    section.dataset.cover = state.theme;
    paintMark();
  };

  const roll = (phrase) => {
    if (!phrase || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    phrase.classList.remove('is-rolling');
    void phrase.offsetWidth;
    phrase.classList.add('is-rolling');
    setTimeout(() => phrase.classList.remove('is-rolling'), 520);
  };

  const pick = (name, value, from) => {
    const option = CHOICES[name].find((entry) => entry.value === value);
    if (!option || state[name] === value) return;
    choose(name, value);
    if (name === 'theme') bindChapters(option);
    paint();
    roll(section.querySelector(`.bindery-phrase[data-choice="${name}"]`));
    says.textContent = option.says;
    says.classList.remove('is-new');
    void says.offsetWidth;
    says.classList.add('is-new');
    if (announce) announce(option.says);
    if (from?.classList?.contains('bindery-cover')) from.focus({ preventScroll: true });
  };

  phrases.forEach((phrase) => {
    const name = phrase.dataset.choice;
    phrase.addEventListener('click', () => {
      const options = CHOICES[name];
      const index = options.findIndex((option) => option.value === state[name]);
      pick(name, options[(index + 1) % options.length].value, phrase);
    });
    phrase.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const options = CHOICES[name];
      const index = options.findIndex((option) => option.value === state[name]);
      pick(name, options[(index + step + options.length) % options.length].value, phrase);
    });
  });

  pegs.forEach((peg, index) => {
    peg.addEventListener('click', () => pick('theme', peg.dataset.value, peg));
    peg.addEventListener('keydown', (event) => {
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      pegs[(index + step + pegs.length) % pegs.length].click();
    });
  });

  paint();
  says.textContent = coverForTheme(state.theme).says;
  section.classList.add('is-ready');
  return () => section.classList.remove('is-ready');
}
