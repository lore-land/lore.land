const MAX_ACTIVE_HISTORY = 96;
const DEFAULT_FOCUS_KEY = '"';
const HISTORY_KEYS = Object.freeze(['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']);
const PHASE_ORDER = Object.freeze(['lex', 'parse', 'sem', 'opt', 'prag']);

function nowIso() {
  return new Date().toISOString();
}

function clone(value) {
  if (value == null || typeof value !== 'object') {
    return value;
  }
  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

function mergeValues(left, right) {
  if (right === undefined) {
    return clone(left);
  }
  if (left === undefined) {
    return clone(right);
  }

  if (Array.isArray(left) && Array.isArray(right)) {
    return [...left.map(clone), ...right.map(clone)];
  }

  if (left && right && typeof left === 'object' && typeof right === 'object' && !Array.isArray(left) && !Array.isArray(right)) {
    return { ...clone(left), ...clone(right) };
  }

  return clone(right);
}

function runtimeMagnitude(value) {
  if (value == null) {
    return 0;
  }
  if (typeof value === 'number') {
    return Math.abs(value);
  }
  if (typeof value === 'string') {
    return value.length;
  }
  if (typeof value === 'boolean') {
    return value ? 1 : 0;
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (typeof value === 'object') {
    return Object.keys(value).length;
  }
  return 0;
}

function clamp01(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function descriptorForKey(key) {
  if (key === '@') {
    return { name: 'Perspective', accessMode: 'perspective', containerAffinity: 'perspective' };
  }
  if (key === '#') {
    return { name: 'Annotation', accessMode: 'category', containerAffinity: 'category' };
  }
  if (key === '&') {
    return { name: 'Confluence', accessMode: 'confluent', containerAffinity: 'merge' };
  }
  if (key === '%') {
    return { name: 'Measure', accessMode: 'ratio', containerAffinity: 'scalar' };
  }
  return { name: `Register ${key}`, accessMode: 'context', containerAffinity: 'stream' };
}

function handleKey(handle) {
  const text = String(handle || '').trim();
  if (!text) {
    return '';
  }

  const bracket = text.match(/\[([^\]\n]+)\]/);
  if (bracket?.[1]) {
    return bracket[1].trim();
  }

  return text;
}

export class SpwRegisterBank {
  constructor(initial = {}) {
    this.active = null;
    this.history = [];
    this.handles = new Map();
    this.payloads = new Map();
    this.concepts = new Map();

    this.entries = new Map();
    this.lensIndex = new Map();
    this.writeTimestamps = new Map();
    this.couplingEdges = new Map();
    this.focusKey = DEFAULT_FOCUS_KEY;

    this.ensureEntry(DEFAULT_FOCUS_KEY);

    Object.entries(initial).forEach(([key, value]) => {
      this.set(key, value, { source: 'init', force: true });
    });
  }

  ensureEntry(key) {
    const existing = this.entries.get(key);
    if (existing) {
      return existing;
    }

    const entry = {
      key,
      value: undefined,
      meta: {
        key,
        descriptor: descriptorForKey(key),
        writes: 0,
        lastUsedAt: nowIso(),
        immutable: false,
        provenance: ['init'],
        lenses: [],
        liminality: 0,
        frequency: 0,
        coupling: 0,
        measureDepth: 0,
        phases: undefined
      }
    };

    this.entries.set(key, entry);
    return entry;
  }

  set(key, value, options = {}) {
    const entry = this.ensureEntry(key);
    if (entry.meta.immutable && !options.force) {
      return false;
    }

    if (options.descriptor && typeof options.descriptor === 'object') {
      entry.meta.descriptor = {
        ...entry.meta.descriptor,
        ...options.descriptor
      };
    }

    entry.value = clone(value);
    entry.meta.writes += 1;
    entry.meta.lastUsedAt = nowIso();
    entry.meta.immutable = options.immutable ?? entry.meta.immutable;
    entry.meta.provenance = this.pushProvenance(entry.meta.provenance, options.source || 'set');

    if (options.phase) {
      entry.meta.phases = this.advancePhase(entry.meta.phases, options.phase, options.source || 'set');
    }

    this.recordWriteTimestamp(key);
    return true;
  }

  get(key = this.focusKey) {
    const entry = this.ensureEntry(key);
    entry.meta.lastUsedAt = nowIso();
    return clone(entry.value);
  }

  focus(key) {
    const text = String(key || '').trim();
    if (!text) {
      return;
    }
    this.ensureEntry(text);
    this.focusKey = text;
  }

  getFocusKey() {
    return this.focusKey;
  }

  getActiveKey() {
    return this.getFocusKey();
  }

  listKeys() {
    return [...this.entries.keys()].sort((a, b) => a.localeCompare(b));
  }

  listHandles() {
    return [...this.handles.keys()];
  }

  setActive(entry) {
    const snapshot = clone(entry);
    this.active = snapshot;
    this.history.unshift(snapshot);
    if (this.history.length > MAX_ACTIVE_HISTORY) {
      this.history.length = MAX_ACTIVE_HISTORY;
    }

    if (snapshot.handle) {
      this.handles.set(snapshot.handle, snapshot);
      const key = handleKey(snapshot.handle);
      if (key) {
        this.focus(key);
      }
    }

    if (snapshot.payloadId) {
      this.payloads.set(snapshot.payloadId, snapshot.payload);
    }

    if (Array.isArray(snapshot.concepts)) {
      snapshot.concepts.forEach((concept) => {
        if (!concept) {
          return;
        }
        const key = String(concept).toLowerCase();
        this.concepts.set(key, (this.concepts.get(key) || 0) + 1);
      });
    }

    this.extract(snapshot, 'selection');
  }

  getActive() {
    return this.active ? clone(this.active) : null;
  }

  getHandle(handle) {
    const entry = this.handles.get(handle);
    return entry ? clone(entry) : null;
  }

  getPayload(payloadId) {
    const entry = this.payloads.get(payloadId);
    return entry ? clone(entry) : null;
  }

  listConcepts(limit = 24) {
    return [...this.concepts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([concept, count]) => ({ concept, count }));
  }

  extract(value, source = 'extract') {
    const wroteFocused = this.set(this.focusKey, value, { source });
    this.set(DEFAULT_FOCUS_KEY, value, { source: `${source}:default`, force: true });
    this.rotateHistory(value, source);
    return wroteFocused;
  }

  yank(value, source = 'extract') {
    return this.extract(value, source);
  }

  deposit(key = this.focusKey) {
    const entry = this.ensureEntry(key);
    entry.meta.lastUsedAt = nowIso();
    entry.meta.provenance = this.pushProvenance(entry.meta.provenance, 'deposit');
    return clone(entry.value);
  }

  paste(key = this.focusKey) {
    return this.deposit(key);
  }

  access(base, path = []) {
    let current = clone(base);
    const segments = Array.isArray(path) ? path : [];

    for (const segment of segments) {
      if (current == null) {
        return undefined;
      }

      if (Array.isArray(current)) {
        const index = Number.parseInt(segment, 10);
        if (!Number.isFinite(index)) {
          return undefined;
        }
        current = current[index];
        continue;
      }

      if (typeof current === 'object') {
        current = current[segment];
        continue;
      }

      return undefined;
    }

    return clone(current);
  }

  resonate(name, value, lens = 'default') {
    const wrote = this.set(name, value, {
      source: `resonate:${lens}`,
      descriptor: descriptorForKey('#'),
      force: true
    });

    if (wrote) {
      const entry = this.ensureEntry(name);
      if (!entry.meta.lenses.includes(lens)) {
        entry.meta.lenses = [...entry.meta.lenses, lens];
      }

      const bucket = this.lensIndex.get(lens) || new Set();
      bucket.add(name);
      this.lensIndex.set(lens, bucket);
    }

    return wrote;
  }

  keysForLens(lens) {
    const bucket = this.lensIndex.get(lens);
    return bucket ? [...bucket].sort((a, b) => a.localeCompare(b)) : [];
  }

  observe(observer, value) {
    const frame = {
      observer,
      capturedAt: nowIso(),
      value: clone(value)
    };

    this.set('@', frame, {
      source: `observe:${observer}`,
      descriptor: descriptorForKey('@'),
      force: true
    });

    return frame;
  }

  confluent(name, ...sources) {
    const merged = sources.reduce((acc, value) => mergeValues(acc, value), undefined);
    this.set(name, merged, {
      source: 'confluent',
      descriptor: descriptorForKey('&'),
      force: true
    });
    return clone(merged);
  }

  materialize(name) {
    const entry = this.entries.get(name);
    if (!entry) {
      return undefined;
    }

    return {
      ...clone(entry.meta),
      descriptor: clone(entry.meta.descriptor),
      provenance: [...entry.meta.provenance],
      lenses: [...entry.meta.lenses]
    };
  }

  enrichPhase(key, phase, source = `enrich:${phase}`) {
    const entry = this.entries.get(key);
    if (!entry) {
      return false;
    }

    entry.meta.phases = this.advancePhase(entry.meta.phases, phase, source);
    entry.meta.lastUsedAt = nowIso();
    return true;
  }

  phaseOf(key) {
    return this.entries.get(key)?.meta?.phases?.current;
  }

  promote(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    const current = Number(entry.meta.liminality || 0);
    const next = Math.min(3, current + 1);
    entry.meta.liminality = next;
    return next;
  }

  demote(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      return undefined;
    }

    const current = Number(entry.meta.liminality || 0);
    const next = Math.max(0, current - 1);
    entry.meta.liminality = next;
    return next;
  }

  frequencyOf(key) {
    return this.entries.get(key)?.meta?.frequency;
  }

  couple(keyA, keyB) {
    this.ensureEntry(keyA);
    this.ensureEntry(keyB);

    const edgesA = this.couplingEdges.get(keyA) || new Set();
    const edgesB = this.couplingEdges.get(keyB) || new Set();
    edgesA.add(keyB);
    edgesB.add(keyA);
    this.couplingEdges.set(keyA, edgesA);
    this.couplingEdges.set(keyB, edgesB);

    this.updateCoupling(keyA);
    this.updateCoupling(keyB);
  }

  couplingOf(key) {
    return this.entries.get(key)?.meta?.coupling;
  }

  measure(key, scale = 1) {
    const entry = this.ensureEntry(key);
    entry.meta.measureDepth = Number(entry.meta.measureDepth || 0) + 1;
    const denominator = scale > 0 ? scale : 1;
    return clamp01(runtimeMagnitude(this.get(key)) / denominator);
  }

  snapshot() {
    const entries = {};
    const lensIndex = {};

    this.entries.forEach((entry, key) => {
      entries[key] = {
        key,
        value: clone(entry.value),
        meta: {
          ...clone(entry.meta),
          descriptor: clone(entry.meta.descriptor),
          provenance: [...entry.meta.provenance],
          lenses: [...entry.meta.lenses],
          phases: entry.meta.phases
            ? {
              ...entry.meta.phases,
              facets: entry.meta.phases.facets.map((facet) => ({ ...facet }))
            }
            : undefined
        }
      };
    });

    this.lensIndex.forEach((keys, lens) => {
      lensIndex[lens] = [...keys].sort((a, b) => a.localeCompare(b));
    });

    return {
      active: this.getActive(),
      handles: this.listHandles(),
      concepts: this.listConcepts(),
      historySize: this.history.length,
      focusKey: this.focusKey,
      activeKey: this.focusKey,
      entries,
      lensIndex
    };
  }

  rotateHistory(value, source) {
    for (let index = HISTORY_KEYS.length - 1; index > 0; index -= 1) {
      const key = HISTORY_KEYS[index];
      const prevKey = HISTORY_KEYS[index - 1];
      const prevValue = this.entries.get(prevKey)?.value;
      this.set(key, prevValue, { source: `${source}:history`, force: true });
    }

    this.set(HISTORY_KEYS[0], value, { source: `${source}:history`, force: true });
  }

  pushProvenance(provenance, source) {
    const next = [...provenance, source];
    if (next.length <= 16) {
      return next;
    }
    return next.slice(next.length - 16);
  }

  advancePhase(existing, phase, source) {
    const phaseIndex = PHASE_ORDER.indexOf(phase);
    const facet = {
      phase,
      enrichedAt: nowIso(),
      source,
      memoryWeight: phaseIndex >= 0 ? (phaseIndex + 1) / PHASE_ORDER.length : 0.5
    };

    if (!existing) {
      return {
        current: phase,
        facets: [facet]
      };
    }

    return {
      ...existing,
      current: phase,
      facets: [...existing.facets, facet]
    };
  }

  recordWriteTimestamp(key) {
    const now = Date.now();
    const windowSize = 10;
    const timestamps = this.writeTimestamps.get(key) || [];
    timestamps.push(now);
    if (timestamps.length > windowSize) {
      timestamps.splice(0, timestamps.length - windowSize);
    }
    this.writeTimestamps.set(key, timestamps);

    const entry = this.entries.get(key);
    if (!entry) {
      return;
    }

    if (timestamps.length >= 2) {
      const ms = now - timestamps[0];
      entry.meta.frequency = ms > 0 ? (timestamps.length - 1) / (ms / 1000) : 0;
    } else {
      entry.meta.frequency = 0;
    }
  }

  updateCoupling(key) {
    const entry = this.entries.get(key);
    if (!entry) {
      return;
    }

    const edgeCount = this.couplingEdges.get(key)?.size || 0;
    const denominator = Math.max(this.entries.size - 1, 1);
    entry.meta.coupling = clamp01(edgeCount / denominator);
  }
}

const globalKey = '__loreSpwRegisterBank__';

export function getSpwRegisterBank() {
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = new SpwRegisterBank();
  }
  return globalThis[globalKey];
}
