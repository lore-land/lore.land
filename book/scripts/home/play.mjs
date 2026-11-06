// Small answers to small acts on the entrance: the page notices what a
// reader has already read, counts down to the next stone, and the hat
// keeps just out of reach. Everything here is decoration on working links;
// without it the page reads the same.
import { SIGHTINGS, readSightings } from '../modules/sightings.mjs?v=2026_11_05.B';

const PROGRESS_KEY = 'lore.chapter.progress.v1';
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function visitedChapters() {
  try {
    const progress = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || '{}');
    return new Set((progress?.visited || []).map(Number));
  } catch {
    return new Set();
  }
}

function daysUntil(iso) {
  const [y, m, d] = String(iso || '').split('-').map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((new Date(y, m - 1, d) - today) / 86400000);
}

const inDays = (days) => (days === 0 ? 'today' : days === 1 ? 'tomorrow' : `in ${days} days`);

/* New stones turn from "new" to "read" once the reader has opened them. */
function markRead() {
  const visited = visitedChapters();
  let unread = 0;
  document.querySelectorAll('.serial-stone[data-chapter]').forEach((stone) => {
    const pill = stone.querySelector('.serial-new');
    if (!pill) return;
    if (visited.has(Number(stone.dataset.chapter))) {
      pill.textContent = 'read';
      pill.setAttribute('data-state', 'read');
    } else {
      unread += 1;
    }
  });
  return unread;
}

/* The next stone counts down where it is announced. */
function countDown(unread) {
  const time = document.querySelector('.serial-stone-next time[datetime]');
  const days = time ? daysUntil(time.getAttribute('datetime')) : null;
  if (days == null) return;
  const card = time.closest('.serial-stone-next');
  if (card && !card.querySelector('.serial-stone-count')) {
    const count = document.createElement('span');
    count.className = 'serial-stone-count';
    count.textContent = days >= 0 ? `Set ${inDays(days)}` : 'Any day now';
    card.querySelector('.serial-stone-kicker')?.after(count);
  }
  // A reader who has read both new stones is waiting for the next one: say when.
  const cta = document.querySelector('.hub-cta-new');
  if (cta && unread === 0 && days >= 0) {
    const sub = cta.querySelector('.hub-cta-sub');
    if (sub) sub.textContent = `Read · next stone ${inDays(days)}`;
  }
}

/* The cast card for the hat: a tally of sightings, and a hat that drifts
 * away from the pointer — always a little farther each time you look. */
function hatCard() {
  const card = document.querySelector('.cast-card[data-cast="hat"]');
  const link = card?.querySelector('a');
  if (!card || !link) return;

  const seen = readSightings();
  const count = SIGHTINGS.filter((s) => seen[s.id]).length;
  if (count) {
    const tally = document.createElement('span');
    tally.className = 'cast-tally';
    tally.textContent = count === SIGHTINGS.length ? 'Sighted nine times. Drawn whole.' : `Sighted ${count} of ${SIGHTINGS.length} times`;
    link.append(tally);
  }

  if (reduced) return;
  const hat = card.querySelector('.cast-hat');
  if (!hat) return;
  link.addEventListener('pointermove', (event) => {
    if (event.pointerType !== 'mouse') return;
    const box = hat.getBoundingClientRect();
    const dx = box.left + box.width / 2 - event.clientX;
    const dy = box.top + box.height / 2 - event.clientY;
    const distance = Math.hypot(dx, dy) || 1;
    const push = Math.max(0, 1 - distance / 140) * 14;
    card.style.setProperty('--hat-x', `${((dx / distance) * push).toFixed(1)}px`);
    card.style.setProperty('--hat-y', `${((dy / distance) * push).toFixed(1)}px`);
  });
  link.addEventListener('pointerleave', () => {
    card.style.removeProperty('--hat-x');
    card.style.removeProperty('--hat-y');
  });
  link.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    card.classList.remove('is-hop');
    void card.offsetWidth;
    card.classList.add('is-hop');
  });
}

countDown(markRead());
hatCard();
