/**
 * mini-dom.mjs — just enough DOM for chapter-render.mjs to run under Node.
 *
 * Supports createElement/createTextNode, attributes (insertion-ordered),
 * className, a dataset proxy with camelCase ⇄ data-kebab mapping, and
 * append/appendChild. Serializes to HTML with escaping. Anything the
 * renderer starts to need beyond this should be added here deliberately,
 * not papered over — the point is that both hosts run identical code.
 */

const VOID_TAGS = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

const escapeText = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;');

const escapeAttr = (value) => escapeText(value).replaceAll('"', '&quot;');

const toDataAttr = (key) => `data-${key.replace(/[A-Z]/g, (ch) => `-${ch.toLowerCase()}`)}`;

class MiniText {
  constructor(text) {
    this.nodeType = 3;
    this.data = String(text);
  }

  get outerHTML() {
    return escapeText(this.data);
  }
}

class MiniElement {
  constructor(tag, ownerDocument) {
    this.nodeType = 1;
    this.localName = String(tag).toLowerCase();
    this.tagName = this.localName.toUpperCase();
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.childNodes = [];
    const element = this;
    this.dataset = new Proxy({}, {
      get: (_, key) => (typeof key === 'string' ? element.getAttribute(toDataAttr(key)) ?? undefined : undefined),
      set: (_, key, value) => {
        element.setAttribute(toDataAttr(key), String(value));
        return true;
      },
      deleteProperty: (_, key) => {
        element.removeAttribute(toDataAttr(key));
        return true;
      },
      has: (_, key) => element.hasAttribute(toDataAttr(key))
    });
  }

  get className() {
    return this.getAttribute('class') || '';
  }

  set className(value) {
    this.setAttribute('class', value);
  }

  get id() {
    return this.getAttribute('id') || '';
  }

  set id(value) {
    this.setAttribute('id', value);
  }

  get children() {
    return this.childNodes.filter((node) => node.nodeType === 1);
  }

  setAttribute(name, value) {
    this.attributes.set(String(name).toLowerCase(), String(value));
  }

  getAttribute(name) {
    const value = this.attributes.get(String(name).toLowerCase());
    return value === undefined ? null : value;
  }

  hasAttribute(name) {
    return this.attributes.has(String(name).toLowerCase());
  }

  removeAttribute(name) {
    this.attributes.delete(String(name).toLowerCase());
  }

  set textContent(value) {
    this.childNodes = [new MiniText(value ?? '')];
  }

  get textContent() {
    return this.childNodes.map((node) => (node.nodeType === 3 ? node.data : node.textContent)).join('');
  }

  appendChild(node) {
    this.childNodes.push(node);
    return node;
  }

  append(...nodes) {
    nodes.forEach((node) => {
      this.childNodes.push(typeof node === 'string' ? new MiniText(node) : node);
    });
  }

  get innerHTML() {
    return this.childNodes.map((node) => node.outerHTML).join('');
  }

  get outerHTML() {
    const attrs = [...this.attributes].map(([name, value]) => (value === '' ? ` ${name}` : ` ${name}="${escapeAttr(value)}"`)).join('');
    if (VOID_TAGS.has(this.localName)) {
      return `<${this.localName}${attrs}>`;
    }
    return `<${this.localName}${attrs}>${this.innerHTML}</${this.localName}>`;
  }
}

export function createMiniDocument() {
  const doc = {
    createElement: (tag) => new MiniElement(tag, doc),
    createTextNode: (text) => new MiniText(text)
  };
  return doc;
}
