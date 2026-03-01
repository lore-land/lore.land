const MAX_HISTORY = 96;

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export class SpwRegisterBank {
  constructor() {
    this.active = null;
    this.history = [];
    this.handles = new Map();
    this.payloads = new Map();
    this.concepts = new Map();
  }

  setActive(entry) {
    const snapshot = clone(entry);
    this.active = snapshot;
    this.history.unshift(snapshot);
    if (this.history.length > MAX_HISTORY) {
      this.history.length = MAX_HISTORY;
    }

    if (snapshot.handle) {
      this.handles.set(snapshot.handle, snapshot);
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
  }

  getActive() {
    return this.active ? clone(this.active) : null;
  }

  getHandle(handle) {
    const entry = this.handles.get(handle);
    return entry ? clone(entry) : null;
  }

  listHandles() {
    return [...this.handles.keys()];
  }

  listConcepts(limit = 24) {
    return [...this.concepts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([concept, count]) => ({ concept, count }));
  }

  snapshot() {
    return {
      active: this.getActive(),
      handles: this.listHandles(),
      concepts: this.listConcepts(),
      historySize: this.history.length
    };
  }
}

const globalKey = '__loreSpwRegisterBank__';

export function getSpwRegisterBank() {
  if (!globalThis[globalKey]) {
    globalThis[globalKey] = new SpwRegisterBank();
  }
  return globalThis[globalKey];
}
