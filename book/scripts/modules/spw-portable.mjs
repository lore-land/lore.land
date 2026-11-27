// @ts-check
/**
 * spw-portable.mjs — portable Spw transport (#spw64= URL fragments) and cross-host slot projection.
 *
 * Implements PLAN.F slices f15 & f42 (see .spw/plans/ecosystem-workbench/PLAN.md and
 * .spw/plans/story-spw-wonders/PLAN.md):
 *   - `#spw64=` base64url encode/decode so ways, spells, sayings, and board/ear lines travel
 *     client-side in URL fragments without touching any server log.
 *   - `projectCrossHostSlot()` bridging lore.land's bracketed kinds (`.type[character]`, `#saying[cN]`)
 *     into the shared `word[mode]{body}(scene)<concept>` cross-host shape (spwashi.com,
 *     factshift.center, texture.website, spw.quest).
 *   - `buildPortableDoorUrl()` for zero-server cross-host links.
 */

const PREFIX = 'spw64=';

/**
 * Encode UTF-8 text as unpadded URL-safe base64 (RFC 4648 §5). Works in both Node and browser.
 * @param {string} text
 * @returns {string}
 */
export function toBase64Url(text) {
  const bytes = new TextEncoder().encode(String(text || ''));
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
  const b64 = typeof globalThis.btoa === 'function'
    ? globalThis.btoa(binary)
    : Buffer.from(bytes).toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

/**
 * Decode unpadded URL-safe base64 back to UTF-8 text. Returns null if malformed.
 * @param {string} token
 * @returns {string | null}
 */
export function fromBase64Url(token) {
  const raw = String(token || '').trim();
  if (!raw || !/^[A-Za-z0-9_-]+$/.test(raw)) return null;
  const padded = raw.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (raw.length % 4)) % 4);
  try {
    if (typeof globalThis.atob === 'function') {
      const binary = globalThis.atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    return Buffer.from(padded, 'base64').toString('utf8');
  } catch {
    return null;
  }
}

/**
 * Encode a Spw line or block into a `#spw64=...` fragment string (never sent in HTTP requests).
 * @param {string} spw
 * @returns {string}
 */
export function encodeSpwFragment(spw) {
  const clean = String(spw || '').trim();
  return clean ? `#${PREFIX}${toBase64Url(clean)}` : '';
}

/**
 * Extract and decode a `#spw64=...` payload from a URL hash, full URL, or bare fragment.
 * Returns null when no valid `spw64=` parameter is present.
 * @param {string} [hashOrUrl]
 * @returns {string | null}
 */
export function decodeSpwFragment(hashOrUrl = globalThis.location?.hash || '') {
  const raw = String(hashOrUrl || '');
  const hashIdx = raw.indexOf('#');
  const fragment = hashIdx >= 0 ? raw.slice(hashIdx + 1) : raw;
  if (!fragment) return null;
  for (const part of fragment.split('&')) {
    if (part.startsWith(PREFIX)) {
      return fromBase64Url(part.slice(PREFIX.length));
    }
  }
  return null;
}

/**
 * Normalize an identifier for Spw slot labels without collapsing readable underscores.
 * @param {string} text
 * @returns {string}
 */
export function normalizeSlotName(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '') || 'unnamed';
}

/**
 * Project a lore.land domain artifact (wonder, trope, saying, character, board, ear) into the
 * cross-host single-line Spw slot grammar `sigil word[mode]{ body }(scene)<concept>` so it
 * opens cleanly in factshift.center, spw.quest, and texture.website without losing its lore.land anchor.
 *
 * @param {{
 *   sigil?: string,
 *   word: string,
 *   mode?: string,
 *   body?: string | string[],
 *   scene?: string,
 *   concept?: string,
 *   source?: string
 * }} spec
 * @returns {string}
 */
export function projectCrossHostSlot(spec) {
  const sigil = spec.sigil && /^[!?~@&*^#.$=%]$/.test(spec.sigil) ? spec.sigil : '~';
  const word = normalizeSlotName(spec.word);
  const mode = spec.mode ? `[${normalizeSlotName(spec.mode)}]` : '';
  const bodyParts = Array.isArray(spec.body)
    ? spec.body.map((s) => String(s || '').trim()).filter(Boolean)
    : spec.body ? [String(spec.body).trim()] : [];
  const body = bodyParts.length ? `{ ${bodyParts.join(' ')} }` : '';
  const scene = spec.scene ? `(${normalizeSlotName(spec.scene)})` : '';
  const concept = spec.concept ? `<${normalizeSlotName(spec.concept)}>` : '';
  const from = spec.source ? ` #from["${String(spec.source).replace(/"/g, "'")}"]` : '';
  return `${sigil}${word}${mode}${body}${scene}${concept}${from}`.trim();
}

/**
 * Build a portable cross-host URL carrying a Spw payload inside `#spw64=`.
 * @param {string} baseUrl e.g. 'https://factshift.center/' or '/scriptorium/'
 * @param {string} spw
 * @returns {string}
 */
export function buildPortableDoorUrl(baseUrl, spw) {
  const frag = encodeSpwFragment(spw);
  if (!frag) return String(baseUrl || '');
  const base = String(baseUrl || '').split('#')[0];
  return `${base}${frag}`;
}
