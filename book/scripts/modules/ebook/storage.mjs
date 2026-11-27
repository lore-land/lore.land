/**
 * ebook/storage.mjs — Persistent reading place, register mode storage, and viewport section probe.
 */

export const STORAGE_KEY = 'lore.ebook.navigation.v1';
export const REGISTER_KEY = 'lore.ebook.register.v1';

export function readState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (error) {
    console.warn('Failed to read ebook navigation state:', error);
    return {};
  }
}

export function writeState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to write ebook navigation state:', error);
  }
}

export function readRegisterMode() {
  try {
    const value = window.localStorage.getItem(REGISTER_KEY);
    if (value === 'reader' || value === 'engineer') {
      return value;
    }
  } catch (error) {
    console.warn('Failed to read ebook register mode:', error);
  }
  return 'reader';
}

export function writeRegisterMode(mode) {
  try {
    window.localStorage.setItem(REGISTER_KEY, mode);
  } catch (error) {
    console.warn('Failed to write ebook register mode:', error);
  }
}

export function chapterKey(chapterNumber) {
  return `chapter-${String(chapterNumber || 0).padStart(2, '0')}`;
}

export function nearestSectionIndex(sections) {
  if (!sections.length) {
    return 1;
  }

  const anchor = 130;
  let bestIndex = sections[0].index || 1;
  let bestDistance = Number.POSITIVE_INFINITY;
  sections.forEach((entry, index) => {
    const rect = entry.node.getBoundingClientRect();
    const distance = Math.abs(rect.top - anchor);
    if (distance < bestDistance) {
      bestDistance = distance;
      bestIndex = entry.index || index + 1;
    }
  });

  return bestIndex;
}
