export const GRAMMAR_PROFILES = Object.freeze([
  {
    id: 'declarative',
    register: 'Chronicle',
    cadence: 'measured',
    description: 'unmarked mood; proposition asserted as true; clause is syntactically complete'
  },
  {
    id: 'interrogative',
    register: 'Inquiry',
    cadence: 'searching',
    description: 'marked mood; proposition withheld; gap requires resolution from outside the clause'
  },
  {
    id: 'imperative',
    register: 'Invocation',
    cadence: 'percussive',
    description: 'directive mood; subject typically elided; verb governs the argument directly'
  },
  {
    id: 'exclamatory',
    register: 'Omen',
    cadence: 'radiant',
    description: 'heightened illocutionary force; canonical order suspended; affect is primary'
  },
  {
    id: 'conditional',
    register: 'Speculation',
    cadence: 'spiral',
    description: 'antecedent-consequent frame; counterfactual or modal register; one path deferred'
  }
]);

export function grammarProfileForChapter(chapterNumber) {
  return GRAMMAR_PROFILES[(Math.max(1, chapterNumber) - 1) % GRAMMAR_PROFILES.length];
}

export function readSigilPhrase(spw) {
  const match = String(spw || '').match(/([!~@^#.?=&*$%]\[[^\]]+\])/);
  return match ? match[1] : '^[chapter]{route}';
}

export function buildChapterLogline(chapter, profile) {
  const sigilPhrase = readSigilPhrase(chapter.spw);
  const { title } = chapter;

  if (profile.id === 'interrogative') {
    return `${title} — interrogative. The clause is held open; ${sigilPhrase} marks the unfilled argument position.`;
  }
  if (profile.id === 'imperative') {
    return `${title} — imperative. Subject is elided; ${sigilPhrase} names the direct object of the directive.`;
  }
  if (profile.id === 'exclamatory') {
    return `${title} — exclamatory. Canonical order is suspended; ${sigilPhrase} carries the affect load.`;
  }
  if (profile.id === 'conditional') {
    return `${title} — conditional. Antecedent is active; ${sigilPhrase} is the hinge between resolved and deferred.`;
  }
  return `${title} — declarative. Proposition is asserted; ${sigilPhrase} occupies a stable argument slot.`;
}

export function buildChapterVerse(chapter, profile) {
  const sigilPhrase = readSigilPhrase(chapter.spw);
  const number = String(chapter.number).padStart(2, '0');

  if (profile.id === 'interrogative') {
    return `ch.${number} — gap marked\n${sigilPhrase} withholds resolution\nclause remains open`;
  }
  if (profile.id === 'imperative') {
    return `ch.${number} — subject elided\n${sigilPhrase} takes the argument slot\nverb governs directly`;
  }
  if (profile.id === 'exclamatory') {
    return `ch.${number} — order suspended\n${sigilPhrase} carries affect\nforce is primary`;
  }
  if (profile.id === 'conditional') {
    return `ch.${number} — antecedent active\n${sigilPhrase} holds the hinge\nconsequent deferred`;
  }
  return `ch.${number} — proposition closed\n${sigilPhrase} in argument slot\nunmarked, stable`;
}
