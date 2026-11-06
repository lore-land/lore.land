/**
 * bracework.mjs — the page reads its own notation (PLAN.E L14, contract c025).
 *
 * In Boon.land, makers write what they mean to build in sigils and braces
 * before they build it. A chapter can set one of those expressions in the
 * page (`figure.bracework[data-spw]`, prerendered by chapter-render.mjs as
 * the expression and its gloss). When one comes near the viewport, this
 * module loads the Spw interpreter — the vendored spw-seed parser, the same
 * kernel the canon is linted with — and draws what it read: the container
 * (a window, a room, a gathering, a passage), the things held, and each
 * sigil with its literary reading (spw-resonance.mjs).
 *
 * The interpreter is honest: when it reads an expression as prose (the
 * makers' shorthand outrunning the grammar), the block says so instead of
 * pretending. Without script, the block is still the expression and gloss.
 */
import { CONTAINER_RESONANCE, OPERATOR_RESONANCE } from './spw-resonance.mjs?v=2026_09_26.C';

const CONTAINERS = Object.freeze({
  Frame: { open: '[', close: ']', word: 'a window', what: 'you can only look into it' },
  Body: { open: '{', close: '}', word: 'a room', what: 'you can stand in it for a minute' },
  Scope: { open: '(', close: ')', word: 'a gathering', what: 'everything in it arrives together' },
  Capsule: { open: '<', close: '>', word: 'a passage', what: 'you can go through it, never stay' }
});

let parser = null;
const loadParser = () => {
  parser = parser || import('../vendor/spw-seed.mjs').then((mod) => mod.parse).catch(() => null);
  return parser;
};

/** Walk the interpreter's tree into a flat reading, in source order. */
export function readTree(ast) {
  const tokens = [];
  const containers = [];
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) { node.forEach(walk); return; }
    const shape = CONTAINERS[node.type];
    if (shape) {
      containers.push(node.type);
      tokens.push({ kind: 'open', text: shape.open, container: node.type });
      Object.entries(node).forEach(([key, value]) => { if (key !== 'span') walk(value); });
      tokens.push({ kind: 'close', text: shape.close, container: node.type });
      return;
    }
    if (node.type === 'Identifier') {
      tokens.push({ kind: 'thing', text: node.token?.value || '' });
      return;
    }
    if (node.type === 'Reference') {
      tokens.push({ kind: 'sigil', text: '@' });
      const value = JSON.stringify(node).match(/"type":"IDENTIFIER","value":"([^"]+)"/);
      if (value) tokens.push({ kind: 'thing', text: value[1] });
      return;
    }
    if (node.type === 'Operation') {
      if (node.operator?.value) tokens.push({ kind: 'sigil', text: node.operator.value });
      (node.modifiers?.modifiers || []).forEach((modifier) => tokens.push({ kind: 'thing', text: modifier.value }));
      Object.entries(node).forEach(([key, value]) => { if (!['span', 'operator', 'modifiers'].includes(key)) walk(value); });
      return;
    }
    Object.entries(node).forEach(([key, value]) => { if (key !== 'span') walk(value); });
  };
  walk(ast);
  return { tokens, containers };
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text != null) node.textContent = text;
  return node;
}

function draw(figure, result) {
  figure.querySelector('.bracework-reading')?.remove();
  const reading = el('div', 'bracework-reading');
  if (!result?.success || result.completeness?.proseFallback) {
    reading.append(el('div', 'bracework-note', 'The interpreter reads this as prose: the makers’ shorthand runs ahead of the grammar here, and the land keeps it anyway.'));
    figure.dataset.read = 'prose';
    figure.append(reading);
    return;
  }
  const { tokens, containers } = readTree(result.ast);
  const shape = el('div', 'bracework-shape');
  shape.setAttribute('aria-hidden', 'true');
  tokens.forEach((token) => {
    const chip = el('span', `bracework-token is-${token.kind}`, token.text);
    if (token.kind === 'sigil') chip.title = OPERATOR_RESONANCE[token.text]?.name || token.text;
    shape.append(chip);
  });
  reading.append(shape);
  const lines = el('ul', 'bracework-lines');
  const outer = CONTAINERS[containers[0]];
  if (outer) {
    const res = CONTAINER_RESONANCE[outer.open];
    lines.append(el('li', 'bracework-line is-container', `${outer.open} ${outer.close} ${outer.word}: ${outer.what}.${res ? ` ${res.reading}` : ''}`));
  }
  [...new Set(tokens.filter((t) => t.kind === 'sigil').map((t) => t.text))].forEach((sigil) => {
    const res = OPERATOR_RESONANCE[sigil];
    if (res) lines.append(el('li', 'bracework-line is-sigil', `${sigil} ${res.name}: ${res.reading}`));
  });
  const things = tokens.filter((t) => t.kind === 'thing').map((t) => t.text);
  if (things.length) lines.append(el('li', 'bracework-line is-things', `Held: ${things.join(', ')}.`));
  reading.append(lines);
  reading.append(el('div', 'bracework-source', 'Read by the Spw interpreter (spw-seed), the same grammar the canon is written in.'));
  figure.dataset.read = 'parsed';
  figure.append(reading);
}

export function initBracework() {
  const blocks = [...document.querySelectorAll('figure.bracework[data-spw]')];
  if (!blocks.length) return () => {};
  const read = async (figure) => {
    if (figure.dataset.read) return;
    figure.dataset.read = 'reading';
    const parse = await loadParser();
    if (!parse) {
      delete figure.dataset.read;
      return;
    }
    draw(figure, parse(figure.dataset.spw, { lexProfile: 'prose' }));
  };
  if (!('IntersectionObserver' in window)) {
    blocks.forEach(read);
    return () => {};
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      observer.unobserve(entry.target);
      read(entry.target);
    });
  }, { rootMargin: '400px 0px' });
  blocks.forEach((block) => observer.observe(block));
  return () => observer.disconnect();
}
