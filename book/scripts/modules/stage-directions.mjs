/**
 * stage-directions.mjs — a chapter's URL as stage directions (PLAN.E L21).
 *
 * A chapter is a stage: its light, its clock, which words are showing, and
 * whether a passage is framed for a picture. These parameters set the stage
 * for one visit; they never change a reader's own settings. "Copy stage
 * link" (in Frame this and the light table) writes them back, so a tuned
 * screenshot is a recipe anyone can open.
 *
 *   #section-id                the section on stage (else the first)
 *   ?stage=story|square|card   open the frame at these proportions
 *   &p=3 | &p=all              which paragraph of the section (1-based), or all of it
 *   &type=1.4                  type size in the frame, in rem (0.85–1.7)
 *   &light=dusk                a named light cue: dawn, morning, noon, afternoon,
 *                              dusk, night or lamp (knobs.json cues) — where the
 *                              light stands, its warmth and its glow
 *   &glow=0.8 &warmth=0.7 &ink=34 &grain=0.3 &edge=0.5   knobs, turned past the cue
 *   &motif=egg                 light the scene as this motif does
 *   &phrases=turn|still        do phrases turn with the clock on this visit
 *   &at=19:00 | &at=2026-11-13T19:00 | &at=canon
 *                              the stage clock: which words the turning phrases show
 *                              (canon: the book's own words)
 *   &controls=off              no frame controls, for a clean automated capture
 *
 * The older ?try=living still turns phrases on (reading-switches.mjs).
 */

const ASPECTS = ['story', 'square', 'card'];
const KNOBS = Object.freeze({ glow: [0, 1], warmth: [0, 1], ink: [0, 360], grain: [0, 1], edge: [0, 1] });
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const pad = (n) => String(n).padStart(2, '0');

function readClock(raw) {
  const value = String(raw || '').trim();
  if (!value) return null;
  if (value === 'canon') return 'canon';
  const time = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (time) {
    const date = new Date();
    date.setHours(Number(time[1]), Number(time[2]), 0, 0);
    return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** The stage this URL sets, normalized; absent directions are null. */
export function readStage(href = typeof location !== 'undefined' ? location.href : '') {
  let url;
  try { url = new URL(href); } catch { return { knobs: {} }; }
  const q = url.searchParams;
  const number = (key) => (q.has(key) && Number.isFinite(Number(q.get(key))) ? Number(q.get(key)) : null);
  const knobs = {};
  Object.entries(KNOBS).forEach(([key, [min, max]]) => {
    const n = number(key);
    if (n != null) knobs[key] = clamp(n, min, max);
  });
  const p = q.get('p');
  return {
    section: decodeURIComponent(url.hash.replace(/^#/, '')) || null,
    aspect: ASPECTS.includes(q.get('stage')) ? q.get('stage') : null,
    paragraph: p === 'all' ? 'all' : (Number.isInteger(Number(p)) && Number(p) > 0 ? Number(p) : null),
    type: number('type') != null ? clamp(number('type'), 0.85, 1.7) : null,
    knobs,
    cue: /^[a-z]+$/.test(q.get('light') || '') ? q.get('light') : null,
    motif: q.get('motif') || null,
    phrases: ['turn', 'still'].includes(q.get('phrases')) ? q.get('phrases') : null,
    at: readClock(q.get('at')),
    controls: q.get('controls') === 'off' ? 'off' : null
  };
}

/** True when this URL gives any stage direction at all. */
export function hasStage(stage = readStage()) {
  return Boolean(stage.aspect || stage.type || stage.cue || stage.motif || stage.phrases || stage.at || stage.controls || Object.keys(stage.knobs || {}).length);
}

/** Write a stage back into a link: only what is set, in a stable order. */
export function stageLink(stage, href = location.href) {
  const url = new URL(href);
  ['stage', 'p', 'type', 'light', 'sun', 'glow', 'warmth', 'ink', 'grain', 'edge', 'motif', 'phrases', 'at', 'controls', 'try'].forEach((key) => url.searchParams.delete(key));
  const set = (key, value) => { if (value != null && value !== '') url.searchParams.set(key, String(value)); };
  const r = (n, digits = 2) => (Number.isFinite(n) ? Number(n.toFixed(digits)) : null);
  set('stage', stage.aspect);
  set('p', stage.paragraph);
  set('type', r(stage.type));
  const k = stage.knobs || {};
  set('light', stage.cue);
  ['glow', 'warmth', 'grain', 'edge'].forEach((key) => set(key, r(k[key])));
  set('ink', Number.isFinite(k.ink) ? Math.round(k.ink) : null);
  set('motif', stage.motif);
  set('phrases', stage.phrases);
  if (stage.at === 'canon') set('at', 'canon');
  else if (stage.at instanceof Date) set('at', `${stage.at.getFullYear()}-${pad(stage.at.getMonth() + 1)}-${pad(stage.at.getDate())}T${pad(stage.at.getHours())}:${pad(stage.at.getMinutes())}`);
  set('controls', stage.controls);
  url.hash = stage.section ? `#${stage.section}` : '';
  return url.toString();
}
