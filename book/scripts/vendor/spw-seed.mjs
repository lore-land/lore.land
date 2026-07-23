/* GENERATED — do not hand-edit.
   Bundled from .spw/_workbench/packages/spw-seed/src/index.ts (spw-workbench parser kernel)
   via node book/scripts/tools/bundle-spw-seed.mjs. Regenerate after every workbench update. */


// .spw/_workbench/packages/spw-seed/src/types/brand.ts
function castToBrand(value) {
  return value;
}

// .spw/_workbench/packages/spw-seed/src/types/ids.ts
function joinTemplate(strings, values) {
  let out = strings[0] ?? "";
  for (let i = 0; i < values.length; i += 1) {
    out += String(values[i]) + (strings[i + 1] ?? "");
  }
  return out;
}
function materializeBrandInput(input, values) {
  return typeof input === "string" ? input : joinTemplate(input, values);
}
function createBrandTag() {
  return (strings, ...values) => castToBrand(joinTemplate(strings, values));
}
function createBrandFactory() {
  function brandFactory(input, ...values) {
    return castToBrand(materializeBrandInput(input, values));
  }
  return brandFactory;
}
var $register = createBrandTag();
var $frame = createBrandTag();
var $domain = createBrandTag();
var $layer = createBrandTag();
var RegisterId = createBrandFactory();
var FrameId = createBrandFactory();
var DomainId = createBrandFactory();
var LayerId = createBrandFactory();

// .spw/_workbench/packages/spw-seed/src/types/coupling.ts
var PAIRED_BOUNDARY_KINDS = [
  "frame",
  "body",
  "scope",
  "capsule",
  "stream",
  "nrange"
];
var OPERATOR_PORTS = [
  "before_operator",
  "operand",
  "after_operator"
];
var BOUNDARY_PORTS = [
  "before_open",
  "open_boundary",
  "inside",
  "close_boundary",
  "after_close"
];
var COUPLING_DESCRIPTORS = {
  couple: {
    kind: "couple",
    form: "operator",
    surface: "<>",
    reg: "couple",
    ports: OPERATOR_PORTS
  },
  frame: {
    kind: "frame",
    form: "boundary",
    surface: "[\u2026]",
    emptySurface: "[]",
    openSurface: "[",
    closeSurface: "]",
    reg: "inner",
    ports: BOUNDARY_PORTS
  },
  body: {
    kind: "body",
    form: "boundary",
    surface: "{\u2026}",
    emptySurface: "{}",
    openSurface: "{",
    closeSurface: "}",
    reg: "around",
    ports: BOUNDARY_PORTS
  },
  scope: {
    kind: "scope",
    form: "boundary",
    surface: "(\u2026)",
    emptySurface: "()",
    openSurface: "(",
    closeSurface: ")",
    reg: "scope",
    ports: BOUNDARY_PORTS
  },
  capsule: {
    kind: "capsule",
    form: "boundary",
    surface: "<\u2026>",
    // Spacing makes the empty capsule visibly distinct from OPERATOR `<>`.
    emptySurface: "< >",
    openSurface: "<",
    closeSurface: ">",
    reg: "capsule",
    ports: BOUNDARY_PORTS
  },
  stream: {
    kind: "stream",
    form: "boundary",
    surface: "<<\u2026>>",
    emptySurface: "<<>>",
    openSurface: "<<",
    closeSurface: ">>",
    reg: "stream",
    ports: BOUNDARY_PORTS
  },
  nrange: {
    kind: "nrange",
    form: "boundary",
    surface: "((\u2026))",
    emptySurface: "(())",
    openSurface: "((",
    closeSurface: "))",
    reg: "range",
    ports: BOUNDARY_PORTS
  }
};
var ACT_PLACEMENTS = /* @__PURE__ */ new Set(["interior", "prefix", "postfix", "none", "membrane"]);
var EMPTY_PAYLOADS = /* @__PURE__ */ new Set(["void", "space"]);
var INHABITED_PAYLOADS = /* @__PURE__ */ new Set(["act", "term", "multi"]);
function isValidArity(value) {
  return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value) && value >= 0;
}
function isValidActPlacement(value) {
  return typeof value === "string" && ACT_PLACEMENTS.has(value);
}
function payloadMatchesOccupancy(occupancy, payload) {
  return occupancy === "empty" ? EMPTY_PAYLOADS.has(payload) : INHABITED_PAYLOADS.has(payload);
}
function couplingFrame(kind, occupancyOrOptions = {}) {
  if (kind === "couple") {
    const options2 = typeof occupancyOrOptions === "object" ? occupancyOrOptions : {};
    const arity = options2.arity ?? 0;
    if (!isValidArity(arity)) {
      throw new RangeError("couple arity must be a finite non-negative integer");
    }
    return {
      kind,
      form: "operator",
      surface: "<>",
      arity
    };
  }
  if (!isCouplingKind(kind)) {
    throw new TypeError(`unknown coupling kind ${String(kind)}`);
  }
  const descriptor = COUPLING_DESCRIPTORS[kind];
  const options = typeof occupancyOrOptions === "string" ? { occupancy: occupancyOrOptions } : occupancyOrOptions;
  const occupancy = options.occupancy ?? "inhabited";
  const payload = options.payload ?? (occupancy === "empty" ? "void" : "term");
  if (!payloadMatchesOccupancy(occupancy, payload)) {
    throw new TypeError(`payload ${payload} is incompatible with ${occupancy} occupancy`);
  }
  if (options.actPlacement !== void 0 && !isValidActPlacement(options.actPlacement)) {
    throw new TypeError(`invalid act placement ${String(options.actPlacement)}`);
  }
  const base = {
    kind,
    form: "boundary",
    surface: occupancy === "empty" ? descriptor.emptySurface : descriptor.surface,
    ...options.actPlacement ? { actPlacement: options.actPlacement } : {},
    ...options.product ? { product: options.product } : {}
  };
  return occupancy === "empty" ? { ...base, occupancy, payload } : { ...base, occupancy, payload };
}
function classifyPayload(args) {
  if (args.length === 0) return "void";
  if (args.length >= 2) return "multi";
  let only = args[0];
  if (only?.sigil === "=" && only.frames?.reg === "parameter" && Array.isArray(only.args) && only.args.length > 0) {
    only = only.args[0];
  }
  const sigil = only?.sigil;
  return sigil && sigil !== "_" ? "act" : "term";
}
function withCoupling(frames, kind, options = {}) {
  const descriptor = COUPLING_DESCRIPTORS[kind];
  const reg = typeof frames.reg === "string" && frames.reg.length > 0 ? frames.reg : descriptor.reg;
  const argCount = options.argCount ?? options.args?.length ?? 0;
  if (kind === "couple") {
    return {
      ...frames,
      reg,
      coupling: couplingFrame("couple", { arity: argCount })
    };
  }
  const occupancy = options.occupancy ?? (argCount === 0 ? "empty" : "inhabited");
  const payload = options.payload ?? (occupancy === "empty" ? "void" : options.args ? classifyPayload(options.args) : "term");
  const actPlacement = options.actPlacement ?? (payload === "act" ? "interior" : void 0);
  return {
    ...frames,
    reg,
    coupling: couplingFrame(kind, {
      occupancy,
      payload,
      actPlacement,
      product: options.product
    })
  };
}
function occupancyFromArgs(args) {
  return args.length === 0 ? "empty" : "inhabited";
}
function couplingDescriptor(kind) {
  return COUPLING_DESCRIPTORS[kind];
}
function boundaryCoordinateForSurface(surface) {
  for (const descriptor of Object.values(COUPLING_DESCRIPTORS)) {
    if (descriptor.form !== "boundary") continue;
    if (surface === descriptor.openSurface) {
      return { kind: descriptor.kind, form: "boundary", side: "open", surface };
    }
    if (surface === descriptor.closeSurface) {
      return { kind: descriptor.kind, form: "boundary", side: "close", surface };
    }
  }
  return void 0;
}
function boundarySetForProfile(profile) {
  return profile.includedKinds.filter(
    (kind) => kind !== "couple"
  );
}
function validateCouplingSemanticsProfile(profile) {
  const issues = [];
  if (profile.id.trim().length === 0) {
    issues.push({ path: "id", message: "profile id must be non-empty" });
  }
  if (profile.revision.trim().length === 0) {
    issues.push({ path: "revision", message: "profile revision must be non-empty" });
  }
  const included = /* @__PURE__ */ new Set();
  for (const [index, kind] of profile.includedKinds.entries()) {
    if (!Object.hasOwn(COUPLING_DESCRIPTORS, kind)) {
      issues.push({ path: `includedKinds[${index}]`, message: `unknown coupling kind ${String(kind)}` });
    } else if (included.has(kind)) {
      issues.push({ path: `includedKinds[${index}]`, message: `duplicate coupling kind ${kind}` });
    }
    included.add(kind);
  }
  for (const [mapKind, semantics] of Object.entries(profile.semantics)) {
    if (!semantics) continue;
    const kind = mapKind;
    const basePath = `semantics.${kind}`;
    if (!included.has(kind)) {
      issues.push({ path: basePath, message: "semantic entry is not present in includedKinds" });
    }
    if (semantics.kind !== kind) {
      issues.push({ path: `${basePath}.kind`, message: `expected ${kind}, received ${semantics.kind}` });
    }
    if (semantics.name.trim().length === 0 || semantics.description.trim().length === 0) {
      issues.push({ path: basePath, message: "name and description must be non-empty" });
    }
    const allowedPorts = new Set(COUPLING_DESCRIPTORS[kind].ports);
    for (const port of Object.keys(semantics.portRoles ?? {})) {
      if (!allowedPorts.has(port)) {
        issues.push({ path: `${basePath}.portRoles.${port}`, message: `port is not valid for ${kind}` });
      }
    }
    const dimensionIds = /* @__PURE__ */ new Set();
    for (const [index, dimension] of (semantics.dimensions ?? []).entries()) {
      const dimensionPath = `${basePath}.dimensions[${index}]`;
      if (dimensionIds.has(dimension.id)) {
        issues.push({ path: `${dimensionPath}.id`, message: `duplicate dimension ${dimension.id}` });
      }
      dimensionIds.add(dimension.id);
      if (dimension.id.trim().length === 0 || dimension.description.trim().length === 0 || dimension.method.trim().length === 0 || dimension.falsifier.trim().length === 0) {
        issues.push({ path: dimensionPath, message: "dimension fields must be non-empty" });
      }
    }
    for (const [index, dynamics] of (semantics.dynamics ?? []).entries()) {
      if (dynamics.operation.trim().length === 0 || dynamics.input.trim().length === 0 || dynamics.output.trim().length === 0 || dynamics.evidence.trim().length === 0) {
        issues.push({
          path: `${basePath}.dynamics[${index}]`,
          message: "dynamics fields must be non-empty"
        });
      }
      if (profile.status !== "operational" && dynamics.effectGrade !== "effect.l0.measure") {
        issues.push({
          path: `${basePath}.dynamics[${index}].effectGrade`,
          message: "write or external effects require an operational profile"
        });
      }
    }
  }
  return issues;
}
function projectCouplingSemantics(structure, profile) {
  const issues = validateCouplingSemanticsProfile(profile);
  const applies = profile.includedKinds.includes(structure.kind);
  return {
    structure,
    profile: {
      id: profile.id,
      revision: profile.revision,
      status: profile.status,
      boundarySet: boundarySetForProfile(profile)
    },
    semantics: applies ? profile.semantics[structure.kind] ?? null : null,
    issues
  };
}
function isBoundaryCouplingFrame(frame) {
  return frame.form === "boundary";
}
function isCouplingKind(value) {
  return typeof value === "string" && Object.hasOwn(COUPLING_DESCRIPTORS, value);
}
function readCouplingFrame(frames) {
  const raw = frames?.coupling;
  if (!raw || typeof raw !== "object") return void 0;
  const candidate = raw;
  if (!isCouplingKind(candidate.kind)) return void 0;
  if (candidate.form === "operator" && candidate.kind === "couple") {
    if (candidate.surface !== "<>" || !isValidArity(candidate.arity)) return void 0;
    return candidate;
  }
  if (candidate.form === "boundary" && candidate.kind !== "couple") {
    const occupancy = candidate.occupancy;
    const payload = candidate.payload;
    if (occupancy !== "empty" && occupancy !== "inhabited") return void 0;
    if (!payloadMatchesOccupancy(occupancy, payload)) return void 0;
    const descriptor = COUPLING_DESCRIPTORS[candidate.kind];
    const expectedSurface = occupancy === "empty" ? descriptor.emptySurface : descriptor.surface;
    if (candidate.surface !== expectedSurface) return void 0;
    if (candidate.actPlacement !== void 0 && !isValidActPlacement(candidate.actPlacement)) {
      return void 0;
    }
    return candidate;
  }
  return void 0;
}

// .spw/_workbench/packages/spw-seed/src/types/state.ts
var DEFAULT_OPTIONS = {
  includeComments: true,
  includeWhitespace: true,
  maxErrors: 10,
  debug: false,
  lexProfile: void 0,
  contextMode: "low"
};

// .spw/_workbench/packages/spw-seed/src/lexer/state.ts
function createLexerState(input) {
  return {
    input,
    offset: 0,
    line: 1,
    column: 1
  };
}
function getPosition(state) {
  return {
    offset: state.offset,
    line: state.line,
    column: state.column
  };
}
function advance(state, count = 1) {
  for (let i = 0; i < count && state.offset < state.input.length; i++) {
    if (state.input[state.offset] === "\n") {
      state.line++;
      state.column = 1;
    } else {
      state.column++;
    }
    state.offset++;
  }
}
function peek(state, offset = 0) {
  return state.input[state.offset + offset] ?? "";
}
function peekString(state, length) {
  return state.input.slice(state.offset, state.offset + length);
}
function isAtEnd(state) {
  return state.offset >= state.input.length;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/whitespace.ts
function* matchWhitespace(state, depth) {
  const start = getPosition(state);
  let value = "";
  while (!isAtEnd(state) && /\s/.test(peek(state))) {
    value += peek(state);
    advance(state);
  }
  if (value.length === 0) return null;
  const token3 = {
    type: "WHITESPACE",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "whitespace",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/comments.ts
function* matchLineComment(state, depth) {
  if (peekString(state, 2) !== "//") return null;
  const start = getPosition(state);
  let value = "//";
  advance(state, 2);
  while (!isAtEnd(state) && peek(state) !== "\n") {
    value += peek(state);
    advance(state);
  }
  const token3 = {
    type: "COMMENT",
    value,
    span: { start, end: getPosition(state) },
    kind: "line"
  };
  yield {
    type: "token",
    rule: "lineComment",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}
function* matchBlockComment(state, depth) {
  if (peekString(state, 2) !== "/*") return null;
  const start = getPosition(state);
  let value = "/*";
  advance(state, 2);
  while (!isAtEnd(state) && peekString(state, 2) !== "*/") {
    value += peek(state);
    advance(state);
  }
  if (peekString(state, 2) === "*/") {
    value += "*/";
    advance(state, 2);
  }
  const token3 = {
    type: "COMMENT",
    value,
    span: { start, end: getPosition(state) },
    kind: "block"
  };
  yield {
    type: "token",
    rule: "blockComment",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/particles.ts
var PARTICLE_AIMS = /* @__PURE__ */ new Set([">", ":", "!"]);
function* matchParticle(state, depth) {
  if (peek(state) !== "#") return null;
  const aim = peek(state, 1);
  if (!PARTICLE_AIMS.has(aim)) return null;
  if (!/[a-zA-Z_]/.test(peek(state, 2) ?? "")) return null;
  const start = getPosition(state);
  let value = `#${aim}`;
  advance(state, 2);
  while (!isAtEnd(state) && /[a-zA-Z0-9_-]/.test(peek(state))) {
    value += peek(state);
    advance(state);
  }
  const token3 = {
    type: "PARTICLE",
    value,
    span: { start, end: getPosition(state) },
    kind: aim
  };
  yield {
    type: "token",
    rule: "particle",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}

// .spw/_workbench/packages/spw-seed/src/lexer/profiles.ts
var DEFAULT_OPERATOR_MAP = {
  "!": "!",
  "^": "^",
  "~": "~",
  "?": "?",
  "*": "*",
  "=": "=",
  "@": "@",
  "#": "#",
  ".": ".",
  "&": "&",
  "$": "$",
  "%": "%",
  "<>": "<>"
};
var DEFAULT_CONNECTOR_MAP = {
  "..": "..",
  "->": "->",
  "|": "|",
  "/": "/"
};
var DEFAULT_LEX_PROFILE = {
  id: "default",
  name: "Default",
  operators: DEFAULT_OPERATOR_MAP,
  connectors: DEFAULT_CONNECTOR_MAP,
  // Prompt-pack boonhonk formulas use infix `+` between measures.
  // Treat it as a connector so canonical prompt files stop producing
  // false lexer diagnostics while keeping the change surface narrow.
  extraConnectors: ["+"],
  stringQuotes: ['"', "'"]
};
var PROSE_LEX_PROFILE = {
  id: "prose",
  name: "Prose",
  operators: DEFAULT_OPERATOR_MAP,
  connectors: DEFAULT_CONNECTOR_MAP,
  unknownAsText: true,
  stringQuotes: ['"']
};
var registry = /* @__PURE__ */ new Map([
  [DEFAULT_LEX_PROFILE.id, DEFAULT_LEX_PROFILE],
  [PROSE_LEX_PROFILE.id, PROSE_LEX_PROFILE]
]);
function registerLexProfile(profile) {
  registry.set(profile.id, profile);
}
function getLexProfile(id) {
  return registry.get(id);
}
function listLexProfiles() {
  return Array.from(registry.values());
}
function resolveLexProfile(profile) {
  if (!profile) return DEFAULT_LEX_PROFILE;
  if (typeof profile === "string") {
    return registry.get(profile) ?? DEFAULT_LEX_PROFILE;
  }
  return profile;
}
function buildOperatorMap(profile) {
  const resolved = resolveLexProfile(profile);
  const map2 = { ...DEFAULT_OPERATOR_MAP, ...resolved.operators ?? {} };
  for (const extra of resolved.extraOperators ?? []) {
    map2[extra] = extra;
  }
  for (const disabled of resolved.disabledOperators ?? []) {
    delete map2[disabled];
  }
  return map2;
}
function buildConnectorMap(profile) {
  const resolved = resolveLexProfile(profile);
  const map2 = { ...DEFAULT_CONNECTOR_MAP, ...resolved.connectors ?? {} };
  for (const extra of resolved.extraConnectors ?? []) {
    map2[extra] = extra;
  }
  for (const disabled of resolved.disabledConnectors ?? []) {
    delete map2[disabled];
  }
  return map2;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/operators.ts
function createOperatorMatcher(operatorMap = DEFAULT_OPERATOR_MAP) {
  const tokens = Object.keys(operatorMap).sort((a, b) => b.length - a.length);
  return function* matchOperator2(state, depth) {
    const start = getPosition(state);
    const char = peek(state);
    if (char === "~" && peek(state, 1) === "#") {
      return null;
    }
    if (char === "." && peek(state, 1) === ".") {
      return null;
    }
    if (char === "." && peek(state, 1) === "{") {
      advance(state);
      const token3 = {
        type: "OPERATOR",
        value: ".",
        span: { start, end: getPosition(state) },
        kind: operatorMap["."]
      };
      yield {
        type: "token",
        rule: "operator",
        position: start,
        data: { token: token3 },
        timestamp: performance.now(),
        depth
      };
      return token3;
    }
    for (const tokenValue of tokens) {
      if (tokenValue.length === 1) {
        if (char !== tokenValue) continue;
      } else if (peekString(state, tokenValue.length) !== tokenValue) {
        continue;
      }
      if (tokenValue === "=" && peek(state, 1) === "=") return null;
      if (tokenValue === "!" && peek(state, 1) === "=") return null;
      advance(state, tokenValue.length);
      const token3 = {
        type: "OPERATOR",
        value: tokenValue,
        span: { start, end: getPosition(state) },
        kind: operatorMap[tokenValue]
      };
      yield {
        type: "token",
        rule: "operator",
        position: start,
        data: { token: token3 },
        timestamp: performance.now(),
        depth
      };
      return token3;
    }
    return null;
  };
}
var defaultMatcher = createOperatorMatcher();

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/connectors.ts
function createConnectorMatcher(connectorMap = DEFAULT_CONNECTOR_MAP) {
  const tokens = Object.keys(connectorMap).sort((a, b) => b.length - a.length);
  return function* matchConnector2(state, depth) {
    const start = getPosition(state);
    for (const tokenValue of tokens) {
      if (tokenValue.length === 1) {
        if (peek(state) !== tokenValue) continue;
      } else if (peekString(state, tokenValue.length) !== tokenValue) {
        continue;
      }
      advance(state, tokenValue.length);
      const token3 = {
        type: "CONNECTOR",
        value: tokenValue,
        span: { start, end: getPosition(state) },
        kind: connectorMap[tokenValue]
      };
      yield {
        type: "token",
        rule: "connector",
        position: start,
        data: { token: token3 },
        timestamp: performance.now(),
        depth
      };
      return token3;
    }
    return null;
  };
}
var defaultMatcher2 = createConnectorMatcher();

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/containers.ts
function* matchContainer(state, depth) {
  const start = getPosition(state);
  const two = peekString(state, 2);
  const char = peek(state);
  if (two === "<<") {
    advance(state, 2);
    const token3 = {
      type: "STREAM_OPEN",
      value: "<<",
      span: { start, end: getPosition(state) },
      kind: "<<"
    };
    yield {
      type: "token",
      rule: "streamOpen",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  if (two === ">>") {
    advance(state, 2);
    const token3 = {
      type: "STREAM_CLOSE",
      value: ">>",
      span: { start, end: getPosition(state) },
      kind: ">>"
    };
    yield {
      type: "token",
      rule: "streamClose",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  if (two === "((") {
    advance(state, 2);
    const token3 = {
      type: "NRANGE_OPEN",
      value: "((",
      span: { start, end: getPosition(state) },
      kind: "(("
    };
    yield {
      type: "token",
      rule: "nrangeOpen",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  if (two === "))") {
    advance(state, 2);
    const token3 = {
      type: "NRANGE_CLOSE",
      value: "))",
      span: { start, end: getPosition(state) },
      kind: "))"
    };
    yield {
      type: "token",
      rule: "nrangeClose",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  if (char === "<") {
    advance(state);
    const token3 = {
      type: "CAPSULE_OPEN",
      value: "<",
      span: { start, end: getPosition(state) },
      kind: "<"
    };
    yield {
      type: "token",
      rule: "capsuleOpen",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  if (char === ">") {
    advance(state);
    const token3 = {
      type: "CAPSULE_CLOSE",
      value: ">",
      span: { start, end: getPosition(state) },
      kind: ">"
    };
    yield {
      type: "token",
      rule: "capsuleClose",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  const openContainers = { "(": "(", "[": "[", "{": "{" };
  const closeContainers = { ")": ")", "]": "]", "}": "}" };
  if (char in openContainers) {
    advance(state);
    const token3 = {
      type: "CONTAINER_OPEN",
      value: char,
      span: { start, end: getPosition(state) },
      kind: openContainers[char]
    };
    yield {
      type: "token",
      rule: "container",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  if (char in closeContainers) {
    advance(state);
    const token3 = {
      type: "CONTAINER_CLOSE",
      value: char,
      span: { start, end: getPosition(state) },
      kind: closeContainers[char]
    };
    yield {
      type: "token",
      rule: "container",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  return null;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/modifiers.ts
function* matchModifier(state, depth) {
  const modifiers = ["bone", "boon", "bane", "bonk", "honk"];
  const start = getPosition(state);
  for (const mod of modifiers) {
    if (peekString(state, mod.length) === mod) {
      const nextChar = peek(state, mod.length);
      if (nextChar && /[a-zA-Z0-9_]/.test(nextChar)) continue;
      advance(state, mod.length);
      const token3 = {
        type: "MODIFIER",
        value: mod,
        span: { start, end: getPosition(state) },
        kind: mod
      };
      yield {
        type: "token",
        rule: "modifier",
        position: start,
        data: { token: token3 },
        timestamp: performance.now(),
        depth
      };
      return token3;
    }
  }
  return null;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/literals.ts
function createStringMatcher(allowedQuotes = ['"', "'"]) {
  const allowed = new Set(allowedQuotes);
  return function* matchString2(state, depth) {
    const quote = peek(state);
    if (!allowed.has(quote)) return null;
    const start = getPosition(state);
    let value = quote;
    advance(state);
    while (!isAtEnd(state)) {
      const char = peek(state);
      if (char === "\\" && !isAtEnd(state)) {
        value += char;
        advance(state);
        if (!isAtEnd(state)) {
          value += peek(state);
          advance(state);
        }
        continue;
      }
      if (char === quote) {
        value += char;
        advance(state);
        break;
      }
      if (char === "\n") {
        yield {
          type: "error",
          rule: "string",
          position: start,
          data: {
            message: "Unterminated string literal",
            expected: [quote],
            found: "newline",
            recoverable: true
          },
          timestamp: performance.now(),
          depth
        };
        break;
      }
      value += char;
      advance(state);
    }
    const token3 = {
      type: "STRING",
      value,
      span: { start, end: getPosition(state) },
      kind: quote
    };
    yield {
      type: "token",
      rule: "string",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  };
}
var matchString = createStringMatcher();
function* matchNumber(state, depth) {
  const start = getPosition(state);
  let value = "";
  if (!/[0-9]/.test(peek(state))) return null;
  while (!isAtEnd(state) && /[0-9]/.test(peek(state))) {
    value += peek(state);
    advance(state);
  }
  if (peek(state) === "." && /[0-9]/.test(peek(state, 1))) {
    value += peek(state);
    advance(state);
    while (!isAtEnd(state) && /[0-9]/.test(peek(state))) {
      value += peek(state);
      advance(state);
    }
  }
  const token3 = {
    type: "NUMBER",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "number",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}
function* matchBoolean(state, depth) {
  const start = getPosition(state);
  for (const bool of ["true", "false"]) {
    if (peekString(state, bool.length) === bool) {
      const nextChar = peek(state, bool.length);
      if (nextChar && /[a-zA-Z0-9_]/.test(nextChar)) continue;
      advance(state, bool.length);
      const token3 = {
        type: "BOOLEAN",
        value: bool,
        span: { start, end: getPosition(state) }
      };
      yield {
        type: "token",
        rule: "boolean",
        position: start,
        data: { token: token3 },
        timestamp: performance.now(),
        depth
      };
      return token3;
    }
  }
  return null;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/identifiers.ts
function* matchIdentifier(state, depth) {
  const start = getPosition(state);
  const firstChar = peek(state);
  if (!/[a-zA-Z_]/.test(firstChar)) return null;
  if (firstChar === "_" && !/[a-zA-Z0-9_]/.test(peek(state, 1) ?? "")) {
    advance(state);
    const token4 = {
      type: "HOLE",
      value: "_",
      span: { start, end: getPosition(state) }
    };
    yield {
      type: "token",
      rule: "hole",
      position: start,
      data: { token: token4 },
      timestamp: performance.now(),
      depth
    };
    return token4;
  }
  let value = firstChar;
  advance(state);
  while (!isAtEnd(state) && /[a-zA-Z0-9_.-]/.test(peek(state))) {
    value += peek(state);
    advance(state);
  }
  const token3 = {
    type: "IDENTIFIER",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "identifier",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}
function* matchAnnotation(state, depth) {
  if (peek(state) !== "~" || peek(state, 1) !== "#") return null;
  const start = getPosition(state);
  let value = "~#";
  advance(state, 2);
  if (!/[a-zA-Z_]/.test(peek(state))) {
    yield {
      type: "error",
      rule: "annotation",
      position: start,
      data: {
        message: "Expected identifier after ~#",
        expected: ["identifier"],
        found: peek(state) || "EOF",
        recoverable: true
      },
      timestamp: performance.now(),
      depth
    };
    return null;
  }
  while (!isAtEnd(state) && /[a-zA-Z0-9_-]/.test(peek(state))) {
    value += peek(state);
    advance(state);
  }
  const token3 = {
    type: "ANNOTATION",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "annotation",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/phrases.ts
function* matchPhrase(state, depth) {
  if (peek(state) !== "`") return null;
  const start = getPosition(state);
  advance(state);
  let value = "`";
  while (!isAtEnd(state)) {
    const ch = peek(state);
    if (ch === "\\" && peek(state, 1) === "`") {
      value += "\\`";
      advance(state, 2);
      continue;
    }
    if (ch === "`") {
      value += "`";
      advance(state);
      break;
    }
    value += ch;
    advance(state);
  }
  const token3 = {
    type: "PHRASE",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "phrase",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/patterns.ts
function* matchSpread(state, depth) {
  if (peek(state) === "." && peek(state, 1) === "." && peek(state, 2) === ".") {
    if (peek(state, 3) !== ".") {
      const start = getPosition(state);
      advance(state, 3);
      const token3 = {
        type: "SPREAD",
        value: "...",
        span: { start, end: getPosition(state) }
      };
      yield {
        type: "token",
        rule: "spread",
        position: start,
        data: { token: token3 },
        timestamp: performance.now(),
        depth
      };
      return token3;
    }
  }
  return null;
}
function* matchArrow(state, depth) {
  if (peek(state) === "=" && peek(state, 1) === ">") {
    const start = getPosition(state);
    advance(state, 2);
    const token3 = {
      type: "ARROW",
      value: "=>",
      span: { start, end: getPosition(state) }
    };
    yield {
      type: "token",
      rule: "arrow",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  return null;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/punctuation.ts
function* matchDot(_state, _depth) {
  return null;
}
function* matchColon(state, depth) {
  if (peek(state) !== ":") return null;
  if (peek(state, 1) === ":") return null;
  const start = getPosition(state);
  advance(state);
  const token3 = {
    type: "COLON",
    value: ":",
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "colon",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}
function* matchComma(state, depth) {
  if (peek(state) !== ",") return null;
  const start = getPosition(state);
  advance(state);
  const token3 = {
    type: "COMMA",
    value: ",",
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "comma",
    position: start,
    data: { token: token3 },
    timestamp: performance.now(),
    depth
  };
  return token3;
}
function* matchComparison(state, depth) {
  const start = getPosition(state);
  const twoChar = peekString(state, 2);
  const twoCharOps = ["==", "!=", "<=", ">="];
  if (twoCharOps.includes(twoChar)) {
    advance(state, 2);
    const token3 = {
      type: "COMPARISON",
      value: twoChar,
      span: { start, end: getPosition(state) },
      kind: twoChar
    };
    yield {
      type: "token",
      rule: "comparison",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  return null;
}

// .spw/_workbench/packages/spw-seed/src/lexer/tokenize.ts
function* tokenize(input, depth = 0, options = {}) {
  const state = createLexerState(input);
  const tokens = [];
  const lexProfile = resolveLexProfile(options.profile);
  const operatorMatcher = createOperatorMatcher(buildOperatorMap(lexProfile));
  const connectorMatcher = createConnectorMatcher(buildConnectorMap(lexProfile));
  const stringMatcher = createStringMatcher(lexProfile.stringQuotes);
  const matchers = [
    matchWhitespace,
    matchLineComment,
    matchBlockComment,
    matchSpread,
    connectorMatcher,
    matchComparison,
    matchArrow,
    matchParticle,
    operatorMatcher,
    matchContainer,
    matchModifier,
    matchBoolean,
    matchAnnotation,
    stringMatcher,
    matchNumber,
    matchPhrase,
    matchIdentifier,
    matchDot,
    matchColon,
    matchComma
  ];
  yield {
    type: "enter",
    rule: "tokenize",
    position: getPosition(state),
    data: { input: input.slice(0, 50) + (input.length > 50 ? "..." : "") },
    timestamp: performance.now(),
    depth
  };
  while (!isAtEnd(state)) {
    let matched = false;
    for (const matcher of matchers) {
      const gen = matcher(state, depth + 1);
      let result = gen.next();
      while (!result.done) {
        yield result.value;
        result = gen.next();
      }
      if (result.value !== null) {
        tokens.push(result.value);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const pos = getPosition(state);
      const char = state.input[state.offset];
      if (lexProfile.unknownAsText) {
        advance(state);
        const token3 = {
          type: "TEXT",
          value: char,
          span: { start: pos, end: getPosition(state) }
        };
        tokens.push(token3);
        yield {
          type: "token",
          rule: "text",
          position: pos,
          data: { token: token3 },
          timestamp: performance.now(),
          depth
        };
      } else {
        yield {
          type: "error",
          rule: "tokenize",
          position: pos,
          data: {
            message: `Unexpected character: ${char}`,
            found: char,
            recoverable: true
          },
          timestamp: performance.now(),
          depth
        };
        advance(state);
      }
    }
  }
  const eofToken = {
    type: "EOF",
    value: "",
    span: { start: getPosition(state), end: getPosition(state) }
  };
  tokens.push(eofToken);
  yield {
    type: "token",
    rule: "eof",
    position: getPosition(state),
    data: { token: eofToken },
    timestamp: performance.now(),
    depth
  };
  yield {
    type: "exit",
    rule: "tokenize",
    position: getPosition(state),
    data: { success: true, consumed: state.offset, result: tokens },
    timestamp: performance.now(),
    depth
  };
  return tokens;
}

// .spw/_workbench/packages/spw-seed/src/lexer/lex.ts
function lex(input, options = {}) {
  const gen = tokenize(input, 0, options);
  const events = [];
  let result = gen.next();
  while (!result.done) {
    events.push(result.value);
    result = gen.next();
  }
  return { tokens: result.value, events };
}

// .spw/_workbench/packages/spw-seed/src/combinators/stream.ts
function createTokenStream(tokens, contextMode = "low") {
  return {
    tokens,
    position: 0,
    marks: [],
    contextMode
  };
}
function current(stream) {
  return stream.tokens[stream.position] ?? stream.tokens[stream.tokens.length - 1];
}
function peek2(stream, offset = 0) {
  return stream.tokens[stream.position + offset];
}
function advance2(stream) {
  const token3 = current(stream);
  if (stream.position < stream.tokens.length - 1) {
    stream.position++;
  }
  return token3;
}
function isAtEnd2(stream) {
  return current(stream).type === "EOF";
}
function mark(stream) {
  stream.marks.push(stream.position);
}
function unmark(stream) {
  stream.marks.pop();
}
function reset(stream) {
  const pos = stream.marks.pop();
  if (pos !== void 0) {
    stream.position = pos;
  }
}
function getPosition2(stream) {
  return current(stream).span.start;
}

// .spw/_workbench/packages/spw-seed/src/combinators/primitives.ts
function token(expectedType, expectedKind) {
  return function* tokenParser(stream, depth) {
    const pos = getPosition2(stream);
    const tok = current(stream);
    yield {
      type: "enter",
      rule: `token(${expectedType}${expectedKind ? ":" + expectedKind : ""})`,
      position: pos,
      data: { input: tok.value },
      timestamp: performance.now(),
      depth
    };
    if (tok.type === expectedType && (!expectedKind || tok.kind === expectedKind)) {
      advance2(stream);
      yield {
        type: "match",
        rule: `token(${expectedType})`,
        position: pos,
        data: { matched: tok.value, expected: expectedType },
        timestamp: performance.now(),
        depth
      };
      yield {
        type: "exit",
        rule: `token(${expectedType})`,
        position: getPosition2(stream),
        data: { success: true, consumed: 1, result: tok },
        timestamp: performance.now(),
        depth
      };
      return { success: true, value: tok, consumed: 1 };
    }
    yield {
      type: "exit",
      rule: `token(${expectedType})`,
      position: pos,
      data: {
        success: false,
        consumed: 0,
        result: void 0
      },
      timestamp: performance.now(),
      depth
    };
    return {
      success: false,
      consumed: 0,
      error: {
        message: `Expected ${expectedType}${expectedKind ? ":" + expectedKind : ""}, found ${tok.type}:${tok.value}`,
        expected: expectedKind ? [`${expectedType}:${expectedKind}`] : [expectedType],
        found: tok.value,
        recoverable: true
      }
    };
  };
}
function literal(value) {
  return function* literalParser(stream, depth) {
    const pos = getPosition2(stream);
    const tok = current(stream);
    yield {
      type: "enter",
      rule: `literal("${value}")`,
      position: pos,
      data: { input: tok.value },
      timestamp: performance.now(),
      depth
    };
    if (tok.value === value) {
      advance2(stream);
      yield {
        type: "match",
        rule: `literal`,
        position: pos,
        data: { matched: value },
        timestamp: performance.now(),
        depth
      };
      yield {
        type: "exit",
        rule: `literal`,
        position: getPosition2(stream),
        data: { success: true, consumed: 1, result: tok },
        timestamp: performance.now(),
        depth
      };
      return { success: true, value: tok, consumed: 1 };
    }
    yield {
      type: "exit",
      rule: `literal`,
      position: pos,
      data: { success: false, consumed: 0 },
      timestamp: performance.now(),
      depth
    };
    return {
      success: false,
      consumed: 0,
      error: {
        message: `Expected "${value}", found "${tok.value}"`,
        expected: [value],
        found: tok.value,
        recoverable: true
      }
    };
  };
}

// .spw/_workbench/packages/spw-seed/src/combinators/composition.ts
function sequence(...parsers) {
  return function* sequenceParser2(stream, depth) {
    const pos = getPosition2(stream);
    const results = [];
    let totalConsumed = 0;
    yield {
      type: "enter",
      rule: "sequence",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    mark(stream);
    for (let i = 0; i < parsers.length; i++) {
      const parser = parsers[i];
      const gen = parser(stream, depth + 1);
      let step = gen.next();
      while (!step.done) {
        yield step.value;
        step = gen.next();
      }
      const result = step.value;
      if (!result.success) {
        reset(stream);
        yield {
          type: "backtrack",
          rule: "sequence",
          position: pos,
          data: {
            reason: `Parser ${i} failed`,
            alternatives: [],
            tried: i
          },
          timestamp: performance.now(),
          depth
        };
        yield {
          type: "exit",
          rule: "sequence",
          position: pos,
          data: { success: false, consumed: 0 },
          timestamp: performance.now(),
          depth
        };
        return { success: false, consumed: 0, error: result.error };
      }
      results.push(result.value);
      totalConsumed += result.consumed;
    }
    unmark(stream);
    yield {
      type: "exit",
      rule: "sequence",
      position: getPosition2(stream),
      data: { success: true, consumed: totalConsumed, result: results },
      timestamp: performance.now(),
      depth
    };
    return { success: true, value: results, consumed: totalConsumed };
  };
}
function choice(...parsers) {
  return function* choiceParser(stream, depth) {
    const pos = getPosition2(stream);
    const errors = [];
    yield {
      type: "enter",
      rule: "choice",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    for (let i = 0; i < parsers.length; i++) {
      mark(stream);
      const parser = parsers[i];
      const gen = parser(stream, depth + 1);
      let step = gen.next();
      while (!step.done) {
        yield step.value;
        step = gen.next();
      }
      const result = step.value;
      if (result.success) {
        unmark(stream);
        yield {
          type: "exit",
          rule: "choice",
          position: getPosition2(stream),
          data: { success: true, consumed: result.consumed, result: result.value },
          timestamp: performance.now(),
          depth
        };
        return result;
      }
      reset(stream);
      if (result.error) {
        errors.push(result.error);
      }
      yield {
        type: "backtrack",
        rule: "choice",
        position: pos,
        data: {
          reason: `Alternative ${i} failed`,
          alternatives: parsers.map((_, j) => `alt${j}`),
          tried: i + 1
        },
        timestamp: performance.now(),
        depth
      };
    }
    yield {
      type: "exit",
      rule: "choice",
      position: pos,
      data: { success: false, consumed: 0 },
      timestamp: performance.now(),
      depth
    };
    return {
      success: false,
      consumed: 0,
      error: {
        message: `No alternative matched`,
        expected: errors.flatMap((e) => e.expected ?? []),
        found: current(stream).value,
        recoverable: true
      }
    };
  };
}
function many(parser) {
  return function* manyParser(stream, depth) {
    const pos = getPosition2(stream);
    const results = [];
    let totalConsumed = 0;
    yield {
      type: "enter",
      rule: "many",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    while (!isAtEnd2(stream)) {
      mark(stream);
      const gen = parser(stream, depth + 1);
      let step = gen.next();
      while (!step.done) {
        yield step.value;
        step = gen.next();
      }
      const result = step.value;
      if (!result.success || result.consumed === 0) {
        reset(stream);
        break;
      }
      unmark(stream);
      results.push(result.value);
      totalConsumed += result.consumed;
    }
    yield {
      type: "exit",
      rule: "many",
      position: getPosition2(stream),
      data: { success: true, consumed: totalConsumed, result: results },
      timestamp: performance.now(),
      depth
    };
    return { success: true, value: results, consumed: totalConsumed };
  };
}
function many1(parser) {
  return function* many1Parser(stream, depth) {
    const pos = getPosition2(stream);
    yield {
      type: "enter",
      rule: "many1",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    const firstGen = parser(stream, depth + 1);
    let firstStep = firstGen.next();
    while (!firstStep.done) {
      yield firstStep.value;
      firstStep = firstGen.next();
    }
    const firstResult = firstStep.value;
    if (!firstResult.success) {
      yield {
        type: "exit",
        rule: "many1",
        position: pos,
        data: { success: false, consumed: 0 },
        timestamp: performance.now(),
        depth
      };
      return { success: false, consumed: 0, error: firstResult.error };
    }
    const results = [firstResult.value];
    let totalConsumed = firstResult.consumed;
    const restGen = many(parser)(stream, depth + 1);
    let restStep = restGen.next();
    while (!restStep.done) {
      yield restStep.value;
      restStep = restGen.next();
    }
    const restResult = restStep.value;
    if (restResult.success && restResult.value) {
      results.push(...restResult.value);
      totalConsumed += restResult.consumed;
    }
    yield {
      type: "exit",
      rule: "many1",
      position: getPosition2(stream),
      data: { success: true, consumed: totalConsumed, result: results },
      timestamp: performance.now(),
      depth
    };
    return { success: true, value: results, consumed: totalConsumed };
  };
}
function optional(parser) {
  return function* optionalParser(stream, depth) {
    const pos = getPosition2(stream);
    yield {
      type: "enter",
      rule: "optional",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    mark(stream);
    const gen = parser(stream, depth + 1);
    let step = gen.next();
    while (!step.done) {
      yield step.value;
      step = gen.next();
    }
    if (step.value.success) {
      unmark(stream);
      yield {
        type: "exit",
        rule: "optional",
        position: getPosition2(stream),
        data: { success: true, consumed: step.value.consumed, result: step.value.value },
        timestamp: performance.now(),
        depth
      };
      return step.value;
    }
    reset(stream);
    yield {
      type: "exit",
      rule: "optional",
      position: pos,
      data: { success: true, consumed: 0, result: void 0 },
      timestamp: performance.now(),
      depth
    };
    return { success: true, value: void 0, consumed: 0 };
  };
}

// .spw/_workbench/packages/spw-seed/src/combinators/transform.ts
function map(parser, fn) {
  return function* mapParser(stream, depth) {
    const startPos = getPosition2(stream);
    const gen = parser(stream, depth);
    let step = gen.next();
    while (!step.done) {
      yield step.value;
      step = gen.next();
    }
    if (step.value.success) {
      const endPos = getPosition2(stream);
      const span = { start: startPos, end: endPos };
      const mapped = fn(step.value.value, span);
      return { success: true, value: mapped, consumed: step.value.consumed };
    }
    return { success: false, consumed: 0, error: step.value.error };
  };
}
function sepBy(item, separator) {
  return function* sepByParser(stream, depth) {
    const pos = getPosition2(stream);
    yield {
      type: "enter",
      rule: "sepBy",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    mark(stream);
    const firstGen = item(stream, depth + 1);
    let firstStep = firstGen.next();
    while (!firstStep.done) {
      yield firstStep.value;
      firstStep = firstGen.next();
    }
    if (!firstStep.value.success) {
      reset(stream);
      yield {
        type: "exit",
        rule: "sepBy",
        position: pos,
        data: { success: true, consumed: 0, result: [] },
        timestamp: performance.now(),
        depth
      };
      return { success: true, value: [], consumed: 0 };
    }
    unmark(stream);
    const results = [firstStep.value.value];
    let totalConsumed = firstStep.value.consumed;
    while (!isAtEnd2(stream)) {
      mark(stream);
      const sepGen = separator(stream, depth + 1);
      let sepStep = sepGen.next();
      while (!sepStep.done) {
        yield sepStep.value;
        sepStep = sepGen.next();
      }
      if (!sepStep.value.success) {
        reset(stream);
        break;
      }
      totalConsumed += sepStep.value.consumed;
      const itemGen = item(stream, depth + 1);
      let itemStep = itemGen.next();
      while (!itemStep.done) {
        yield itemStep.value;
        itemStep = itemGen.next();
      }
      if (!itemStep.value.success) {
        reset(stream);
        break;
      }
      unmark(stream);
      results.push(itemStep.value.value);
      totalConsumed += itemStep.value.consumed;
    }
    yield {
      type: "exit",
      rule: "sepBy",
      position: getPosition2(stream),
      data: { success: true, consumed: totalConsumed, result: results },
      timestamp: performance.now(),
      depth
    };
    return { success: true, value: results, consumed: totalConsumed };
  };
}
function between(open, close, content) {
  return function* betweenParser(stream, depth) {
    const pos = getPosition2(stream);
    yield {
      type: "enter",
      rule: "between",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    const seqParser = sequence(open, content, close);
    const gen = seqParser(stream, depth + 1);
    let step = gen.next();
    while (!step.done) {
      yield step.value;
      step = gen.next();
    }
    if (step.value.success) {
      const [, contentResult] = step.value.value;
      yield {
        type: "exit",
        rule: "between",
        position: getPosition2(stream),
        data: { success: true, consumed: step.value.consumed, result: contentResult },
        timestamp: performance.now(),
        depth
      };
      return { success: true, value: contentResult, consumed: step.value.consumed };
    }
    yield {
      type: "exit",
      rule: "between",
      position: pos,
      data: { success: false, consumed: 0 },
      timestamp: performance.now(),
      depth
    };
    return step.value;
  };
}

// .spw/_workbench/packages/spw-seed/src/combinators/utilities.ts
function lazy(fn) {
  return function* lazyParser(stream, depth) {
    const parser = fn();
    const gen = parser(stream, depth);
    let step = gen.next();
    while (!step.done) {
      yield step.value;
      step = gen.next();
    }
    return step.value;
  };
}
function named(name, parser) {
  return function* namedParser(stream, depth) {
    const pos = getPosition2(stream);
    yield {
      type: "enter",
      rule: name,
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    const gen = parser(stream, depth + 1);
    let step = gen.next();
    while (!step.done) {
      yield step.value;
      step = gen.next();
    }
    yield {
      type: "exit",
      rule: name,
      position: getPosition2(stream),
      data: {
        success: step.value.success,
        consumed: step.value.consumed,
        result: step.value.value
      },
      timestamp: performance.now(),
      depth
    };
    return step.value;
  };
}
function skipWhitespace(stream) {
  let skipped = 0;
  while (current(stream).type === "WHITESPACE" || current(stream).type === "COMMENT") {
    advance2(stream);
    skipped++;
  }
  return skipped;
}
function lexeme(parser) {
  return function* lexemeParser(stream, depth) {
    skipWhitespace(stream);
    const gen = parser(stream, depth);
    let step = gen.next();
    while (!step.done) {
      yield step.value;
      step = gen.next();
    }
    return step.value;
  };
}

// .spw/_workbench/packages/spw-seed/src/grammar/tokens.ts
var operator = lexeme(token("OPERATOR"));
var modifier = lexeme(token("MODIFIER"));
var connector = lexeme(token("CONNECTOR"));
var spread = lexeme(token("SPREAD"));
var arrow = lexeme(token("ARROW"));
var identifier = lexeme(token("IDENTIFIER"));
var stringLit = lexeme(token("STRING"));
var numberLit = lexeme(token("NUMBER"));
var booleanLit = lexeme(token("BOOLEAN"));
var annotation = lexeme(token("ANNOTATION"));
var particle = lexeme(token("PARTICLE"));
var colon = lexeme(token("COLON"));
var comma = lexeme(token("COMMA"));
var streamOpen = lexeme(token("STREAM_OPEN"));
var streamClose = lexeme(token("STREAM_CLOSE"));
var nrangeOpen = lexeme(token("NRANGE_OPEN"));
var nrangeClose = lexeme(token("NRANGE_CLOSE"));
var capsuleOpen = lexeme(token("CAPSULE_OPEN"));
var capsuleClose = lexeme(token("CAPSULE_CLOSE"));
var openParen = lexeme(token("CONTAINER_OPEN", "("));
var closeParen = lexeme(token("CONTAINER_CLOSE", ")"));
var openBracket = lexeme(token("CONTAINER_OPEN", "["));
var closeBracket = lexeme(token("CONTAINER_CLOSE", "]"));
var openBrace = lexeme(token("CONTAINER_OPEN", "{"));
var closeBrace = lexeme(token("CONTAINER_CLOSE", "}"));

// .spw/_workbench/packages/spw-seed/src/grammar/literals.ts
var literalNode = named(
  "literal",
  map(
    choice(
      stringLit,
      numberLit,
      booleanLit
    ),
    (tok, span) => ({
      type: "Literal",
      span,
      token: tok
    })
  )
);
var identifierNode = named(
  "identifier",
  map(
    identifier,
    (tok, span) => ({
      type: "Identifier",
      span,
      token: tok
    })
  )
);

// .spw/_workbench/packages/spw-seed/src/grammar/references.ts
function isReferencePathToken(token3) {
  if (token3.type === "IDENTIFIER" || token3.type === "TEXT" || token3.type === "NUMBER" || token3.type === "DOT") {
    return true;
  }
  if (token3.type === "CONNECTOR" && (token3.value === "/" || token3.value === "..")) {
    return true;
  }
  if (token3.type === "OPERATOR" && token3.value === ".") {
    return true;
  }
  return false;
}
function buildReferencePath(tokens) {
  if (tokens.length === 0) return null;
  const raw = tokens.map((t) => t.value).join("");
  if (!raw) return null;
  const hasSlash = raw.includes("/");
  const parts = hasSlash ? raw.split("/").filter(Boolean) : raw.split(".").filter(Boolean);
  const span = { start: tokens[0].span.start, end: tokens[tokens.length - 1].span.end };
  return { raw, parts, span };
}
function isBarePathStartToken(token3) {
  if (token3.type === "OPERATOR" && token3.value === ".") return true;
  if (token3.type === "CONNECTOR" && (token3.value === ".." || token3.value === "/")) return true;
  return false;
}
function isBarePathToken(token3) {
  if (token3.type === "IDENTIFIER" || token3.type === "NUMBER") return true;
  if (token3.type === "CONNECTOR" && (token3.value === "/" || token3.value === "..")) return true;
  if (token3.type === "OPERATOR" && (token3.value === "." || token3.value === "*")) return true;
  return false;
}
function isContiguous(left, right) {
  return left.span.end.offset === right.span.start.offset;
}
function peekBarePathTokens(stream) {
  const first = stream.tokens[stream.position];
  if (!first || !isBarePathStartToken(first)) return [];
  const tokens = [];
  let cursor = stream.position;
  let previous;
  while (cursor < stream.tokens.length) {
    const token3 = stream.tokens[cursor];
    if (!token3 || !isBarePathToken(token3)) break;
    if (previous && !isContiguous(previous, token3)) break;
    tokens.push(token3);
    previous = token3;
    cursor += 1;
  }
  if (tokens.length === 0) return [];
  const raw = tokens.map((token3) => token3.value).join("");
  if (!(raw.startsWith("./") || raw.startsWith("../") || raw.startsWith("/"))) {
    return [];
  }
  return tokens;
}
function consumeTokenCount(stream, count) {
  for (let i = 0; i < count; i += 1) {
    advance2(stream);
  }
}
function quotePath(path) {
  return `"${path.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function stringTokenFromBarePath(tokens) {
  const raw = tokens.map((token3) => token3.value).join("");
  return {
    type: "STRING",
    value: quotePath(raw),
    span: {
      start: tokens[0].span.start,
      end: tokens[tokens.length - 1].span.end
    },
    kind: '"'
  };
}
function emitPathSugarWarning(stream, depth, message) {
  return {
    type: "warning",
    rule: "pathRef.sugar",
    position: getPosition2(stream),
    data: {
      message,
      expected: ["string"],
      found: current(stream).type,
      recoverable: true
    },
    timestamp: performance.now(),
    depth
  };
}
var referenceNode = named(
  "reference",
  function* referenceParser(stream, depth) {
    const startPos = getPosition2(stream);
    const atGen = token("OPERATOR", "@")(stream, depth + 1);
    let atStep = atGen.next();
    while (!atStep.done) {
      yield atStep.value;
      atStep = atGen.next();
    }
    if (!atStep.value.success) {
      return { success: false, consumed: 0, error: atStep.value.error };
    }
    let consumed = atStep.value.consumed;
    skipWhitespace(stream);
    const pathTokens = [];
    let hasSlash = false;
    while (true) {
      const token3 = current(stream);
      if (!isReferencePathToken(token3)) break;
      if (token3.type === "CONNECTOR" && token3.value === "..") {
        const prevWasSlash = pathTokens[pathTokens.length - 1]?.type === "CONNECTOR" && pathTokens[pathTokens.length - 1]?.value === "/";
        const next = peek2(stream, 1);
        const nextIsSlash = next?.type === "CONNECTOR" && next.value === "/";
        if (!hasSlash && !prevWasSlash && !nextIsSlash) break;
      }
      pathTokens.push(token3);
      if (token3.type === "CONNECTOR" && token3.value === "/") {
        hasSlash = true;
      }
      advance2(stream);
      consumed += 1;
    }
    const built = buildReferencePath(pathTokens);
    if (!built) {
      return {
        success: false,
        consumed: 0,
        error: {
          message: "Expected reference path after @",
          expected: ["identifier"],
          found: current(stream).type,
          recoverable: true
        }
      };
    }
    const pathParts = built.parts.map((part) => ({
      type: "IDENTIFIER",
      value: part,
      span: built.span
      // Simplified - ideally track each part
    }));
    const endPos = getPosition2(stream);
    const node = {
      type: "Reference",
      span: { start: startPos, end: endPos },
      path: pathParts,
      raw: built.raw
    };
    return { success: true, value: node, consumed };
  }
);
var pathRefNode = named(
  "pathRef",
  function* pathRefParser(stream, depth) {
    const startPos = getPosition2(stream);
    const tildeGen = token("OPERATOR", "~")(stream, depth + 1);
    let tildeStep = tildeGen.next();
    while (!tildeStep.done) {
      yield tildeStep.value;
      tildeStep = tildeGen.next();
    }
    if (!tildeStep.value.success) {
      return { success: false, consumed: 0, error: tildeStep.value.error };
    }
    let consumed = tildeStep.value.consumed;
    const tildeToken = tildeStep.value.value;
    skipWhitespace(stream);
    let tag;
    if (current(stream).type === "CAPSULE_OPEN") {
      const openGen = capsuleOpen(stream, depth + 1);
      let openStep = openGen.next();
      while (!openStep.done) {
        yield openStep.value;
        openStep = openGen.next();
      }
      if (!openStep.value.success) {
        return { success: false, consumed: 0, error: openStep.value.error };
      }
      consumed += openStep.value.consumed;
      skipWhitespace(stream);
      const tagGen = identifier(stream, depth + 1);
      let tagStep = tagGen.next();
      while (!tagStep.done) {
        yield tagStep.value;
        tagStep = tagGen.next();
      }
      if (!tagStep.value.success) {
        return {
          success: false,
          consumed: 0,
          error: tagStep.value.error ?? {
            message: "Expected tag identifier inside <...>",
            expected: ["identifier"],
            found: current(stream).type,
            recoverable: false
          }
        };
      }
      tag = tagStep.value.value;
      consumed += tagStep.value.consumed;
      skipWhitespace(stream);
      const closeGen = capsuleClose(stream, depth + 1);
      let closeStep = closeGen.next();
      while (!closeStep.done) {
        yield closeStep.value;
        closeStep = closeGen.next();
      }
      if (!closeStep.value.success) {
        return { success: false, consumed: 0, error: closeStep.value.error };
      }
      consumed += closeStep.value.consumed;
    }
    skipWhitespace(stream);
    const strGen = stringLit(stream, depth + 1);
    let strStep = strGen.next();
    while (!strStep.done) {
      yield strStep.value;
      strStep = strGen.next();
    }
    let strTok;
    if (!strStep.value.success) {
      const barePathTokens = peekBarePathTokens(stream);
      if (barePathTokens.length > 0) {
        if (stream.contextMode === "low") {
          return {
            success: false,
            consumed: 0,
            error: {
              message: 'Unquoted local path references are high-context sugar. Use ~"..." or parse with contextMode: "high".',
              expected: ["string"],
              found: current(stream).type,
              recoverable: false
            }
          };
        }
        strTok = stringTokenFromBarePath(barePathTokens);
        consumeTokenCount(stream, barePathTokens.length);
        consumed += barePathTokens.length;
        yield emitPathSugarWarning(
          stream,
          depth,
          "Desugared bare local path to canonical quoted path reference."
        );
      } else {
        return {
          success: false,
          consumed: 0,
          error: strStep.value.error ?? {
            message: "Expected string literal path after ~",
            expected: ["string"],
            found: current(stream).type,
            recoverable: false
          }
        };
      }
    }
    if (!strTok) {
      strTok = strStep.value.value;
      consumed += strStep.value.consumed;
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "PathRef",
      span: { start: startPos, end: endPos },
      operator: tildeToken,
      tag,
      path: {
        type: "Literal",
        span: { start: strTok.span.start, end: strTok.span.end },
        token: strTok
      }
    };
    return { success: true, value: node, consumed };
  }
);
var particleNode = named(
  "particle",
  function* particleParser(stream, depth) {
    const partGen = particle(stream, depth + 1);
    let partStep = partGen.next();
    while (!partStep.done) {
      yield partStep.value;
      partStep = partGen.next();
    }
    if (!partStep.value.success) {
      return { success: false, consumed: 0, error: partStep.value.error };
    }
    const partToken = partStep.value.value;
    const aim = partToken.value.charAt(1);
    const nameToken = {
      type: "IDENTIFIER",
      value: partToken.value.slice(2),
      span: partToken.span
    };
    return {
      success: true,
      consumed: partStep.value.consumed,
      value: {
        type: "Particle",
        token: partToken,
        aim,
        name: nameToken,
        span: partToken.span
      }
    };
  }
);
var annotationNode = named(
  "annotation",
  function* annotationParser(stream, depth) {
    const startPos = getPosition2(stream);
    const annGen = annotation(stream, depth + 1);
    let annStep = annGen.next();
    while (!annStep.done) {
      yield annStep.value;
      annStep = annGen.next();
    }
    if (!annStep.value.success) {
      return { success: false, consumed: 0, error: annStep.value.error };
    }
    let consumed = annStep.value.consumed;
    const annToken = annStep.value.value;
    const nameToken = {
      type: "IDENTIFIER",
      value: annToken.value.startsWith("~#") ? annToken.value.slice(2) : annToken.value.slice(1),
      span: annToken.span
    };
    let valueNode;
    skipWhitespace(stream);
    if (current(stream).type === "COLON") {
      const colonGen = colon(stream, depth + 1);
      let colonStep = colonGen.next();
      while (!colonStep.done) {
        yield colonStep.value;
        colonStep = colonGen.next();
      }
      if (colonStep.value.success) {
        consumed += colonStep.value.consumed;
        const valueGen = choice(pathRefNode, referenceNode, literalNode)(stream, depth + 1);
        let valueStep = valueGen.next();
        while (!valueStep.done) {
          yield valueStep.value;
          valueStep = valueGen.next();
        }
        if (valueStep.value.success) {
          consumed += valueStep.value.consumed;
          valueNode = valueStep.value.value;
        } else {
          const barePathTokens = peekBarePathTokens(stream);
          if (barePathTokens.length > 0) {
            if (stream.contextMode === "low") {
              return {
                success: false,
                consumed: 0,
                error: {
                  message: 'Unquoted annotation path payload is high-context sugar. Use ~#tag "./path" or parse with contextMode: "high".',
                  expected: ["string"],
                  found: current(stream).type,
                  recoverable: false
                }
              };
            }
            const strTok = stringTokenFromBarePath(barePathTokens);
            consumeTokenCount(stream, barePathTokens.length);
            consumed += barePathTokens.length;
            valueNode = {
              type: "Literal",
              span: { start: strTok.span.start, end: strTok.span.end },
              token: strTok
            };
            yield emitPathSugarWarning(
              stream,
              depth,
              "Desugared unquoted annotation path payload to canonical quoted string."
            );
          }
        }
      }
    } else {
      skipWhitespace(stream);
      const valueGen = choice(pathRefNode, referenceNode, literalNode)(stream, depth + 1);
      let valueStep = valueGen.next();
      while (!valueStep.done) {
        yield valueStep.value;
        valueStep = valueGen.next();
      }
      if (valueStep.value.success) {
        consumed += valueStep.value.consumed;
        valueNode = valueStep.value.value;
      } else {
        const barePathTokens = peekBarePathTokens(stream);
        if (barePathTokens.length > 0) {
          if (stream.contextMode === "low") {
            return {
              success: false,
              consumed: 0,
              error: {
                message: 'Unquoted annotation path payload is high-context sugar. Use ~#tag "./path" or parse with contextMode: "high".',
                expected: ["string"],
                found: current(stream).type,
                recoverable: false
              }
            };
          }
          const strTok = stringTokenFromBarePath(barePathTokens);
          consumeTokenCount(stream, barePathTokens.length);
          consumed += barePathTokens.length;
          valueNode = {
            type: "Literal",
            span: { start: strTok.span.start, end: strTok.span.end },
            token: strTok
          };
          yield emitPathSugarWarning(
            stream,
            depth,
            "Desugared unquoted annotation path payload to canonical quoted string."
          );
        }
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Annotation",
      span: { start: startPos, end: endPos },
      name: nameToken,
      value: valueNode
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/modifiers.ts
var modifierChain = named(
  "modifierChain",
  function* modifierChainParser(stream, depth) {
    const startPos = getPosition2(stream);
    const firstGen = modifier(stream, depth + 1);
    let firstStep = firstGen.next();
    while (!firstStep.done) {
      yield firstStep.value;
      firstStep = firstGen.next();
    }
    if (!firstStep.value.success) {
      return { success: false, consumed: 0, error: firstStep.value.error };
    }
    const modifiers = [firstStep.value.value];
    let consumed = firstStep.value.consumed;
    skipWhitespace(stream);
    if (current(stream).value === ".") {
      const savedPos = stream.position;
      const dotGen = literal(".")(stream, depth + 1);
      let dotStep = dotGen.next();
      while (!dotStep.done) {
        yield dotStep.value;
        dotStep = dotGen.next();
      }
      if (dotStep.value.success) {
        consumed += dotStep.value.consumed;
        const secondGen = modifier(stream, depth + 1);
        let secondStep = secondGen.next();
        while (!secondStep.done) {
          yield secondStep.value;
          secondStep = secondGen.next();
        }
        if (secondStep.value.success) {
          modifiers.push(secondStep.value.value);
          consumed += secondStep.value.consumed;
        } else {
          stream.position = savedPos;
        }
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "ModifierChain",
      span: { start: startPos, end: endPos },
      modifiers
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/match.ts
var matchNode = named(
  "match",
  function* matchParser(stream, depth) {
    const startPos = getPosition2(stream);
    const opToken = current(stream);
    if (opToken.type !== "OPERATOR" || opToken.value !== "?") return { success: false, consumed: 0 };
    const labelToken = peek2(stream, 1);
    if (labelToken?.type !== "IDENTIFIER" || labelToken.value !== "match") return { success: false, consumed: 0 };
    advance2(stream);
    advance2(stream);
    let consumed = 2;
    skipWhitespace(stream);
    if (current(stream).type !== "CONTAINER_OPEN" || current(stream).value !== "[") {
      return { success: false, consumed: 0 };
    }
    advance2(stream);
    consumed += 1;
    skipWhitespace(stream);
    const inputGen = expressionNode(stream, depth + 1);
    let inputStep = inputGen.next();
    while (!inputStep.done) {
      yield inputStep.value;
      inputStep = inputGen.next();
    }
    if (!inputStep.value.success) return { success: false, consumed: 0 };
    consumed += inputStep.value.consumed;
    const inputNode = inputStep.value.value;
    skipWhitespace(stream);
    if (current(stream).type !== "CONTAINER_CLOSE" || current(stream).value !== "]") {
      return { success: false, consumed: 0 };
    }
    advance2(stream);
    consumed += 1;
    skipWhitespace(stream);
    if (current(stream).type !== "CONTAINER_OPEN" || current(stream).value !== "{") {
      return { success: false, consumed: 0 };
    }
    advance2(stream);
    consumed += 1;
    const arms = [];
    while (true) {
      skipWhitespace(stream);
      if (current(stream).type === "CONTAINER_CLOSE" && current(stream).value === "}") {
        advance2(stream);
        consumed += 1;
        break;
      }
      if (current(stream).type === "EOF") {
        return { success: false, consumed: 0 };
      }
      const armGen = matchArmNode(stream, depth + 1);
      let armStep = armGen.next();
      while (!armStep.done) {
        yield armStep.value;
        armStep = armGen.next();
      }
      if (!armStep.value.success) {
        return {
          success: false,
          consumed: 0,
          error: armStep.value.error ?? {
            message: "Invalid match arm",
            expected: ["pattern => handler"],
            found: current(stream).type,
            recoverable: false
          }
        };
      }
      arms.push(armStep.value.value);
      consumed += armStep.value.consumed;
      skipWhitespace(stream);
      if (current(stream).type === "COMMA") {
        advance2(stream);
        consumed += 1;
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Match",
      span: { start: startPos, end: endPos },
      input: inputNode,
      arms
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/bullets.ts
var bulletNode = named(
  "bullet",
  function* bulletParser(stream, depth) {
    const startPos = getPosition2(stream);
    const markGen = token("CONNECTOR", "..")(stream, depth + 1);
    let markStep = markGen.next();
    while (!markStep.done) {
      yield markStep.value;
      markStep = markGen.next();
    }
    if (!markStep.value.success) {
      return { success: false, consumed: 0, error: markStep.value.error };
    }
    let consumed = markStep.value.consumed;
    const marker = markStep.value.value;
    skipWhitespace(stream);
    const markerLine = marker.span.start.line;
    const t0 = current(stream);
    const isSpw = t0.type === "OPERATOR" || t0.type === "CAPSULE_OPEN" || t0.type === "STREAM_OPEN" || t0.type === "NRANGE_OPEN" || t0.type === "CONTAINER_OPEN";
    if (isSpw) {
      const itemGen = expressionNode(stream, depth + 1);
      let itemStep = itemGen.next();
      while (!itemStep.done) {
        yield itemStep.value;
        itemStep = itemGen.next();
      }
      if (!itemStep.value.success) {
        return { success: false, consumed: 0, error: itemStep.value.error };
      }
      consumed += itemStep.value.consumed;
      const endPos2 = getPosition2(stream);
      const node2 = {
        type: "Bullet",
        span: { start: startPos, end: endPos2 },
        marker,
        item: itemStep.value.value
      };
      return { success: true, value: node2, consumed };
    }
    const collected = [];
    while (true) {
      const tok = current(stream);
      if (tok.type === "EOF") break;
      if (tok.span.start.line !== markerLine) break;
      if (tok.type === "COMMENT") break;
      collected.push(tok);
      advance2(stream);
      consumed += 1;
    }
    let startIdx = 0;
    while (startIdx < collected.length && collected[startIdx].type === "WHITESPACE") startIdx++;
    let endIdx = collected.length - 1;
    while (endIdx >= startIdx && collected[endIdx].type === "WHITESPACE") endIdx--;
    const text = startIdx <= endIdx ? collected.slice(startIdx, endIdx + 1).map((t) => t.value).join("") : "";
    const chunk = {
      type: "ProseChunk",
      span: startIdx <= endIdx ? { start: collected[startIdx].span.start, end: collected[endIdx].span.end } : { start: marker.span.end, end: marker.span.end },
      text
    };
    const endPos = getPosition2(stream);
    const node = {
      type: "Bullet",
      span: { start: startPos, end: endPos },
      marker,
      item: chunk
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/expressions.ts
var INLINE_PAYLOAD_OPERATORS = /* @__PURE__ */ new Set(["#", "?"]);
var INLINE_PAYLOAD_PUNCT = /* @__PURE__ */ new Set([".", "#", "?", "!"]);
var LOW_CONTEXT_PATH_SUGAR_ERROR = 'Unquoted local path references are high-context sugar. Use ~"..." or parse with contextMode: "high".';
function isBarePathStartToken2(token3) {
  if (token3.type === "OPERATOR" && token3.value === ".") return true;
  if (token3.type === "CONNECTOR" && (token3.value === ".." || token3.value === "/")) return true;
  return false;
}
function shouldStopLinePayload(token3, previous) {
  if (token3.type === "COMMENT") return true;
  if (token3.type === "CONNECTOR") return true;
  if (token3.type === "CAPSULE_OPEN" || token3.type === "CAPSULE_CLOSE") return true;
  if (token3.type === "STREAM_OPEN" || token3.type === "STREAM_CLOSE") return true;
  if (token3.type === "NRANGE_OPEN" || token3.type === "NRANGE_CLOSE") return true;
  if (token3.type === "WHITESPACE" && token3.value.includes("\n")) return true;
  if (token3.type === "OPERATOR") {
    const prevWasWhitespace = !previous || previous.type === "WHITESPACE";
    const isPunctuation = INLINE_PAYLOAD_PUNCT.has(token3.value);
    return prevWasWhitespace || !isPunctuation;
  }
  return false;
}
function readLinePayload(stream, opToken) {
  const opLine = opToken.span.start.line;
  const collected = [];
  let consumed = 0;
  let prev;
  while (true) {
    const token3 = current(stream);
    if (token3.type === "EOF") break;
    if (token3.span.start.line !== opLine) break;
    if (shouldStopLinePayload(token3, prev)) break;
    collected.push(token3);
    prev = token3;
    advance2(stream);
    consumed++;
  }
  let startIndex = 0;
  while (startIndex < collected.length && collected[startIndex].type === "WHITESPACE") startIndex++;
  let endIndex = collected.length - 1;
  while (endIndex >= startIndex && collected[endIndex].type === "WHITESPACE") endIndex--;
  if (startIndex > endIndex) {
    return { consumed };
  }
  const text = collected.slice(startIndex, endIndex + 1).map((t) => t.value).join("");
  const node = {
    type: "ProseChunk",
    span: {
      start: collected[startIndex].span.start,
      end: collected[endIndex].span.end
    },
    text
  };
  return { node, consumed };
}
var expressionNode = lazy(() => expressionImpl);
var sequenceNode = lazy(() => sequenceImpl);
var operationNode = named(
  "operation",
  function* operationParser(stream, depth) {
    const startPos = getPosition2(stream);
    let consumed = 0;
    let modifiers;
    let operatorLabel;
    skipWhitespace(stream);
    if (current(stream).type === "MODIFIER") {
      const modGen = modifierChain(stream, depth + 1);
      let modStep = modGen.next();
      while (!modStep.done) {
        yield modStep.value;
        modStep = modGen.next();
      }
      if (modStep.value.success) {
        modifiers = modStep.value.value;
        consumed += modStep.value.consumed;
      }
    }
    skipWhitespace(stream);
    const opGen = operator(stream, depth + 1);
    let opStep = opGen.next();
    while (!opStep.done) {
      yield opStep.value;
      opStep = opGen.next();
    }
    if (!opStep.value.success) {
      return { success: false, consumed: 0, error: opStep.value.error };
    }
    const operatorToken = opStep.value.value;
    consumed += opStep.value.consumed;
    skipWhitespace(stream);
    if (operatorToken.value === "~" && stream.contextMode === "low" && isBarePathStartToken2(current(stream))) {
      return {
        success: false,
        consumed: 0,
        error: {
          message: LOW_CONTEXT_PATH_SUGAR_ERROR,
          expected: ["string"],
          found: current(stream).type,
          recoverable: false
        }
      };
    }
    const isAdjacent = operatorToken.span.end.offset === current(stream).span.start.offset || operatorToken.span.end.line === current(stream).span.start.line && operatorToken.span.end.column === current(stream).span.start.column;
    if (isAdjacent && current(stream).type === "IDENTIFIER") {
      const labelGen = identifier(stream, depth + 1);
      let labelStep = labelGen.next();
      while (!labelStep.done) {
        yield labelStep.value;
        labelStep = labelGen.next();
      }
      if (labelStep.value.success) {
        operatorLabel = labelStep.value.value;
        consumed += labelStep.value.consumed;
      }
    }
    skipWhitespace(stream);
    if (!modifiers && current(stream).type === "MODIFIER") {
      const modGen = modifierChain(stream, depth + 1);
      let modStep = modGen.next();
      while (!modStep.done) {
        yield modStep.value;
        modStep = modGen.next();
      }
      if (modStep.value.success) {
        modifiers = modStep.value.value;
        consumed += modStep.value.consumed;
      }
    }
    skipWhitespace(stream);
    if (!modifiers && current(stream).type === "IDENTIFIER" && !current(stream).value.startsWith("_")) {
      const idGen = identifier(stream, depth + 1);
      let idStep = idGen.next();
      while (!idStep.done) {
        yield idStep.value;
        idStep = idGen.next();
      }
      if (idStep.value.success) {
        const modifierTokens = [{
          type: "MODIFIER",
          value: idStep.value.value.value,
          span: idStep.value.value.span,
          kind: idStep.value.value.value
        }];
        consumed += idStep.value.consumed;
        skipWhitespace(stream);
        if (current(stream).value === ".") {
          const savedPos = stream.position;
          const dotGen = literal(".")(stream, depth + 1);
          let dotStep = dotGen.next();
          while (!dotStep.done) {
            yield dotStep.value;
            dotStep = dotGen.next();
          }
          if (dotStep.value.success) {
            const nextGen = identifier(stream, depth + 1);
            let nextStep = nextGen.next();
            while (!nextStep.done) {
              yield nextStep.value;
              nextStep = nextGen.next();
            }
            if (nextStep.value.success) {
              modifierTokens.push({
                type: "MODIFIER",
                value: nextStep.value.value.value,
                span: nextStep.value.value.span,
                kind: nextStep.value.value.value
              });
              consumed += dotStep.value.consumed + nextStep.value.consumed;
            } else {
              stream.position = savedPos;
            }
          }
        }
        const endPos2 = getPosition2(stream);
        modifiers = {
          type: "ModifierChain",
          span: { start: startPos, end: endPos2 },
          modifiers: modifierTokens
        };
      }
    }
    let subject;
    if (operatorToken.value === "^") {
      skipWhitespace(stream);
      if (current(stream).type === "STRING" || current(stream).type === "IDENTIFIER" || current(stream).type === "OPERATOR" || current(stream).type === "CAPSULE_OPEN") {
        const subjGen = choice(pathRefNode, referenceNode, identifierNode, literalNode, capsuleNode, scopeNode, wildcardNode, spreadNode)(stream, depth + 1);
        let subjStep = subjGen.next();
        while (!subjStep.done) {
          yield subjStep.value;
          subjStep = subjGen.next();
        }
        if (subjStep.value.success) {
          subject = subjStep.value.value;
          consumed += subjStep.value.consumed;
        }
      }
    } else if (operatorToken.value === "=") {
      skipWhitespace(stream);
      if (current(stream).type === "OPERATOR") {
        const subjGen = choice(pathRefNode, referenceNode)(stream, depth + 1);
        let subjStep = subjGen.next();
        while (!subjStep.done) {
          yield subjStep.value;
          subjStep = subjGen.next();
        }
        if (subjStep.value.success) {
          subject = subjStep.value.value;
          consumed += subjStep.value.consumed;
        }
      }
    } else if (operatorToken.value === "?") {
      skipWhitespace(stream);
      if (current(stream).type === "CONTAINER_OPEN" && current(stream).value === "(") {
        const scopeGen = scopeNode(stream, depth + 1);
        let scopeStep = scopeGen.next();
        while (!scopeStep.done) {
          yield scopeStep.value;
          scopeStep = scopeGen.next();
        }
        if (scopeStep.value.success) {
          subject = scopeStep.value.value;
          consumed += scopeStep.value.consumed;
        }
      }
    }
    let frame;
    skipWhitespace(stream);
    if (current(stream).value === "[") {
      const frameGen = frameNode(stream, depth + 1);
      let frameStep = frameGen.next();
      while (!frameStep.done) {
        yield frameStep.value;
        frameStep = frameGen.next();
      }
      if (!frameStep.value.success) {
        return { success: false, consumed: 0, error: frameStep.value.error };
      }
      frame = frameStep.value.value;
      consumed += frameStep.value.consumed;
    }
    let body;
    skipWhitespace(stream);
    if (current(stream).value === "{") {
      const bodyGen = bodyNode(stream, depth + 1);
      let bodyStep = bodyGen.next();
      while (!bodyStep.done) {
        yield bodyStep.value;
        bodyStep = bodyGen.next();
      }
      if (!bodyStep.value.success) {
        return { success: false, consumed: 0, error: bodyStep.value.error };
      }
      body = bodyStep.value.value;
      consumed += bodyStep.value.consumed;
    }
    let linePayload;
    if (!frame && !body && !subject && INLINE_PAYLOAD_OPERATORS.has(operatorToken.value)) {
      skipWhitespace(stream);
      const payload = readLinePayload(stream, operatorToken);
      if (payload.node) {
        linePayload = payload.node;
      }
      consumed += payload.consumed;
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Operation",
      span: { start: startPos, end: endPos },
      modifiers,
      operator: operatorToken,
      operatorLabel,
      frame,
      body,
      subject,
      linePayload
    };
    return { success: true, value: node, consumed };
  }
);
var termNode = lazy(() => named(
  "term",
  function* termParser(stream, depth) {
    const token3 = current(stream);
    const nextToken = peek2(stream, 1);
    if (token3.type === "OPERATOR" && token3.value === "?" && nextToken?.type === "IDENTIFIER" && nextToken.value === "match") {
      const matchGen = matchNode(stream, depth + 1);
      let matchStep = matchGen.next();
      while (!matchStep.done) {
        yield matchStep.value;
        matchStep = matchGen.next();
      }
      if (matchStep.value.success) {
        return {
          success: true,
          value: matchStep.value.value,
          consumed: matchStep.value.consumed
        };
      }
      return {
        success: false,
        consumed: 0,
        error: matchStep.value.error ?? {
          message: "Invalid match expression",
          expected: ["?match[expression]{ pattern => handler }"],
          found: current(stream).type,
          recoverable: false
        }
      };
    }
    if (token3.type === "OPERATOR" && token3.value === "@" && nextToken?.type === "IDENTIFIER" && nextToken.value.startsWith("_")) {
      const opGen = operationNode(stream, depth + 1);
      let opStep = opGen.next();
      while (!opStep.done) {
        yield opStep.value;
        opStep = opGen.next();
      }
      if (opStep.value.success) {
        return {
          success: true,
          value: opStep.value.value,
          consumed: opStep.value.consumed
        };
      }
      return {
        success: false,
        consumed: 0,
        error: opStep.value.error ?? {
          message: "Invalid labeled perspective operation",
          expected: ["@_label[frame]{body}"],
          found: current(stream).type,
          recoverable: false
        }
      };
    }
    const fallbackGen = choice(
      bulletNode,
      annotationNode,
      particleNode,
      pathRefNode,
      referenceNode,
      operationNode,
      identifierNode,
      wildcardNode,
      spreadNode,
      scopeNode,
      literalNode,
      capsuleNode,
      frameNode,
      streamNode,
      nrangeNode,
      bodyNode
    )(stream, depth + 1);
    let fallbackStep = fallbackGen.next();
    while (!fallbackStep.done) {
      yield fallbackStep.value;
      fallbackStep = fallbackGen.next();
    }
    return fallbackStep.value;
  }
));
var expressionImpl = named(
  "expression",
  function* expressionParser(stream, depth) {
    const startPos = getPosition2(stream);
    skipWhitespace(stream);
    const firstGen = termNode(stream, depth + 1);
    let firstStep = firstGen.next();
    while (!firstStep.done) {
      yield firstStep.value;
      firstStep = firstGen.next();
    }
    if (!firstStep.value.success) {
      return { success: false, consumed: 0, error: firstStep.value.error };
    }
    let headTerm = firstStep.value.value;
    let consumed = firstStep.value.consumed;
    while (true) {
      const saved = stream.position;
      skipWhitespace(stream);
      if (current(stream).type !== "CAPSULE_OPEN") {
        stream.position = saved;
        break;
      }
      const capGen = capsuleNode(stream, depth + 1);
      let capStep = capGen.next();
      while (!capStep.done) {
        yield capStep.value;
        capStep = capGen.next();
      }
      if (!capStep.value.success) {
        stream.position = saved;
        break;
      }
      let right;
      const afterCap = stream.position;
      skipWhitespace(stream);
      const rightTok = current(stream);
      if (rightTok.type !== "EOF" && rightTok.type !== "CONNECTOR" && rightTok.type !== "COLON" && rightTok.type !== "CONTAINER_CLOSE" && rightTok.type !== "CAPSULE_CLOSE" && rightTok.type !== "STREAM_CLOSE" && rightTok.type !== "NRANGE_CLOSE" && !(rightTok.type === "OPERATOR" && rightTok.value === "<>")) {
        const rightGen = termNode(stream, depth + 1);
        let rightStep = rightGen.next();
        while (!rightStep.done) {
          yield rightStep.value;
          rightStep = rightGen.next();
        }
        if (rightStep.value.success && rightStep.value.consumed > 0) {
          right = rightStep.value.value;
          consumed += rightStep.value.consumed;
        } else {
          stream.position = afterCap;
        }
      } else {
        stream.position = afterCap;
      }
      const shell = capStep.value.value;
      consumed += capStep.value.consumed;
      const endPos2 = getPosition2(stream);
      const medial = {
        ...shell,
        type: "Capsule",
        span: { start: headTerm.span.start, end: right?.span.end ?? shell.span.end ?? endPos2 },
        left: headTerm,
        right,
        placement: "medial"
      };
      headTerm = medial;
    }
    const terms = [headTerm];
    const connectors = [];
    skipWhitespace(stream);
    if (current(stream).type === "COLON") {
      const colonGen = colon(stream, depth + 1);
      let colonStep = colonGen.next();
      while (!colonStep.done) {
        yield colonStep.value;
        colonStep = colonGen.next();
      }
      if (!colonStep.value.success) {
        return { success: false, consumed: 0, error: colonStep.value.error };
      }
      consumed += colonStep.value.consumed;
      skipWhitespace(stream);
      const rhsGen = expressionNode(stream, depth + 1);
      let rhsStep = rhsGen.next();
      while (!rhsStep.done) {
        yield rhsStep.value;
        rhsStep = rhsGen.next();
      }
      if (!rhsStep.value.success) {
        return { success: false, consumed: 0, error: rhsStep.value.error };
      }
      consumed += rhsStep.value.consumed;
      const endPos2 = getPosition2(stream);
      const binding = {
        type: "Binding",
        span: { start: startPos, end: endPos2 },
        key: headTerm,
        value: rhsStep.value.value
      };
      const node2 = {
        type: "Expression",
        span: { start: startPos, end: endPos2 },
        terms: [binding],
        connectors: []
      };
      return { success: true, value: node2, consumed };
    }
    while (true) {
      skipWhitespace(stream);
      if (current(stream).type !== "CONNECTOR") break;
      const connGen = connector(stream, depth + 1);
      let connStep = connGen.next();
      while (!connStep.done) {
        yield connStep.value;
        connStep = connGen.next();
      }
      if (!connStep.value.success) break;
      connectors.push(connStep.value.value);
      consumed += connStep.value.consumed;
      skipWhitespace(stream);
      const termGen = termNode(stream, depth + 1);
      let termStep = termGen.next();
      while (!termStep.done) {
        yield termStep.value;
        termStep = termGen.next();
      }
      if (!termStep.value.success) break;
      terms.push(termStep.value.value);
      consumed += termStep.value.consumed;
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Expression",
      span: { start: startPos, end: endPos },
      terms,
      connectors
    };
    return { success: true, value: node, consumed };
  }
);
var sequenceImpl = named(
  "sequence",
  function* sequenceParser(stream, depth) {
    const startPos = getPosition2(stream);
    const expressions = [];
    let consumed = 0;
    while (true) {
      skipWhitespace(stream);
      const curr = current(stream);
      if (curr.type === "EOF" || curr.type === "CONTAINER_CLOSE" || curr.type === "STREAM_CLOSE" || curr.type === "NRANGE_CLOSE" || curr.type === "CAPSULE_CLOSE") {
        break;
      }
      const exprGen = expressionNode(stream, depth + 1);
      let step = exprGen.next();
      while (!step.done) {
        yield step.value;
        step = exprGen.next();
      }
      if (!step.value.success || step.value.consumed === 0) break;
      expressions.push(step.value.value);
      consumed += step.value.consumed;
      skipWhitespace(stream);
      if (current(stream).type === "COMMA") {
        advance2(stream);
        consumed += 1;
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Sequence",
      span: { start: startPos, end: endPos },
      expressions
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/parameters.ts
var parameterNode = named(
  "parameter",
  function* parameterParser(stream, depth) {
    const startPos = getPosition2(stream);
    let consumed = 0;
    let nameToken;
    skipWhitespace(stream);
    if (current(stream).type === "IDENTIFIER" || current(stream).type === "STRING") {
      const savedPos = stream.position;
      const nameGen = (current(stream).type === "STRING" ? stringLit : identifier)(stream, depth + 1);
      let nameStep = nameGen.next();
      while (!nameStep.done) {
        yield nameStep.value;
        nameStep = nameGen.next();
      }
      if (nameStep.value.success) {
        skipWhitespace(stream);
        if (current(stream).type === "COLON") {
          nameToken = nameStep.value.value;
          consumed += nameStep.value.consumed;
          const colonGen = colon(stream, depth + 1);
          let colonStep = colonGen.next();
          while (!colonStep.done) {
            yield colonStep.value;
            colonStep = colonGen.next();
          }
          if (colonStep.value.success) {
            consumed += colonStep.value.consumed;
          }
        } else {
          stream.position = savedPos;
        }
      }
    }
    const valueGen = expressionNode(stream, depth + 1);
    let valueStep = valueGen.next();
    while (!valueStep.done) {
      yield valueStep.value;
      valueStep = valueGen.next();
    }
    if (!valueStep.value.success) {
      return { success: false, consumed: 0, error: valueStep.value.error };
    }
    consumed += valueStep.value.consumed;
    let value = valueStep.value.value;
    if (value.type === "Expression" && value.connectors.length == 0 && value.terms.length == 1) {
      const only = value.terms[0];
      if (only.type === "Literal" || only.type === "Reference") {
        value = only;
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Parameter",
      span: { start: startPos, end: endPos },
      name: nameToken,
      value
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/containers.ts
var frameContent = named(
  "frameContent",
  sepBy(
    choice(parameterNode, referenceNode, literalNode),
    comma
  )
);
var frameNode = named(
  "frame",
  function* frameParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = openBracket(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) {
      return { success: false, consumed: 0, error: openStep.value.error };
    }
    let consumed = openStep.value.consumed;
    skipWhitespace(stream);
    const contentGen = frameContent(stream, depth + 1);
    let contentStep = contentGen.next();
    while (!contentStep.done) {
      yield contentStep.value;
      contentStep = contentGen.next();
    }
    const content = contentStep.value.success ? contentStep.value.value : [];
    consumed += contentStep.value.consumed;
    skipWhitespace(stream);
    const closeGen = closeBracket(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) {
      return { success: false, consumed: 0, error: closeStep.value.error };
    }
    consumed += closeStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "Frame",
      span: { start: startPos, end: endPos },
      content
    };
    return { success: true, value: node, consumed };
  }
);
var bodyNode = named(
  "body",
  function* bodyParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = openBrace(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) {
      return { success: false, consumed: 0, error: openStep.value.error };
    }
    let consumed = openStep.value.consumed;
    skipWhitespace(stream);
    const seqGen = sequenceNode(stream, depth + 1);
    let seqStep = seqGen.next();
    while (!seqStep.done) {
      yield seqStep.value;
      seqStep = seqGen.next();
    }
    const seq2 = seqStep.value.success ? seqStep.value.value : {
      type: "Sequence",
      span: { start: startPos, end: startPos },
      expressions: []
    };
    consumed += seqStep.value.consumed;
    skipWhitespace(stream);
    const closeGen = closeBrace(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) {
      return { success: false, consumed: 0, error: closeStep.value.error };
    }
    consumed += closeStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "Body",
      span: { start: startPos, end: endPos },
      sequence: seq2
    };
    return { success: true, value: node, consumed };
  }
);
var scopeNode = named(
  "scope",
  function* scopeParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = openParen(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) {
      return { success: false, consumed: 0, error: openStep.value.error };
    }
    let consumed = openStep.value.consumed;
    let nameToken;
    skipWhitespace(stream);
    if (current(stream).type === "IDENTIFIER") {
      const savedPos = stream.position;
      const idGen = identifier(stream, depth + 1);
      let idStep = idGen.next();
      while (!idStep.done) {
        yield idStep.value;
        idStep = idGen.next();
      }
      if (idStep.value.success) {
        skipWhitespace(stream);
        if (current(stream).type === "COLON") {
          nameToken = idStep.value.value;
          consumed += idStep.value.consumed;
          const colonGen = colon(stream, depth + 1);
          let colonStep = colonGen.next();
          while (!colonStep.done) {
            yield colonStep.value;
            colonStep = colonGen.next();
          }
          consumed += colonStep.value.consumed;
        } else {
          stream.position = savedPos;
        }
      }
    }
    skipWhitespace(stream);
    const seqGen = sequenceNode(stream, depth + 1);
    let seqStep = seqGen.next();
    while (!seqStep.done) {
      yield seqStep.value;
      seqStep = seqGen.next();
    }
    const seq2 = seqStep.value.success ? seqStep.value.value : {
      type: "Sequence",
      span: { start: startPos, end: startPos },
      expressions: []
    };
    consumed += seqStep.value.consumed;
    skipWhitespace(stream);
    const closeGen = closeParen(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) {
      return { success: false, consumed: 0, error: closeStep.value.error };
    }
    consumed += closeStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "Scope",
      span: { start: startPos, end: endPos },
      name: nameToken,
      sequence: seq2
    };
    return { success: true, value: node, consumed };
  }
);
var nrangeNode = named(
  "nrange",
  function* nrangeParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = nrangeOpen(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) {
      return { success: false, consumed: 0, error: openStep.value.error };
    }
    let consumed = openStep.value.consumed;
    let expression;
    skipWhitespace(stream);
    if (current(stream).type !== "NRANGE_CLOSE") {
      const exprGen = expressionNode(stream, depth + 1);
      let exprStep = exprGen.next();
      while (!exprStep.done) {
        yield exprStep.value;
        exprStep = exprGen.next();
      }
      if (exprStep.value.success) {
        expression = exprStep.value.value;
        consumed += exprStep.value.consumed;
      }
    }
    skipWhitespace(stream);
    const closeGen = nrangeClose(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) {
      return { success: false, consumed: 0, error: closeStep.value.error };
    }
    consumed += closeStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "NRange",
      span: { start: startPos, end: endPos },
      ...expression ? { expression } : {},
      open: openStep.value.value,
      close: closeStep.value.value
    };
    return { success: true, value: node, consumed };
  }
);
var streamNode = named(
  "stream",
  function* streamParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = streamOpen(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) {
      return { success: false, consumed: 0, error: openStep.value.error };
    }
    let consumed = openStep.value.consumed;
    skipWhitespace(stream);
    const seqGen = sequenceNode(stream, depth + 1);
    let seqStep = seqGen.next();
    while (!seqStep.done) {
      yield seqStep.value;
      seqStep = seqGen.next();
    }
    if (!seqStep.value.success) {
      return { success: false, consumed: 0, error: seqStep.value.error };
    }
    consumed += seqStep.value.consumed;
    skipWhitespace(stream);
    const closeGen = streamClose(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) {
      return { success: false, consumed: 0, error: closeStep.value.error };
    }
    consumed += closeStep.value.consumed;
    skipWhitespace(stream);
    let sink;
    if (current(stream).type === "OPERATOR" && current(stream).value === "@") {
      const sinkGen = referenceNode(stream, depth + 1);
      let sinkStep = sinkGen.next();
      while (!sinkStep.done) {
        yield sinkStep.value;
        sinkStep = sinkGen.next();
      }
      if (sinkStep.value.success) {
        sink = sinkStep.value.value;
        consumed += sinkStep.value.consumed;
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Stream",
      span: { start: startPos, end: endPos },
      open: openStep.value.value,
      sequence: seqStep.value.value,
      close: closeStep.value.value,
      sink
    };
    return { success: true, value: node, consumed };
  }
);
var capsuleNode = named(
  "capsule",
  function* capsuleParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = capsuleOpen(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) {
      return { success: false, consumed: 0, error: openStep.value.error };
    }
    let consumed = openStep.value.consumed;
    skipWhitespace(stream);
    let tag;
    let channel;
    const tok = current(stream);
    if (tok.type === "IDENTIFIER") {
      const tagGen = identifier(stream, depth + 1);
      let tagStep = tagGen.next();
      while (!tagStep.done) {
        yield tagStep.value;
        tagStep = tagGen.next();
      }
      if (tagStep.value.success) {
        tag = tagStep.value.value;
        consumed += tagStep.value.consumed;
        channel = {
          type: "Identifier",
          span: tag.span,
          token: tag
        };
      }
    } else if (tok.type === "NUMBER" || tok.type === "STRING" || tok.type === "BOOLEAN") {
      const litGen = literalNode(stream, depth + 1);
      let litStep = litGen.next();
      while (!litStep.done) {
        yield litStep.value;
        litStep = litGen.next();
      }
      if (litStep.value.success) {
        channel = litStep.value.value;
        consumed += litStep.value.consumed;
      }
    }
    let frame;
    skipWhitespace(stream);
    if (current(stream).value === "[") {
      const frameGen = frameNode(stream, depth + 1);
      let frameStep = frameGen.next();
      while (!frameStep.done) {
        yield frameStep.value;
        frameStep = frameGen.next();
      }
      if (frameStep.value.success) {
        frame = frameStep.value.value;
        consumed += frameStep.value.consumed;
      }
    }
    let body;
    skipWhitespace(stream);
    if (current(stream).value === "{") {
      const bodyGen = bodyNode(stream, depth + 1);
      let bodyStep = bodyGen.next();
      while (!bodyStep.done) {
        yield bodyStep.value;
        bodyStep = bodyGen.next();
      }
      if (bodyStep.value.success) {
        body = bodyStep.value.value;
        consumed += bodyStep.value.consumed;
      }
    }
    skipWhitespace(stream);
    const closeGen = capsuleClose(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) {
      return { success: false, consumed: 0, error: closeStep.value.error };
    }
    consumed += closeStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "Capsule",
      span: { start: startPos, end: endPos },
      open: openStep.value.value,
      close: closeStep.value.value,
      tag,
      channel,
      frame,
      body,
      placement: "shell"
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/patterns.ts
var patternFrameNode = named(
  "patternFrame",
  function* patternFrameParser(stream, depth) {
    const startPos = getPosition2(stream);
    const openGen = openBracket(stream, depth + 1);
    let openStep = openGen.next();
    while (!openStep.done) {
      yield openStep.value;
      openStep = openGen.next();
    }
    if (!openStep.value.success) return { success: false, consumed: 0, error: openStep.value.error };
    let consumed = openStep.value.consumed;
    skipWhitespace(stream);
    const contentGen = sepBy(patternNode, comma)(stream, depth + 1);
    let contentStep = contentGen.next();
    while (!contentStep.done) {
      yield contentStep.value;
      contentStep = contentGen.next();
    }
    const content = contentStep.value.success ? contentStep.value.value : [];
    consumed += contentStep.value.consumed;
    skipWhitespace(stream);
    const closeGen = closeBracket(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    if (!closeStep.value.success) return { success: false, consumed: 0, error: closeStep.value.error };
    consumed += closeStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "Frame",
      span: { start: startPos, end: endPos },
      content
    };
    return { success: true, value: node, consumed };
  }
);
var patternNode = lazy(() => named(
  "pattern",
  choice(
    wildcardNode,
    spreadNode,
    referenceNode,
    literalNode,
    patternFrameNode,
    scopeNode,
    operationNode
  )
));
var matchArmNode = named(
  "matchArm",
  function* matchArmParser(stream, depth) {
    const startPos = getPosition2(stream);
    const patGen = patternNode(stream, depth + 1);
    let patStep = patGen.next();
    while (!patStep.done) {
      yield patStep.value;
      patStep = patGen.next();
    }
    if (!patStep.value.success) return { success: false, consumed: 0 };
    let consumed = patStep.value.consumed;
    skipWhitespace(stream);
    const arrowGen = arrow(stream, depth + 1);
    let arrowStep = arrowGen.next();
    while (!arrowStep.done) {
      yield arrowStep.value;
      arrowStep = arrowGen.next();
    }
    if (!arrowStep.value.success) {
      return { success: false, consumed: 0 };
    }
    consumed += arrowStep.value.consumed;
    skipWhitespace(stream);
    const handlerGen = choice(bodyNode, expressionNode)(stream, depth + 1);
    let handlerStep = handlerGen.next();
    while (!handlerStep.done) {
      yield handlerStep.value;
      handlerStep = handlerGen.next();
    }
    if (!handlerStep.value.success) return { success: false, consumed: 0 };
    consumed += handlerStep.value.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "MatchArm",
      span: { start: startPos, end: endPos },
      pattern: patStep.value.value,
      handler: handlerStep.value.value
    };
    return { success: true, value: node, consumed };
  }
);
var wildcardNode = named(
  "wildcard",
  function* wildcardParser(stream, _depth) {
    yield* [];
    const tok = current(stream);
    if ((tok.type === "IDENTIFIER" || tok.type === "HOLE") && tok.value === "_") {
      advance2(stream);
      return {
        success: true,
        value: { type: "Wildcard", span: tok.span },
        consumed: 1
      };
    }
    return { success: false, consumed: 0 };
  }
);
var spreadNode = named(
  "spread",
  function* spreadParser(stream, depth) {
    const startPos = getPosition2(stream);
    const spreadGen = spread(stream, depth + 1);
    let spreadStep = spreadGen.next();
    while (!spreadStep.done) {
      yield spreadStep.value;
      spreadStep = spreadGen.next();
    }
    if (!spreadStep.value.success) {
      return { success: false, consumed: 0, error: spreadStep.value.error };
    }
    let consumed = spreadStep.value.consumed;
    let capture2;
    if (current(stream).type === "OPERATOR" && current(stream).value === "@") {
      const refGen = referenceNode(stream, depth + 1);
      let refStep = refGen.next();
      while (!refStep.done) {
        yield refStep.value;
        refStep = refGen.next();
      }
      if (refStep.value.success) {
        capture2 = refStep.value.value;
        consumed += refStep.value.consumed;
      }
    }
    const endPos = getPosition2(stream);
    return {
      success: true,
      value: {
        type: "Spread",
        span: { start: startPos, end: endPos },
        capture: capture2
      },
      consumed
    };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/prose.ts
function isSpwTrigger(token3) {
  if (token3.type === "OPERATOR") return true;
  if (token3.type === "PARTICLE") return true;
  if (token3.type === "CAPSULE_OPEN") return true;
  if (token3.type === "STREAM_OPEN") return true;
  if (token3.type === "NRANGE_OPEN") return true;
  if (token3.type === "CONTAINER_OPEN") return true;
  return false;
}
function collectFallbackText(stream) {
  const first = current(stream);
  const start = first.span.start;
  let end = first.span.end;
  let text = first.value;
  let consumed = 0;
  while (!isAtEnd2(stream)) {
    const token3 = current(stream);
    if (token3.type === "EOF") break;
    if (consumed > 0 && isSpwTrigger(token3)) break;
    text += token3.value;
    end = token3.span.end;
    advance2(stream);
    consumed++;
  }
  return {
    node: {
      type: "ProseChunk",
      span: { start, end },
      text
    },
    consumed
  };
}
var proseTextNode = named(
  "proseText",
  function* proseTextParser(stream, _depth) {
    yield* [];
    const startPos = getPosition2(stream);
    let text = "";
    let consumed = 0;
    while (true) {
      if (isAtEnd2(stream)) break;
      const token3 = current(stream);
      if (token3.type === "EOF") break;
      if (isSpwTrigger(token3)) break;
      text += token3.value;
      advance2(stream);
      consumed++;
    }
    const endPos = getPosition2(stream);
    if (consumed === 0) {
      return {
        success: false,
        consumed: 0,
        error: {
          message: "No text content",
          recoverable: true,
          expected: ["Text"],
          found: isAtEnd2(stream) ? "EOF" : current(stream).type
        }
      };
    }
    const node = {
      type: "ProseChunk",
      span: { start: startPos, end: endPos },
      text
    };
    return { success: true, value: node, consumed };
  }
);
var proseNode = named(
  "prose",
  function* proseParser(stream, depth) {
    const startPos = getPosition2(stream);
    const chunks = [];
    let consumed = 0;
    while (!isAtEnd2(stream)) {
      const token3 = current(stream);
      if (token3.type === "EOF") break;
      if (isSpwTrigger(token3)) {
        const spwParser = expressionNode;
        const gen = spwParser(stream, depth + 1);
        const eventsBuffer = [];
        let step = gen.next();
        while (!step.done) {
          eventsBuffer.push(step.value);
          step = gen.next();
        }
        if (step.value.success) {
          for (const evt of eventsBuffer) {
            yield evt;
          }
          chunks.push(step.value.value);
          consumed += step.value.consumed;
        } else {
          const fallback = collectFallbackText(stream);
          chunks.push(fallback.node);
          consumed += fallback.consumed;
        }
      } else {
        const textGen = proseTextNode(stream, depth + 1);
        let step = textGen.next();
        while (!step.done) {
          yield step.value;
          step = textGen.next();
        }
        if (step.value.success) {
          chunks.push(step.value.value);
          consumed += step.value.consumed;
        } else {
          advance2(stream);
          consumed++;
        }
      }
    }
    const endPos = getPosition2(stream);
    const node = {
      type: "Prose",
      span: { start: startPos, end: endPos },
      chunks
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/seed.ts
var seedNode = named(
  "seed",
  function* seedParser(stream, depth) {
    const startPos = getPosition2(stream);
    const annotations = [];
    let consumed = 0;
    while (true) {
      skipWhitespace(stream);
      if (current(stream).type !== "ANNOTATION") break;
      const annGen = annotationNode(stream, depth + 1);
      let annStep = annGen.next();
      while (!annStep.done) {
        yield annStep.value;
        annStep = annGen.next();
      }
      const annResult = annStep.value;
      if (!annResult.success) break;
      annotations.push(annResult.value);
      consumed += annResult.consumed;
    }
    let exprResult;
    {
      const savedPos = stream.position;
      const sequenceGen = sequenceNode(stream, depth + 1);
      let sequenceStep = sequenceGen.next();
      while (!sequenceStep.done) {
        yield sequenceStep.value;
        sequenceStep = sequenceGen.next();
      }
      exprResult = sequenceStep.value;
      skipWhitespace(stream);
      const reachedEOF = current(stream).type === "EOF";
      if (!reachedEOF) {
        stream.position = savedPos;
      }
      if (!reachedEOF || !(exprResult.success && exprResult.consumed > 0)) {
        const proseGen = proseNode(stream, depth + 1);
        let proseStep = proseGen.next();
        while (!proseStep.done) {
          yield proseStep.value;
          proseStep = proseGen.next();
        }
        exprResult = proseStep.value;
        if (!exprResult.success) {
          return { success: false, consumed: 0, error: exprResult.error };
        }
      }
    }
    consumed += exprResult.consumed;
    const endPos = getPosition2(stream);
    const node = {
      type: "Seed",
      span: { start: startPos, end: endPos },
      annotations,
      expression: exprResult.value
    };
    return { success: true, value: node, consumed };
  }
);

// .spw/_workbench/packages/spw-seed/src/parser/formatters.ts
var textFormatter = {
  format(event) {
    const indent = "  ".repeat(event.depth);
    const pos = `${event.position.line}:${event.position.column}`;
    switch (event.type) {
      case "enter":
        return `${indent}\u2192 ${event.rule} at ${pos}`;
      case "exit": {
        const data = event.data;
        const status = data.success ? "\u2713" : "\u2717";
        return `${indent}\u2190 ${event.rule} ${status} (consumed: ${data.consumed})`;
      }
      case "match": {
        const data = event.data;
        return `${indent}  \u2713 matched: "${data.matched}"`;
      }
      case "backtrack": {
        const data = event.data;
        return `${indent}  \u21BA backtrack: ${data.reason} (tried: ${data.tried})`;
      }
      case "token": {
        const data = event.data;
        return `${indent}  TOKEN: ${data.token.type} = "${data.token.value}"`;
      }
      case "error": {
        const data = event.data;
        return `${indent}  \u2717 ERROR: ${data.message} at ${pos}`;
      }
      case "warning": {
        const data = event.data;
        return `${indent}  \u26A0 WARNING: ${data.message}`;
      }
      case "debug":
        return `${indent}  [debug] ${JSON.stringify(event.data)}`;
      default:
        return `${indent}  ${event.type}: ${JSON.stringify(event.data)}`;
    }
  }
};
var jsonFormatter = {
  format(event) {
    return JSON.stringify({
      type: event.type,
      rule: event.rule,
      position: event.position,
      data: event.data,
      depth: event.depth,
      timestamp: event.timestamp
    });
  }
};
var compactFormatter = {
  format(event) {
    if (event.type === "token") {
      const data = event.data;
      return `[${data.token.type}:${data.token.value}]`;
    }
    if (event.type === "error") {
      const data = event.data;
      return `ERROR@${event.position.line}:${event.position.column}: ${data.message}`;
    }
    if (event.type === "enter" || event.type === "exit") {
      const success = event.type === "exit" ? event.data.success : null;
      return `${event.type === "enter" ? ">" : "<"}${event.rule}${success !== null ? success ? "\u2713" : "\u2717" : ""}`;
    }
    return "";
  }
};

// .spw/_workbench/packages/spw-seed/src/parser/parse-stream.ts
function* parseStream(input, options = {}) {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events = [];
  const errors = [];
  const warnings = [];
  const lexProfile = resolveLexProfile(opts.lexProfile);
  const lexGen = tokenize(input, 0, { profile: lexProfile });
  let lexStep = lexGen.next();
  while (!lexStep.done) {
    events.push(lexStep.value);
    if (lexStep.value.type === "error") errors.push(lexStep.value);
    if (lexStep.value.type === "warning") warnings.push(lexStep.value);
    yield lexStep.value;
    lexStep = lexGen.next();
  }
  const tokens = lexStep.value;
  const filteredTokens = opts.includeWhitespace ? tokens : tokens.filter((t) => t.type !== "WHITESPACE" && t.type !== "COMMENT");
  const stream = createTokenStream(filteredTokens, opts.contextMode);
  const parseGen = seedNode(stream, 0);
  let parseStep = parseGen.next();
  while (!parseStep.done) {
    events.push(parseStep.value);
    if (parseStep.value.type === "error") errors.push(parseStep.value);
    if (parseStep.value.type === "warning") warnings.push(parseStep.value);
    yield parseStep.value;
    parseStep = parseGen.next();
  }
  const result = parseStep.value;
  const duration = performance.now() - startTime;
  return {
    success: result.success,
    ast: result.value,
    tokens,
    events,
    errors,
    warnings,
    error: result.success ? void 0 : result.error,
    duration,
    lexProfile: lexProfile.id
  };
}

// .spw/_workbench/packages/spw-seed/src/parser/trace.ts
function isASTNode(value) {
  return typeof value === "object" && value !== null && "type" in value && "span" in value;
}
function filterEvents(events, types) {
  return events.filter((e) => types.includes(e.type));
}
function extractTokens(events) {
  return events.filter((e) => e.type === "token").map((e) => e.data.token);
}
function extractErrors(events) {
  return events.filter((e) => e.type === "error");
}
function buildTrace(events) {
  const root = { rule: "root", children: [], events: [] };
  const stack = [root];
  for (const event of events) {
    const current2 = stack[stack.length - 1];
    if (event.type === "enter") {
      const node = { rule: event.rule, children: [], events: [event] };
      current2.children.push(node);
      stack.push(node);
    } else if (event.type === "exit") {
      const node = stack.pop();
      if (node !== root) {
        node.events.push(event);
        node.success = event.data.success;
        node.consumed = event.data.consumed;
      }
    } else {
      current2.events.push(event);
    }
  }
  return root;
}
function printAST(node, indent = 0) {
  const prefix = "  ".repeat(indent);
  let output = `${prefix}${node.type}`;
  if ("value" in node && typeof node.value === "string") {
    output += `: "${node.value}"`;
  }
  if ("operator" in node && node.operator) {
    output += ` [${node.operator.value}]`;
  }
  if ("modifiers" in node && node.modifiers) {
    const modArray = node.modifiers.modifiers;
    if (modArray) {
      const mods = modArray.map((m) => m.value).join(".");
      output += ` (${mods})`;
    }
  }
  output += "\n";
  if (node.children) {
    for (const child of node.children) {
      output += printAST(child, indent + 1);
    }
  }
  const childProps = [
    "expression",
    "expressions",
    "sequence",
    "terms",
    "frame",
    "body",
    "content",
    "annotations",
    "modifiers"
  ];
  for (const prop of childProps) {
    const value = node[prop];
    if (value) {
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isASTNode(child)) {
            output += printAST(child, indent + 1);
          }
        }
      } else if (isASTNode(value)) {
        output += printAST(value, indent + 1);
      }
    }
  }
  return output;
}

// .spw/_workbench/packages/spw-seed/src/parser/parse.ts
function parse(input, options = {}) {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events = [];
  const errors = [];
  const warnings = [];
  const lexProfile = resolveLexProfile(opts.lexProfile);
  const lexGen = tokenize(input, 0, { profile: lexProfile });
  let lexStep = lexGen.next();
  while (!lexStep.done) {
    events.push(lexStep.value);
    if (lexStep.value.type === "error") {
      errors.push(lexStep.value);
    }
    if (lexStep.value.type === "warning") {
      warnings.push(lexStep.value);
    }
    lexStep = lexGen.next();
  }
  const tokens = lexStep.value;
  const filteredTokens = tokens.filter((t) => {
    if (!opts.includeWhitespace && t.type === "WHITESPACE") return false;
    if (!opts.includeComments && t.type === "COMMENT") return false;
    return true;
  });
  const stream = createTokenStream(filteredTokens, opts.contextMode);
  const parseGen = seedNode(stream, 0);
  let parseStep = parseGen.next();
  while (!parseStep.done) {
    events.push(parseStep.value);
    if (parseStep.value.type === "error") {
      errors.push(parseStep.value);
    }
    if (parseStep.value.type === "warning") {
      warnings.push(parseStep.value);
    }
    parseStep = parseGen.next();
  }
  const result = parseStep.value;
  let success = result.success;
  if (success) {
    skipWhitespace(stream);
    if (current(stream).type !== "EOF") {
      success = false;
      const pos = getPosition2(stream);
      const found = current(stream);
      const evt = {
        type: "error",
        rule: "parse",
        position: pos,
        data: {
          message: `Unexpected trailing tokens starting at ${found.type} (${JSON.stringify(found.value)})`,
          expected: ["EOF"],
          found: found.type,
          recoverable: false
        },
        timestamp: performance.now(),
        depth: 0
      };
      events.push(evt);
      errors.push(evt);
    }
  }
  const duration = performance.now() - startTime;
  return {
    success,
    ast: result.value,
    tokens,
    events,
    errors,
    warnings,
    duration,
    lexProfile: lexProfile.id
  };
}

// .spw/_workbench/packages/spw-seed/src/parser/parse-expression.ts
function parseExpression(input, options = {}) {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events = [];
  const errors = [];
  const warnings = [];
  const lexProfile = resolveLexProfile(opts.lexProfile);
  const { tokens } = lex(input, { profile: lexProfile });
  const filteredTokens = opts.includeWhitespace ? tokens : tokens.filter((t) => t.type !== "WHITESPACE" && t.type !== "COMMENT");
  const stream = createTokenStream(filteredTokens, opts.contextMode);
  const parseGen = expressionNode(stream, 0);
  let parseStep = parseGen.next();
  while (!parseStep.done) {
    events.push(parseStep.value);
    if (parseStep.value.type === "error") {
      errors.push(parseStep.value);
    }
    parseStep = parseGen.next();
  }
  const result = parseStep.value;
  const duration = performance.now() - startTime;
  return {
    success: result.success,
    ast: result.value,
    tokens,
    events,
    errors,
    warnings,
    duration,
    lexProfile: lexProfile.id
  };
}

// .spw/_workbench/packages/spw-seed/src/parser/index.ts
function parseWithLog(input, formatter = textFormatter) {
  const gen = parseStream(input);
  let step = gen.next();
  while (!step.done) {
    const formatted = formatter.format(step.value);
    if (formatted) {
      console.log(formatted);
    }
    step = gen.next();
  }
  return step.value;
}

// .spw/_workbench/packages/spw-seed/src/instrumentation/hooks.ts
var noopHooks = {};
function createHooks(overrides) {
  return { ...noopHooks, ...overrides };
}
function combineHooks(...hookSets) {
  return {
    onParseStart: (input) => {
      hookSets.forEach((h) => h.onParseStart?.(input));
    },
    onParseEnd: (result) => {
      hookSets.forEach((h) => h.onParseEnd?.(result));
    },
    onEvent: (event) => {
      hookSets.forEach((h) => h.onEvent?.(event));
    },
    onToken: (token3) => {
      hookSets.forEach((h) => h.onToken?.(token3));
    },
    onEnterRule: (rule, depth) => {
      hookSets.forEach((h) => h.onEnterRule?.(rule, depth));
    },
    onExitRule: (rule, success, consumed) => {
      hookSets.forEach((h) => h.onExitRule?.(rule, success, consumed));
    },
    onBacktrack: (rule, reason) => {
      hookSets.forEach((h) => h.onBacktrack?.(rule, reason));
    },
    onError: (error) => {
      hookSets.forEach((h) => h.onError?.(error));
    },
    onNodeCreated: (node) => {
      hookSets.forEach((h) => h.onNodeCreated?.(node));
    }
  };
}
function processEvent(event, hooks) {
  hooks.onEvent?.(event);
  switch (event.type) {
    case "token":
      hooks.onToken?.(event.data.token);
      break;
    case "enter":
      hooks.onEnterRule?.(event.rule, event.depth);
      break;
    case "exit": {
      const exitData = event.data;
      hooks.onExitRule?.(event.rule, exitData.success, exitData.consumed);
      break;
    }
    case "backtrack": {
      const btData = event.data;
      hooks.onBacktrack?.(event.rule, btData.reason);
      break;
    }
    case "error":
      hooks.onError?.(event.data);
      break;
  }
}

// .spw/_workbench/packages/spw-seed/src/instrumentation/audit.ts
function walkAST(node, visitor, path = []) {
  const result = visitor(node, path);
  if (result === false) return;
  const newPath = [...path, node];
  const children = getNodeChildren(node);
  for (const child of children) {
    walkAST(child, visitor, newPath);
  }
}
function getNodeChildren(node) {
  const children = [];
  const seen = /* @__PURE__ */ new Set();
  const pushChild = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) pushChild(item);
      return;
    }
    if (!isAstNode(value) || value === node || seen.has(value)) return;
    seen.add(value);
    children.push(value);
  };
  for (const [key, value] of Object.entries(node)) {
    if (key === "type" || key === "span") continue;
    pushChild(value);
  }
  return children;
}
function isAstNode(value) {
  if (!value || typeof value !== "object") return false;
  const candidate = value;
  return typeof candidate.type === "string" && candidate.type !== candidate.type.toUpperCase() && !!candidate.span && typeof candidate.span === "object" && !!candidate.span.start && typeof candidate.span.start === "object" && !!candidate.span.end && typeof candidate.span.end === "object";
}
function findNodes(node, predicate) {
  const results = [];
  walkAST(node, (n) => {
    if (predicate(n)) {
      results.push(n);
    }
  });
  return results;
}
function getNodePath(root, target) {
  let foundPath = null;
  walkAST(root, (node, path) => {
    if (node === target) {
      foundPath = [...path, node];
      return false;
    }
  });
  return foundPath;
}
function getMaxDepth(node, currentDepth = 0) {
  const children = getNodeChildren(node);
  if (children.length === 0) return currentDepth;
  return Math.max(...children.map((child) => getMaxDepth(child, currentDepth + 1)));
}
function countNodeTypes(node) {
  const counts = /* @__PURE__ */ new Map();
  walkAST(node, (n) => {
    const count = counts.get(n.type) || 0;
    counts.set(n.type, count + 1);
  });
  return counts;
}
function auditAST(ast) {
  const items = [];
  let nodeCount = 0;
  walkAST(ast, (node) => {
    nodeCount++;
    if (node.type === "Sequence" && node.expressions?.length === 0) {
      items.push({
        level: "info",
        message: "Empty sequence",
        node,
        span: node.span
      });
    }
    const children = getNodeChildren(node);
    if (children.length > 10) {
      items.push({
        level: "warning",
        message: `Node has ${children.length} children, consider simplifying`,
        node,
        span: node.span
      });
    }
    if (node.type === "Operation") {
      const op = node;
      if (!op.frame && !op.body && !op.linePayload) {
        items.push({
          level: "info",
          message: "Operation has neither frame nor body",
          node,
          span: node.span
        });
      }
    }
  });
  return {
    nodeCount,
    maxDepth: getMaxDepth(ast),
    nodeTypes: countNodeTypes(ast),
    items
  };
}

// .spw/_workbench/packages/spw-seed/src/instrumentation/coverage.ts
var CoverageCollector = class _CoverageCollector {
  rules = /* @__PURE__ */ new Map();
  ruleStack = [];
  startTime = 0;
  eventCount = 0;
  /**
   * Known grammar rules (for computing coverage percentage)
   */
  static knownRules = /* @__PURE__ */ new Set([
    "tokenize",
    "seed",
    "expression",
    "term",
    "operation",
    "scope",
    "frame",
    "body",
    "sequence",
    "reference",
    "literal",
    "identifier",
    "annotation",
    "modifierChain",
    "parameter",
    "frameContent",
    // Extended forms
    "capsule",
    "stream",
    "nrange",
    // Pipeline helper
    "lex",
    // Token rules
    "whitespace",
    "lineComment",
    "blockComment",
    "operator",
    "connector",
    "container",
    "modifier",
    "boolean",
    "string",
    "number",
    "dot",
    "colon",
    "comma",
    "comparison"
  ]);
  /**
   * Process a parse event for coverage tracking
   */
  processEvent(event) {
    this.eventCount++;
    if (this.startTime === 0) {
      this.startTime = event.timestamp;
    }
    if (event.type === "enter") {
      this.handleEnter(event);
    } else if (event.type === "exit") {
      this.handleExit(event);
    }
  }
  handleEnter(event) {
    const rule = this.normalizeRuleName(event.rule);
    if (!this.rules.has(rule)) {
      this.rules.set(rule, {
        rule,
        enterCount: 0,
        successCount: 0,
        failCount: 0,
        totalTime: 0,
        avgTime: 0
      });
    }
    const coverage = this.rules.get(rule);
    coverage.enterCount++;
    this.ruleStack.push({
      enterTime: event.timestamp,
      depth: event.depth
    });
  }
  handleExit(event) {
    const rule = this.normalizeRuleName(event.rule);
    const coverage = this.rules.get(rule);
    if (!coverage) return;
    const state = this.ruleStack.pop();
    if (state) {
      const duration = event.timestamp - state.enterTime;
      coverage.totalTime += duration;
      coverage.avgTime = coverage.totalTime / coverage.enterCount;
    }
    const data = event.data;
    if (data.success) {
      coverage.successCount++;
    } else {
      coverage.failCount++;
    }
  }
  normalizeRuleName(rule) {
    const match = rule.match(/^([a-zA-Z0-9_]+)/);
    return match ? match[1] : rule;
  }
  /**
   * Get the coverage report
   */
  getReport() {
    const coveredRules = this.rules.size;
    const totalRules = _CoverageCollector.knownRules.size;
    return {
      rules: new Map(this.rules),
      coveredRules,
      totalRules,
      coveragePercent: coveredRules / totalRules * 100,
      totalEvents: this.eventCount,
      duration: this.eventCount > 0 ? performance.now() - this.startTime : 0
    };
  }
  /**
   * Reset the collector
   */
  reset() {
    this.rules.clear();
    this.ruleStack = [];
    this.startTime = 0;
    this.eventCount = 0;
  }
  /**
   * Get rules that were never entered
   */
  getUncoveredRules() {
    const covered = new Set(this.rules.keys());
    return Array.from(_CoverageCollector.knownRules).filter((r) => !covered.has(r));
  }
  /**
   * Get rules sorted by failure rate
   */
  getRulesByFailureRate() {
    return Array.from(this.rules.values()).filter((r) => r.enterCount > 0).map((r) => ({
      ...r,
      failureRate: r.failCount / r.enterCount
    })).sort((a, b) => b.failureRate - a.failureRate);
  }
  /**
   * Get rules sorted by average time
   */
  getRulesByTime() {
    return Array.from(this.rules.values()).filter((r) => r.enterCount > 0).sort((a, b) => b.avgTime - a.avgTime);
  }
};
function createCoverageHooks() {
  const collector = new CoverageCollector();
  return {
    collector,
    hooks: {
      onEvent: (event) => collector.processEvent(event)
    }
  };
}

// .spw/_workbench/packages/spw-seed/src/instrumentation/metrics.ts
var MetricsCollector = class {
  startTime = 0;
  lexEndTime = 0;
  parseEndTime = 0;
  tokenCount = 0;
  eventCount = 0;
  ruleTimings = /* @__PURE__ */ new Map();
  ruleStack = [];
  childTimeStack = [0];
  /**
   * Process a parse event for metrics
   */
  processEvent(event) {
    this.eventCount++;
    if (this.startTime === 0) {
      this.startTime = event.timestamp;
    }
    if (event.type === "token") {
      this.tokenCount++;
    }
    if (event.rule === "tokenize" && event.type === "exit") {
      this.lexEndTime = event.timestamp;
    }
    if (event.type === "enter") {
      this.handleRuleEnter(event);
    } else if (event.type === "exit") {
      this.handleRuleExit(event);
    }
  }
  handleRuleEnter(event) {
    const rule = this.normalizeRuleName(event.rule);
    if (!this.ruleTimings.has(rule)) {
      this.ruleTimings.set(rule, {
        totalTime: 0,
        selfTime: 0,
        callCount: 0,
        enterTime: 0,
        childTime: 0
      });
    }
    const timing = this.ruleTimings.get(rule);
    timing.enterTime = event.timestamp;
    timing.callCount++;
    this.ruleStack.push(rule);
    this.childTimeStack.push(0);
  }
  handleRuleExit(event) {
    const rule = this.normalizeRuleName(event.rule);
    const timing = this.ruleTimings.get(rule);
    if (!timing) return;
    const duration = event.timestamp - timing.enterTime;
    timing.totalTime += duration;
    timing.selfTime += duration - timing.childTime;
    timing.childTime = 0;
    this.ruleStack.pop();
    this.childTimeStack.pop();
    if (this.childTimeStack.length > 0) {
      this.childTimeStack[this.childTimeStack.length - 1] += duration;
    }
    this.parseEndTime = event.timestamp;
  }
  normalizeRuleName(rule) {
    const match = rule.match(/^([a-zA-Z0-9_]+)/);
    return match ? match[1] : rule;
  }
  /**
   * Mark the end of parsing
   */
  finish() {
    if (this.parseEndTime === 0) {
      this.parseEndTime = performance.now();
    }
  }
  /**
   * Get timing metrics
   */
  getMetrics() {
    const totalTime = this.parseEndTime - this.startTime;
    const lexTime = this.lexEndTime - this.startTime;
    const parseTime = this.parseEndTime - this.lexEndTime;
    return {
      totalTime,
      lexTime,
      parseTime,
      tokenCount: this.tokenCount,
      eventCount: this.eventCount,
      tokensPerMs: this.tokenCount / (lexTime || 1),
      eventsPerMs: this.eventCount / (totalTime || 1)
    };
  }
  /**
   * Get rule timing breakdown
   */
  getRuleTimings() {
    return Array.from(this.ruleTimings.entries()).map(([rule, data]) => ({
      rule,
      totalTime: data.totalTime,
      selfTime: data.selfTime,
      callCount: data.callCount,
      avgTime: data.totalTime / data.callCount
    })).sort((a, b) => b.selfTime - a.selfTime);
  }
  /**
   * Get hotspots (rules taking most time)
   */
  getHotspots(limit = 10) {
    return this.getRuleTimings().slice(0, limit);
  }
  /**
   * Reset the collector
   */
  reset() {
    this.startTime = 0;
    this.lexEndTime = 0;
    this.parseEndTime = 0;
    this.tokenCount = 0;
    this.eventCount = 0;
    this.ruleTimings.clear();
    this.ruleStack = [];
    this.childTimeStack = [0];
  }
};
function createMetricsHooks() {
  const collector = new MetricsCollector();
  return {
    collector,
    hooks: {
      onEvent: (event) => collector.processEvent(event),
      onParseEnd: () => collector.finish()
    }
  };
}

// .spw/_workbench/packages/spw-seed/src/instrumentation/stream.ts
var EventStream = class {
  subscribers = /* @__PURE__ */ new Set();
  filters = [];
  buffer = [];
  bufferSize;
  paused = false;
  constructor(options = {}) {
    this.bufferSize = options.bufferSize ?? 1e3;
  }
  /**
   * Subscribe to events
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  /**
   * Add a filter (events must pass all filters)
   */
  addFilter(filter) {
    this.filters.push(filter);
    return () => {
      const index = this.filters.indexOf(filter);
      if (index >= 0) this.filters.splice(index, 1);
    };
  }
  /**
   * Push an event to the stream
   */
  push(event) {
    if (!this.filters.every((f) => f(event))) {
      return;
    }
    this.buffer.push(event);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
    if (!this.paused) {
      this.subscribers.forEach((sub) => sub(event));
    }
  }
  /**
   * Pause event delivery (events still buffered)
   */
  pause() {
    this.paused = true;
  }
  /**
   * Resume event delivery
   */
  resume() {
    this.paused = false;
  }
  /**
   * Get buffered events
   */
  getBuffer() {
    return [...this.buffer];
  }
  /**
   * Clear the buffer
   */
  clearBuffer() {
    this.buffer = [];
  }
  /**
   * Check if paused
   */
  isPaused() {
    return this.paused;
  }
};
var eventFilters = {
  /**
   * Filter by event type
   */
  byType(...types) {
    return (event) => types.includes(event.type);
  },
  /**
   * Filter by rule name
   */
  byRule(...rules) {
    return (event) => rules.includes(event.rule);
  },
  /**
   * Filter by depth
   */
  byDepth(maxDepth) {
    return (event) => event.depth <= maxDepth;
  },
  /**
   * Filter to only errors
   */
  errorsOnly() {
    return (event) => event.type === "error";
  },
  /**
   * Filter to only tokens
   */
  tokensOnly() {
    return (event) => event.type === "token";
  },
  /**
   * Filter to entry/exit events
   */
  ruleEvents() {
    return (event) => event.type === "enter" || event.type === "exit";
  },
  /**
   * Exclude whitespace tokens
   */
  noWhitespace() {
    return (event) => {
      if (event.type !== "token") return true;
      const token3 = event.data.token;
      return token3?.type !== "WHITESPACE" && token3?.type !== "COMMENT";
    };
  }
};
function createStreamHooks(options) {
  const stream = new EventStream(options);
  return {
    stream,
    hooks: {
      onEvent: (event) => stream.push(event)
    }
  };
}

// .spw/_workbench/packages/spw-seed/src/canonical/canonicalize.ts
var FORMAT_PROFILES = {
  /** Whitespace hygiene only (CLI default historically) */
  canonical: {
    normalizeNewlines: true,
    trimTrailingWhitespace: true,
    ensureFinalNewline: true,
    collapseBlankLines: false,
    indentBraces: false,
    alignComments: false,
    blankLineBetweenFrames: false,
    reflowProse: false,
    migrateSlashComments: false
  },
  /** Readable authoring: indent + frame spacing + `#` prose wrap */
  pretty: {
    normalizeNewlines: true,
    trimTrailingWhitespace: true,
    ensureFinalNewline: true,
    collapseBlankLines: true,
    indentBraces: true,
    indentSize: 2,
    alignComments: false,
    blankLineBetweenFrames: true,
    reflowProse: true,
    printWidth: 88,
    migrateSlashComments: false
  },
  /** Structure layout without rewriting prose paragraphs */
  layout: {
    normalizeNewlines: true,
    trimTrailingWhitespace: true,
    ensureFinalNewline: true,
    collapseBlankLines: true,
    indentBraces: true,
    indentSize: 2,
    alignComments: true,
    commentColumn: 40,
    blankLineBetweenFrames: true,
    reflowProse: false,
    migrateSlashComments: false
  },
  /** Prose-focused: wrap `#` light; hygiene; no re-indent */
  prose: {
    normalizeNewlines: true,
    trimTrailingWhitespace: true,
    ensureFinalNewline: true,
    collapseBlankLines: true,
    indentBraces: false,
    blankLineBetweenFrames: false,
    alignComments: false,
    reflowProse: true,
    printWidth: 88,
    migrateSlashComments: false
  },
  /**
   * Cultural cleanup: pretty + migrate borrowed `//` → `#` light.
   * Use for anatomy promotion; avoid on #:desk #!challenge without intent.
   */
  culture: {
    normalizeNewlines: true,
    trimTrailingWhitespace: true,
    ensureFinalNewline: true,
    collapseBlankLines: true,
    indentBraces: true,
    indentSize: 2,
    alignComments: false,
    blankLineBetweenFrames: true,
    reflowProse: true,
    printWidth: 88,
    migrateSlashComments: true
  }
};
var DEFAULT_OPTIONS2 = {
  normalizeNewlines: true,
  trimTrailingWhitespace: true,
  ensureFinalNewline: true,
  collapseBlankLines: false,
  indentBraces: false,
  indentSize: 2,
  alignComments: false,
  commentColumn: 40,
  blankLineBetweenFrames: false,
  reflowProse: false,
  printWidth: 88,
  migrateSlashComments: false
};
function resolveFormatProfile(profile, overrides = {}) {
  const base = FORMAT_PROFILES[profile] ?? FORMAT_PROFILES.canonical;
  return { ...DEFAULT_OPTIONS2, ...base, ...overrides };
}
function braceStats(line) {
  let delta = 0;
  let opensOnLine = false;
  let closesOnLine = false;
  let bracketDelta = 0;
  let bracketOpens = false;
  let bracketCloses = false;
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!inString && (ch === '"' || ch === "'" || ch === "`")) {
      inString = ch;
      continue;
    }
    if (inString && ch === inString && line[i - 1] !== "\\") {
      inString = false;
      continue;
    }
    if (inString) continue;
    if (ch === "/" && line[i + 1] === "/") break;
    if (ch === "{") {
      delta++;
      opensOnLine = true;
    }
    if (ch === "}") {
      delta--;
      closesOnLine = true;
    }
    if (ch === "[") {
      bracketDelta++;
      bracketOpens = true;
    }
    if (ch === "]") {
      bracketDelta--;
      bracketCloses = true;
    }
  }
  return { delta, opensOnLine, closesOnLine, bracketDelta, bracketOpens, bracketCloses };
}
function isFrameHeader(line) {
  return /^\s*\^(?:\["[^"]*"\]|"[^"]*"|\[[A-Za-z_]\w*\])\s*\{/.test(line);
}
function splitTrailingComment(line) {
  let inString = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (!inString && (ch === '"' || ch === "'" || ch === "`")) {
      inString = ch;
      continue;
    }
    if (inString && ch === inString && line[i - 1] !== "\\") {
      inString = false;
      continue;
    }
    if (inString) continue;
    if (ch === "/" && line[i + 1] === "/") return [line, null];
    if (ch === "#" && i > 0 && /\s/.test(line[i - 1])) {
      const afterHash = line[i + 1];
      if (afterHash === ">" || afterHash === ":" || afterHash === "!") continue;
      const content = line.slice(0, i).replace(/\s+$/, "");
      const comment = line.slice(i);
      return [content, comment];
    }
  }
  return [line, null];
}
function alignCommentsInBlock(lines, minColumn) {
  const result = [];
  let group = [];
  function flushGroup() {
    if (group.length === 0) return;
    const maxWidth = Math.max(minColumn, ...group.map((g) => g.content.length + 2));
    for (const g of group) {
      result[g.index] = g.content.padEnd(maxWidth) + g.comment;
    }
    group = [];
  }
  for (let i = 0; i < lines.length; i++) {
    const [content, comment] = splitTrailingComment(lines[i]);
    if (comment) {
      group.push({ index: i, content, comment });
      result.push(lines[i]);
    } else {
      flushGroup();
      result.push(lines[i]);
    }
  }
  flushGroup();
  return result;
}
function isProseCommentLine(line) {
  const t = line.trimStart();
  if (!t.startsWith("#")) return false;
  if (/^#(?:>|:|!)/.test(t)) return false;
  if (/^##/.test(t)) return false;
  return true;
}
function isSlashLineComment(line) {
  return /^\s*\/\//.test(line);
}
function migrateSlashCommentsToHash(source) {
  return source.split("\n").map((line) => {
    const m = line.match(/^(\s*)\/\/\s?(.*)$/);
    if (!m) return line;
    const indent = m[1] ?? "";
    const text = m[2] ?? "";
    return text === "" ? `${indent}#` : `${indent}# ${text}`;
  }).join("\n");
}
function parseProseLine(line) {
  if (!isProseCommentLine(line)) return null;
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch?.[1] ?? "";
  const body = line.slice(indent.length);
  const text = body === "#" ? "" : body.slice(1).replace(/^\s?/, "");
  return { indent, text };
}
function wrapWords(text, width) {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [""];
  const lines = [];
  let cur = "";
  for (const w of words) {
    if (!cur) {
      cur = w;
      continue;
    }
    if (cur.length + 1 + w.length <= width) {
      cur = `${cur} ${w}`;
    } else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}
function reflowProseBlocks(source, printWidth) {
  const lines = source.split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const parsed = parseProseLine(lines[i]);
    if (!parsed) {
      out.push(lines[i]);
      i++;
      continue;
    }
    const block = [parsed];
    let j = i + 1;
    while (j < lines.length) {
      const next = parseProseLine(lines[j]);
      if (!next || next.indent !== parsed.indent) break;
      block.push(next);
      j++;
    }
    const paragraphs = [];
    let para = [];
    for (const pl of block) {
      if (pl.text.trim() === "") {
        if (para.length) {
          paragraphs.push(para);
          para = [];
        }
        paragraphs.push([pl]);
      } else {
        para.push(pl);
      }
    }
    if (para.length) paragraphs.push(para);
    const prefix = `${parsed.indent}#`;
    const contentWidth = Math.max(20, printWidth - prefix.length - 1);
    for (const p of paragraphs) {
      if (p.length === 1 && p[0].text.trim() === "") {
        out.push(`${parsed.indent}#`);
        continue;
      }
      const joined = p.map((x) => x.text.trim()).filter(Boolean).join(" ");
      const wrapped = wrapWords(joined, contentWidth);
      for (const w of wrapped) {
        out.push(w === "" ? `${parsed.indent}#` : `${parsed.indent}# ${w}`);
      }
    }
    i = j;
  }
  return out.join("\n");
}
function canonicalize(input, options = {}) {
  const opts = { ...DEFAULT_OPTIONS2, ...options };
  let normalized = input;
  if (opts.normalizeNewlines) {
    normalized = normalized.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  }
  if (opts.trimTrailingWhitespace) {
    normalized = normalized.split("\n").map((line) => line.replace(/\s+$/g, "")).join("\n");
  }
  if (opts.migrateSlashComments) {
    normalized = migrateSlashCommentsToHash(normalized);
  }
  if (opts.reflowProse) {
    normalized = reflowProseBlocks(normalized, opts.printWidth);
  }
  if (opts.indentBraces) {
    const indent = " ".repeat(opts.indentSize);
    const lines = normalized.split("\n");
    const out = [];
    let depth = 0;
    let bracketDepth = 0;
    for (const rawLine of lines) {
      const stripped = rawLine.replace(/^\s+/, "");
      if (stripped === "") {
        out.push("");
        continue;
      }
      if (depth === 0 && bracketDepth === 0 && stripped.startsWith("#")) {
        out.push(stripped);
        continue;
      }
      const stats = braceStats(stripped);
      const totalDepth = depth + bracketDepth;
      if (stripped.startsWith("}") || stripped.startsWith("]")) {
        depth = Math.max(0, depth + stats.delta);
        bracketDepth = Math.max(0, bracketDepth + stats.bracketDelta);
        const newTotal = depth + bracketDepth;
        out.push(indent.repeat(Math.max(0, newTotal)) + stripped);
        continue;
      }
      out.push(indent.repeat(Math.max(0, totalDepth)) + stripped);
      depth = Math.max(0, depth + stats.delta);
      bracketDepth = Math.max(0, bracketDepth + stats.bracketDelta);
    }
    normalized = out.join("\n");
  }
  if (opts.alignComments) {
    normalized = alignCommentsInBlock(normalized.split("\n"), opts.commentColumn).join("\n");
  }
  if (opts.blankLineBetweenFrames) {
    const lines = normalized.split("\n");
    const out = [];
    let braceDepth = 0;
    let closedTopLevelFrame = false;
    let prevBlankCount = 0;
    for (const line of lines) {
      const isBlank = line.trim() === "";
      const isFrame = isFrameHeader(line);
      if (isBlank) {
        prevBlankCount++;
        continue;
      }
      if (out.length > 0 && (isFrame || closedTopLevelFrame)) {
        out.push("");
        prevBlankCount = 0;
        closedTopLevelFrame = false;
      } else if (prevBlankCount > 0 && out.length > 0) {
        out.push("");
        prevBlankCount = 0;
      }
      const stats = braceStats(line);
      if (isFrame) braceDepth = 1;
      else braceDepth = Math.max(0, braceDepth + stats.delta);
      if (line.trim().startsWith("}") && braceDepth === 0) {
        closedTopLevelFrame = true;
      }
      out.push(line);
      prevBlankCount = 0;
    }
    normalized = out.join("\n");
  }
  if (opts.collapseBlankLines && !opts.blankLineBetweenFrames) {
    normalized = normalized.replace(/\n{3,}/g, "\n\n");
  }
  if (opts.ensureFinalNewline && !normalized.endsWith("\n")) {
    normalized += "\n";
  }
  return {
    source: normalized,
    hash: hashString(normalized)
  };
}
function hashString(value) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = hash * 16777619 >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

// .spw/_workbench/packages/spw-seed/src/canonical/differential.ts
var EFFECT_GRADE_ORDER = {
  "effect.l0.measure": 0,
  "effect.l1.memory": 1,
  "effect.l2.workspace": 2,
  "effect.l3.external": 3
};
function effectGradeAtMost(grade, ceiling) {
  return EFFECT_GRADE_ORDER[grade] <= EFFECT_GRADE_ORDER[ceiling];
}
function applyEdits(source, edits) {
  if (edits.length === 0) return source;
  const ordered = [...edits].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return a.end - b.end;
  });
  for (let i = 1; i < ordered.length; i++) {
    if (ordered[i].start < ordered[i - 1].end) {
      throw new Error(
        `overlapping edits: ${ordered[i - 1].ruleId}[${ordered[i - 1].start},${ordered[i - 1].end}) vs ${ordered[i].ruleId}[${ordered[i].start},${ordered[i].end})`
      );
    }
  }
  let out = source;
  for (let i = ordered.length - 1; i >= 0; i--) {
    const e = ordered[i];
    if (e.start < 0 || e.end > out.length || e.start > e.end) {
      throw new Error(
        `edit out of range: ${e.ruleId}[${e.start},${e.end}) length=${out.length}`
      );
    }
    out = out.slice(0, e.start) + e.newText + out.slice(e.end);
  }
  return out;
}
function differentialFromSources(before, after, ruleId, stratum, hash) {
  if (before === after) {
    const h = hash(before);
    return {
      beforeHash: h,
      afterHash: h,
      beforeLength: before.length,
      afterLength: after.length,
      edits: [],
      vector: zeroVector(),
      identity: true
    };
  }
  const edits = lineSpanEdits(before, after, ruleId, stratum);
  const vector = vectorFromEdits(edits, before.length, after.length, stratum);
  return {
    beforeHash: hash(before),
    afterHash: hash(after),
    beforeLength: before.length,
    afterLength: after.length,
    edits,
    vector,
    identity: false
  };
}
function zeroVector() {
  return {
    layout_delta: 0,
    token_delta: 0,
    structure_delta: 0,
    label_delta: 0,
    reference_delta: 0,
    script_delta: 0,
    edit_count: 0,
    bytes_delta: 0
  };
}
function mergeVectors(a, b) {
  return {
    layout_delta: a.layout_delta + b.layout_delta,
    token_delta: a.token_delta + b.token_delta,
    structure_delta: a.structure_delta + b.structure_delta,
    label_delta: a.label_delta + b.label_delta,
    reference_delta: a.reference_delta + b.reference_delta,
    script_delta: a.script_delta + b.script_delta,
    edit_count: a.edit_count + b.edit_count,
    bytes_delta: a.bytes_delta + b.bytes_delta
  };
}
function vectorFromEdits(edits, beforeLen, afterLen, stratum) {
  const v = zeroVector();
  v.edit_count = edits.length;
  v.bytes_delta = afterLen - beforeLen;
  const mag = Math.max(1, edits.length);
  switch (stratum) {
    case "layout":
      v.layout_delta = mag;
      break;
    case "source":
      v.token_delta = mag;
      break;
    case "structure":
      v.structure_delta = mag;
      break;
    case "reference":
      v.reference_delta = mag;
      break;
    case "script":
      v.script_delta = mag;
      break;
    case "operation":
      v.structure_delta = mag;
      break;
  }
  return v;
}
function lineSpanEdits(before, after, ruleId, stratum) {
  const bLines = splitKeepEnds(before);
  const aLines = splitKeepEnds(after);
  let prefix = 0;
  const minLen = Math.min(bLines.length, aLines.length);
  while (prefix < minLen && bLines[prefix] === aLines[prefix]) {
    prefix++;
  }
  let suffix = 0;
  while (suffix < minLen - prefix && bLines[bLines.length - 1 - suffix] === aLines[aLines.length - 1 - suffix]) {
    suffix++;
  }
  const bStart = offsetOfLine(bLines, prefix);
  const bEnd = offsetOfLine(bLines, bLines.length - suffix);
  const aMid = aLines.slice(prefix, aLines.length - suffix).join("");
  if (prefix === 0 && suffix === 0) {
    return [
      {
        start: 0,
        end: before.length,
        newText: after,
        ruleId,
        stratum
      }
    ];
  }
  return [
    {
      start: bStart,
      end: bEnd,
      newText: aMid,
      ruleId,
      stratum
    }
  ];
}
function splitKeepEnds(text) {
  if (text.length === 0) return [];
  const parts = [];
  let start = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") {
      parts.push(text.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (start < text.length) {
    parts.push(text.slice(start));
  }
  return parts;
}
function offsetOfLine(lines, lineIndex) {
  let offset = 0;
  for (let i = 0; i < lineIndex && i < lines.length; i++) {
    offset += lines[i].length;
  }
  return offset;
}

// .spw/_workbench/packages/spw-seed/src/canonical/mutation-automata.ts
var DEFAULT_CANONICAL = {
  normalizeNewlines: true,
  trimTrailingWhitespace: true,
  ensureFinalNewline: true,
  collapseBlankLines: false,
  indentBraces: false,
  indentSize: 2,
  alignComments: false,
  commentColumn: 40,
  blankLineBetweenFrames: false,
  reflowProse: false,
  printWidth: 88,
  migrateSlashComments: false
};
function canonSlice(source, ctx, slice) {
  return canonicalize(source, { ...ctx.options, ...slice }).source;
}
function applyEquivScriptTransforms(source) {
  const counts = { seqAliasToLs: 0, dotPostfixNormalized: 0, wildcardExpanded: 0 };
  let next = source;
  next = next.replace(/npm run spw:seq --/g, () => {
    counts.seqAliasToLs += 1;
    return "npm run spw:ls --";
  });
  next = next.replace(/\.\*/g, () => {
    counts.wildcardExpanded += 1;
    return "*()";
  });
  next = next.replace(/\.([!?~@&*=%#$^_])/g, (_match, token3) => {
    counts.dotPostfixNormalized += 1;
    return token3;
  });
  return { source: next, counts };
}
var BUILTIN_MUTATION_RULES = [
  {
    id: "normalize_newlines",
    description: "Normalize CRLF/CR to LF",
    stratum: "source",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: true,
      trimTrailingWhitespace: false,
      ensureFinalNewline: false,
      collapseBlankLines: false,
      indentBraces: false,
      alignComments: false,
      blankLineBetweenFrames: false
    })
  },
  {
    id: "trim_trailing_whitespace",
    description: "Strip trailing whitespace per line",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: false,
      trimTrailingWhitespace: true,
      ensureFinalNewline: false,
      collapseBlankLines: false,
      indentBraces: false,
      alignComments: false,
      blankLineBetweenFrames: false
    })
  },
  {
    id: "ensure_final_newline",
    description: "Ensure file ends with a single newline",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: false,
      trimTrailingWhitespace: false,
      ensureFinalNewline: true,
      collapseBlankLines: false,
      indentBraces: false,
      alignComments: false,
      blankLineBetweenFrames: false
    })
  },
  {
    id: "collapse_blank_lines",
    description: "Collapse runs of blank lines to at most one",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: false,
      trimTrailingWhitespace: false,
      ensureFinalNewline: false,
      collapseBlankLines: true,
      indentBraces: false,
      alignComments: false,
      blankLineBetweenFrames: false
    })
  },
  {
    id: "indent_braces",
    description: "Indent by brace/bracket depth",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: true,
      trimTrailingWhitespace: true,
      ensureFinalNewline: false,
      collapseBlankLines: false,
      indentBraces: true,
      alignComments: false,
      blankLineBetweenFrames: false
    })
  },
  {
    id: "align_comments",
    description: "Align trailing # comments within blocks",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: false,
      trimTrailingWhitespace: false,
      ensureFinalNewline: false,
      collapseBlankLines: false,
      indentBraces: false,
      alignComments: true,
      blankLineBetweenFrames: false
    })
  },
  {
    id: "blank_line_between_frames",
    description: "Exactly one blank line between top-level ^ frames",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: false,
      trimTrailingWhitespace: false,
      ensureFinalNewline: false,
      collapseBlankLines: false,
      indentBraces: false,
      alignComments: false,
      blankLineBetweenFrames: true,
      reflowProse: false
    })
  },
  {
    id: "reflow_prose",
    description: "Wrap block-level # / // prose comments to printWidth",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonSlice(s, ctx, {
      normalizeNewlines: true,
      trimTrailingWhitespace: true,
      ensureFinalNewline: false,
      collapseBlankLines: false,
      indentBraces: false,
      alignComments: false,
      blankLineBetweenFrames: false,
      reflowProse: true,
      printWidth: ctx.options.printWidth ?? 88
    })
  },
  {
    id: "equiv_seq_alias",
    description: "Rewrite npm run spw:seq -- \u2192 spw:ls --",
    stratum: "script",
    effectGrade: "effect.l1.memory",
    transform: (s) => s.replace(/npm run spw:seq --/g, "npm run spw:ls --")
  },
  {
    id: "equiv_wildcard",
    description: "Rewrite .* \u2192 *()",
    stratum: "script",
    effectGrade: "effect.l1.memory",
    transform: (s) => s.replace(/\.\*/g, "*()")
  },
  {
    id: "equiv_dot_postfix",
    description: "Normalize .! / .? style postfix sugar to bare sigil",
    stratum: "script",
    effectGrade: "effect.l1.memory",
    transform: (s) => s.replace(/\.([!?~@&*=%#$^_])/g, "$1")
  },
  {
    id: "layout_bundle",
    description: "Single-pass canonical layout bundle (newlines + trim + final nl)",
    stratum: "layout",
    effectGrade: "effect.l1.memory",
    transform: (s, ctx) => canonicalize(s, {
      ...ctx.options,
      normalizeNewlines: true,
      trimTrailingWhitespace: true,
      ensureFinalNewline: true
    }).source
  }
];
var RULE_BY_ID = new Map(BUILTIN_MUTATION_RULES.map((r) => [r.id, r]));
var MUTATION_PROFILES = {
  layout_canonical: {
    rules: ["layout_bundle"],
    effectCeiling: "effect.l1.memory",
    requireIdempotence: true
  },
  layout_full: {
    rules: [
      "normalize_newlines",
      "trim_trailing_whitespace",
      "reflow_prose",
      "indent_braces",
      "align_comments",
      "blank_line_between_frames",
      "collapse_blank_lines",
      "ensure_final_newline"
    ],
    effectCeiling: "effect.l1.memory",
    requireIdempotence: true
  },
  equiv_scripts: {
    rules: [
      "equiv_seq_alias",
      "equiv_wildcard",
      "equiv_dot_postfix",
      "layout_bundle"
    ],
    effectCeiling: "effect.l1.memory",
    requireIdempotence: true
  },
  measure_only: {
    rules: ["layout_bundle"],
    effectCeiling: "effect.l0.measure",
    dryRun: true,
    requireIdempotence: false
  }
};
function resolveMutationRules(config = {}) {
  const catalog = new Map(RULE_BY_ID);
  for (const custom of config.customRules ?? []) {
    catalog.set(custom.id, custom);
  }
  let ids;
  if (config.profile && Object.hasOwn(MUTATION_PROFILES, config.profile)) {
    ids = [...MUTATION_PROFILES[config.profile].rules];
  } else if (config.enabledRules?.length) {
    ids = [...config.enabledRules];
  } else {
    ids = [...MUTATION_PROFILES.layout_canonical.rules];
  }
  if (config.enabledRules?.length && config.profile) {
    const allow = new Set(config.enabledRules);
    ids = ids.filter((id) => allow.has(id));
  }
  if (config.disabledRules?.length) {
    const deny = new Set(config.disabledRules);
    ids = ids.filter((id) => !deny.has(id));
  }
  for (const custom of config.customRules ?? []) {
    if (!ids.includes(custom.id)) ids.push(custom.id);
  }
  const rules = [];
  for (const id of ids) {
    const rule = catalog.get(id);
    if (rule) rules.push(rule);
  }
  return rules;
}
function planRuleDifferential(source, rule, ctx) {
  const after = rule.transform(source, ctx);
  return differentialFromSources(source, after, rule.id, rule.stratum, hashString);
}
function planMutationPass(source, rules, ctx) {
  let current2 = source;
  const intermediate = [];
  let vector = zeroVector();
  for (const rule of rules) {
    const diff = planRuleDifferential(current2, rule, ctx);
    intermediate.push({
      step: ctx.step,
      ruleId: rule.id,
      differential: diff,
      applied: false
    });
    if (!diff.identity) {
      current2 = applyEdits(current2, diff.edits);
      vector = mergeVectors(vector, diff.vector);
    }
  }
  const composed = differentialFromSources(
    source,
    current2,
    "pipeline_pass",
    "operation",
    hashString
  );
  return { intermediate, finalSource: current2, composed, vector };
}
function runMutationAutomata(source, config = {}) {
  const profileId = Object.hasOwn(MUTATION_PROFILES, config.profile) ? config.profile : config.profile ? String(config.profile) : "layout_canonical";
  const profileDefaults = Object.hasOwn(MUTATION_PROFILES, profileId) ? MUTATION_PROFILES[profileId] : MUTATION_PROFILES.layout_canonical;
  const effectCeiling = config.effectCeiling ?? profileDefaults.effectCeiling ?? "effect.l1.memory";
  const dryRun = config.dryRun ?? profileDefaults.dryRun ?? false;
  const maxSteps = config.maxSteps ?? 8;
  const requireIdempotence = config.requireIdempotence ?? profileDefaults.requireIdempotence ?? true;
  const rules = resolveMutationRules({
    ...config,
    profile: Object.hasOwn(MUTATION_PROFILES, profileId) ? profileId : config.profile
  });
  const options = {
    ...DEFAULT_CANONICAL,
    ...config.canonicalOptions
  };
  const inputHash = hashString(source);
  const steps = [];
  let current2 = source;
  let plannedSource = source;
  let vector = zeroVector();
  let stopReason = "fixed_point";
  const rulesResolved = rules.map((rule) => rule.id);
  const planOnly = dryRun || effectCeiling === "effect.l0.measure";
  const blockedRules = planOnly ? [] : rules.filter((rule) => !effectGradeAtMost(rule.effectGrade, effectCeiling));
  const canApply = !planOnly && blockedRules.length === 0;
  const blockedReason = blockedRules.length > 0 ? `atomic profile blocked by ${blockedRules.map((rule) => `${rule.id}:${rule.effectGrade}`).join(",")}` : void 0;
  try {
    for (let step = 0; step < maxSteps; step++) {
      const ctx = {
        step,
        options,
        params: config.params ?? {}
      };
      const pass = planMutationPass(current2, rules, ctx);
      plannedSource = pass.finalSource;
      for (const s of pass.intermediate) {
        const changedStep = !s.differential.identity;
        steps.push({
          ...s,
          applied: canApply && changedStep,
          ...!canApply && changedStep ? { skippedReason: blockedReason ?? "plan_only" } : {}
        });
      }
      vector = mergeVectors(vector, pass.vector);
      if (pass.finalSource === current2) {
        stopReason = blockedRules.length > 0 ? "authority_failure" : "fixed_point";
        break;
      }
      if (!canApply && !planOnly) {
        stopReason = "authority_failure";
        break;
      }
      current2 = pass.finalSource;
      if (requireIdempotence) {
        const check = planMutationPass(current2, rules, {
          ...ctx,
          step: step + 1
        });
        if (check.finalSource !== current2) {
          if (step + 1 >= maxSteps) {
            stopReason = "idempotence_failure";
          }
          continue;
        }
        stopReason = "fixed_point";
        break;
      }
      if (step + 1 >= maxSteps) {
        stopReason = "budget_exhausted";
      }
    }
    if (steps.length > 0 && stopReason === "fixed_point") {
      const lastChanged = steps.some((s) => !s.differential.identity);
      if (!lastChanged && current2 === source) {
        stopReason = "fixed_point";
      }
    }
  } catch {
    stopReason = "rule_error";
  }
  const resultSource = canApply ? current2 : source;
  const plannedDifferential = differentialFromSources(
    source,
    plannedSource,
    "mutation_run",
    "operation",
    hashString
  );
  const rulesApplied = [...new Set(
    steps.filter((step) => step.applied).map((step) => step.ruleId)
  )];
  return {
    source: resultSource,
    plannedSource,
    inputHash,
    outputHash: hashString(resultSource),
    plannedOutputHash: hashString(plannedSource),
    changed: resultSource !== source,
    wouldChange: plannedSource !== source,
    plannedDifferential,
    stopReason,
    steps,
    vector,
    profile: String(profileId),
    rulesResolved,
    rulesPlanned: rulesResolved,
    rulesApplied,
    rulesBlocked: blockedRules.map((rule) => ({
      ruleId: rule.id,
      effectGrade: rule.effectGrade
    })),
    rulesRun: rulesResolved,
    effectCeiling,
    dryRun: planOnly,
    requiresWriteAuthority: plannedSource !== source
  };
}
function planMutation(source, config = {}) {
  return runMutationAutomata(source, {
    ...config,
    dryRun: true,
    effectCeiling: config.effectCeiling ?? "effect.l0.measure"
  });
}
function collectPlannedEdits(result) {
  return result.plannedDifferential.edits.map((edit) => ({ ...edit }));
}
function mutationRulesAsSequenceContext(config = {}) {
  const options = {
    ...DEFAULT_CANONICAL,
    ...config.canonicalOptions
  };
  const ctx = {
    step: 0,
    options,
    params: config.params ?? {}
  };
  const rules = /* @__PURE__ */ new Map();
  for (const rule of BUILTIN_MUTATION_RULES) {
    rules.set(rule.id, (source) => rule.transform(source, ctx));
  }
  for (const rule of config.customRules ?? []) {
    rules.set(rule.id, (source) => rule.transform(source, ctx));
  }
  return { rules };
}

// .spw/_workbench/packages/spw-seed/src/canonical/brace-projection.ts
function emptyKinds() {
  return { scope: 0, frame: 0, body: 0, capsule: 0, stream: 0, nrange: 0 };
}
function pairedKind(node) {
  switch (node.type) {
    case "Scope":
      return "scope";
    case "Frame":
      return "frame";
    case "Body":
      return "body";
    case "Capsule":
      return "capsule";
    case "Stream":
      return "stream";
    case "NRange":
      return "nrange";
    default:
      return null;
  }
}
function channelOfCapsule(node) {
  const cap = node;
  if (cap.type !== "Capsule") return null;
  if (cap.tag?.value) return cap.tag.value;
  if (cap.channel?.token?.value != null) return String(cap.channel.token.value);
  return null;
}
function isMedialCapsule(node) {
  const cap = node;
  if (cap.type !== "Capsule") return false;
  return cap.placement === "medial" || cap.left != null || cap.right != null;
}
function signatureOf(kinds, coupleOps, medials, shells, channels) {
  const kindPart = Object.keys(kinds).map((k) => `${k}:${kinds[k]}`).join(",");
  return `k{${kindPart}}|c${coupleOps}|m${medials}|s${shells}|ch[${channels.join("|")}]`;
}
function extractBraceProjection(sourceOrAst) {
  const kinds = emptyKinds();
  let coupleOps = 0;
  let medials = 0;
  let shells = 0;
  const channelBag = [];
  let root = typeof sourceOrAst === "string" ? parse(sourceOrAst).ast ?? null : sourceOrAst;
  if (!root) {
    return {
      kinds,
      coupleOps: 0,
      medials: 0,
      shells: 0,
      channels: [],
      signature: signatureOf(kinds, 0, 0, 0, [])
    };
  }
  walkAST(root, (node) => {
    const kind = pairedKind(node);
    if (kind) {
      kinds[kind] += 1;
      if (kind === "capsule") {
        if (isMedialCapsule(node)) medials += 1;
        else shells += 1;
        const ch = channelOfCapsule(node);
        if (ch != null && ch !== "") channelBag.push(ch);
      }
    }
    if (node.type === "Operation" && node.operator?.value === "<>") {
      coupleOps += 1;
    }
  });
  const channels = [...channelBag].sort();
  return {
    kinds,
    coupleOps,
    medials,
    shells,
    channels,
    signature: signatureOf(kinds, coupleOps, medials, shells, channels)
  };
}
function multisetDiff(before, after) {
  const b = [...before];
  const a = [...after];
  const removed = [];
  const added = [];
  for (const x of b) {
    const i = a.indexOf(x);
    if (i >= 0) a.splice(i, 1);
    else removed.push(x);
  }
  for (const x of a) added.push(x);
  return { added, removed };
}
function braceProjectionDelta(before, after) {
  const kindDeltas = emptyKinds();
  let kindMoved = false;
  for (const k of Object.keys(kindDeltas)) {
    kindDeltas[k] = after.kinds[k] - before.kinds[k];
    if (kindDeltas[k] !== 0) kindMoved = true;
  }
  const coupleOpsDelta = after.coupleOps - before.coupleOps;
  const medialsDelta = after.medials - before.medials;
  const shellsDelta = after.shells - before.shells;
  const { added: channelsAdded, removed: channelsRemoved } = multisetDiff(
    before.channels,
    after.channels
  );
  const findings = [];
  if (kindMoved) {
    const parts = Object.entries(kindDeltas).filter(([, v]) => v !== 0).map(([k, v]) => `${k}${v > 0 ? "+" : ""}${v}`);
    findings.push(`brace kinds: ${parts.join(" ")}`);
  }
  if (coupleOpsDelta !== 0) {
    findings.push(`couple ops \u0394=${coupleOpsDelta > 0 ? "+" : ""}${coupleOpsDelta}`);
  }
  if (medialsDelta !== 0 || shellsDelta !== 0) {
    findings.push(
      `placement medials\u0394=${medialsDelta > 0 ? "+" : ""}${medialsDelta} shells\u0394=${shellsDelta > 0 ? "+" : ""}${shellsDelta}`
    );
  }
  if (channelsAdded.length || channelsRemoved.length) {
    const bits = [];
    if (channelsAdded.length) bits.push(`+${channelsAdded.join(",")}`);
    if (channelsRemoved.length) bits.push(`-${channelsRemoved.join(",")}`);
    findings.push(`channels ${bits.join(" ")}`);
  }
  const equal = before.signature === after.signature;
  let severity = "none";
  if (!equal) {
    if (kindMoved) severity = "kind";
    else if (coupleOpsDelta !== 0) severity = "couple";
    else if (medialsDelta !== 0 || shellsDelta !== 0) severity = "placement";
    else if (channelsAdded.length || channelsRemoved.length) severity = "channel";
    else severity = "kind";
  } else {
    severity = "layout_ok";
  }
  return {
    equal,
    severity: equal ? "none" : severity,
    kindDeltas,
    coupleOpsDelta,
    medialsDelta,
    shellsDelta,
    channelsAdded,
    channelsRemoved,
    findings
  };
}
function classifyMutationUsefulness(input) {
  const findings = [];
  if (!input.changed) {
    return {
      class: "noop",
      advice: "No planned edits \u2014 fixed point; nothing to apply.",
      writeSafeLayout: false,
      findings
    };
  }
  if (input.healthRegressed || !input.parseHealthy) {
    findings.push("parse health regressed or unhealthy");
    return {
      class: "refuse_health",
      advice: "Refuse write \u2014 restore parse health before mutation.",
      writeSafeLayout: false,
      findings
    };
  }
  if (!input.braceEqual) {
    findings.push("brace projection drifted (kind/placement/channel)");
    return {
      class: "review_structure",
      advice: "Review structure \u2014 brace projection changed; not a layout-only pulse. Use --diff and inspect channels/kinds.",
      writeSafeLayout: false,
      findings
    };
  }
  if (input.structureMoved) {
    findings.push("structure metrics moved with brace projection stable");
    return {
      class: "review_structure",
      advice: "Review structure \u2014 depth/container counts moved; confirm intentional.",
      writeSafeLayout: false,
      findings
    };
  }
  if (input.layoutOnlyCandidate && input.layoutVectorPositive && !input.nonLayoutVectorAxes) {
    return {
      class: "layout_safe",
      advice: "Layout-safe candidate \u2014 brace projection stable; --write layout_canonical allowed if policy matches.",
      writeSafeLayout: true,
      findings: ["brace projection equal", "layout-only topography candidate"]
    };
  }
  return {
    class: "unknown",
    advice: "Changed but not classified as layout-safe \u2014 inspect vector axes and --diff before write.",
    writeSafeLayout: false,
    findings: ["surface or script axes moved without full layout-only evidence"]
  };
}

// .spw/_workbench/packages/spw-seed/src/canonical/topography-probe.ts
function emptyContainers() {
  return { scope: 0, frame: 0, body: 0, capsule: 0, stream: 0, nrange: 0 };
}
function pairedKind2(node) {
  switch (node.type) {
    case "Scope":
      return "scope";
    case "Frame":
      return "frame";
    case "Body":
      return "body";
    case "Capsule":
      return "capsule";
    case "Stream":
      return "stream";
    case "NRange":
      return "nrange";
    default:
      return null;
  }
}
function lexemesAreClosed(tokens) {
  return tokens.every((token3) => {
    if (token3.type === "COMMENT" && token3.kind === "block") {
      return token3.value.endsWith("*/");
    }
    if (token3.type === "PHRASE") {
      return token3.value.startsWith("`") && endsWithUnescapedDelimiter(token3.value, "`");
    }
    if (token3.type === "STRING") {
      const q = token3.value[0];
      return (q === '"' || q === "'") && token3.value.startsWith(q) && endsWithUnescapedDelimiter(token3.value, q);
    }
    return true;
  });
}
function endsWithUnescapedDelimiter(value, delimiter) {
  if (value.length < 2 || value.at(-1) !== delimiter) return false;
  let precedingBackslashes = 0;
  for (let index = value.length - 2; index >= 0 && value[index] === "\\"; index -= 1) {
    precedingBackslashes += 1;
  }
  return precedingBackslashes % 2 === 0;
}
function snapshotTopography(source) {
  const output = parse(source);
  const { tokens, ast, errors } = output;
  const significantTokens = tokens.filter(
    (t) => t.type !== "WHITESPACE" && t.type !== "COMMENT" && t.type !== "EOF"
  ).length;
  const proseFallback = ast?.expression?.type === "Prose";
  const nonRecoverableError = errors.some(
    (error) => error.data?.recoverable === false
  );
  const lexemesClosed = lexemesAreClosed(tokens);
  const reasons = [];
  if (!output.success) reasons.push("parser_failure");
  if (!ast) reasons.push("missing_ast");
  if (nonRecoverableError) reasons.push("non_recoverable_error");
  if (!lexemesClosed) reasons.push("unterminated_lexeme");
  const invalid = reasons.length > 0;
  if (!invalid && errors.length > 0) reasons.push("recoverable_errors");
  if (!invalid && proseFallback) reasons.push("prose_fallback");
  const parseHealth = invalid ? "invalid" : reasons.length > 0 ? "recovered" : "complete_structured";
  const recognizedPairedContainers = ast ? emptyContainers() : null;
  let explicitCoupleOperations = ast ? 0 : null;
  let maxPairedContainerDepth = ast ? 0 : null;
  const braceProjection = extractBraceProjection(ast ?? null);
  if (ast && recognizedPairedContainers) {
    walkAST(ast, (node, path) => {
      const kind = pairedKind2(node);
      if (kind) recognizedPairedContainers[kind] += 1;
      if (node.type === "Operation" && node.operator?.value === "<>") {
        explicitCoupleOperations = (explicitCoupleOperations ?? 0) + 1;
      }
      const ancestorPaired = path.reduce(
        (depth, ancestor) => depth + (pairedKind2(ancestor) ? 1 : 0),
        0
      );
      const nodeDepth = ancestorPaired + (kind ? 1 : 0);
      if (maxPairedContainerDepth === null || nodeDepth > maxPairedContainerDepth) {
        maxPairedContainerDepth = nodeDepth;
      }
    });
  }
  return {
    parseHealth,
    parserSuccess: output.success,
    proseFallback: Boolean(proseFallback),
    lexemesClosed,
    braceProjection,
    tokenCount: tokens.filter((t) => t.type !== "EOF").length,
    significantTokens,
    maxAstDepth: ast ? getMaxDepth(ast) : null,
    maxPairedContainerDepth,
    recognizedPairedContainers,
    explicitCoupleOperations,
    reasons,
    sourceLength: source.length
  };
}
function healthRank(h) {
  if (h === "complete_structured") return 2;
  if (h === "recovered") return 1;
  return 0;
}
function topographyDelta(before, after) {
  const maxAstDepthDelta = before.maxAstDepth !== null && after.maxAstDepth !== null ? after.maxAstDepth - before.maxAstDepth : null;
  const maxPairedContainerDepthDelta = before.maxPairedContainerDepth !== null && after.maxPairedContainerDepth !== null ? after.maxPairedContainerDepth - before.maxPairedContainerDepth : null;
  let containerDeltas = null;
  let containerMoved = false;
  if (before.recognizedPairedContainers && after.recognizedPairedContainers) {
    containerDeltas = emptyContainers();
    for (const key of Object.keys(containerDeltas)) {
      containerDeltas[key] = after.recognizedPairedContainers[key] - before.recognizedPairedContainers[key];
      if (containerDeltas[key] !== 0) containerMoved = true;
    }
  }
  const coupleOpsDelta = before.explicitCoupleOperations !== null && after.explicitCoupleOperations !== null ? after.explicitCoupleOperations - before.explicitCoupleOperations : null;
  const brace = braceProjectionDelta(before.braceProjection, after.braceProjection);
  const structureMoved = containerMoved || maxAstDepthDelta !== null && maxAstDepthDelta !== 0 || maxPairedContainerDepthDelta !== null && maxPairedContainerDepthDelta !== 0 || coupleOpsDelta !== null && coupleOpsDelta !== 0 || !brace.equal;
  const surfaceMoved = before.tokenCount !== after.tokenCount || before.significantTokens !== after.significantTokens || before.sourceLength !== after.sourceLength;
  const parseHealthChanged = before.parseHealth !== after.parseHealth;
  const healthRegressed = healthRank(after.parseHealth) < healthRank(before.parseHealth);
  return {
    parseHealthChanged,
    parseHealthBefore: before.parseHealth,
    parseHealthAfter: after.parseHealth,
    healthRegressed,
    maxAstDepthDelta,
    maxPairedContainerDepthDelta,
    tokenCountDelta: after.tokenCount - before.tokenCount,
    significantTokenDelta: after.significantTokens - before.significantTokens,
    coupleOpsDelta,
    containerDeltas,
    sourceLengthDelta: after.sourceLength - before.sourceLength,
    structureMoved,
    layoutOnlyCandidate: !structureMoved && brace.equal && !parseHealthChanged && !healthRegressed && surfaceMoved && before.parseHealth === after.parseHealth,
    brace
  };
}
function findingsFrom(mutation, delta, plannedDelta) {
  const lines = [];
  lines.push(
    `stop=${mutation.stopReason} profile=${mutation.profile} changed=${mutation.changed} dryRun=${mutation.dryRun}`
  );
  lines.push(
    `vector edits=${mutation.vector.edit_count} layout=${mutation.vector.layout_delta} script=${mutation.vector.script_delta} bytes=${mutation.vector.bytes_delta}`
  );
  const d = plannedDelta;
  lines.push(
    `topo health ${d.parseHealthBefore} \u2192 ${d.parseHealthAfter}` + (d.healthRegressed ? " (REGRESSED)" : d.parseHealthChanged ? " (changed)" : " (stable)")
  );
  if (d.brace.equal) {
    lines.push("brace projection: stable (kinds/placement/channels)");
  } else {
    lines.push(`brace projection: DRIFT severity=${d.brace.severity}`);
    for (const f of d.brace.findings.slice(0, 4)) {
      lines.push(`  brace \xB7 ${f}`);
    }
  }
  if (d.layoutOnlyCandidate) {
    lines.push("topo layout-only candidate: brace+structure stable, surface metrics moved");
  }
  if (d.structureMoved) {
    lines.push(
      `topo structure moved: astDepth\u0394=${d.maxAstDepthDelta ?? "n/a"} pairedDepth\u0394=${d.maxPairedContainerDepthDelta ?? "n/a"} couple\u0394=${d.coupleOpsDelta ?? "n/a"}`
    );
  }
  if (d.containerDeltas) {
    const parts = Object.entries(d.containerDeltas).filter(([, v]) => v !== 0).map(([k, v]) => `${k}${v > 0 ? "+" : ""}${v}`);
    if (parts.length) lines.push(`topo containers: ${parts.join(" ")}`);
  }
  const use = classifyMutationUsefulness({
    changed: mutation.changed,
    healthRegressed: d.healthRegressed,
    parseHealthy: d.parseHealthBefore === "complete_structured" && d.parseHealthAfter === "complete_structured",
    braceEqual: d.brace.equal,
    structureMoved: d.structureMoved,
    layoutOnlyCandidate: d.layoutOnlyCandidate,
    layoutVectorPositive: mutation.vector.layout_delta > 0,
    nonLayoutVectorAxes: mutation.vector.token_delta !== 0 || mutation.vector.structure_delta !== 0 || mutation.vector.label_delta !== 0 || mutation.vector.reference_delta !== 0 || mutation.vector.script_delta !== 0
  });
  lines.push(`use: ${use.class} \u2014 ${use.advice}`);
  if (!mutation.changed && mutation.vector.edit_count === 0) {
    lines.push("fixed point: no planned edits");
  }
  if (mutation.requiresWriteAuthority) {
    lines.push("effect.l2.workspace write authority required to persist");
  }
  if (mutation.dryRun && plannedDelta.sourceLengthDelta !== delta.sourceLengthDelta) {
    lines.push("dry-run: applied snapshot unchanged; planned delta above is virtual");
  }
  return lines;
}
function probeMutationTopography(source, config = { profile: "layout_canonical", dryRun: true }) {
  const before = snapshotTopography(source);
  const mutation = runMutationAutomata(source, {
    dryRun: true,
    ...config
  });
  const plannedAfter = snapshotTopography(mutation.plannedSource);
  const after = snapshotTopography(mutation.source);
  const delta = topographyDelta(before, after);
  const plannedDelta = topographyDelta(before, plannedAfter);
  const usefulness = classifyMutationUsefulness({
    changed: mutation.changed,
    healthRegressed: plannedDelta.healthRegressed,
    parseHealthy: plannedDelta.parseHealthBefore === "complete_structured" && plannedDelta.parseHealthAfter === "complete_structured",
    braceEqual: plannedDelta.brace.equal,
    structureMoved: plannedDelta.structureMoved,
    layoutOnlyCandidate: plannedDelta.layoutOnlyCandidate,
    layoutVectorPositive: mutation.vector.layout_delta > 0,
    nonLayoutVectorAxes: mutation.vector.token_delta !== 0 || mutation.vector.structure_delta !== 0 || mutation.vector.label_delta !== 0 || mutation.vector.reference_delta !== 0 || mutation.vector.script_delta !== 0
  });
  plannedDelta.usefulness = usefulness;
  delta.usefulness = usefulness;
  return {
    mutation,
    before,
    after,
    plannedAfter,
    delta,
    plannedDelta,
    vector: mutation.vector,
    findings: findingsFrom(mutation, delta, plannedDelta)
  };
}

// .spw/_workbench/packages/spw-seed/src/canonical/geometry-inspect-sigils.ts
var SIGIL_CHARS = ["^", "!", "?", "~", "*", "=", "@", "#", ".", "&", "$", "%"];

// .spw/_workbench/packages/spw-seed/src/canonical/geometry-inspect.ts
var ROLES = {
  "^": "integrate / frame",
  "!": "action / inject",
  "?": "wonder / probe",
  "~": "potential / path",
  "*": "value / collapse",
  "=": "config / bias",
  "@": "perspective / root",
  "#": "annotation / resonance",
  ".": "ground / facet",
  "&": "confluence / merge",
  $: "select / address",
  "%": "measure"
};
var SIGIL_SET = new Set(SIGIL_CHARS);
function inspectGeometry(source) {
  const braces = extractBraceProjection(source);
  const operators = censusOperators(source);
  const nesting = nestingStats(source);
  const lessons = buildLessons(braces, operators, nesting);
  return {
    version: "spw.geometry/1",
    braces,
    operators,
    nesting,
    lessons
  };
}
function censusOperators(source) {
  const counts = /* @__PURE__ */ new Map();
  let total = 0;
  for (const ch of source) {
    if (!SIGIL_SET.has(ch)) continue;
    counts.set(ch, (counts.get(ch) ?? 0) + 1);
    total++;
  }
  return [...counts.entries()].map(([sigil, count]) => ({
    sigil,
    count,
    percent: total > 0 ? count / total * 100 : 0,
    role: ROLES[sigil] ?? "operator"
  })).sort((a, b) => b.count - a.count || a.sigil.localeCompare(b.sigil));
}
function nestingStats(source) {
  let depth = 0;
  let maxDepth = 0;
  let deepLines = 0;
  for (const line of source.split(/\r?\n/)) {
    let lineMax = depth;
    for (const ch of line) {
      if (ch === "{" || ch === "[" || ch === "(") {
        depth++;
        if (depth > maxDepth) maxDepth = depth;
        if (depth > lineMax) lineMax = depth;
      } else if (ch === "}" || ch === "]" || ch === ")") {
        depth = Math.max(0, depth - 1);
      }
    }
    if (lineMax >= 2) deepLines++;
  }
  return { maxDepth, openBalance: depth, deepLines };
}
function buildLessons(braces, operators, nesting) {
  const out = [];
  const k = braces.kinds;
  const totalBraces = k.scope + k.frame + k.body + k.capsule + k.stream + k.nrange;
  if (totalBraces === 0) {
    out.push("No paired braces detected \u2014 surface may be prose-heavy or linear.");
  } else {
    const dominant = [
      ["body {}", k.body],
      ["frame []", k.frame],
      ["scope ()", k.scope],
      ["capsule <>", k.capsule],
      ["stream <<>>", k.stream],
      ["nrange (())", k.nrange]
    ].filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1])[0];
    if (dominant) {
      out.push(`Dominant bound: ${dominant[0]} \xD7${dominant[1]} \u2014 geometry centers there.`);
    }
  }
  if (braces.medials > 0) {
    out.push(
      `Medial capsules \xD7${braces.medials} (channels: ${braces.channels.slice(0, 6).join(", ") || "\u2014"}) \u2014 inline geometry, not only shells.`
    );
  }
  if (braces.coupleOps > 0) {
    out.push(`Couple ops \xD7${braces.coupleOps} \u2014 peer relations bind geometry across sites.`);
  }
  const topOp = operators[0];
  if (topOp) {
    out.push(
      `Operator rhythm led by ${topOp.sigil} (${topOp.role}) \u2014 ${topOp.percent.toFixed(0)}% of sigils.`
    );
  }
  if (nesting.maxDepth >= 3) {
    out.push(
      `Nesting maxDepth=${nesting.maxDepth} \u2014 deep form; prefer local labels before long-range &.`
    );
  } else if (nesting.maxDepth <= 1 && totalBraces > 0) {
    out.push("Shallow nesting \u2014 good for teaching contours one bound at a time.");
  }
  if (nesting.openBalance !== 0) {
    out.push(`Unbalanced open braces (balance=${nesting.openBalance}) \u2014 check close pairs.`);
  }
  out.push("Learn: empty \u2192 inhabit \u2192 label/select \u2192 path/ref \u2192 fold (form-ladders).");
  return out;
}
function formatGeometryReport(r) {
  const k = r.braces.kinds;
  const opTotal = r.operators.reduce((a, o) => a + o.count, 0);
  const lines = [
    `# spw geometry  braces=${k.scope + k.frame + k.body + k.capsule + k.stream + k.nrange}  ops=${opTotal}  maxDepth=${r.nesting.maxDepth}`,
    `kinds  ()=${k.scope}  []=${k.frame}  {}=${k.body}  <>=${k.capsule}  <<>>=${k.stream}  (())=${k.nrange}`,
    `couple=${r.braces.coupleOps}  medials=${r.braces.medials}  shells=${r.braces.shells}  channels=${r.braces.channels.slice(0, 8).join(",") || "\u2014"}`,
    `signature  ${r.braces.signature.slice(0, 16)}\u2026`,
    "",
    "operators"
  ];
  for (const o of r.operators.slice(0, 12)) {
    lines.push(
      `  ${o.sigil}  ${String(o.count).padStart(4)}  ${o.percent.toFixed(1).padStart(5)}%  ${o.role}`
    );
  }
  lines.push("", "lessons");
  for (const L of r.lessons) lines.push(`  \xB7 ${L}`);
  return lines.join("\n");
}

// .spw/_workbench/packages/spw-seed/src/canonical/operational-transform.ts
function editLengthDelta(edit) {
  return edit.newText.length - (edit.end - edit.start);
}
function transformEdit(op, against) {
  if (against.end <= op.start) {
    const d = editLengthDelta(against);
    return {
      edit: {
        ...op,
        start: op.start + d,
        end: op.end + d
      }
    };
  }
  if (against.start >= op.end) {
    return { edit: { ...op } };
  }
  if (against.start === op.start && against.end === op.end && against.newText === op.newText) {
    return { edit: null, conflict: "identical" };
  }
  if (against.start <= op.start && against.end >= op.end) {
    return { edit: null, conflict: "contained" };
  }
  if (op.start <= against.start && op.end >= against.end) {
    return { edit: null, conflict: "overlap" };
  }
  return { edit: null, conflict: "overlap" };
}
function transformEditList(ops, againstList) {
  let current2 = [...ops];
  const conflicts = [];
  for (const against of againstList) {
    const next = [];
    for (const op of current2) {
      const r = transformEdit(op, against);
      if (r.edit) next.push(r.edit);
      else if (r.conflict && r.conflict !== "identical") {
        conflicts.push({ op, conflict: r.conflict });
      }
    }
    current2 = next;
  }
  return { edits: current2, conflicts };
}
function foldEdits(edits, options = {}) {
  if (edits.length === 0) return [];
  const ordered = [...edits].sort((a, b) => a.start - b.start || a.end - b.end);
  if (!options.mergeAdjacent) return ordered;
  const out = [];
  for (const e of ordered) {
    const prev = out[out.length - 1];
    if (prev && prev.end === e.start && prev.ruleId === e.ruleId && prev.stratum === e.stratum) {
      out[out.length - 1] = {
        ...prev,
        end: e.end,
        newText: prev.newText + e.newText
      };
    } else {
      out.push({ ...e });
    }
  }
  return out;
}
function foldTransforms(source, transforms) {
  let current2 = source;
  const steps = [];
  let vector = zeroVector();
  for (const t of transforms) {
    const next = t.apply(current2);
    const differential = differentialFromSources(
      current2,
      next,
      t.id,
      t.stratum,
      hashString
    );
    steps.push({ id: t.id, differential, source: next });
    if (!differential.identity) {
      vector = mergeVectors(vector, differential.vector);
    }
    current2 = next;
  }
  const folded = differentialFromSources(
    source,
    current2,
    "fold",
    "operation",
    hashString
  );
  return { source: current2, steps, folded, vector };
}
function composeEditLists(base, first, second) {
  const a = foldEdits(first);
  const mid = applyEdits(base, a);
  const { edits: rebased, conflicts } = transformEditList(second, a);
  const b = foldEdits(rebased);
  const source = applyEdits(mid, b);
  const composed = differentialFromSources(base, source, "compose", "operation", hashString);
  return { edits: composed.edits, source, conflicts };
}
function composeSequence(base, stages) {
  return foldTransforms(base, stages);
}
var MUTATION_VECTOR_AXES = [
  "layout_delta",
  "token_delta",
  "structure_delta",
  "label_delta",
  "reference_delta",
  "script_delta",
  "edit_count",
  "bytes_delta"
];
var STRATUM_ORDER = [
  "source",
  "structure",
  "layout",
  "reference",
  "operation",
  "script"
];
function vectorToArray(v) {
  return MUTATION_VECTOR_AXES.map((axis) => v[axis]);
}
function vectorMagnitude(v) {
  return Math.abs(v.layout_delta) + Math.abs(v.token_delta) + Math.abs(v.structure_delta) + Math.abs(v.label_delta) + Math.abs(v.reference_delta) + Math.abs(v.script_delta) + Math.abs(v.edit_count);
}
function matrixFromVectors(rows) {
  return {
    rows: rows.map((r) => r.id),
    cols: MUTATION_VECTOR_AXES,
    data: rows.map((r) => vectorToArray(r.vector))
  };
}
function matrixByStratum(entries) {
  const acc = /* @__PURE__ */ new Map();
  for (const s of STRATUM_ORDER) acc.set(s, zeroVector());
  for (const e of entries) {
    acc.set(e.stratum, mergeVectors(acc.get(e.stratum) ?? zeroVector(), e.vector));
  }
  return matrixFromVectors(
    STRATUM_ORDER.map((stratum) => ({
      id: stratum,
      vector: acc.get(stratum) ?? zeroVector()
    }))
  );
}
function matrixTranspose(m) {
  const rows = [...m.cols];
  const cols = [...m.rows];
  const data = rows.map(
    (_, axisIndex) => m.data.map((row) => row[axisIndex] ?? 0)
  );
  return {
    rows,
    cols,
    data
  };
}
function formatMatrix(m, precision = 0) {
  const header = ["", ...m.cols].join("	");
  const body = m.data.map((row, i) => {
    const cells = row.map(
      (n) => precision === 0 ? String(n) : n.toFixed(precision)
    );
    return [m.rows[i], ...cells].join("	");
  });
  return [header, ...body].join("\n");
}
var OPERATIONAL_SEQUENCES = {
  layout_then_script: {
    id: "layout_then_script",
    description: "Canonical layout bundle, then equiv script rewrites",
    mode: "serial",
    steps: [
      { id: "layout_bundle", kind: "rule", target: "layout_bundle", stratum: "layout" },
      { id: "equiv_seq_alias", kind: "rule", target: "equiv_seq_alias", stratum: "script" },
      { id: "equiv_wildcard", kind: "rule", target: "equiv_wildcard", stratum: "script" },
      { id: "equiv_dot_postfix", kind: "rule", target: "equiv_dot_postfix", stratum: "script" }
    ]
  },
  script_then_layout: {
    id: "script_then_layout",
    description: "Script rewrites first, then layout (order sensitivity probe)",
    mode: "serial",
    steps: [
      { id: "equiv_seq_alias", kind: "rule", target: "equiv_seq_alias", stratum: "script" },
      { id: "equiv_wildcard", kind: "rule", target: "equiv_wildcard", stratum: "script" },
      { id: "equiv_dot_postfix", kind: "rule", target: "equiv_dot_postfix", stratum: "script" },
      { id: "layout_bundle", kind: "rule", target: "layout_bundle", stratum: "layout" }
    ]
  },
  layout_granular: {
    id: "layout_granular",
    description: "Granular layout rule sequence (fold of layout_full)",
    mode: "serial",
    steps: [
      { id: "normalize_newlines", kind: "rule", target: "normalize_newlines", stratum: "source" },
      { id: "trim_trailing_whitespace", kind: "rule", target: "trim_trailing_whitespace", stratum: "layout" },
      { id: "ensure_final_newline", kind: "rule", target: "ensure_final_newline", stratum: "layout" }
    ]
  },
  parallel_layout_script: {
    id: "parallel_layout_script",
    description: "Plan layout and script on same base, OT-compose (conflict probe)",
    mode: "parallel_plan",
    steps: [
      { id: "layout_bundle", kind: "rule", target: "layout_bundle", stratum: "layout" },
      { id: "equiv_seq_alias", kind: "rule", target: "equiv_seq_alias", stratum: "script" }
    ]
  }
};
function runOperationalSequence(source, sequence2, ctx) {
  const seq2 = typeof sequence2 === "string" ? OPERATIONAL_SEQUENCES[sequence2] : sequence2;
  if (!seq2) {
    throw new Error(`unknown operational sequence: ${String(sequence2)}`);
  }
  const inputHash = hashString(source);
  const conflicts = [];
  if (seq2.mode === "parallel_plan") {
    let current2 = source;
    const steps = [];
    let vector = zeroVector();
    let applied = [];
    for (const step of seq2.steps) {
      const apply = resolveStepApply(step, ctx);
      const planned = apply(source);
      const diff = differentialFromSources(
        source,
        planned,
        step.id,
        step.stratum ?? "operation",
        hashString
      );
      const { edits: rebased, conflicts: c } = transformEditList(diff.edits, applied);
      conflicts.push(...c);
      const mid = applyEdits(current2, rebased);
      const stepDiff = differentialFromSources(
        current2,
        mid,
        step.id,
        step.stratum ?? "operation",
        hashString
      );
      steps.push({ id: step.id, differential: stepDiff, source: mid });
      if (!stepDiff.identity) {
        vector = mergeVectors(vector, stepDiff.vector);
        applied = differentialFromSources(
          source,
          mid,
          seq2.id,
          "operation",
          hashString
        ).edits;
      }
      current2 = mid;
    }
    const folded = differentialFromSources(source, current2, seq2.id, "operation", hashString);
    return {
      sequenceId: seq2.id,
      mode: seq2.mode,
      source: current2,
      inputHash,
      outputHash: hashString(current2),
      changed: current2 !== source,
      steps,
      folded,
      vector,
      matrix: matrixFromVectors(steps.map((s) => ({ id: s.id, vector: s.differential.vector }))),
      conflicts
    };
  }
  const transforms = seq2.steps.map((step) => ({
    id: step.id,
    stratum: step.stratum ?? "operation",
    apply: resolveStepApply(step, ctx)
  }));
  const foldedRun = foldTransforms(source, transforms);
  return {
    sequenceId: seq2.id,
    mode: seq2.mode,
    source: foldedRun.source,
    inputHash,
    outputHash: hashString(foldedRun.source),
    changed: foldedRun.source !== source,
    steps: foldedRun.steps,
    folded: foldedRun.folded,
    vector: foldedRun.vector,
    matrix: matrixFromVectors(
      foldedRun.steps.map((s) => ({ id: s.id, vector: s.differential.vector }))
    ),
    conflicts
  };
}
function resolveStepApply(step, ctx) {
  if (step.kind === "custom" && step.apply) return step.apply;
  if (step.target && ctx.rules.has(step.target)) {
    return ctx.rules.get(step.target);
  }
  if (step.apply) return step.apply;
  return (s) => s;
}

// .spw/_workbench/packages/spw-seed/src/normalize.ts
function desugar(source) {
  let out = source;
  out = out.replace(/«([^»]*)»/g, "`$1`");
  out = out.replace(/([A-Za-z][A-Za-z0-9_-]*)\s*\{\s*\}/g, "{_$1 }_$1");
  out = out.replace(/([!?*^~=@])_([A-Za-z][A-Za-z0-9_-]*)/g, "$1($2)");
  return out;
}
function parseDesugared(input) {
  const normalized = desugar(input);
  return { source: normalized, ast: parse(normalized) };
}
function frameScalar(node) {
  if (!node || typeof node !== "object") return void 0;
  switch (node.type) {
    case "Literal":
      return node.token?.value;
    case "Identifier":
      return node.token?.value;
    case "Reference":
      return node.raw ?? node.path?.map((part) => part.value).join(".");
    case "PathRef":
      return node.path?.token?.value;
    case "ProseChunk":
      return node.text;
    case "Expression":
      if (node.terms?.length === 1) {
        return frameScalar(node.terms[0]);
      }
      return void 0;
    case "Parameter":
      return frameScalar(node.value);
    default:
      return void 0;
  }
}
function extractFrameBindings(frame) {
  if (!frame?.content || !Array.isArray(frame.content)) {
    return {};
  }
  const bindings = {};
  let positionalAssigned = false;
  for (const item of frame.content) {
    if (!item || typeof item !== "object") {
      continue;
    }
    if (item.type === "Parameter") {
      const paramValue = frameScalar(item.value);
      const paramName = item.name?.value;
      if (paramName && paramValue !== void 0) {
        bindings[paramName] = paramValue;
        continue;
      }
      if (!positionalAssigned && paramValue !== void 0) {
        bindings.value = paramValue;
        positionalAssigned = true;
      }
      continue;
    }
    const scalar = frameScalar(item);
    if (!positionalAssigned && scalar !== void 0) {
      bindings.value = scalar;
      positionalAssigned = true;
    }
  }
  return bindings;
}
function extractValence(op) {
  const modifiers = op.modifiers?.modifiers;
  if (!Array.isArray(modifiers) || modifiers.length === 0) {
    return void 0;
  }
  return modifiers.map((modifier2) => modifier2.value).filter((modifier2) => typeof modifier2 === "string");
}
function normalizeToONF(node) {
  switch (node.type) {
    case "Seed":
      return normalizeToONF(node.expression);
    case "Expression": {
      const expr = node;
      if (!expr.connectors || expr.connectors.length === 0) {
        if (expr.terms && expr.terms.length > 0) return normalizeToONF(expr.terms[0]);
        return { sigil: "_", args: [], frames: { reg: "empty" } };
      }
      let current2 = normalizeToONF(expr.terms[0]);
      for (let i = 0; i < expr.connectors.length; i++) {
        const connector2 = expr.connectors[i].value;
        const right = normalizeToONF(expr.terms[i + 1]);
        const reg = connector2 === "/" ? "proj" : "conn";
        current2 = {
          sigil: connector2,
          args: [current2, right],
          frames: { reg }
        };
      }
      return current2;
    }
    case "Operation": {
      const op = node;
      const sigil = op.operator.value;
      const args = [];
      if (op.subject) args.push(normalizeToONF(op.subject));
      if (op.body) args.push(normalizeToONF(op.body));
      if (op.linePayload) args.push(normalizeToONF(op.linePayload));
      const frameArgs = op.frame ? (op.frame.content ?? []).map((content) => normalizeToONF(content)) : [];
      if (sigil === "<>" && frameArgs.length > 0) {
        args.push(...frameArgs);
      }
      let reg = "op";
      const hasFrameOnly = Boolean(op.frame && !op.body && !op.subject);
      const hasBodyOnly = Boolean(op.body && !op.frame && !op.subject);
      switch (sigil) {
        case "!":
          reg = "hydrate";
          break;
        case "~":
          reg = "defer";
          break;
        case "*":
          reg = "collapse";
          break;
        case "=":
          reg = "config";
          break;
        case "@":
          reg = "observe";
          break;
        case "#":
          reg = hasFrameOnly ? "set" : "resonate";
          break;
        case "&":
          reg = "merge";
          break;
        case "^":
          reg = "integrate";
          break;
        case "?":
          reg = "probe";
          break;
        case "%":
          reg = "measure";
          break;
        case "$":
          reg = "substrate";
          break;
        case ".":
          reg = hasBodyOnly ? "facet" : "property";
          break;
        case "<>":
          reg = "couple";
          break;
      }
      let frames = {
        reg,
        ...extractFrameBindings(op.frame)
      };
      if (sigil === "<>") {
        frames = withCoupling(frames, "couple", {
          args,
          argCount: args.length
        });
      }
      if (op.frame && frameArgs.length > 1) {
        frames.select = {
          armCount: frameArgs.length,
          named: frameArgs.filter((a) => a?.frames?.reg === "parameter" && a?.frames?.name).length
        };
      }
      if (op.frame && !op.body) {
        frames.bound = withCoupling({}, "frame", {
          args: frameArgs,
          argCount: frameArgs.length,
          actPlacement: "prefix",
          product: hasFrameOnly && (sigil === "#" || sigil === "&" || sigil === "?") ? "select" : void 0
        }).coupling;
      }
      if (op.body && !op.frame && sigil !== "=") {
        const bodyArgs = op.body.sequence ? op.body.sequence.expressions.map((e) => normalizeToONF(e)) : [];
        frames.bound = withCoupling({}, "body", {
          args: bodyArgs,
          argCount: bodyArgs.length,
          actPlacement: "prefix",
          product: hasBodyOnly && sigil === "." ? "facet" : void 0
        }).coupling;
      }
      if (sigil === "=" && op.body) {
        const bodyArgs = op.body.sequence ? op.body.sequence.expressions.map((e) => normalizeToONF(e)) : [];
        frames.bound = withCoupling({}, "body", {
          args: bodyArgs,
          argCount: bodyArgs.length,
          actPlacement: "prefix",
          product: "bias"
        }).coupling;
      }
      const valence = extractValence(op);
      if (valence && valence.length > 0) {
        frames.valence = valence;
      }
      if (op.operatorLabel?.value) {
        frames.label = op.operatorLabel.value;
      }
      if (op.position === "prefix" || op.position === "postfix") {
        frames.fixity = op.position;
      }
      return { sigil, args, frames };
    }
    case "Capsule": {
      const cap = node;
      const open = cap.open?.value ?? "<";
      const bodyArgs = cap.body && cap.body.sequence ? cap.body.sequence.expressions.map((e) => normalizeToONF(e)) : [];
      if (open === "#[") {
        return {
          sigil: "#",
          args: bodyArgs,
          frames: withCoupling({ reg: "set" }, "frame", { args: bodyArgs, argCount: bodyArgs.length })
        };
      }
      if (open === ".{") {
        return {
          sigil: ".",
          args: bodyArgs,
          frames: withCoupling({ reg: "facet" }, "body", { args: bodyArgs, argCount: bodyArgs.length })
        };
      }
      let channel = cap.tag?.value;
      let channelKind = channel !== void 0 ? "id" : void 0;
      if (cap.channel?.type === "Literal") {
        channel = String(cap.channel.token?.value ?? "");
        const lt = cap.channel.token?.type;
        channelKind = lt === "NUMBER" ? "number" : lt === "BOOLEAN" ? "boolean" : "string";
      } else if (cap.channel?.type === "Identifier") {
        channel = cap.channel.token?.value ?? channel;
        channelKind = "id";
      }
      const left = cap.left ? normalizeToONF(cap.left) : void 0;
      const right = cap.right ? normalizeToONF(cap.right) : void 0;
      const medial = Boolean(cap.placement === "medial" || left || right);
      const args = medial ? [left, right].filter(Boolean) : bodyArgs;
      const occupancy = medial || bodyArgs.length > 0 ? "inhabited" : "empty";
      const payload = medial ? args.length >= 2 ? "multi" : args.length === 1 ? "term" : "void" : bodyArgs.length > 0 ? bodyArgs.length > 1 ? "multi" : "term" : "void";
      const frameArgs = cap.frame ? (cap.frame.content ?? []).map((c) => normalizeToONF(c)) : [];
      const capsuleFrames = {
        reg: medial ? "composite" : "capsule",
        placement: medial ? "medial" : "shell",
        ...channel !== void 0 ? { tag: channel, channel, channelKind } : {},
        ...bodyArgs.length > 0 ? { hasBody: true } : {},
        ...frameArgs.length > 0 ? {
          bound: withCoupling({}, "frame", {
            args: frameArgs,
            argCount: frameArgs.length,
            actPlacement: "membrane"
          }).coupling
        } : {}
      };
      return {
        sigil: "<",
        args,
        frames: withCoupling(
          capsuleFrames,
          "capsule",
          { args, argCount: args.length, occupancy, payload }
        )
      };
    }
    case "Stream": {
      const stream = node;
      const args = stream.sequence ? stream.sequence.expressions.map((e) => normalizeToONF(e)) : [];
      const sinkNode = stream.sink ? normalizeToONF(stream.sink) : void 0;
      return {
        sigil: "?",
        args,
        frames: withCoupling(
          {
            ...sinkNode ? { sink: sinkNode } : {},
            ...args.length > 1 ? { foldReady: true, foldKind: "sequence" } : {}
          },
          "stream",
          {
            args,
            argCount: args.length,
            occupancy: args.length > 0 ? "inhabited" : "empty",
            payload: args.length > 1 ? "multi" : args.length === 1 ? "term" : "void"
          }
        )
      };
    }
    case "Identifier": {
      const id = node.token.value;
      if (id === "_") return { sigil: "_", args: [], frames: { reg: "hole" } };
      return { sigil: "_", args: [], frames: { reg: "id", value: id } };
    }
    case "Literal": {
      const val = node.token.value;
      const type = node.token.type;
      if (type === "PHRASE") return { sigil: "_", args: [], frames: { reg: "phrase", value: val } };
      return { sigil: "_", args: [], frames: { reg: "literal", value: val } };
    }
    case "Wildcard": {
      return { sigil: "_", args: [], frames: { reg: "hole" } };
    }
    case "Reference": {
      return { sigil: "@", args: [], frames: { reg: "ref", value: node.raw || "ref" } };
    }
    case "Annotation": {
      const ann = node;
      const name = ann.name?.value ?? "annotation";
      const valueArgs = ann.value ? [normalizeToONF(ann.value)] : [];
      return { sigil: "#", args: valueArgs, frames: { reg: "annotation", value: name } };
    }
    case "Particle": {
      const part = node;
      const reg = part.aim === ">" ? "deixis" : part.aim === ":" ? "case" : "mood";
      return { sigil: "#", args: [], frames: { reg, value: part.name?.value ?? "" } };
    }
    case "ModifierChain": {
      const chain = node;
      const modifiers = (chain.modifiers ?? []).map((m) => m.value).join(",");
      return { sigil: "_", args: [], frames: { reg: "fold", value: modifiers } };
    }
    case "Binding": {
      const binding = node;
      const keyNode = normalizeToONF(binding.key);
      const valueNode = normalizeToONF(binding.value);
      return { sigil: "=", args: [keyNode, valueNode], frames: { reg: "changelist" } };
    }
    case "Bullet": {
      const bullet = node;
      const itemNode = bullet.item ? normalizeToONF(bullet.item) : { sigil: "_", args: [], frames: { reg: "empty" } };
      const markerValue = bullet.marker?.value ?? "..";
      return { sigil: "_", args: [itemNode], frames: { reg: "marker", marker: markerValue } };
    }
    case "PathRef": {
      const pathRef = node;
      const pathNode = normalizeToONF(pathRef.path);
      const tag = pathRef.tag?.value;
      return { sigil: "@", args: [pathNode], frames: { reg: "pathref", ...tag ? { tag } : {} } };
    }
    case "Prose": {
      const prose = node;
      const chunkArgs = (prose.chunks ?? []).map((c) => normalizeToONF(c));
      return { sigil: "_", args: chunkArgs, frames: { reg: "prose" } };
    }
    case "ProseChunk": {
      const chunk = node;
      return { sigil: "_", args: [], frames: { reg: "text", value: chunk.text ?? "" } };
    }
    case "NRange": {
      const nrange = node;
      if (!nrange.expression) {
        return {
          sigil: "_",
          args: [],
          frames: withCoupling({}, "nrange", { occupancy: "empty", payload: "void" })
        };
      }
      const exprNode = normalizeToONF(nrange.expression);
      return {
        sigil: "_",
        args: [exprNode],
        frames: withCoupling({}, "nrange", { args: [exprNode], argCount: 1 })
      };
    }
    case "Frame": {
      const frame = node;
      const contentArgs = (frame.content ?? []).map((c) => normalizeToONF(c));
      return {
        sigil: "_",
        args: contentArgs,
        frames: withCoupling({}, "frame", { args: contentArgs, argCount: contentArgs.length })
      };
    }
    case "Body": {
      const body = node;
      const bodyArgs = body.sequence ? body.sequence.expressions.map((e) => normalizeToONF(e)) : [];
      return {
        sigil: "_",
        args: bodyArgs,
        frames: withCoupling({}, "body", { args: bodyArgs, argCount: bodyArgs.length })
      };
    }
    case "Scope": {
      const scope = node;
      const scopeArgs = scope.sequence ? scope.sequence.expressions.map((e) => normalizeToONF(e)) : [];
      const scopeName = scope.name?.value;
      return {
        sigil: "_",
        args: scopeArgs,
        frames: withCoupling(
          { ...scopeName ? { name: scopeName } : {} },
          "scope",
          { args: scopeArgs, argCount: scopeArgs.length }
        )
      };
    }
    case "Condition": {
      const cond = node;
      const leftNode = normalizeToONF(cond.left);
      const rightNode = normalizeToONF(cond.right);
      const op = cond.operator?.value ?? "==";
      return { sigil: "?", args: [leftNode, rightNode], frames: { reg: "condition", op } };
    }
    case "Parameter": {
      const param = node;
      const paramName = param.name?.value;
      const paramValue = normalizeToONF(param.value);
      return { sigil: "=", args: [paramValue], frames: { reg: "parameter", ...paramName ? { name: paramName } : {} } };
    }
    case "Match": {
      const match = node;
      const inputNode = normalizeToONF(match.input);
      const armNodes = (match.arms ?? []).map((a) => normalizeToONF(a));
      return { sigil: "?", args: [inputNode, ...armNodes], frames: { reg: "match" } };
    }
    case "MatchArm": {
      const arm = node;
      const patternNode2 = normalizeToONF(arm.pattern);
      const handlerNode = normalizeToONF(arm.handler);
      return { sigil: "_", args: [patternNode2, handlerNode], frames: { reg: "arm" } };
    }
    case "Spread": {
      const spread2 = node;
      const captureArgs = spread2.capture ? [normalizeToONF(spread2.capture)] : [];
      return { sigil: "_", args: captureArgs, frames: { reg: "spread" } };
    }
    case "Sequence": {
      const seq2 = node;
      const exprNodes = (seq2.expressions ?? []).map((e) => normalizeToONF(e));
      if (exprNodes.length === 1) return exprNodes[0];
      return { sigil: "_", args: exprNodes, frames: { reg: "sequence" } };
    }
    default:
      return { sigil: "_", args: [], frames: { reg: "unknown", nodeType: node.type } };
  }
}

// .spw/_workbench/packages/spw-seed/src/canonical/form-ladders.ts
var FORM_LADDER_PROFILE = {
  id: "Spw.Form.Ladders",
  revision: "0.3",
  status: "interpretive",
  includedBoundaryKinds: ["frame", "body", "scope", "capsule", "stream", "nrange"]
};
function notationOf(steps, arrow2 = "=>") {
  return steps.map((s) => s.surface).join(` ${arrow2} `);
}
function S(id, surface, role, implies, exp = "structured") {
  return { id, surface, role, implies, parseExpectation: exp };
}
var BOUNDARY_LADDERS = {
  frame: {
    id: "boundary:frame",
    kind: "boundary",
    boundary: "frame",
    couplingKind: "frame",
    name: "Frame []",
    essence: "selection / parameter / address boundary",
    emptySurface: "[]",
    emptyState: { occupancy: "empty", payload: "void" },
    axes: ["selection", "label", "path", "fold"],
    arrow: "=>",
    steps: [
      S("empty", "[]", "empty", "uninhabited Frame; selection is a profile reading"),
      S("inhabit", "[x]", "inhabit", "select a single term"),
      S("select", "[a, b]", "select", "enumerate selection / params"),
      S("label", "[name: x]", "label", "named parameter (Parameter form)"),
      S("path", "x / [y]", "path", "project then re-select", "conceptual"),
      S("product", "#[a, b]", "product", "resonance \xD7 frame \u2192 set"),
      S("fold", "#[a, b, c]", "fold", "fold many into one categorical set", "conceptual")
    ],
    notation: ""
  },
  body: {
    id: "boundary:body",
    kind: "boundary",
    boundary: "body",
    couplingKind: "body",
    name: "Body {}",
    essence: "materialization / definition / field boundary",
    emptySurface: "{}",
    emptyState: { occupancy: "empty", payload: "void" },
    axes: ["material", "ground", "label", "fold"],
    arrow: "=>",
    steps: [
      S("empty", "{}", "empty", "uninhabited Body; material is a profile reading"),
      S("inhabit", "{x}", "inhabit", "one term in the field"),
      S("materialize", "{a b}", "materialize", "juxtaposed material (sequence interior)", "conceptual"),
      S("ground", ".{}", "ground", "ground Act \xD7 body \u2192 empty facet"),
      S("label", ".{k: v}", "label", "named facet binding", "conceptual"),
      S("fold", ".{a: 1, b: 2}", "fold", "fold properties into one facet map", "conceptual"),
      S("integrate", '^["name"]{}', "integrate", "labeled integrate block (header idiom)", "conceptual")
    ],
    notation: ""
  },
  scope: {
    id: "boundary:scope",
    kind: "boundary",
    boundary: "scope",
    couplingKind: "scope",
    name: "Scope ()",
    essence: "flow / perspective / hold \u2014 reference-friendly boundary",
    emptySurface: "()",
    emptyState: { occupancy: "empty", payload: "void" },
    axes: ["flow", "reference", "path", "ground"],
    arrow: "=>",
    steps: [
      S("empty", "()", "empty", "uninhabited Scope; hold is a profile reading"),
      S("inhabit", "(x)", "inhabit", "hold one term"),
      S("hold", "(_)", "hold", "hold a hole (open placeholder)"),
      S("ref", "@()", "ref", "perspective product empty observer"),
      S("ref_named", "@(here)", "ref", "named observer / standpoint"),
      S("path", "(a / b)", "path", "path inside a hold", "conceptual"),
      S("product", "@(a / b)", "product", "observe a projection", "conceptual")
    ],
    notation: ""
  },
  capsule: {
    id: "boundary:capsule",
    kind: "boundary",
    boundary: "capsule",
    couplingKind: "capsule",
    name: "Capsule <\u2026>",
    essence: "interface / concept shell \u2014 not digraph <>",
    emptySurface: "< >",
    emptyState: { occupancy: "empty", payload: "void" },
    axes: ["interface", "label", "reference"],
    arrow: "=>",
    steps: [
      S("empty", "< >", "empty", "uninhabited Capsule, visibly distinct from operator <>"),
      S("label", "<tag>", "label", "tagged shell (tag, often still empty occupancy)"),
      S("membrane", "<x>", "membrane", "capsule with tag/id surface"),
      S("inhabit", "<tag>{body}", "inhabit", "shell + material body"),
      S("ref", '~"<path>"', "ref", "pathref as portable reference (related surface)", "conceptual")
    ],
    notation: ""
  },
  stream: {
    id: "boundary:stream",
    kind: "boundary",
    boundary: "stream",
    couplingKind: "stream",
    name: "Stream <<\u2026>>",
    essence: "ordered channel \u2014 fold over sequence of values",
    emptySurface: "<<>>",
    emptyState: { occupancy: "empty", payload: "void" },
    axes: ["flow", "fold", "path", "reference"],
    arrow: "=>",
    steps: [
      S("empty", "<<>>", "empty", "empty channel"),
      S("inhabit", "<<x>>", "inhabit", "single value on the channel"),
      S("multi", "<<a, b>>", "multi", "ordered multi-value channel"),
      S("channel", "<<a, b, c>>", "channel", "longer stream for fold"),
      S("fold", "<<a, b>> / head", "fold", "project/fold stream head (conceptual)", "conceptual"),
      S("ref", "<<x>>@sink", "ref", "stream with sink reference (ONF preserves sink)")
    ],
    notation: ""
  },
  nrange: {
    id: "boundary:nrange",
    kind: "boundary",
    boundary: "nrange",
    couplingKind: "nrange",
    name: "NRange ((\u2026))",
    essence: "range / band boundary \u2014 extent then step",
    emptySurface: "(())",
    emptyState: { occupancy: "empty", payload: "void" },
    axes: ["selection", "path", "fold"],
    arrow: "=>",
    steps: [
      S("empty", "(())", "empty", "empty n-range occupancy (structured)"),
      S("inhabit", "((x))", "inhabit", "range over one expression"),
      S("range", "((a / b))", "range", "range with internal path"),
      S("fold", "((a .. b))", "fold", "range as fold of continuum (conceptual)", "conceptual")
    ],
    notation: ""
  }
};
var OPERATOR_LADDERS = {
  "&": {
    id: "op:&",
    kind: "operator",
    operator: "&",
    name: "Confluence",
    essence: "merge streams \u2014 fold many into one field",
    preferredBoundary: "body",
    preferredProduct: "{&}",
    axes: ["fold", "material", "selection", "label", "ground"],
    arrow: "=>",
    steps: [
      S("seed", "&", "seed", "bare confluence Act"),
      S("wrap", "{&}", "wrap", "materialize merge inside a body field"),
      S("select", "&[a, b]", "select", "merge with selection of arms"),
      S("annotate", "{&[describe!]}", "annotate", "optional named force on a merge arm", "conceptual"),
      S("fold", "&(a, b, c)", "fold", "fold n args through confluence", "conceptual"),
      S("ground", ".{&: _}", "ground", "ground a merge slot in a facet", "conceptual")
    ],
    notation: ""
  },
  "!": {
    id: "op:!",
    kind: "operator",
    operator: "!",
    name: "Action",
    essence: "commit / hydrate \u2014 often prefix over a Bound",
    preferredBoundary: "void",
    preferredProduct: "![]",
    axes: ["label", "selection", "material", "path", "ground"],
    arrow: "=>",
    steps: [
      S("seed", "!", "seed", "bare action Act"),
      S("label", "!x", "label", "operator label (adjacent id)"),
      S("select", "![]", "select", "prefix Act owns empty frame"),
      S("wrap", "{!}", "wrap", "action as body interior"),
      S("path", "! x / y", "path", "action then path (conceptual)", "conceptual"),
      S("ground", "!.{}", "ground", "force a facet ground", "conceptual")
    ],
    notation: ""
  },
  "~": {
    id: "op:~",
    kind: "operator",
    operator: "~",
    name: "Potential",
    essence: "defer \u2014 hold without collapse",
    preferredBoundary: "scope",
    preferredProduct: "~()",
    axes: ["potential", "flow", "ground", "reference"],
    arrow: "=>",
    steps: [
      S("seed", "~", "seed", "bare potential Act"),
      S("hold", "~()", "hold", "defer empty hold"),
      S("hold_hole", "~(_)", "hold", "defer a hole (open binding site)"),
      S("wrap", "{~}", "wrap", "potential inside body"),
      S("ref", '~@"target"', "ref", "deferred path-like reference", "conceptual"),
      S("ground", "~.{}", "ground", "defer a ground facet", "conceptual")
    ],
    notation: ""
  },
  "?": {
    id: "op:?",
    kind: "operator",
    operator: "?",
    name: "Wonder",
    essence: "probe / branch \u2014 stream affinity",
    preferredBoundary: "stream",
    preferredProduct: "<<>>",
    axes: ["potential", "flow", "selection", "path", "fold"],
    arrow: "=>",
    steps: [
      S("seed", "?", "seed", "bare wonder Act"),
      S("channel", "<<>>", "channel", "empty stream Bound (affinity neighbor)"),
      S("inhabit", "<<?>>", "inhabit", "probe on a channel"),
      S("select", "?(a, b)", "select", "conditional arms", "conceptual"),
      S("path", "? a / b", "path", "probe then project", "conceptual"),
      S("fold", "?(a, b, c)", "fold", "multi-arm wonder fold", "conceptual")
    ],
    notation: ""
  },
  "*": {
    id: "op:*",
    kind: "operator",
    operator: "*",
    name: "Value",
    essence: "collapse to concrete \u2014 end of defer chain",
    preferredBoundary: "body",
    preferredProduct: "*{}",
    axes: ["ground", "fold", "material", "path"],
    arrow: "=>",
    steps: [
      S("seed", "*", "seed", "bare collapse Act"),
      S("ground", "*()", "ground", "collapse empty hold / unit"),
      S("inhabit", "*(x)", "inhabit", "collapse a term"),
      S("wrap", "{*}", "wrap", "collapse interior in body"),
      S("path", "* x / k", "path", "collapse after path", "conceptual"),
      S("fold", "*(a, b)", "fold", "collapse of multi (last/merge policy conceptual)", "conceptual")
    ],
    notation: ""
  },
  "#": {
    id: "op:#",
    kind: "operator",
    operator: "#",
    name: "Resonance",
    essence: "categorical set \u2014 selection product",
    preferredBoundary: "frame",
    preferredProduct: "#[\u2026]",
    axes: ["selection", "fold", "ground", "path", "label"],
    arrow: "=>",
    steps: [
      S("seed", "#", "seed", "bare resonance Act"),
      S("empty", "#[]", "empty", "empty set product"),
      S("select", "#[a]", "select", "singleton set"),
      S("fold", "#[a, b, c]", "fold", "fold members into a set", "conceptual"),
      S("path", "#x / y", "path", "tag then project", "conceptual"),
      S("label", "#name[]", "label", "labeled set (conceptual)", "conceptual")
    ],
    notation: ""
  },
  ".": {
    id: "op:.",
    kind: "operator",
    operator: ".",
    name: "Ground",
    essence: "baseline / subject / property ground",
    preferredBoundary: "body",
    preferredProduct: ".{\u2026}",
    axes: ["ground", "path", "label", "fold"],
    arrow: "=>",
    steps: [
      S("seed", ".", "seed", "bare ground Act"),
      S("empty", ".{}", "empty", "empty facet \u2014 ground with no properties"),
      S("label", ".{k: v}", "label", "named property on ground", "conceptual"),
      S("path", ". / k", "path", "project from ground", "conceptual"),
      S("path_chain", "a / b / c", "path", "path chain (connector ladder)", "conceptual"),
      S("fold", ".{a: 1, b: 2}", "fold", "fold properties onto ground", "conceptual")
    ],
    notation: ""
  },
  "@": {
    id: "op:@",
    kind: "operator",
    operator: "@",
    name: "Perspective",
    essence: "observe / reference standpoint",
    preferredBoundary: "scope",
    preferredProduct: "@(\u2026)",
    axes: ["reference", "flow", "path"],
    arrow: "=>",
    steps: [
      S("seed", "@", "seed", "bare perspective Act"),
      S("empty", "@()", "empty", "empty observer product"),
      S("ref", "@(here)", "ref", "named standpoint"),
      S("path", "@(a / b)", "path", "observe a path", "conceptual"),
      S("ref_path", '~"relative/path"', "ref", "pathref surface (portable ref)", "conceptual"),
      S("wrap", "{@(here)}", "wrap", "observation inside body", "conceptual")
    ],
    notation: ""
  },
  "^": {
    id: "op:^",
    kind: "operator",
    operator: "^",
    name: "Integration",
    essence: "promote / label a unit upward",
    preferredBoundary: "body",
    preferredProduct: '^["name"]{}',
    axes: ["label", "material", "fold", "selection", "ground"],
    arrow: "=>",
    steps: [
      S("seed", "^", "seed", "bare integrate Act"),
      S("wrap", "{^}", "wrap", "integrate marker in body"),
      S("label", '^["name"]{}', "label", "named integrate block", "conceptual"),
      S("select", "^[]", "select", "integrate with frame", "conceptual"),
      S("fold", "^(a, b)", "fold", "integrate multiple args", "conceptual"),
      S("ground", "^.{}", "ground", "integrate a ground facet", "conceptual")
    ],
    notation: ""
  },
  "$": {
    id: "op:$",
    kind: "operator",
    operator: "$",
    name: "Substrate",
    essence: "medium / meta register reflection",
    preferredBoundary: "none",
    preferredProduct: "$(reg)",
    axes: ["reference", "ground", "label", "path"],
    arrow: "=>",
    steps: [
      S("seed", "$", "seed", "bare substrate Act"),
      S("ref", "$(reg)", "ref", "materialize named register meta"),
      S("label", "$name", "label", "substrate label form", "conceptual"),
      S("path", "$ / meta", "path", "project substrate", "conceptual"),
      S("ground", "$.{}", "ground", "substrate ground facet", "conceptual"),
      S("measure", "$%[m]", "annotate", "substrate measurement point idiom", "conceptual")
    ],
    notation: ""
  },
  "%": {
    id: "op:%",
    kind: "operator",
    operator: "%",
    name: "Measure",
    essence: "sample / scale \u2014 often over a selection",
    preferredBoundary: "frame",
    preferredProduct: "%[metric]",
    axes: ["selection", "ground", "reference", "label", "path"],
    arrow: "=>",
    steps: [
      S("seed", "%", "seed", "bare measure Act"),
      S("select", "%[]", "select", "measure empty selection", "conceptual"),
      S("label", "%[metric]", "label", "named metric frame", "conceptual"),
      S("ref", "$%[metric]", "ref", "measurement point on substrate", "conceptual"),
      S("path", "% x / scale", "path", "measure then scale path", "conceptual"),
      S("ground", "%.{}", "ground", "measure a ground", "conceptual")
    ],
    notation: ""
  },
  "=": {
    id: "op:=",
    kind: "operator",
    operator: "=",
    name: "Configuration",
    essence: "bind \u2014 label a value into place",
    preferredBoundary: "body",
    preferredProduct: "k = v",
    axes: ["label", "ground", "material", "selection", "fold"],
    arrow: "=>",
    steps: [
      S("seed", "=", "seed", "bare bind Act"),
      S("label", "k = v", "label", "name\u2013value bind", "conceptual"),
      S("ground", ".{k: v}", "ground", "facet bind as ground product", "conceptual"),
      S("wrap", "{=}", "wrap", "bind marker in body"),
      S("select", "=[k]", "select", "bind into selection", "conceptual"),
      S("fold", "={a: 1, b: 2}", "fold", "fold many binds", "conceptual")
    ],
    notation: ""
  },
  "<>": {
    id: "op:<>",
    kind: "operator",
    operator: "<>",
    name: "Coupling",
    essence: "peer exchange \u2014 interface between named registers",
    preferredBoundary: "frame",
    preferredProduct: "<>[a, b]",
    axes: ["interface", "reference", "label", "path"],
    arrow: "=>",
    steps: [
      S("seed", "<>", "seed", "zero-arity couple Act; not an empty boundary"),
      S("couple", '<>["a", "b"]', "couple", "couple two operands selected by a Frame"),
      S("ref", "<>[@src, @dst]", "ref", "peer references selected by a Frame", "conceptual"),
      S("wrap", '{<>["a", "b"]}', "wrap", "couple expression inside a Body", "conceptual"),
      S("path", "a <> b / edge", "path", "couple then project edge", "conceptual")
    ],
    notation: ""
  }
};
var BOUNDARY_AXIS_IMPLICATIONS = [
  {
    boundary: "frame",
    axis: "selection",
    implies: "[] pins, parameters, and enumerated addresses",
    surfaces: ["[]", "[x]", "#[\u2026]"]
  },
  {
    boundary: "frame",
    axis: "path",
    implies: "selection often follows or precedes / projection",
    surfaces: ["x / [y]", "#[a] / b"]
  },
  {
    boundary: "frame",
    axis: "fold",
    implies: "multi-select folds into sets under #",
    surfaces: ["#[a, b, c]"]
  },
  {
    boundary: "body",
    axis: "material",
    implies: "{} is the materialization / definition field",
    surfaces: ["{}", "{x}", ".{\u2026}"]
  },
  {
    boundary: "body",
    axis: "ground",
    implies: ".{} grounds property structure",
    surfaces: [".{}", ".{k: v}"]
  },
  {
    boundary: "body",
    axis: "label",
    implies: 'facet keys and ^["name"]{} headers label material',
    surfaces: [".{k: v}", '^["name"]{}']
  },
  {
    boundary: "body",
    axis: "fold",
    implies: "property maps fold many binds into one body",
    surfaces: [".{a: 1, b: 2}"]
  },
  {
    boundary: "scope",
    axis: "flow",
    implies: "() holds flow without binding identity",
    surfaces: ["()", "(x)", "~()"]
  },
  {
    boundary: "scope",
    axis: "reference",
    implies: "@(\u2026) and pathrefs use scope-shaped observation",
    surfaces: ["@()", "@(here)", '~"path"']
  },
  {
    boundary: "scope",
    axis: "path",
    implies: "paths nest cleanly inside holds",
    surfaces: ["(a / b)", "@(a / b)"]
  },
  {
    boundary: "capsule",
    axis: "interface",
    implies: "<\u2026> is membrane/shell; digraph <> is separate couple Act",
    surfaces: ["< >", "<tag>", "<x>"]
  },
  {
    boundary: "capsule",
    axis: "label",
    implies: "capsule tags name the interface",
    surfaces: ["<tag>"]
  },
  {
    boundary: "stream",
    axis: "flow",
    implies: "<<>> is ordered channel flow",
    surfaces: ["<<>>", "<<x>>", "<<a, b>>"]
  },
  {
    boundary: "stream",
    axis: "fold",
    implies: "streams are natural fold domains (head/reduce conceptual)",
    surfaces: ["<<a, b, c>>"]
  },
  {
    boundary: "nrange",
    axis: "selection",
    implies: "ranges select a band of a continuum",
    surfaces: ["(())", "((x))"]
  },
  {
    boundary: "nrange",
    axis: "path",
    implies: "range interiors often carry paths or sequences",
    surfaces: ["((a / b))"]
  }
];
for (const ladder of Object.values(BOUNDARY_LADDERS)) {
  ladder.notation = notationOf(ladder.steps, ladder.arrow);
}
for (const ladder of Object.values(OPERATOR_LADDERS)) {
  ladder.notation = notationOf(ladder.steps, ladder.arrow);
}
function boundaryLadder(id) {
  if (Object.hasOwn(BOUNDARY_LADDERS, id)) return BOUNDARY_LADDERS[id];
  const aliases = {
    "[]": "frame",
    "{}": "body",
    "()": "scope",
    "< >": "capsule",
    "<\u2026>": "capsule",
    "<<>>": "stream",
    "(())": "nrange",
    frame: "frame",
    body: "body",
    scope: "scope",
    capsule: "capsule",
    stream: "stream",
    nrange: "nrange"
  };
  const mapped = aliases[id];
  return mapped ? BOUNDARY_LADDERS[mapped] : void 0;
}
function operatorLadder(op) {
  if (Object.hasOwn(OPERATOR_LADDERS, op)) return OPERATOR_LADDERS[op];
  return void 0;
}
function listBoundaryLadders() {
  return Object.values(BOUNDARY_LADDERS);
}
function listOperatorLadders() {
  return Object.values(OPERATOR_LADDERS);
}
function listFormLadders() {
  return [...listBoundaryLadders(), ...listOperatorLadders()];
}
function implicationsForBoundary(boundary) {
  return BOUNDARY_AXIS_IMPLICATIONS.filter((i) => i.boundary === boundary);
}
function firstOnf(source) {
  const result = parse(source);
  if (!result.success || !result.ast) return null;
  try {
    return normalizeToONF(result.ast);
  } catch {
    return null;
  }
}
function probeStep(step, index) {
  const topography = snapshotTopography(step.surface);
  const onfNode = firstOnf(step.surface);
  const coupling = onfNode ? readCouplingFrame(onfNode.frames) : void 0;
  const c = coupling;
  const onf = onfNode ? {
    sigil: String(onfNode.sigil),
    reg: typeof onfNode.frames.reg === "string" ? onfNode.frames.reg : void 0,
    couplingKind: c?.kind,
    occupancy: c?.occupancy,
    payload: c?.payload,
    arity: c?.arity
  } : null;
  const proseFallback = topography.proseFallback;
  const structuredOk = topography.parseHealth === "complete_structured" || topography.parseHealth === "recovered" && !proseFallback;
  const expectationMet = step.parseExpectation === "conceptual" ? true : structuredOk && !proseFallback;
  return {
    step,
    index,
    parseSuccess: topography.parserSuccess,
    parseHealth: topography.parseHealth,
    proseFallback,
    onf,
    topography,
    expectationMet
  };
}
function probeLadder(ladder) {
  const stepProbes = ladder.steps.map((step, index) => probeStep(step, index));
  const structuredHits = stepProbes.filter(
    (s) => s.step.parseExpectation === "structured" && s.expectationMet
  ).length;
  const conceptualSlots = stepProbes.filter((s) => s.step.parseExpectation === "conceptual").length;
  const findings = [
    `${ladder.kind === "boundary" ? "boundary" : "op"} ${ladder.name}: ${ladder.essence}`,
    `axes: ${ladder.axes.join(", ")}`,
    `notation: ${ladder.notation}`,
    `steps=${stepProbes.length} structured-ok=${structuredHits} conceptual=${conceptualSlots}`
  ];
  for (const s of stepProbes) {
    const onfBits = s.onf ? ` sigil=${s.onf.sigil} reg=${s.onf.reg ?? "\u2014"}` + (s.onf.couplingKind ? ` couple=${s.onf.couplingKind}` : "") + (s.onf.occupancy ? ` occ=${s.onf.occupancy}` : "") + (s.onf.payload ? ` payload=${s.onf.payload}` : "") + (s.onf.arity !== void 0 ? ` arity=${s.onf.arity}` : "") : " onf=\u2014";
    findings.push(
      `  ${s.index + 1}. [${s.step.role}] ${s.step.surface}  health=${s.parseHealth}` + (s.proseFallback ? " prose" : "") + onfBits + (s.expectationMet ? "" : " \u26A0 expectation")
    );
  }
  return {
    ladder,
    steps: stepProbes,
    structuredHits,
    conceptualSlots,
    findings
  };
}
function probeFormLadder(ladder) {
  return probeLadder(ladder);
}
function probeBoundaryLadder(id) {
  const ladder = boundaryLadder(id);
  return ladder ? probeLadder(ladder) : void 0;
}
function probeOperatorLadder(op) {
  const ladder = operatorLadder(op);
  return ladder ? probeLadder(ladder) : void 0;
}
function resolveLadderQuery(query) {
  const q = query.trim();
  if (q === "all") return { mode: "all" };
  if (q === "boundaries" || q === "boundary" || q === "bounds") return { mode: "boundaries" };
  if (q === "braces" || q === "brace") return { mode: "boundaries", legacyAlias: "brace" };
  if (q === "ops" || q === "operators" || q === "op") return { mode: "ops" };
  const b = boundaryLadder(q);
  if (b) return { mode: "one", ladder: b };
  const o = operatorLadder(q);
  if (o) return { mode: "one", ladder: o };
  return { mode: "one" };
}
function formatBoundaryAxisTable() {
  const lines = ["boundary | axis | hypothesis | example surfaces"];
  for (const row of BOUNDARY_AXIS_IMPLICATIONS) {
    lines.push(
      `${row.boundary} | ${row.axis} | ${row.implies} | ${row.surfaces.join(" \xB7 ")}`
    );
  }
  return lines.join("\n");
}
function formatAllLadderNotations() {
  const lines = [
    `# Paired-boundary ladders (${FORM_LADDER_PROFILE.id}@${FORM_LADDER_PROFILE.revision}; ${FORM_LADDER_PROFILE.status})`,
    `# included boundary kinds: ${FORM_LADDER_PROFILE.includedBoundaryKinds.join(", ")}`,
    ""
  ];
  for (const l of listBoundaryLadders()) {
    lines.push(`${l.boundary}  (${l.axes.join(", ")})`);
    lines.push(`  ${l.notation}`);
    lines.push("");
  }
  lines.push("# Operator ladders", "");
  for (const l of listOperatorLadders()) {
    lines.push(`${l.operator}  ${l.name}  \u2192 ${l.preferredBoundary}`);
    lines.push(`  ${l.notation}`);
    lines.push("");
  }
  return lines.join("\n");
}
function operatorLadderTable() {
  return listOperatorLadders().map((l) => ({
    operator: l.operator,
    name: l.name,
    notation: l.notation,
    preferredBoundary: l.preferredBoundary
  }));
}
function boundaryLadderTable() {
  return listBoundaryLadders().map((l) => ({
    boundary: l.boundary,
    name: l.name,
    notation: l.notation,
    axes: l.axes.join(",")
  }));
}

// .spw/_workbench/packages/spw-seed/src/canonical/form-geometry.ts
var FORM_GEOMETRY_PROFILE = {
  id: "Spw.Form.Geometry",
  revision: "0.2",
  status: "interpretive",
  labelGrammar: "identifier"
};
var FORM_MOBILITY_APPLICATION_PROFILE = {
  id: "Spw.Form.Geometry.Application",
  revision: "0.1",
  status: "operational",
  effectGrade: "effect.l1.memory",
  authority: "in-memory source only",
  semanticEquivalence: "not_claimed"
};
function matchPattern(pos, pattern) {
  if (pattern.site !== void 0) {
    const sites = Array.isArray(pattern.site) ? pattern.site : [pattern.site];
    if (!sites.includes(pos.site)) return false;
  }
  if (pattern.liminal !== void 0) {
    const shapes = Array.isArray(pattern.liminal) ? pattern.liminal : [pattern.liminal];
    if (!shapes.includes(pos.liminal)) return false;
  }
  if (pattern.boundary !== void 0) {
    const boundaries = Array.isArray(pattern.boundary) ? pattern.boundary : [pattern.boundary];
    if (!pos.boundary || !boundaries.includes(pos.boundary)) return false;
  }
  return true;
}
function subLabel(template, label) {
  return template.replace(/\$L/g, label);
}
function applyFreeToOperatorAdjacent(source, label) {
  const trimmed = source.trim();
  if (trimmed === label) return `!${label}`;
  if (trimmed === "") return `!${label}`;
  if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(trimmed) && trimmed === label) return `!${label}`;
  return null;
}
function applyFreeToFrameParam(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "") return `[${label}]`;
  if (trimmed === "[]") return `[${label}]`;
  return null;
}
function applyFreeToFrameParamHole(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "" || trimmed === "[]") return `[${label}: _]`;
  return null;
}
function applyFreeToCapsuleTag(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "" || trimmed === "< >" || trimmed === "<>") {
    if (trimmed === "<>") return null;
    return `<${label}>`;
  }
  return null;
}
function applyFreeToFacetKey(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "" || trimmed === ".{}" || trimmed === "{}") {
    return `.{${label}: _}`;
  }
  return null;
}
function applyFreeToRefHandle(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "" || trimmed === "@()" || trimmed === "()") {
    return `@(${label})`;
  }
  return null;
}
function applyFreeToHeader(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "") {
    return `^["${label}"]{}`;
  }
  return null;
}
function applyFrameParamToFree(source, label) {
  const trimmed = source.trim();
  if (trimmed === `[${label}]` || trimmed === `[${label}: _]`) return label;
  return null;
}
function applyOperatorAdjacentToFree(source, label) {
  const trimmed = source.trim();
  if (trimmed === `!${label}`) return label;
  return null;
}
function applyFrameParamToPath(source, label) {
  const trimmed = source.trim();
  if (trimmed === `[${label}]` || trimmed === label) return `${label} / _`;
  return null;
}
function applyPathExtend(source, label) {
  const trimmed = source.trim();
  if (/^[A-Za-z_][A-Za-z0-9_]*(\s*\/\s*[A-Za-z_`][^/]*)*$/.test(trimmed) || trimmed.endsWith("/ _") || trimmed.endsWith("/_")) {
    const base = trimmed.replace(/\s*\/\s*_$/, "").replace(/\/_$/, "");
    return `${base} / ${label}`;
  }
  if (trimmed === "_") return label;
  return null;
}
function applyRefToFree(source, label) {
  const trimmed = source.trim();
  if (trimmed === `@(${label})`) return label;
  return null;
}
function applyInteriorToFacet(source, label) {
  const trimmed = source.trim();
  if (trimmed === `{${label}}`) return `.{${label}: ${label}}`;
  return null;
}
function applyFacetsToHeader(source, label) {
  const trimmed = source.trim();
  const re = new RegExp(
    `^\\.\\{\\s*${escapeRegExp(label)}\\s*:\\s*([\\s\\S]*)\\}\\s*$`
  );
  const m = trimmed.match(re);
  if (m) {
    const body = m[1].trim();
    return `^["${label}"]{${body}}`;
  }
  if (trimmed === label || trimmed === ".{}") {
    return `^["${label}"]{}`;
  }
  return null;
}
function applyHeaderToFacet(source, label) {
  const trimmed = source.trim();
  const re = new RegExp(
    `^\\^\\[\\s*"${escapeRegExp(label)}"\\s*\\]\\s*\\{([\\s\\S]*)\\}\\s*$`
  );
  const m = trimmed.match(re);
  if (m) {
    const body = m[1].trim();
    return body.length === 0 ? `.{${label}: _}` : `.{${label}: ${body}}`;
  }
  return null;
}
function applyPublishedToRegisterMeta(source, label) {
  const trimmed = source.trim();
  if (trimmed === `@(${label})`) return `$(${label})`;
  return null;
}
function applyRegisterMetaToRef(source, label) {
  const trimmed = source.trim();
  if (trimmed === `$(${label})`) return `@(${label})`;
  return null;
}
function applyFreeToPairLabels(source, label) {
  const trimmed = source.trim();
  if (trimmed === label || trimmed === "" || trimmed === "{}") {
    return `{_${label} }_${label}`;
  }
  const bodyRe = /^\{\s*([^{}]+)\s*\}$/;
  const m = trimmed.match(bodyRe);
  if (m && !trimmed.includes(`_${label}`)) {
    const interior = m[1].trim();
    return `{_${label} ${interior} }_${label}`;
  }
  return null;
}
function pairLabelInterior(source, label) {
  const trimmed = source.trim();
  const re = new RegExp(
    `^\\{\\s*_${escapeRegExp(label)}\\s*([\\s\\S]*?)\\s*\\}_${escapeRegExp(label)}\\s*$`
  );
  const m = trimmed.match(re);
  if (!m) return null;
  return m[1].trim();
}
function applyEmptyPairLabelsToFree(source, label) {
  const interior = pairLabelInterior(source, label);
  return interior === "" ? label : null;
}
function applyInhabitedPairLabelsToBody(source, label) {
  const interior = pairLabelInterior(source, label);
  return interior ? `{${interior}}` : null;
}
function applyPairLabelsToHeader(source, label) {
  const trimmed = source.trim();
  const re = new RegExp(
    `^\\{\\s*_${escapeRegExp(label)}\\s*([\\s\\S]*?)\\s*\\}_${escapeRegExp(label)}\\s*$`
  );
  const m = trimmed.match(re);
  if (!m) return null;
  const interior = m[1].trim();
  return `^["${label}"]{${interior}}`;
}
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var MOBILITY_RULES = [
  // ── ingress: free → named sites ────────────────────────────
  {
    id: "ingress.operator_label",
    name: "attach operator-adjacent label",
    from: { site: "free", liminal: ["exterior", "void"] },
    to: { site: "operator_adjacent", liminal: "aperture" },
    rewrite: { before: "$L", after: "!$L" },
    inverse: "egress.operator_label",
    status: "implemented",
    apply: applyFreeToOperatorAdjacent,
    motion: "ingress",
    axes: ["label", "potential"]
  },
  {
    id: "ingress.frame_select",
    name: "pull label into frame selection",
    from: { site: "free", liminal: ["exterior", "void"] },
    to: { site: "frame_param", liminal: "chamber", boundary: "frame" },
    rewrite: { before: "$L", after: "[$L]" },
    inverse: "egress.frame_select",
    status: "implemented",
    apply: applyFreeToFrameParam,
    motion: "ingress",
    axes: ["selection", "label"]
  },
  {
    id: "ingress.frame_hole",
    name: "pull label into frame as named hole",
    from: { site: ["free", "frame_param"], liminal: ["exterior", "void", "chamber"] },
    to: { site: "frame_param", liminal: "hole", boundary: "frame" },
    rewrite: { before: "$L | []", after: "[$L: _]" },
    status: "implemented",
    apply: applyFreeToFrameParamHole,
    motion: "ingress",
    axes: ["selection", "label", "ground"]
  },
  {
    id: "ingress.facet_key",
    name: "ground label as facet key",
    from: { site: "free", liminal: ["exterior", "void"] },
    to: { site: "facet_key", liminal: "chamber", boundary: "body" },
    rewrite: { before: "$L | .{}", after: ".{$L: _}" },
    status: "implemented",
    apply: applyFreeToFacetKey,
    motion: "ingress",
    axes: ["ground", "label", "material"]
  },
  {
    id: "ingress.capsule_tag",
    name: "seat label on capsule membrane",
    from: { site: "free", liminal: ["exterior", "void"] },
    to: { site: "capsule_tag", liminal: "membrane", boundary: "capsule" },
    rewrite: { before: "$L | < >", after: "<$L>" },
    status: "implemented",
    apply: applyFreeToCapsuleTag,
    motion: "ingress",
    axes: ["interface", "label"]
  },
  {
    id: "ingress.ref_handle",
    name: "publish label as observer handle",
    from: { site: "free", liminal: ["exterior", "void"] },
    to: { site: "ref_handle", liminal: "published", boundary: "scope" },
    rewrite: { before: "$L | @()", after: "@($L)" },
    inverse: "egress.ref_handle",
    status: "implemented",
    apply: applyFreeToRefHandle,
    motion: "ingress",
    axes: ["reference", "flow"]
  },
  {
    id: "ingress.header",
    name: "promote label to integrate header",
    from: { site: "free", liminal: ["exterior", "void"] },
    to: { site: "header", liminal: "published", boundary: "body" },
    rewrite: { before: "$L", after: '^["$L"]{}' },
    status: "implemented",
    apply: applyFreeToHeader,
    motion: "promote",
    axes: ["label", "material", "fold"]
  },
  // ── egress: named sites → free / path ──────────────────────
  {
    id: "egress.frame_select",
    name: "push selection label out to free",
    from: { site: "frame_param", liminal: ["chamber", "hole"], boundary: "frame" },
    to: { site: "free", liminal: "exterior" },
    rewrite: { before: "[$L]", after: "$L" },
    inverse: "ingress.frame_select",
    status: "implemented",
    apply: applyFrameParamToFree,
    motion: "egress",
    axes: ["selection", "label"]
  },
  {
    id: "egress.operator_label",
    name: "detach operator-adjacent label",
    from: { site: "operator_adjacent", liminal: "aperture" },
    to: { site: "free", liminal: "exterior" },
    rewrite: { before: "!$L", after: "$L" },
    inverse: "ingress.operator_label",
    status: "implemented",
    apply: applyOperatorAdjacentToFree,
    motion: "egress",
    axes: ["label"]
  },
  {
    id: "egress.ref_handle",
    name: "unref handle to free name",
    from: { site: "ref_handle", liminal: "published", boundary: "scope" },
    to: { site: "free", liminal: "exterior" },
    rewrite: { before: "@($L)", after: "$L" },
    inverse: "ingress.ref_handle",
    status: "implemented",
    apply: applyRefToFree,
    motion: "egress",
    axes: ["reference"]
  },
  // ── project: into path geometry ────────────────────────────
  {
    id: "project.frame_to_path",
    name: "selection becomes path root",
    from: { site: ["frame_param", "free"], liminal: ["chamber", "exterior"] },
    to: { site: "path_node", liminal: "exterior" },
    rewrite: { before: "[$L] | $L", after: "$L / _" },
    status: "implemented",
    apply: applyFrameParamToPath,
    motion: "project",
    axes: ["path", "selection"]
  },
  {
    id: "project.path_extend",
    name: "extend path with new segment label",
    from: { site: "path_node", liminal: "exterior" },
    to: { site: "path_node", liminal: "exterior" },
    rewrite: { before: "\u2026 / _", after: "\u2026 / $L" },
    status: "implemented",
    apply: applyPathExtend,
    motion: "project",
    axes: ["path", "reference"]
  },
  // ── rehost / fold ──────────────────────────────────────────
  {
    id: "rehost.interior_to_facet",
    name: "body interior term becomes facet key+value",
    from: { site: "interior_term", liminal: "chamber", boundary: "body" },
    to: { site: "facet_key", liminal: "chamber", boundary: "body" },
    rewrite: { before: "{$L}", after: ".{$L: $L}" },
    status: "implemented",
    apply: applyInteriorToFacet,
    motion: "rehost",
    axes: ["ground", "label", "material"]
  },
  {
    id: "fold.facets_to_header",
    name: "fold facet field into named header unit",
    from: { site: "facet_key", liminal: "chamber", boundary: "body" },
    to: { site: "header", liminal: "published", boundary: "body" },
    rewrite: { before: ".{$L: \u2026}", after: '^["$L"]{\u2026}' },
    inverse: "unfold.header_to_facet",
    status: "implemented",
    apply: applyFacetsToHeader,
    motion: "fold",
    axes: ["fold", "label"]
  },
  {
    id: "unfold.header_to_facet",
    name: "unfold header unit back to facet key",
    from: { site: "header", liminal: "published", boundary: "body" },
    to: { site: "facet_key", liminal: "chamber", boundary: "body" },
    rewrite: { before: '^["$L"]{\u2026}', after: ".{$L: \u2026}" },
    inverse: "fold.facets_to_header",
    status: "implemented",
    apply: applyHeaderToFacet,
    motion: "unfold",
    axes: ["fold", "label", "ground"]
  },
  {
    id: "orbit.frame_param_to_tag",
    name: "move label from frame param to capsule tag",
    from: { site: "frame_param", boundary: "frame" },
    to: { site: "capsule_tag", boundary: "capsule", liminal: "membrane" },
    rewrite: { before: "[$L]", after: "<$L>" },
    status: "implemented",
    apply: (source, label) => {
      const t = source.trim();
      if (t === `[${label}]` || t === `[${label}: _]`) return `<${label}>`;
      return null;
    },
    motion: "rehost",
    axes: ["selection", "interface", "label"]
  },
  {
    id: "orbit.tag_to_ref",
    name: "capsule tag becomes observer ref",
    from: { site: "capsule_tag", boundary: "capsule" },
    to: { site: "ref_handle", boundary: "scope", liminal: "published" },
    rewrite: { before: "<$L>", after: "@($L)" },
    status: "implemented",
    apply: (source, label) => {
      const t = source.trim();
      if (t === `<${label}>`) return `@(${label})`;
      return null;
    },
    motion: "rehost",
    axes: ["interface", "reference"]
  },
  {
    id: "promote.register_bridge",
    name: "project observer handle to substrate meta $(L)",
    from: { site: "ref_handle", liminal: "published", boundary: "scope" },
    to: { site: "register_meta", liminal: "published" },
    rewrite: { before: "@($L)", after: "$($L)" },
    inverse: "demote.register_to_ref",
    status: "implemented",
    apply: applyPublishedToRegisterMeta,
    motion: "promote",
    axes: ["reference", "ground"]
  },
  {
    id: "demote.register_to_ref",
    name: "substrate meta back to observer ref",
    from: { site: "register_meta", liminal: "published" },
    to: { site: "ref_handle", liminal: "published", boundary: "scope" },
    rewrite: { before: "$($L)", after: "@($L)" },
    inverse: "promote.register_bridge",
    status: "implemented",
    apply: applyRegisterMetaToRef,
    motion: "demote",
    axes: ["reference", "ground"]
  },
  // ── pair labels (desugar surface {_L } _L) ─────────────────
  {
    id: "ingress.pair_labels",
    name: "attach open/close pair labels on body (desugar surface)",
    from: { site: ["free", "interior_term"], liminal: ["exterior", "void", "chamber"] },
    to: { site: "pair_open", liminal: "aperture", boundary: "body" },
    rewrite: { before: "$L | {} | {body}", after: "{_$L \u2026 }_$L" },
    status: "implemented",
    apply: applyFreeToPairLabels,
    motion: "ingress",
    axes: ["label", "material"]
  },
  {
    id: "egress.pair_labels",
    name: "strip empty pair labels to a free label",
    from: { site: ["pair_open", "pair_close"], liminal: ["aperture", "egress"], boundary: "body" },
    to: { site: "free", liminal: "exterior" },
    rewrite: { before: "{_$L }_$L", after: "$L" },
    status: "implemented",
    apply: applyEmptyPairLabelsToFree,
    motion: "egress",
    axes: ["label", "material"]
  },
  {
    id: "egress.pair_labels_to_body",
    name: "strip pair labels while retaining an inhabited body",
    from: { site: ["pair_open", "pair_close"], liminal: ["aperture", "egress"], boundary: "body" },
    to: { site: "interior_term", liminal: "chamber", boundary: "body" },
    rewrite: { before: "{_$L body }_$L", after: "{body}" },
    status: "implemented",
    apply: applyInhabitedPairLabelsToBody,
    motion: "egress",
    axes: ["label", "material"]
  },
  {
    id: "promote.pair_to_header",
    name: "pair-labeled body publishes as integrate header",
    from: { site: "pair_open", liminal: "aperture", boundary: "body" },
    to: { site: "header", liminal: "published", boundary: "body" },
    rewrite: { before: "{_$L \u2026 }_$L", after: '^["$L"]{\u2026}' },
    status: "implemented",
    apply: applyPairLabelsToHeader,
    motion: "promote",
    axes: ["label", "fold", "material"]
  }
];
var RULE_BY_ID2 = new Map(MOBILITY_RULES.map((r) => [r.id, r]));
function mobilityRule(id) {
  return RULE_BY_ID2.get(id);
}
function rulesFrom(pos) {
  return MOBILITY_RULES.filter((r) => matchPattern(pos, r.from));
}
function rulesTo(pos) {
  return MOBILITY_RULES.filter((r) => matchPattern(pos, r.to));
}
function rulesByMotion(motion) {
  return MOBILITY_RULES.filter((r) => r.motion === motion);
}
function rulesByStatus(status) {
  return MOBILITY_RULES.filter((r) => r.status === status);
}
function applyMobilityRule(ruleId, source, label) {
  const rule = RULE_BY_ID2.get(ruleId);
  if (!rule) return { ok: false, reason: `unknown rule ${ruleId}` };
  if (!rule.apply) return { ok: false, reason: `rule ${ruleId} has no computational apply (${rule.status})`, rule };
  if (!isFormLabel(label)) {
    return { ok: false, reason: `label must match ${FORM_GEOMETRY_PROFILE.labelGrammar} grammar`, rule };
  }
  const next = rule.apply(source, label);
  if (next === null) return { ok: false, reason: `preconditions failed for ${ruleId}`, rule };
  const beforeTopography = snapshotTopography(source);
  const afterTopography = snapshotTopography(next);
  const inverseRule = rule.inverse ? RULE_BY_ID2.get(rule.inverse) : void 0;
  const restoredSource = inverseRule?.apply?.(next, label) ?? void 0;
  const inverseStatus = !rule.inverse || !inverseRule?.apply ? "unavailable" : restoredSource === void 0 ? "failed" : restoredSource === source.trim() ? "exact" : "changed";
  return {
    ok: true,
    source: next,
    rule,
    receipt: {
      profile: FORM_MOBILITY_APPLICATION_PROFILE,
      effectGrade: "effect.l1.memory",
      beforeHash: hashString(source),
      afterHash: hashString(next),
      beforeHealth: beforeTopography.parseHealth,
      afterHealth: afterTopography.parseHealth,
      topographyDelta: topographyDelta(beforeTopography, afterTopography),
      semanticEquivalence: "not_claimed",
      inverse: {
        ruleId: rule.inverse,
        comparison: "trimmed_surface",
        status: inverseStatus,
        restoredSource
      }
    }
  };
}
function isFormLabel(label) {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(label);
}
var REFERENCE_PROGRESSIONS = [
  {
    id: "ref.selection_path",
    name: "selection \u2192 path \u2192 ref",
    description: "Name enters selection, becomes path root, then observer handle",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "frame_param", liminal: "chamber", boundary: "frame" },
      { site: "path_node", liminal: "exterior" },
      { site: "ref_handle", liminal: "published", boundary: "scope" }
    ],
    rulePath: ["ingress.frame_select", "project.frame_to_path", "ingress.ref_handle"],
    status: "partial"
  },
  {
    id: "ref.ground_publish",
    name: "ground facet \u2192 header publish",
    description: "Name grounds as facet key then folds to integrate header",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "facet_key", liminal: "chamber", boundary: "body" },
      { site: "header", liminal: "published", boundary: "body" }
    ],
    rulePath: ["ingress.facet_key", "fold.facets_to_header"],
    status: "implemented"
  },
  {
    id: "ref.membrane_observe",
    name: "membrane tag \u2192 observer",
    description: "Capsule tag rehosts to perspective ref",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "capsule_tag", liminal: "membrane", boundary: "capsule" },
      { site: "ref_handle", liminal: "published", boundary: "scope" }
    ],
    rulePath: ["ingress.capsule_tag", "orbit.tag_to_ref"],
    status: "implemented"
  },
  {
    id: "ref.pair_publish",
    name: "pair labels \u2192 header",
    description: "Desugar pair labels then publish as header",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "pair_open", liminal: "aperture", boundary: "body" },
      { site: "header", liminal: "published", boundary: "body" }
    ],
    rulePath: ["ingress.pair_labels", "promote.pair_to_header"],
    status: "implemented"
  },
  {
    id: "ref.to_register_meta",
    name: "observer \u2192 substrate meta",
    description: "Published ref bridges to $(L) surface (runtime promote is separate effect.l1.memory)",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "ref_handle", liminal: "published", boundary: "scope" },
      { site: "register_meta", liminal: "published" }
    ],
    rulePath: ["ingress.ref_handle", "promote.register_bridge"],
    status: "implemented"
  },
  {
    id: "ref.path_chain",
    name: "path chain deepening",
    description: "Compose path segments as higher-order reference form",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "path_node", liminal: "exterior" },
      { site: "path_node", liminal: "exterior" },
      { site: "path_node", liminal: "exterior" }
    ],
    rulePath: ["project.frame_to_path", "project.path_extend", "project.path_extend"],
    status: "implemented"
  },
  {
    id: "ref.action_label_cycle",
    name: "free \u21C4 operator-adjacent",
    description: "Attach/detach action label (aperture liminality)",
    waypoints: [
      { site: "free", liminal: "exterior" },
      { site: "operator_adjacent", liminal: "aperture" },
      { site: "free", liminal: "exterior" }
    ],
    rulePath: ["ingress.operator_label", "egress.operator_label"],
    status: "implemented"
  }
];
function walkReferenceProgression(progressionId, label, startSource) {
  const progression = REFERENCE_PROGRESSIONS.find((p) => p.id === progressionId);
  if (!progression) return void 0;
  let source = startSource ?? label;
  const steps = [];
  for (const ruleId of progression.rulePath) {
    const before = source;
    const result = applyMobilityRule(ruleId, source, label);
    if (!result.ok) {
      steps.push({ ruleId, ok: false, before, reason: result.reason });
      return { progression, steps, source, completed: false };
    }
    source = result.source;
    steps.push({ ruleId, ok: true, before, after: source, receipt: result.receipt });
  }
  return { progression, steps, source, completed: true };
}
var HIGHER_ORDER_FORMS = [
  {
    id: "hof.select_then_path",
    name: "Select then path",
    description: "Pull free label into [] then open a path root",
    program: ["ingress.frame_select", "project.frame_to_path"],
    boundaries: ["frame"],
    composition: "project \u2218 ingress_select",
    status: "implemented",
    liminalPath: ["exterior", "chamber", "exterior"]
  },
  {
    id: "hof.ground_then_publish",
    name: "Ground then publish",
    description: "Seat label as facet key then fold facet into integrate header",
    program: ["ingress.facet_key", "fold.facets_to_header"],
    boundaries: ["body"],
    composition: "fold_header \u2218 ingress_ground",
    status: "implemented",
    liminalPath: ["exterior", "chamber", "published"]
  },
  {
    id: "hof.membrane_to_observer",
    name: "Membrane to observer",
    description: "Tag capsule then rehost to @(tag)",
    program: ["ingress.capsule_tag", "orbit.tag_to_ref"],
    boundaries: ["capsule", "scope"],
    composition: "rehost_ref \u2218 ingress_membrane",
    status: "implemented",
    liminalPath: ["exterior", "membrane", "published"]
  },
  {
    id: "hof.path_deepen",
    name: "Path deepen",
    description: "Build a multi-segment path reference",
    program: ["project.frame_to_path", "project.path_extend", "project.path_extend"],
    composition: "path_extend\xB2 \u2218 path_root",
    status: "implemented",
    liminalPath: ["exterior", "exterior", "exterior"]
  },
  {
    id: "hof.label_orbit_frame_capsule_scope",
    name: "Label orbit frame\u2192capsule\u2192scope",
    description: "Move one label across boundary hosts: selection \u2192 membrane \u2192 reference",
    program: ["ingress.frame_select", "orbit.frame_param_to_tag", "orbit.tag_to_ref"],
    boundaries: ["frame", "capsule", "scope"],
    composition: "rehost_scope \u2218 rehost_capsule \u2218 ingress_frame",
    status: "implemented",
    liminalPath: ["exterior", "chamber", "membrane", "published"]
  },
  {
    id: "hof.action_aperture_cycle",
    name: "Action aperture cycle",
    description: "Attach and detach !label \u2014 reversible aperture liminality",
    program: ["ingress.operator_label", "egress.operator_label"],
    composition: "egress \u2218 ingress",
    status: "implemented",
    liminalPath: ["exterior", "aperture", "exterior"]
  },
  {
    id: "hof.interior_ground_fold",
    name: "Interior ground fold",
    description: "Body interior {x} becomes grounded facet .{x: x}",
    program: ["rehost.interior_to_facet"],
    boundaries: ["body"],
    composition: "rehost_ground",
    status: "implemented",
    liminalPath: ["chamber", "chamber"]
  },
  {
    id: "hof.pair_label_publish",
    name: "Pair labels then publish",
    description: 'Desugar-style {_L }_L pair labels then promote to ^["L"]{}',
    program: ["ingress.pair_labels", "promote.pair_to_header"],
    boundaries: ["body"],
    composition: "promote_header \u2218 ingress_pair",
    status: "implemented",
    liminalPath: ["exterior", "aperture", "published"]
  },
  {
    id: "hof.publish_to_register",
    name: "Publish then substrate bridge",
    description: "Free name becomes an observer ref, then a reversible $(L) substrate meta surface",
    program: ["ingress.ref_handle", "promote.register_bridge"],
    boundaries: ["scope"],
    composition: "register_bridge \u2218 ingress_ref",
    status: "implemented",
    liminalPath: ["exterior", "published", "published"]
  },
  {
    id: "hof.ground_fold_register",
    name: "Ground \u2192 header \u2192 register meta",
    description: "Proposed payload-carrying chain: free \u2192 facet \u2192 header \u2192 register projection",
    program: ["ingress.facet_key", "fold.facets_to_header", "promote.register_bridge"],
    boundaries: ["body"],
    composition: "register_bridge \u2218 fold_header \u2218 ingress_ground",
    status: "partial",
    liminalPath: ["exterior", "chamber", "published", "published"]
  }
];
function runHigherOrderForm(formId, label, startSource) {
  const form = HIGHER_ORDER_FORMS.find((f) => f.id === formId);
  if (!form) return void 0;
  let source = startSource ?? label;
  const steps = [];
  for (const ruleId of form.program) {
    const before = source;
    const segmentLabel = ruleId === "project.path_extend" ? `${label}${steps.filter((s) => s.ruleId === ruleId).length + 1}` : label;
    const result = applyMobilityRule(ruleId, source, segmentLabel === label ? label : segmentLabel);
    if (!result.ok && ruleId === "project.path_extend") {
      const retry = applyMobilityRule(ruleId, source, label);
      if (retry.ok) {
        source = retry.source;
        steps.push({ ruleId, ok: true, before, after: source, receipt: retry.receipt });
        continue;
      }
    }
    if (!result.ok) {
      steps.push({ ruleId, ok: false, before, reason: result.reason });
      return { form, steps, source, completed: false };
    }
    source = result.source;
    steps.push({ ruleId, ok: true, before, after: source, receipt: result.receipt });
  }
  return { form, steps, source, completed: true };
}
function labelSiteGraph() {
  const edgeMap = /* @__PURE__ */ new Map();
  for (const rule of MOBILITY_RULES) {
    const fromSites = flattenSite(rule.from.site) ?? ["free"];
    const toSites = flattenSite(rule.to.site) ?? ["free"];
    for (const f of fromSites) {
      for (const t of toSites) {
        const key = `${f}->${t}`;
        const existing = edgeMap.get(key);
        if (existing) {
          if (!existing.ruleIds.includes(rule.id)) existing.ruleIds.push(rule.id);
          if (!existing.motions.includes(rule.motion)) existing.motions.push(rule.motion);
        } else {
          edgeMap.set(key, {
            from: f,
            to: t,
            ruleIds: [rule.id],
            motions: [rule.motion]
          });
        }
      }
    }
  }
  return Array.from(edgeMap.values());
}
function flattenSite(site) {
  if (site === void 0) return void 0;
  return Array.isArray(site) ? site : [site];
}
function formatSiteGraph() {
  const edges = labelSiteGraph();
  const lines = ["from \u2192 to | motions | rules"];
  for (const e of edges.sort((a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to))) {
    lines.push(
      `${e.from} \u2192 ${e.to} | ${e.motions.join(",")} | ${e.ruleIds.join(", ")}`
    );
  }
  return lines.join("\n");
}
function formatHigherOrderForms() {
  return HIGHER_ORDER_FORMS.map(
    (f) => `${f.id}
  ${f.name}: ${f.description}
  ${f.composition}
  liminal: ${f.liminalPath.join(" \u2192 ")}
  program: ${f.program.join(" \u21D2 ")}
  status: ${f.status}`
  ).join("\n\n");
}
function formatMobilityRules(status) {
  const rules = status ? rulesByStatus(status) : MOBILITY_RULES;
  return rules.map(
    (r) => `${r.id} [${r.status}/${r.motion}]
  ${r.name}
  ${subLabel(r.rewrite.before, "$L")}  \u21D2  ${subLabel(r.rewrite.after, "$L")}`
  ).join("\n\n");
}
function computationalRuleIds() {
  return MOBILITY_RULES.filter((r) => typeof r.apply === "function").map((r) => r.id);
}

// .spw/_workbench/packages/spw-seed/src/canonical/form-contours.ts
var ROLE_AXES = {
  select: ["selection"],
  materialize: ["material"],
  hold: ["flow"],
  membrane: ["interface"],
  channel: ["flow"],
  range: ["selection"],
  label: ["label"],
  path: ["path"],
  ref: ["reference"],
  ground: ["ground"],
  fold: ["fold"],
  annotate: ["label"],
  defer: ["potential"],
  collapse: ["ground"],
  integrate: ["label", "material"],
  couple: ["interface"],
  open: ["potential"]
};
function catalogSignatureFor(points, declaredAxes) {
  return hashString(
    `${FORM_LADDER_PROFILE.id}@${FORM_LADDER_PROFILE.revision}${declaredAxes.join(",")}` + points.map(
      (point) => `${point.catalogIndex}:${point.id}:${point.surface}:${point.role}:${point.axes.join(",")}:${point.implies}`
    ).join("")
  );
}
function cloneContour(contour) {
  return {
    ...contour,
    declaredAxes: [...contour.declaredAxes],
    points: contour.points.map((point) => ({
      ...point,
      axes: [...point.axes],
      evidence: { ...point.evidence }
    })),
    omittedPointIds: [...contour.omittedPointIds],
    dimensions: {
      ...contour.dimensions,
      axisCoverage: {
        ...contour.dimensions.axisCoverage,
        undeclared: [...contour.dimensions.axisCoverage.undeclared]
      }
    }
  };
}
function freezeContourSnapshot(contour) {
  Object.freeze(contour.declaredAxes);
  for (const point of contour.points) {
    Object.freeze(point.axes);
    Object.freeze(point.evidence);
    Object.freeze(point);
  }
  Object.freeze(contour.points);
  Object.freeze(contour.omittedPointIds);
  Object.freeze(contour.dimensions.axisCoverage.undeclared);
  Object.freeze(contour.dimensions.axisCoverage);
  Object.freeze(contour.dimensions);
  return Object.freeze(contour);
}
function evidenceSignatureFor(points) {
  return hashString(
    points.map(
      (point) => `${point.catalogIndex}:${point.evidence.expectation}:${point.evidence.parseHealth}:${point.evidence.expectationMet}:${point.evidence.proseFallback}`
    ).join("")
  );
}
function viewSignatureFor(catalogSignature, points) {
  return hashString(
    `${catalogSignature}${evidenceSignatureFor(points)}` + points.map((point) => point.catalogIndex).join(",")
  );
}
function dimensionsFor(points, catalogPointCount, declaredAxes) {
  const roles = new Set(points.map((point) => point.role));
  const coveredAxes = new Set(points.flatMap((point) => point.axes));
  const declared = new Set(declaredAxes);
  const covered = [...coveredAxes].filter((axis) => declared.has(axis)).length;
  const undeclared = [...coveredAxes].filter((axis) => !declared.has(axis));
  return {
    visiblePointCount: points.length,
    catalogPointCount,
    roleVariety: roles.size,
    structuredEvidenceCount: points.filter(
      (point) => point.evidence.expectation === "structured" && point.evidence.expectationMet
    ).length,
    conceptualSlotCount: points.filter((point) => point.evidence.expectation === "conceptual").length,
    failedExpectationCount: points.filter((point) => !point.evidence.expectationMet).length,
    axisCoverage: {
      covered,
      declared: declared.size,
      ratio: declared.size === 0 ? 1 : covered / declared.size,
      undeclared
    }
  };
}
function projectContour(original, indices, view) {
  const selected = new Set(indices);
  const points = original.points.filter((point) => selected.has(point.catalogIndex));
  const newlyOmittedPointIds = original.points.filter((point) => !selected.has(point.catalogIndex)).map((point) => point.id);
  const omittedPointIds = [.../* @__PURE__ */ new Set([...original.omittedPointIds, ...newlyOmittedPointIds])];
  return {
    ...original,
    view,
    points,
    omittedPointIds,
    evidenceSignature: evidenceSignatureFor(points),
    viewSignature: viewSignatureFor(original.catalogSignature, points),
    dimensions: dimensionsFor(
      points,
      original.dimensions.catalogPointCount,
      original.declaredAxes
    )
  };
}
function contourFormLadder(ladderOrQuery) {
  const ladder = typeof ladderOrQuery === "string" ? boundaryLadder(ladderOrQuery) ?? operatorLadder(ladderOrQuery) : ladderOrQuery;
  if (!ladder) return void 0;
  const probe = probeFormLadder(ladder);
  const points = ladder.steps.map((step, catalogIndex) => {
    const observation = probe.steps[catalogIndex];
    const attributedAxes = ROLE_AXES[step.role] ?? [];
    return {
      catalogIndex,
      id: step.id,
      surface: step.surface,
      role: step.role,
      implies: step.implies,
      axes: attributedAxes,
      evidence: {
        expectation: step.parseExpectation,
        parseHealth: observation.parseHealth,
        expectationMet: observation.expectationMet,
        proseFallback: observation.proseFallback
      }
    };
  });
  const catalogSignature = catalogSignatureFor(points, ladder.axes);
  const evidenceSignature = evidenceSignatureFor(points);
  return {
    profile: FORM_LADDER_PROFILE,
    ladderId: ladder.id,
    ladderKind: ladder.kind,
    declaredAxes: ladder.axes,
    view: "full",
    catalogSignature,
    evidenceSignature,
    viewSignature: viewSignatureFor(catalogSignature, points),
    points,
    omittedPointIds: [],
    dimensions: dimensionsFor(points, points.length, ladder.axes)
  };
}
function endpoints(points) {
  if (points.length === 0) return [];
  if (points.length === 1) return [points[0].catalogIndex];
  return [points[0].catalogIndex, points[points.length - 1].catalogIndex];
}
function balancedIndices(points, maxPoints) {
  if (!Number.isInteger(maxPoints) || maxPoints < 2) {
    throw new RangeError("balanced contour reduction requires maxPoints >= 2");
  }
  if (points.length <= maxPoints) return points.map((point) => point.catalogIndex);
  const indices = /* @__PURE__ */ new Set();
  for (let slot = 0; slot < maxPoints; slot += 1) {
    const pointIndex = Math.round(slot * (points.length - 1) / (maxPoints - 1));
    indices.add(points[pointIndex].catalogIndex);
  }
  return [...indices];
}
function reductionIndices(contour, policy, maxPoints) {
  const points = contour.points;
  const keep = new Set(endpoints(points));
  if (policy === "evidence") {
    for (const point of points) {
      if (point.evidence.expectation === "structured" || !point.evidence.expectationMet) {
        keep.add(point.catalogIndex);
      }
    }
  } else if (policy === "axes") {
    for (const axis of contour.declaredAxes) {
      const anchor = points.find((point) => point.axes.includes(axis));
      if (anchor) keep.add(anchor.catalogIndex);
    }
  } else if (policy === "balanced") {
    return balancedIndices(points, maxPoints);
  }
  return [...keep].sort((a, b) => a - b);
}
function reduceFormContour(contour, options = {}) {
  const policy = options.policy ?? "axes";
  const indices = reductionIndices(contour, policy, options.maxPoints ?? 4);
  const reduced = projectContour(contour, indices, "reduced");
  const retained = new Set(indices);
  const omittedPoints = contour.points.filter((point) => !retained.has(point.catalogIndex));
  const retainedPoints = contour.points.filter((point) => retained.has(point.catalogIndex));
  const retainedAxes = new Set(retainedPoints.flatMap((point) => point.axes));
  const retainedRoles = new Set(retainedPoints.map((point) => point.role));
  const omittedAxes = [...new Set(omittedPoints.flatMap((point) => point.axes))].filter((axis) => !retainedAxes.has(axis));
  const omittedRoles = [...new Set(omittedPoints.map((point) => point.role))].filter((role) => !retainedRoles.has(role));
  const identity = omittedPoints.length === 0;
  const original = freezeContourSnapshot(cloneContour(contour));
  return {
    operation: "reduce",
    policy,
    inputSignature: contour.viewSignature,
    outputSignature: reduced.viewSignature,
    contour: reduced,
    omittedPoints,
    loss: {
      kind: identity ? "none" : "projection",
      omittedPointCount: omittedPoints.length,
      omittedRoles,
      omittedAxes,
      omittedStructuredEvidence: omittedPoints.filter(
        (point) => point.evidence.expectation === "structured" && point.evidence.expectationMet
      ).length
    },
    semanticEquivalence: identity ? "identity" : "not_claimed",
    reversible: identity ? "identity" : "with_receipt",
    original
  };
}
function expandFormContour(reduction, options = {}) {
  const original = reduction.original;
  const reducedIndices = new Set(reduction.contour.points.map((point) => point.catalogIndex));
  const selected = new Set(reducedIndices);
  if (options.full ?? false) {
    for (const point of original.points) selected.add(point.catalogIndex);
  } else {
    const radius = options.radius ?? 1;
    if (!Number.isInteger(radius) || radius < 0) {
      throw new RangeError("contour expansion radius must be a non-negative integer");
    }
    for (const anchor of reducedIndices) {
      for (const point of original.points) {
        if (Math.abs(point.catalogIndex - anchor) <= radius) selected.add(point.catalogIndex);
      }
    }
  }
  const indices = [...selected].sort((a, b) => a - b);
  const exactRestore = indices.length === original.points.length;
  const contour = exactRestore ? cloneContour(original) : projectContour(original, indices, "expanded");
  const addedPointIds = contour.points.filter((point) => !reducedIndices.has(point.catalogIndex)).map((point) => point.id);
  return {
    operation: "expand",
    inputSignature: reduction.outputSignature,
    outputSignature: contour.viewSignature,
    contour,
    addedPointIds,
    remainingOmittedPointIds: contour.omittedPointIds,
    exactRestore
  };
}
function restoreFormContour(reduction) {
  return cloneContour(reduction.original);
}
function formatFormContour(contour) {
  const dimensions = contour.dimensions;
  const lines = [
    `${contour.ladderId} [${contour.view}] ${contour.viewSignature}`,
    `profile=${contour.profile.id}@${contour.profile.revision} status=${contour.profile.status}`,
    `points=${dimensions.visiblePointCount}/${dimensions.catalogPointCount} roles=${dimensions.roleVariety} axes=${dimensions.axisCoverage.covered}/${dimensions.axisCoverage.declared} structured=${dimensions.structuredEvidenceCount} conceptual=${dimensions.conceptualSlotCount} failed=${dimensions.failedExpectationCount}`
  ];
  for (const point of contour.points) {
    lines.push(
      `${point.catalogIndex + 1}. ${point.surface} [${point.role}]` + (point.axes.length > 0 ? ` axes=${point.axes.join(",")}` : "") + ` health=${point.evidence.parseHealth}` + (point.evidence.expectationMet ? "" : " expectation=failed")
    );
  }
  if (contour.omittedPointIds.length > 0) {
    lines.push(`omitted=${contour.omittedPointIds.join(",")}`);
  }
  return lines.join("\n");
}

// .spw/_workbench/packages/spw-seed/src/canonical/range-transform.ts
var FRAGMENT_LINE = /^#:L(\d+)(?:C(\d+))?(?:-L(\d+)(?:C(\d+))?)?$/i;
var FRAGMENT_OFFSET = /^#@offset=(\d+)\.\.(\d+)$/i;
function contentHash(source) {
  return hashString(source).slice(0, 16);
}
function parseRangeFragment(fragment) {
  const f = fragment.trim();
  const off = f.match(FRAGMENT_OFFSET);
  if (off) {
    return { offsetStart: Number(off[1]), offsetEnd: Number(off[2]) };
  }
  const m = f.match(FRAGMENT_LINE);
  if (!m) return null;
  const startLine = Number(m[1]);
  const startCol = m[2] !== void 0 ? Number(m[2]) : 0;
  const endLine = m[3] !== void 0 ? Number(m[3]) : startLine;
  const endCol = m[4] !== void 0 ? Number(m[4]) : Number.POSITIVE_INFINITY;
  return {
    start: { line: startLine, column: startCol },
    end: { line: endLine, column: endCol },
    lineOnly: m[2] === void 0 && m[4] === void 0
  };
}
function splitPathFragment(ref) {
  const hash = ref.indexOf("#");
  if (hash < 0) return { path: ref, fragment: "" };
  return { path: ref.slice(0, hash), fragment: ref.slice(hash) };
}
function spanToOffsets(source, span) {
  const lines = source.split(/\r?\n/);
  const startLine = Math.max(1, span.start.line);
  const endLine = Math.max(startLine, span.end.line);
  let start = 0;
  for (let i = 1; i < startLine; i++) {
    start += (lines[i - 1]?.length ?? 0) + 1;
  }
  start += Math.min(span.start.column, lines[startLine - 1]?.length ?? 0);
  let end = 0;
  for (let i = 1; i < endLine; i++) {
    end += (lines[i - 1]?.length ?? 0) + 1;
  }
  const endLineText = lines[endLine - 1] ?? "";
  const endCol = span.end.column === Number.POSITIVE_INFINITY ? endLineText.length : Math.min(span.end.column, endLineText.length);
  end += endCol;
  if (source.includes("\r\n")) {
    return spanToOffsetsCrLf(source, span);
  }
  return { start, end: Math.max(start, end) };
}
function spanToOffsetsCrLf(source, span) {
  let line = 1;
  let col = 0;
  let start = 0;
  let end = source.length;
  let foundStart = false;
  for (let i = 0; i < source.length; i++) {
    if (!foundStart && line === span.start.line && col === span.start.column) {
      start = i;
      foundStart = true;
    }
    if (line === span.end.line) {
      const endCol = span.end.column === Number.POSITIVE_INFINITY ? (
        // end of line
        -1
      ) : span.end.column;
      if (endCol === -1) {
        if (source[i] === "\n") {
          end = i;
          break;
        }
      } else if (col === endCol) {
        end = i;
        break;
      }
    }
    if (source[i] === "\n") {
      line++;
      col = 0;
    } else if (source[i] === "\r") {
    } else {
      col++;
    }
  }
  if (!foundStart) {
    const lines = source.split(/\r?\n/);
    let s = 0;
    for (let i = 1; i < span.start.line; i++) s += (lines[i - 1]?.length ?? 0) + 1;
    start = s + span.start.column;
  }
  return { start, end: Math.max(start, end) };
}
function resolveRange(input) {
  const encoding = input.encoding ?? "utf16";
  const parsed = parseRangeFragment(input.fragment);
  if (!parsed) {
    throw new Error(`invalid range fragment: ${input.fragment}`);
  }
  let startOffset;
  let endOffset;
  let span;
  if ("offsetStart" in parsed) {
    startOffset = parsed.offsetStart;
    endOffset = parsed.offsetEnd;
    span = {
      start: offsetToPosition(input.source, startOffset),
      end: offsetToPosition(input.source, endOffset)
    };
  } else {
    span = parsed;
    const o = spanToOffsets(input.source, span);
    startOffset = o.start;
    endOffset = o.end;
  }
  return {
    uri: input.uri,
    source: input.source,
    contentHash: contentHash(input.source),
    encoding,
    startOffset,
    endOffset,
    span,
    fragment: input.fragment
  };
}
function offsetToPosition(source, offset) {
  let line = 1;
  let column = 0;
  const o = Math.min(Math.max(0, offset), source.length);
  for (let i = 0; i < o; i++) {
    if (source[i] === "\n") {
      line++;
      column = 0;
    } else {
      column++;
    }
  }
  return { line, column };
}
function planSpanTransform(resolved, transform, options = {}) {
  const size = Math.max(1, options.size ?? 2);
  const slice = resolved.source.slice(resolved.startOffset, resolved.endOffset);
  const lines = slice.split(/\r?\n/);
  let newSlice;
  switch (transform) {
    case "indent_lines": {
      const pad = " ".repeat(size);
      newSlice = lines.map((l) => l.length ? pad + l : l).join("\n");
      break;
    }
    case "outdent_lines": {
      newSlice = lines.map((l) => {
        if (l.startsWith(" ".repeat(size))) return l.slice(size);
        if (l.startsWith("	")) return l.slice(1);
        return l.replace(/^\s{1,}/, (m) => m.length > size ? m.slice(size) : "");
      }).join("\n");
      break;
    }
    case "trim_lines": {
      newSlice = lines.map((l) => l.trimEnd()).join("\n");
      break;
    }
    default:
      throw new Error(`unknown span transform: ${transform}`);
  }
  const edits = [
    {
      start: resolved.startOffset,
      end: resolved.endOffset,
      newText: newSlice,
      ruleId: transform,
      stratum: "layout"
    }
  ];
  const plannedSource = applyEdits(resolved.source, edits);
  const effectCeiling = options.effectCeiling ?? "effect.l1.memory";
  return {
    version: "spw.range/1",
    resolved,
    transform,
    options: { size, effectCeiling },
    edits,
    plannedSource,
    effectCeiling,
    writeSafe: effectCeiling !== "effect.l0.measure"
  };
}
function applyRangePlan(currentSource, plan, opts = {}) {
  const hash = contentHash(currentSource);
  const expected = opts.expectedHash ?? plan.resolved.contentHash;
  if (!opts.force && hash !== expected) {
    throw new Error(
      `range apply refused: contentHash drift (have ${hash}, plan ${expected})`
    );
  }
  if (plan.effectCeiling === "effect.l0.measure") {
    throw new Error("range apply refused: effect.l0.measure is plan-only");
  }
  const source = applyEdits(currentSource, plan.edits);
  return {
    source,
    differential: differentialFromSources(currentSource, source, plan.transform, "layout", hashString)
  };
}
function formatRangePlan(plan) {
  const r = plan.resolved;
  return [
    `# spw range plan  ${plan.transform}  effect=${plan.effectCeiling}`,
    `uri=${r.uri}  fragment=${r.fragment}  hash=${r.contentHash}`,
    `span L${r.span.start.line}C${r.span.start.column}-L${r.span.end.line}C${r.span.end.column === Number.POSITIVE_INFINITY ? "\u221E" : r.span.end.column}`,
    `offsets ${r.startOffset}..${r.endOffset}  edits=${plan.edits.length}  writeSafe=${plan.writeSafe}`
  ].join("\n");
}

// .spw/_workbench/packages/spw-seed/src/canonical/index-config.ts
var INDEX_PRESETS = {
  minimal: {
    version: "spw.index/1",
    depth: "minimal",
    pathRefs: true,
    annotations: false,
    braceGeometry: false,
    operatorCensus: false,
    onfProducts: false,
    streamMeta: false,
    maxFiles: 200,
    concurrency: 4,
    excludeSubstrings: ["node_modules", "dist", "_workbench", ".git"]
  },
  standard: {
    version: "spw.index/1",
    depth: "standard",
    pathRefs: true,
    annotations: true,
    braceGeometry: false,
    operatorCensus: true,
    onfProducts: false,
    streamMeta: false,
    maxFiles: 2e3,
    concurrency: 8,
    excludeSubstrings: ["node_modules", "dist", "_workbench", ".git"]
  },
  full: {
    version: "spw.index/1",
    depth: "full",
    pathRefs: true,
    annotations: true,
    braceGeometry: true,
    operatorCensus: true,
    onfProducts: true,
    streamMeta: true,
    maxFiles: 0,
    concurrency: 8,
    excludeSubstrings: ["node_modules", "dist", "_workbench", ".git"]
  }
};
var INDEX_TRADEOFFS = {
  minimal: "Navigation-only: fast open. Misses concept trees and geometry lessons.",
  standard: "Default LSP-like: path refs + annotations + cheap op census. No full ONF.",
  full: "Parse-heavy: brace signatures, ONF products, stream meta. Use for audits / offline invent."
};
function resolveIndexConfig(depthOrPartial) {
  if (!depthOrPartial) return { ...INDEX_PRESETS.standard };
  if (typeof depthOrPartial === "string") {
    return { ...INDEX_PRESETS[depthOrPartial] };
  }
  const base = INDEX_PRESETS[depthOrPartial.depth ?? "standard"];
  return { ...base, ...depthOrPartial, version: "spw.index/1" };
}

// .spw/_workbench/packages/spw-seed/src/canonical/dream-schedule.ts
var DREAM_SCHEDULE_SOFT = scheduleOf("soft", "Gentle corpus modeling without write", [
  { id: "rest", beats: 2, effect: "effect.l0.measure", act: "idle hold", hint: "spw beat -n 1" },
  { id: "invent", beats: 3, effect: "effect.l0.measure", act: "inventory warmth", hint: "spw invent <roots> --role hub -n 12" },
  { id: "form", beats: 2, effect: "effect.l0.measure", act: "wrap confluence ladder", hint: 'spw form --seq "& => {&} => {&[#label]}"' },
  { id: "formula", beats: 2, effect: "effect.l0.measure", act: "pattern scan", hint: "spw formula <roots> --top 8" },
  { id: "topo", beats: 2, effect: "effect.l0.measure", act: "hubs + strands", hint: "spw map <roots> --hubs 8" },
  { id: "rest", beats: 1, effect: "effect.l0.measure", act: "consolidate", hint: "spw mem status" }
]);
var DREAM_SCHEDULE_PLAY = scheduleOf(
  "play",
  "Construct play \u2014 expand, wrap/label, dry mutation measure",
  [
    { id: "form", beats: 2, effect: "effect.l0.measure", act: "seed wrap sequence", hint: "spw form --catalog" },
    { id: "select", beats: 2, effect: "effect.l0.measure", act: "label selection", hint: "spw form --label my_claim --style hash" },
    { id: "invent", beats: 2, effect: "effect.l0.measure", act: "locate construct sites", hint: "spw invent <roots> --sort frames" },
    { id: "mutate_dry", beats: 3, effect: "effect.l0.measure", act: "mutation plan only", hint: "spw pulse <file> --profile layout_canonical" },
    { id: "formula", beats: 1, effect: "effect.l0.measure", act: "measure formulas", hint: "spw formula <roots> --family hold" },
    { id: "awaken", beats: 1, effect: "effect.l0.measure", act: "report next promote", hint: "spw analyze <roots> --quiet" }
  ]
);
var DREAM_SCHEDULE_DEEP = scheduleOf("deep", "Full sense loop per cycle", [
  { id: "invent", beats: 2, effect: "effect.l0.measure", act: "inventory", hint: "spw invent <roots>" },
  { id: "topo", beats: 3, effect: "effect.l0.measure", act: "topography", hint: "spw map <roots>" },
  { id: "formula", beats: 2, effect: "effect.l0.measure", act: "formulas", hint: "spw formula <roots>" },
  { id: "compose", beats: 2, effect: "effect.l0.measure", act: "composition model", hint: "spw analyze <roots>" },
  { id: "form", beats: 2, effect: "effect.l0.measure", act: "form masks", hint: "spw form --mask endpoints" },
  { id: "mutate_dry", beats: 2, effect: "effect.l0.measure", act: "dry mutation sample", hint: "spw pulse <hub> --check" },
  { id: "awaken", beats: 1, effect: "effect.l0.measure", act: "wake report", hint: "spw invent <roots> --role hub -n 5" }
]);
function scheduleOf(id, description, phases) {
  return {
    version: "spw.dream/1",
    id,
    description,
    phases,
    cycleBeats: phases.reduce((a, p) => a + p.beats, 0),
    loop: true
  };
}

// .spw/_workbench/packages/spw-seed/src/query/quoted.ts
function readDecodedQuotedValue(input, offset) {
  const quote = input[offset];
  if (quote !== '"' && quote !== "'" && quote !== "`") return null;
  let value = "";
  let cursor = offset + 1;
  while (cursor < input.length) {
    const char = input[cursor];
    if (char === quote) return { value, nextOffset: cursor + 1 };
    if (char === "\\") {
      if (cursor + 1 >= input.length) return null;
      value += input[cursor + 1];
      cursor += 2;
      continue;
    }
    value += char;
    cursor += 1;
  }
  return null;
}
function decodeQuotedToken(value) {
  const decoded = readDecodedQuotedValue(value, 0);
  return decoded?.nextOffset === value.length ? decoded.value : value;
}

// .spw/_workbench/packages/spw-seed/src/canonical/read-bias.ts
function termScalar(node) {
  if (!node) return void 0;
  switch (node.type) {
    case "PathRef": {
      const value = decodeQuotedToken(node.path.token.value);
      const hash = value.indexOf("#");
      if (hash > 0) return { value, kind: "path", fragment: value.slice(hash + 1) };
      return { value, kind: "path" };
    }
    case "Reference": {
      const ref = node;
      return { value: ref.raw ?? ref.path.map((t) => t.value).join("."), kind: "ref" };
    }
    case "Identifier":
      return { value: node.token.value, kind: "name" };
    case "Literal":
      return { value: decodeQuotedToken(node.token.value), kind: "literal" };
    case "Expression":
      return termScalar(node.terms[0]);
    default:
      return void 0;
  }
}
function readAxis(frame) {
  if (!frame) return void 0;
  const param = frame.content.find((c) => c.type === "Parameter");
  if (!param) return void 0;
  if (param.name) return param.name.value;
  return termScalar(param.value)?.value;
}
function readTargets(body) {
  const out = [];
  for (const expr of body.sequence.expressions) {
    for (const term of expr.terms) {
      const scalar = termScalar(term);
      if (scalar) out.push(scalar);
    }
  }
  return out;
}
function readBias(node) {
  if (node.type !== "Operation") return null;
  const op = node;
  if (op.operator.value !== "=" || !op.body) return null;
  const valence = op.modifiers?.modifiers.map((m) => m.value) ?? [];
  const sign = valence.includes("bane") ? "inverse" : "forward";
  return {
    anchor: termScalar(op.subject),
    axis: readAxis(op.frame),
    targets: readTargets(op.body),
    sign,
    valence
  };
}

// .spw/_workbench/packages/spw-seed/src/canonical/particles.ts
function isParticleLed(expr) {
  return expr.terms.length > 0 && expr.terms[0].type === "Particle";
}
function isBoundarylessOp(node) {
  if (!node || node.type !== "Operation") return false;
  const op = node;
  return !op.frame && !op.body && !op.subject && !op.linePayload;
}
function isMarkLike(item) {
  if (item.type === "Expression") {
    const expr = item;
    if (isParticleLed(expr)) return true;
    return isBoundarylessOp(expr.terms[0]);
  }
  if (item.type === "ProseChunk") {
    return (item.text ?? "").trim() === "";
  }
  return isBoundarylessOp(item);
}
function particlesOf(item) {
  if (item.type !== "Expression") return [];
  return item.terms.filter((t) => t.type === "Particle");
}
function bindItems(items, out) {
  for (let i = 0; i < items.length; i += 1) {
    const particles = particlesOf(items[i]);
    if (particles.length === 0) continue;
    let bound = null;
    for (let j = i + 1; j < items.length; j += 1) {
      if (!isMarkLike(items[j])) {
        bound = items[j];
        break;
      }
    }
    for (const particle2 of particles) {
      out.push({ particle: particle2, bound });
    }
  }
}
function particleBindings(root) {
  const out = [];
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }
    if (!node || typeof node !== "object") continue;
    const typed = node;
    if (typed.type === "Sequence") {
      bindItems(typed.expressions, out);
    } else if (typed.type === "Prose") {
      bindItems(typed.chunks, out);
    }
    for (const key of Object.keys(typed)) {
      if (key === "span" || key === "token") continue;
      stack.push(typed[key]);
    }
  }
  return out;
}
var ASPECT_MARK = /~#[A-Za-z_]/g;
function particleMix(root, source = "") {
  const mix = { deixis: 0, case: 0, mood: 0, aspect: 0 };
  mix.aspect = (source.match(ASPECT_MARK) ?? []).length;
  if (!root) return mix;
  for (const binding of particleBindings(root)) {
    switch (binding.particle.aim) {
      case ">":
        mix.deixis += 1;
        break;
      case ":":
        mix.case += 1;
        break;
      default:
        mix.mood += 1;
    }
  }
  return mix;
}
function particleMixTotal(mix) {
  return mix.deixis + mix.case + mix.mood + mix.aspect;
}
function deixisTable(root) {
  const table = /* @__PURE__ */ new Map();
  for (const binding of particleBindings(root)) {
    if (binding.particle.aim !== ">") continue;
    const name = binding.particle.name.value;
    if (!table.has(name)) table.set(name, binding);
  }
  return table;
}

// .spw/_workbench/packages/spw-seed/src/canonical/resolve-fragment.ts
function resolveFragment(root, fragment) {
  const table = deixisTable(root);
  return {
    fragment,
    binding: table.get(fragment) ?? null,
    available: [...table.keys()]
  };
}

// .spw/_workbench/packages/spw-seed/src/instrumentation/preview.ts
function describeOperation(op) {
  const mod = op.modifiers ? op.modifiers.modifiers.map((m) => m.value).join(".") + " " : "";
  const label = op.operatorLabel?.value ?? "";
  const subject = op.subject ? describeTerm(op.subject) : "";
  const frame = op.frame ? describeFrame(op.frame) : "";
  const body = op.body ? describeBody(op.body) : "";
  const inline = op.linePayload?.text ? ` ${op.linePayload.text}` : "";
  return `${mod}${op.operator.value}${label}${subject}${frame}${body ? ` {${body}}` : ""}${inline}`.trim();
}
function describePathRef(ref) {
  const tag = ref.tag ? `<${ref.tag.value}>` : "";
  return `~${tag}${ref.path.token.value}`;
}
function describeReference(ref) {
  const raw = ref.raw;
  const path = raw ?? ref.path.map((p) => p.value).filter(Boolean).join(".");
  return `@${path || ""}`;
}
function describeFrame(frame) {
  const items = frame.content.map((item) => {
    switch (item.type) {
      case "Reference":
        return describeReference(item);
      case "Literal":
        return item.token.value;
      case "Parameter": {
        const param = item;
        const name = param.name ? param.name.value + ":" : "";
        if (param.value.type === "Literal") {
          return `${name}${param.value.token.value}`;
        }
        if (param.value.type === "Reference") {
          return `${name}${describeReference(param.value)}`;
        }
        if (param.value.type === "Expression") {
          return `${name}${describeExpression(param.value)}`;
        }
        return name;
      }
      default:
        return "";
    }
  });
  return `[${items.filter(Boolean).join(", ")}]`;
}
function describeBody(body) {
  return describeSequence(body.sequence);
}
function describeCapsule(cap) {
  const channel = cap.tag?.value ?? (cap.channel?.type === "Literal" ? cap.channel.token.value : cap.channel?.type === "Identifier" ? cap.channel.token.value : "");
  const frame = cap.frame ? describeFrame(cap.frame) : "";
  const body = cap.body ? `{${describeBody(cap.body)}}` : "";
  const shell = `<${channel || "capsule"}${frame}>${body}`;
  if (cap.placement === "medial" || cap.left || cap.right) {
    const L = cap.left ? describeTerm(cap.left) : "";
    const R = cap.right ? describeTerm(cap.right) : "";
    return `${L}${shell}${R}`;
  }
  return shell;
}
function describeStream(stream) {
  const seq2 = describeSequence(stream.sequence);
  const sink = stream.sink ? ` @${describeReference(stream.sink).replace(/^ref\(/, "").replace(/\)$/, "")}` : "";
  return `<< ${seq2} >>${sink}`;
}
function describeNRange(nr) {
  return `((${nr.expression ? describeExpression(nr.expression) : ""}))`;
}
function describeScope(scope) {
  const name = scope.name ? scope.name.value : "";
  return `(${name ? name + ": " : ""}${describeSequence(scope.sequence)})`;
}
function describeTerm(term) {
  switch (term.type) {
    case "Binding":
      return describeBinding(term);
    case "Bullet":
      return describeBullet(term);
    case "PathRef":
      return describePathRef(term);
    case "Operation":
      return describeOperation(term);
    case "Reference":
      return describeReference(term);
    case "Scope":
      return describeScope(term);
    case "Capsule":
      return describeCapsule(term);
    case "Stream":
      return describeStream(term);
    case "NRange":
      return describeNRange(term);
    case "Literal":
      return term.token.value;
    case "Identifier":
      return term.token.value;
    case "Annotation": {
      const a = term;
      if (!a.value) return `~#${a.name.value}`;
      const v = a.value;
      if (v.type === "Literal") return `~#${a.name.value} ${v.token.value}`;
      if (v.type === "Reference") return `~#${a.name.value} ${describeReference(v)}`;
      if (v.type === "PathRef") return `~#${a.name.value} ${describePathRef(v)}`;
      return `~#${a.name.value}`;
    }
    default:
      return "Unknown";
  }
}
function describeBinding(b) {
  const key = describeTerm(b.key);
  const value = describeExpression(b.value);
  return `${key}: ${value}`;
}
function describeBullet(b) {
  const item = b.item.type === "ProseChunk" ? (b.item.text || "").trim() : describeExpression(b.item);
  return `.. ${item}`.trim();
}
function describeExpression(expr) {
  const parts = [];
  expr.terms.forEach((term, idx) => {
    parts.push(describeTerm(term));
    if (expr.connectors[idx]) {
      parts.push(expr.connectors[idx].value);
    }
  });
  return parts.join(" ");
}
function describeSequence(seq2) {
  return seq2.expressions.map(describeExpression).join(" ; ");
}
function describeProse(prose) {
  return prose.chunks.map((chunk) => {
    switch (chunk.type) {
      case "ProseChunk":
        return chunk.text;
      case "Expression":
        return describeExpression(chunk);
      case "Operation":
        return describeOperation(chunk);
      case "Reference":
        return describeReference(chunk);
      case "Scope":
        return describeScope(chunk);
      case "Capsule":
        return describeCapsule(chunk);
      case "Stream":
        return describeStream(chunk);
      case "NRange":
        return describeNRange(chunk);
      default:
        return "";
    }
  }).filter(Boolean).join(" ");
}
function previewAST(ast) {
  if (!ast) return "No AST";
  const expr = ast.expression.type === "Expression" ? describeExpression(ast.expression) : ast.expression.type === "Sequence" ? describeSequence(ast.expression) : describeProse(ast.expression);
  const annotations = ast.annotations?.map((a) => `#${a.name.value}`).join(" ");
  return [annotations, expr].filter(Boolean).join(" ").trim();
}

// .spw/_workbench/packages/spw-seed/src/math/graph.ts
function graphFromEdges(edges, extraNodes = []) {
  const set = new Set(extraNodes);
  for (const e of edges) {
    set.add(e.from);
    set.add(e.to);
  }
  return { nodes: [...set].sort(), edges: [...edges] };
}
function adjacencyList(g) {
  const m = /* @__PURE__ */ new Map();
  for (const n of g.nodes) m.set(n, []);
  for (const e of g.edges) {
    const list = m.get(e.from) ?? [];
    list.push(e);
    m.set(e.from, list);
  }
  return m;
}
function adjacencyMatrix(g) {
  const order = [...g.nodes].sort();
  const idx = new Map(order.map((n2, i) => [n2, i]));
  const n = order.length;
  const matrix = Array.from(
    { length: n },
    (_, i) => Array.from({ length: n }, (_2, j) => i === j ? 0 : Number.POSITIVE_INFINITY)
  );
  for (const e of g.edges) {
    const i = idx.get(e.from);
    const j = idx.get(e.to);
    if (i == null || j == null) continue;
    const w = e.weight ?? 1;
    matrix[i][j] = Math.min(matrix[i][j], w);
  }
  return { order, matrix };
}
function detectCycle(g) {
  const adj = adjacencyList(g);
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = /* @__PURE__ */ new Map();
  for (const n of g.nodes) color.set(n, WHITE);
  const parent = /* @__PURE__ */ new Map();
  let found;
  function dfs(u) {
    color.set(u, GRAY);
    for (const e of adj.get(u) ?? []) {
      const v = e.to;
      const c = color.get(v) ?? WHITE;
      if (c === GRAY) {
        const cycle = [v];
        let x = u;
        while (x && x !== v) {
          cycle.push(x);
          x = parent.get(x) ?? null;
        }
        cycle.push(v);
        cycle.reverse();
        found = cycle;
        return true;
      }
      if (c === WHITE) {
        parent.set(v, u);
        if (dfs(v)) return true;
      }
    }
    color.set(u, BLACK);
    return false;
  }
  for (const n of g.nodes) {
    if ((color.get(n) ?? WHITE) === WHITE) {
      parent.set(n, null);
      if (dfs(n)) return { cyclic: true, cycle: found };
    }
  }
  return { cyclic: false };
}
function topologicalSort(g) {
  const adj = adjacencyList(g);
  const indeg = /* @__PURE__ */ new Map();
  for (const n of g.nodes) indeg.set(n, 0);
  for (const e of g.edges) indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  const q = [];
  for (const [n, d] of indeg) if (d === 0) q.push(n);
  q.sort();
  const out = [];
  while (q.length) {
    const u = q.shift();
    out.push(u);
    for (const e of adj.get(u) ?? []) {
      const d = (indeg.get(e.to) ?? 0) - 1;
      indeg.set(e.to, d);
      if (d === 0) {
        q.push(e.to);
        q.sort();
      }
    }
  }
  if (out.length !== g.nodes.length) {
    throw new Error("topologicalSort: graph has a cycle");
  }
  return out;
}
function walkGraph(g, start, opts = {}) {
  const maxSteps = opts.maxSteps ?? 64;
  const mode = opts.mode ?? "bfs";
  if (!g.nodes.includes(start)) return { path: [], truncated: false };
  const adj = adjacencyList(g);
  const seen = /* @__PURE__ */ new Set([start]);
  const path = [start];
  const q = [start];
  while (q.length && path.length < maxSteps) {
    const u = mode === "bfs" ? q.shift() : q.pop();
    for (const e of adj.get(u) ?? []) {
      if (seen.has(e.to)) continue;
      seen.add(e.to);
      path.push(e.to);
      q.push(e.to);
      if (path.length >= maxSteps) break;
    }
  }
  const reachable = g.nodes.filter((n) => !seen.has(n) && hasPath(g, start, n));
  return { path, truncated: path.length >= maxSteps || reachable.length > 0 };
}
function hasPath(g, from, to) {
  const adj = adjacencyList(g);
  const seen = /* @__PURE__ */ new Set();
  const q = [from];
  while (q.length) {
    const u = q.pop();
    if (u === to) return true;
    if (seen.has(u)) continue;
    seen.add(u);
    for (const e of adj.get(u) ?? []) q.push(e.to);
  }
  return false;
}
function shortestPath(g, source, target) {
  if (!g.nodes.includes(source) || !g.nodes.includes(target)) return null;
  const adj = adjacencyList(g);
  const dist = /* @__PURE__ */ new Map();
  const prev = /* @__PURE__ */ new Map();
  for (const n of g.nodes) {
    dist.set(n, Number.POSITIVE_INFINITY);
    prev.set(n, null);
  }
  dist.set(source, 0);
  const open = new Set(g.nodes);
  while (open.size) {
    let u = null;
    let best = Number.POSITIVE_INFINITY;
    for (const n of open) {
      const d2 = dist.get(n) ?? Number.POSITIVE_INFINITY;
      if (d2 < best) {
        best = d2;
        u = n;
      }
    }
    if (u == null || best === Number.POSITIVE_INFINITY) break;
    open.delete(u);
    if (u === target) break;
    for (const e of adj.get(u) ?? []) {
      const w = e.weight ?? 1;
      if (w < 0) throw new Error("shortestPath: negative weights not supported");
      const alt = best + w;
      if (alt < (dist.get(e.to) ?? Number.POSITIVE_INFINITY)) {
        dist.set(e.to, alt);
        prev.set(e.to, u);
      }
    }
  }
  const d = dist.get(target) ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(d)) return null;
  const path = [];
  let cur = target;
  while (cur) {
    path.push(cur);
    cur = prev.get(cur) ?? null;
  }
  path.reverse();
  return { distance: d, path };
}

// .spw/_workbench/packages/spw-seed/src/math/loop.ts
function fixedPoint(f, x0, opts = {}) {
  const maxIter = opts.maxIter ?? 64;
  const eps = opts.eps ?? 1e-9;
  const eq = opts.eq ?? ((a, b) => {
    if (typeof a === "number" && typeof b === "number") return Math.abs(a - b) < eps;
    return Object.is(a, b);
  });
  const history = opts.record ? [x0] : [];
  let x = x0;
  for (let i = 1; i <= maxIter; i++) {
    const y = f(x);
    if (opts.record) history.push(y);
    if (eq(x, y)) {
      return { value: y, iterations: i, converged: true, history };
    }
    x = y;
  }
  return { value: x, iterations: maxIter, converged: false, history };
}
function boundedWhile(pred, body, maxSteps = 1e4) {
  let steps = 0;
  while (pred() && steps < maxSteps) {
    body();
    steps++;
  }
  return { steps, exhausted: pred() && steps >= maxSteps };
}
function rangeFold(start, end, step, init, f) {
  if (step === 0) throw new Error("rangeFold: step must be non-zero");
  let acc = init;
  if (step > 0) {
    for (let i = start; i < end; i += step) acc = f(acc, i);
  } else {
    for (let i = start; i > end; i += step) acc = f(acc, i);
  }
  return acc;
}
function orbit(f, x0, steps) {
  const out = [x0];
  let x = x0;
  for (let t = 0; t < steps; t++) {
    x = f(x, t);
    out.push(x);
  }
  return out;
}
function detectPeriod(seq2, period, tol = 1e-9) {
  if (period <= 0 || seq2.length < period * 2) return false;
  const a = seq2.slice(-period);
  const b = seq2.slice(-2 * period, -period);
  return a.every((v, i) => Math.abs(v - (b[i] ?? 0)) <= tol);
}
function logisticOrbit(r, x0, steps) {
  return orbit((x) => r * x * (1 - x), x0, steps);
}

// .spw/_workbench/packages/spw-seed/src/math/equation.ts
function evalPolynomial(coeffs, x) {
  let y = 0;
  let p = 1;
  for (const c of coeffs) {
    y += c * p;
    p *= x;
  }
  return y;
}
function residual(f, x) {
  return f(x);
}
function bisectionRoot(f, lo, hi, opts = {}) {
  const tol = opts.tol ?? 1e-10;
  const maxIter = opts.maxIter ?? 80;
  let a = lo;
  let b = hi;
  let fa = f(a);
  let fb = f(b);
  if (fa === 0) return { root: a, iterations: 0, converged: true, fRoot: 0 };
  if (fb === 0) return { root: b, iterations: 0, converged: true, fRoot: 0 };
  if (fa * fb > 0) {
    throw new Error("bisectionRoot: f(lo) and f(hi) must have opposite signs");
  }
  let mid = a;
  for (let i = 1; i <= maxIter; i++) {
    mid = 0.5 * (a + b);
    const fm = f(mid);
    if (Math.abs(fm) < tol || (b - a) / 2 < tol) {
      return { root: mid, iterations: i, converged: true, fRoot: fm };
    }
    if (fa * fm <= 0) {
      b = mid;
      fb = fm;
    } else {
      a = mid;
      fa = fm;
    }
  }
  return { root: mid, iterations: maxIter, converged: false, fRoot: f(mid) };
}
function solveLinearSystem(A, b) {
  const n = b.length;
  if (A.length !== n) throw new Error("solveLinearSystem: shape mismatch");
  const M = A.map((row, i) => {
    if (row.length !== n) throw new Error("solveLinearSystem: non-square row");
    return [...row, b[i]];
  });
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) {
      if (Math.abs(M[r][col]) > Math.abs(M[pivot][col])) pivot = r;
    }
    if (Math.abs(M[pivot][col]) < 1e-14) {
      throw new Error("solveLinearSystem: singular or ill-conditioned matrix");
    }
    if (pivot !== col) {
      const tmp = M[col];
      M[col] = M[pivot];
      M[pivot] = tmp;
    }
    const div = M[col][col];
    for (let c = col; c <= n; c++) M[col][c] /= div;
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      for (let c = col; c <= n; c++) M[r][c] -= factor * M[col][c];
    }
  }
  return M.map((row) => row[n]);
}
function productConstraint(factors, exponents) {
  let p = 1;
  for (let i = 0; i < factors.length; i++) {
    const h = clamp01(factors[i]);
    const a = exponents?.[i] ?? 1;
    if (a === 0) continue;
    p *= Math.pow(h, a);
  }
  return clamp01(p);
}
function linearResidual(A, x, b) {
  let s = 0;
  for (let i = 0; i < A.length; i++) {
    let row = 0;
    for (let j = 0; j < x.length; j++) row += (A[i][j] ?? 0) * x[j];
    const d = row - (b[i] ?? 0);
    s += d * d;
  }
  return Math.sqrt(s);
}
function clamp01(x) {
  if (!Number.isFinite(x)) return 0;
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// .spw/_workbench/packages/spw-seed/src/math/field.ts
function zeros(sites) {
  const s = {};
  for (const id of sites) s[id] = 0;
  return s;
}
function cloneField(state) {
  return { ...state };
}
function fieldNorm(state, p = 2) {
  const vals = Object.values(state);
  if (p === Infinity) return vals.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  let acc = 0;
  for (const v of vals) acc += Math.pow(Math.abs(v), p);
  return Math.pow(acc, 1 / p);
}
function fieldSum(state) {
  return Object.values(state).reduce((a, b) => a + b, 0);
}
function decayField(state, rate, dt = 1) {
  const f = Math.exp(-Math.max(0, rate) * dt);
  const out = {};
  for (const [k, v] of Object.entries(state)) out[k] = v * f;
  return out;
}
function halfLifeToRate(halfLife) {
  if (halfLife <= 0) return Number.POSITIVE_INFINITY;
  return Math.LN2 / halfLife;
}
function diffuseField(g, state, kappa, dt = 1, opts = {}) {
  const symmetric = opts.symmetric !== false;
  const u = cloneField(state);
  for (const n of g.nodes) if (u[n] == null) u[n] = 0;
  if (symmetric) {
    const next2 = cloneField(u);
    const seen = /* @__PURE__ */ new Set();
    for (const e of g.edges) {
      const key = e.from < e.to ? `${e.from}\0${e.to}` : `${e.to}\0${e.from}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const w = e.weight ?? 1;
      const ui = next2[e.from] ?? 0;
      const uj = next2[e.to] ?? 0;
      const exchange = kappa * dt * w * (uj - ui);
      next2[e.from] = ui + exchange;
      next2[e.to] = uj - exchange;
    }
    return next2;
  }
  const adj = adjacencyList(g);
  const next = cloneField(u);
  for (const n of g.nodes) {
    let delta = 0;
    for (const e of adj.get(n) ?? []) {
      const w = e.weight ?? 1;
      delta += w * ((u[e.to] ?? 0) - (u[n] ?? 0));
    }
    next[n] = (u[n] ?? 0) + kappa * dt * delta;
  }
  return next;
}
function transfer(state, from, to, amount) {
  const out = cloneField(state);
  const avail = Math.max(0, out[from] ?? 0);
  const a = Math.max(0, Math.min(amount, avail));
  out[from] = avail - a;
  out[to] = (out[to] ?? 0) + a;
  return out;
}
function flux(permeability, upstream, downstream) {
  return permeability * (downstream - upstream);
}
function cascadeChain(input, stages, steps = 1) {
  let x = input;
  const out = [];
  for (const st of stages) {
    for (let s = 0; s < steps; s++) {
      x = st.gain * x;
      if (st.decay != null && st.decay > 0) x *= Math.exp(-st.decay);
    }
    out.push(x);
  }
  return out;
}
function capacityStep(x, capacity, rate, dt = 1) {
  if (capacity <= 0) return 0;
  const nx = x + rate * x * (1 - x / capacity) * dt;
  return Math.max(0, nx);
}
function affinityAllocate(carriers, sites) {
  const capLeft = {};
  for (const s of sites) capLeft[s.id] = Math.max(0, s.capacity);
  const bound = {};
  const free = {};
  const offers = [];
  for (const c of carriers) {
    bound[c.id] = {};
    free[c.id] = Math.max(0, c.free);
    for (const s of sites) {
      const aff = (c.affinity?.[s.id] ?? 0) * (s.receptivity ?? 1);
      if (aff <= 0 || free[c.id] === 0) continue;
      offers.push({ carrier: c.id, site: s.id, score: aff, want: free[c.id] });
    }
  }
  offers.sort((a, b) => b.score - a.score || a.carrier.localeCompare(b.carrier) || a.site.localeCompare(b.site));
  for (const o of offers) {
    const left = free[o.carrier] ?? 0;
    const room = capLeft[o.site] ?? 0;
    if (left <= 0 || room <= 0) continue;
    const take = Math.min(left, room);
    free[o.carrier] = left - take;
    capLeft[o.site] = room - take;
    bound[o.carrier][o.site] = (bound[o.carrier][o.site] ?? 0) + take;
  }
  const occupancy = {};
  for (const s of sites) {
    occupancy[s.id] = s.capacity - (capLeft[s.id] ?? 0);
  }
  return { bound, occupancy, free };
}
function mixFields(parts, opts = {}) {
  let wsum = parts.reduce((a, p) => a + p.weight, 0);
  if (opts.normalize && wsum > 0) {
  } else {
    wsum = 1;
  }
  const keys = /* @__PURE__ */ new Set();
  for (const p of parts) for (const k of Object.keys(p.state)) keys.add(k);
  const out = {};
  for (const k of keys) {
    let v = 0;
    for (const p of parts) {
      const w = opts.normalize && wsum > 0 ? p.weight / wsum : p.weight;
      v += w * (p.state[k] ?? 0);
    }
    out[k] = v;
  }
  return out;
}
function fieldBeat(g, state, opts = {}) {
  const dt = opts.dt ?? 1;
  let s = opts.decayRate != null ? decayField(state, opts.decayRate, dt) : cloneField(state);
  if (g && opts.kappa != null && opts.kappa !== 0) {
    s = diffuseField(g, s, opts.kappa, dt, { symmetric: true });
  }
  if (opts.inject) {
    for (const [k, v] of Object.entries(opts.inject)) {
      s[k] = (s[k] ?? 0) + v;
    }
  }
  return s;
}
function massConserved(a, b, tol = 1e-9) {
  return Math.abs(fieldSum(a) - fieldSum(b)) <= tol;
}

// .spw/_workbench/packages/spw-seed/src/math/corpus.ts
function graphFromLinks(links, extraNodes = []) {
  const edges = links.map((l) => ({
    from: l.from,
    to: l.to,
    label: l.kind,
    weight: 1
  }));
  return graphFromEdges(edges, extraNodes);
}
function degreeHubs(g, top = 12) {
  const inn = /* @__PURE__ */ new Map();
  const out = /* @__PURE__ */ new Map();
  for (const n of g.nodes) {
    inn.set(n, 0);
    out.set(n, 0);
  }
  for (const e of g.edges) {
    out.set(e.from, (out.get(e.from) ?? 0) + 1);
    inn.set(e.to, (inn.get(e.to) ?? 0) + 1);
  }
  return g.nodes.map((id) => ({
    id,
    inDegree: inn.get(id) ?? 0,
    outDegree: out.get(id) ?? 0,
    total: (inn.get(id) ?? 0) + (out.get(id) ?? 0)
  })).filter((h) => h.total > 0).sort((a, b) => b.total - a.total || a.id.localeCompare(b.id)).slice(0, top);
}
function topoLayers(g) {
  const indeg = /* @__PURE__ */ new Map();
  const outs = /* @__PURE__ */ new Map();
  for (const n of g.nodes) {
    indeg.set(n, 0);
    outs.set(n, []);
  }
  for (const e of g.edges) {
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
    outs.get(e.from).push(e.to);
  }
  const layers = [];
  let frontier = g.nodes.filter((n) => (indeg.get(n) ?? 0) === 0).sort();
  const seen = /* @__PURE__ */ new Set();
  while (frontier.length) {
    layers.push(frontier);
    for (const u of frontier) seen.add(u);
    const next = [];
    for (const u of frontier) {
      for (const v of outs.get(u) ?? []) {
        const d = (indeg.get(v) ?? 0) - 1;
        indeg.set(v, d);
        if (d === 0 && !seen.has(v)) next.push(v);
      }
    }
    frontier = [...new Set(next)].sort();
  }
  return layers;
}
function basename(p) {
  const s = p.replace(/\\/g, "/");
  const i = s.lastIndexOf("/");
  return i >= 0 ? s.slice(i + 1) : s;
}
function stem(p) {
  const b = basename(p);
  const i = b.lastIndexOf(".");
  return i > 0 ? b.slice(0, i) : b;
}
function analyzeTopography(links, opts = {}) {
  const known = opts.knownFiles;
  const fileNodes = /* @__PURE__ */ new Set();
  for (const l of links) {
    fileNodes.add(l.from);
    fileNodes.add(l.to);
  }
  if (known) for (const f of known) fileNodes.add(f);
  const graph = graphFromLinks(links, [...fileNodes]);
  const cycle = detectCycle(graph);
  let layers = [];
  if (!cycle.cyclic) {
    try {
      topologicalSort(graph);
      layers = topoLayers(graph);
    } catch {
      layers = [];
    }
  }
  const hubs = degreeHubs(graph, opts.hubTop ?? 12);
  const withEdges = /* @__PURE__ */ new Set();
  for (const e of graph.edges) {
    withEdges.add(e.from);
    withEdges.add(e.to);
  }
  const orphans = graph.nodes.filter((n) => !withEdges.has(n)).sort();
  const brokenTargets = [];
  if (known) {
    const seen = /* @__PURE__ */ new Set();
    for (const l of links) {
      if (l.kind === "path" && !known.has(l.to) && !seen.has(l.to)) {
        if (l.to.includes("/") || l.to.endsWith(".spw")) {
          seen.add(l.to);
          brokenTargets.push(l.to);
        }
      }
    }
    brokenTargets.sort();
  }
  const sigilHistogram = {};
  if (opts.signals) {
    for (const s of opts.signals) {
      for (const [k, v] of Object.entries(s.sigils)) {
        sigilHistogram[k] = (sigilHistogram[k] ?? 0) + v;
      }
    }
  }
  const strands = buildStrands(links, opts.signals ?? [], sigilHistogram);
  return {
    files: known?.size ?? new Set(links.map((l) => l.from)).size,
    links: links.length,
    graph,
    cyclic: cycle.cyclic,
    cycleWitness: cycle.cycle,
    layers,
    hubs,
    orphans,
    brokenTargets,
    strands,
    sigilHistogram
  };
}
function buildStrands(links, signals, sigils) {
  const strands = [];
  const baseCount = /* @__PURE__ */ new Map();
  for (const l of links) {
    if (l.kind !== "path") continue;
    const b = basename(l.to);
    baseCount.set(b, (baseCount.get(b) ?? 0) + 1);
  }
  const topBases = [...baseCount.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (topBases.length) {
    strands.push({
      id: "shared_path_basenames",
      score: topBases[0][1] / Math.max(1, links.length),
      detail: topBases.map(([b, c]) => `${b}\xD7${c}`).join(", ")
    });
  }
  const sigEntries = Object.entries(sigils).sort((a, b) => b[1] - a[1]).slice(0, 8);
  if (sigEntries.length) {
    const total = sigEntries.reduce((a, [, v]) => a + v, 0);
    strands.push({
      id: "sigil_rhythm",
      score: total > 0 ? sigEntries[0][1] / total : 0,
      detail: sigEntries.map(([k, v]) => `${k}:${v}`).join(" ")
    });
  }
  if (signals.length) {
    const frames = signals.reduce((a, s) => a + s.frameCount, 0);
    const lines = signals.reduce((a, s) => a + s.lineCount, 0);
    strands.push({
      id: "frame_density",
      score: lines > 0 ? frames / lines : 0,
      detail: `${frames} frames / ${lines} lines`
    });
    const paths = signals.reduce((a, s) => a + s.pathRefCount, 0);
    strands.push({
      id: "path_ref_density",
      score: lines > 0 ? paths / lines : 0,
      detail: `${paths} path refs across ${signals.length} files`
    });
  }
  const roots = /* @__PURE__ */ new Map();
  for (const l of links) {
    if (l.kind !== "root") continue;
    const root = l.to.split("/")[0] || l.to;
    roots.set(root, (roots.get(root) ?? 0) + 1);
  }
  if (roots.size) {
    const top = [...roots.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6);
    strands.push({
      id: "root_shelves",
      score: top[0][1] / Math.max(1, links.length),
      detail: top.map(([r, c]) => `@${r}\xD7${c}`).join(", ")
    });
  }
  return strands;
}
function compareFamiliarity(a, b) {
  const basesA = new Set(
    a.graph.edges.filter((e) => e.label === "path").map((e) => basename(e.to))
  );
  const basesB = new Set(
    b.graph.edges.filter((e) => e.label === "path").map((e) => basename(e.to))
  );
  for (const h of a.hubs) basesA.add(stem(h.id));
  for (const h of b.hubs) basesB.add(stem(h.id));
  const sharedBases = [...basesA].filter((x) => basesB.has(x));
  const onlyA = [...basesA].filter((x) => !basesB.has(x)).sort();
  const onlyB = [...basesB].filter((x) => !basesA.has(x)).sort();
  const pathOverlap = basesA.size + basesB.size === 0 ? 0 : 2 * sharedBases.length / (basesA.size + basesB.size);
  const keys = /* @__PURE__ */ new Set([...Object.keys(a.sigilHistogram), ...Object.keys(b.sigilHistogram)]);
  const va = [];
  const vb = [];
  for (const k of [...keys].sort()) {
    va.push(a.sigilHistogram[k] ?? 0);
    vb.push(b.sigilHistogram[k] ?? 0);
  }
  const cosineSigils = cosine(va, vb);
  const framesA = a.strands.find((s) => s.id === "frame_density")?.score ?? 0;
  const framesB = b.strands.find((s) => s.id === "frame_density")?.score ?? 0;
  const frameOverlap = framesA + framesB === 0 ? 0 : 1 - Math.abs(framesA - framesB) / Math.max(framesA, framesB, 1e-9);
  const sharedStrands = [
    {
      id: "path_basename_jaccard",
      score: pathOverlap,
      detail: sharedBases.slice(0, 12).join(", ") || "(none)"
    },
    {
      id: "sigil_cosine",
      score: cosineSigils,
      detail: `cos=${cosineSigils.toFixed(3)}`
    },
    {
      id: "frame_density_affinity",
      score: frameOverlap,
      detail: `A=${framesA.toFixed(4)} B=${framesB.toFixed(4)}`
    }
  ];
  return { sharedStrands, onlyA: onlyA.slice(0, 40), onlyB: onlyB.slice(0, 40), cosineSigils, pathOverlap, frameOverlap };
}
function cosine(a, b) {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function heuristicSigilHistogram(source) {
  const sigils = ["~", "#", "@", "^", "&", "%", "$", "?", "!", "*", "=", "."];
  const out = {};
  for (const s of sigils) out[s] = 0;
  const stripped = source.replace(/`[^`]*`/g, " ").replace(/"[^"]*"/g, " ").replace(/'[^']*'/g, " ");
  for (const ch of stripped) {
    if (out[ch] != null) out[ch]++;
  }
  return out;
}
function heuristicFrameCount(source) {
  return (source.match(/^\s*\^\[?"/gm) ?? []).length;
}
function heuristicAnnotationHints(source) {
  return (source.match(/#:[A-Za-z_]|#![\w]|#>/g) ?? []).length;
}

// .spw/_workbench/packages/spw-seed/src/math/formula-scan.ts
var FORMULA_CATALOG = [
  {
    id: "F2.hold",
    family: "hold",
    formula: "Hold = \u220F h_i^{\u03B1_i(c)}",
    meaning: "Product of clamped hold factors under context salience",
    machine: "packages/spw-cli/src/emit/axes.ts#holdProduct"
  },
  {
    id: "F4.canonize",
    family: "constraint",
    formula: "Canonize \u21D4 Hold\u2265\u03B8 \u2227 evidence \u2227 episode",
    meaning: "Promotion gate: hold threshold + evidence + episode lock",
    machine: "packages/spw-cli/src/emit/axes.ts#cacheAxisContext"
  },
  {
    id: "F8.literacy",
    family: "literacy",
    formula: "L = Form \xB7 Agency \xB7 Evidence \xB7 Memory",
    meaning: "Literacy product; any zero collapses L",
    machine: "packages/spw-cli/src/emit/axes.ts#literacyProduct"
  },
  {
    id: "residual",
    family: "measure",
    formula: "r(x) = f(x)  (zero-seeking residual)",
    meaning: "%measure / Hold shortfall as error to drive",
    machine: "packages/spw-seed/src/math/equation.ts#residual"
  },
  {
    id: "productConstraint",
    family: "constraint",
    formula: "C = \u220F x_i^{w_i}",
    meaning: "Multiplicative satisfaction under positive weights",
    machine: "packages/spw-seed/src/math/equation.ts#productConstraint"
  },
  {
    id: "field.decay",
    family: "field",
    formula: "s\u2032 = s \xB7 e^{\u2212\u03BB\u0394t}",
    meaning: "Carrier mass decay on sites",
    machine: "packages/spw-seed/src/math/field.ts#decayField"
  },
  {
    id: "field.diffuse",
    family: "field",
    formula: "mass-conserving neighbor transfer",
    meaning: "Diffuse across undirected site edges",
    machine: "packages/spw-seed/src/math/field.ts#diffuseField"
  },
  {
    id: "field.affinity",
    family: "field",
    formula: "allocate by affinity weights under capacity",
    meaning: "Binding sites compete for carrier mass",
    machine: "packages/spw-seed/src/math/field.ts#affinityAllocate"
  },
  {
    id: "graph.topo",
    family: "graph",
    formula: "layers = Kahn freelist of DAG",
    meaning: "Dependency stack; cycles break topo",
    machine: "packages/spw-seed/src/math/graph.ts + corpus.ts"
  },
  {
    id: "loop.fixedPoint",
    family: "loop",
    formula: "x \u2190 f(x) until |x\u2212f(x)| < \u03B5 or maxIter",
    meaning: "Saga / pulse stop law under measure plateau",
    machine: "packages/spw-seed/src/math/loop.ts#fixedPoint"
  },
  {
    id: "axis.salience",
    family: "axis",
    formula: "\u03C3(c) = normalize(boost(axes, context))",
    meaning: "Context-sensitive axis attention for Hold \u03B1",
    machine: "packages/spw-cli/src/emit/axes.ts#salienceForContext"
  }
];
var RULES = [
  // Hold / product
  { family: "hold", patternId: "hold_product", re: /\bHold\b\s*=|\bholdProduct\b|∏\s*h_/i, score: 0.95 },
  { family: "hold", patternId: "hold_factor", re: /\bhold[_\s-]?(factor|α|alpha)\b|h_i\^α/i, score: 0.8 },
  { family: "hold", patternId: "hold_keyword", re: /\bHold_c\b|\bhold\s*≥|\bHold\s*>=/i, score: 0.75 },
  // Named F-series
  { family: "hold", patternId: "F2", re: /\bF2\b|Hold\s*=\s*∏/, score: 0.9 },
  { family: "constraint", patternId: "F4", re: /\bF4\b|Canonize\s*⇔|Canonize\s*iff/i, score: 0.9 },
  { family: "literacy", patternId: "F8", re: /\bF8\b|Form\s*[·*]\s*Agency\s*[·*]\s*Evidence/i, score: 0.9 },
  { family: "axis", patternId: "F_axis", re: /\bF[1-9]\b|\baxis\s*context\b|salienceForContext/i, score: 0.65 },
  // Measure / residual
  { family: "measure", patternId: "percent_measure", re: /%[a-zA-Z_][\w.]*/, score: 0.55 },
  { family: "measure", patternId: "residual", re: /\bresidual\b|\bf\(x\)\s*=\s*0\b|1\s*-\s*Hold/i, score: 0.85 },
  { family: "measure", patternId: "measure_keyword", re: /\bmeasure\b.*\b(error|delta|shortfall)\b|\b%measure\b/i, score: 0.7 },
  // Field dynamics
  { family: "field", patternId: "decay", re: /\bdecayField\b|\bhalfLife\b|\bdecay\s*(rate|field)?\b/i, score: 0.8 },
  { family: "field", patternId: "diffuse", re: /\bdiffuseField\b|\bdiffuse\b/i, score: 0.75 },
  { family: "field", patternId: "cascade", re: /\bcascadeChain\b|\bcascade\b/i, score: 0.75 },
  { family: "field", patternId: "affinity", re: /\baffinityAllocate\b|\baffinity\b/i, score: 0.75 },
  { family: "field", patternId: "capacity", re: /\bcapacityStep\b|\bcapacity\b/i, score: 0.7 },
  { family: "field", patternId: "field_beat", re: /\bfieldBeat\b|\bfield\s*beat\b/i, score: 0.85 },
  { family: "field", patternId: "carrier_site", re: /\bcarrier\b|\bbinding\s*site\b|\bBindingSite\b/i, score: 0.65 },
  // Graph
  { family: "graph", patternId: "cycle", re: /\bdetectCycle\b|\bcyclic\b|\bcycleWitness\b|\bSCC\b/i, score: 0.8 },
  { family: "graph", patternId: "topo", re: /\btopologicalSort\b|\btopoLayers\b|\btopo\s*layer/i, score: 0.8 },
  { family: "graph", patternId: "hub", re: /\bdegreeHubs\b|\bhub\s*(score|degree)?\b/i, score: 0.7 },
  { family: "graph", patternId: "path_edge", re: /~"[^"]+"|~`[^`]+`/, score: 0.45 },
  // Loop / fixed point
  { family: "loop", patternId: "fixed_point", re: /\bfixedPoint\b|\bfixed[-\s]?point\b|x\s*←\s*f\(x\)/i, score: 0.9 },
  { family: "loop", patternId: "orbit", re: /\blogisticOrbit\b|\borbit\b|\bdetectPeriod\b/i, score: 0.75 },
  { family: "loop", patternId: "max_iter", re: /\bmaxIter\b|\bmax[_\s-]?iter\b|\buntil\s+conver/i, score: 0.65 },
  // Constraints / equations
  { family: "constraint", patternId: "product_constraint", re: /\bproductConstraint\b|∏\s*x_/i, score: 0.9 },
  { family: "constraint", patternId: "linear_system", re: /\bsolveLinearSystem\b|\bA\s*x\s*=\s*b\b/i, score: 0.9 },
  { family: "constraint", patternId: "bisection", re: /\bbisectionRoot\b|\bbisection\b/i, score: 0.85 },
  { family: "constraint", patternId: "polynomial", re: /\bevalPolynomial\b|\bΣ\s*c\[i\]/i, score: 0.85 },
  // Literacy / pedagogy
  { family: "literacy", patternId: "literacy_parts", re: /\bliteracyProduct\b|\bForm\b.*\bAgency\b.*\bEvidence\b/i, score: 0.85 }
];
function scanFormulas(source, opts = {}) {
  const maxHits = opts.maxHits ?? 200;
  const lines = source.split(/\r?\n/);
  const hits = [];
  const seen = /* @__PURE__ */ new Set();
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//")) continue;
    for (const rule of RULES) {
      rule.re.lastIndex = 0;
      if (!rule.re.test(line)) continue;
      const key = `${rule.family}:${rule.patternId}:${i + 1}`;
      if (seen.has(key)) continue;
      seen.add(key);
      hits.push({
        family: rule.family,
        patternId: rule.patternId,
        line: i + 1,
        snippet: truncateSnippet(trimmed, 96),
        score: rule.score
      });
      if (hits.length >= maxHits) return rankHits(hits);
    }
  }
  return rankHits(hits);
}
function rankHits(hits) {
  return hits.sort(
    (a, b) => b.score - a.score || a.line - b.line || a.patternId.localeCompare(b.patternId)
  );
}
function truncateSnippet(s, max) {
  const one = s.replace(/\s+/g, " ");
  if (one.length <= max) return one;
  return `${one.slice(0, max - 1)}\u2026`;
}
function summarizeFormulaHits(hits) {
  const out = {};
  for (const h of hits) {
    out[h.family] = (out[h.family] ?? 0) + 1;
  }
  return out;
}
function aggregateFormulaPatterns(reports) {
  const map2 = /* @__PURE__ */ new Map();
  for (const r of reports) {
    const filePatterns = /* @__PURE__ */ new Set();
    for (const h of r.hits) {
      const key = `${h.family}:${h.patternId}`;
      let row = map2.get(key);
      if (!row) {
        row = { patternId: h.patternId, family: h.family, count: 0, files: /* @__PURE__ */ new Set() };
        map2.set(key, row);
      }
      row.count++;
      filePatterns.add(key);
    }
    for (const key of filePatterns) map2.get(key).files.add(r.file);
  }
  return [...map2.values()].map((r) => ({
    patternId: r.patternId,
    family: r.family,
    count: r.count,
    files: r.files.size
  })).sort((a, b) => b.count - a.count || a.patternId.localeCompare(b.patternId));
}

// .spw/_workbench/packages/spw-seed/src/math/idioms.ts
var SPW_MATH_IDIOMS = [
  {
    id: "path_edge",
    family: "graph",
    surface: '~"to.spw" under from-frame',
    machine: "math/graph.ts + corpus graphFromLinks",
    meaning: "Directed edge in topography / dependency graph",
    falsify: "Cycle claimed acyclic under topologicalSort"
  },
  {
    id: "couple_peer",
    family: "graph",
    surface: "<>[a, b]",
    machine: "math/graph.ts undirected weight 1",
    meaning: "Symmetric peer relation (couple)",
    falsify: "Asymmetric degree after couple without inverse edge"
  },
  {
    id: "saga_fixed_point",
    family: "loop",
    surface: "observe \u2192 mutate \u2192 measure until plateau",
    machine: "math/loop.ts#fixedPoint",
    meaning: "Iterate until residual below \u03B5 or maxIter",
    falsify: "maxIter exceeded while claiming convergence"
  },
  {
    id: "hold_product",
    family: "hold",
    surface: "Hold = \u220F h_i^{\u03B1_i(c)}",
    machine: "emit/axes.ts#holdProduct",
    meaning: "Multiplicative satisfaction under context salience",
    falsify: "productConstraint returns 1 with a zero factor"
  },
  {
    id: "measure_residual",
    family: "equation",
    surface: "%name or 1 - Hold",
    machine: "math/equation.ts#residual",
    meaning: "Zero-seeking error for control / stop laws",
    falsify: "Residual ignored while stop claims Hold\u2265\u03B8"
  },
  {
    id: "field_decay",
    family: "field",
    surface: "site mass decay / half-life traits",
    machine: "math/field.ts#decayField",
    meaning: "Carrier mass exponential decay on sites",
    falsify: "Mass increases under pure decay"
  },
  {
    id: "field_diffuse",
    family: "field",
    surface: "neighbor transfer / ensemble mix",
    machine: "math/field.ts#diffuseField",
    meaning: "Mass-conserving undirected diffuse",
    falsify: "Total mass drifts beyond tolerance"
  },
  {
    id: "stream_fold",
    family: "loop",
    surface: "<<a, b, c>> foldReady multi",
    machine: "math/loop.ts#rangeFold + ONF stream foldReady",
    meaning: "Ordered channel fold over multi payload",
    falsify: "foldReady true with argCount < 2"
  },
  {
    id: "select_arms",
    family: "graph",
    surface: "&[a, b] or #[a, b] multi-arm",
    machine: "ONF frames.select + graph fan-out",
    meaning: "Explicit multi-arm selection / set product",
    falsify: "select.armCount \u2260 frame content length"
  }
];
function idiomsForFamily(family) {
  return SPW_MATH_IDIOMS.filter((i) => i.family === family);
}
function formatMathIdioms(family) {
  const list = family ? idiomsForFamily(family) : SPW_MATH_IDIOMS;
  return list.map(
    (i) => `${i.id.padEnd(18)} ${i.family.padEnd(9)} ${i.surface}
  \u2192 ${i.machine}
  ${i.meaning}`
  ).join("\n\n");
}

// .spw/_workbench/packages/spw-seed/src/workspace-roots.ts
function parseWorkspaceRootDeclarations(source) {
  return analyzeWorkspaceRootManifest(source).declarations;
}
function analyzeWorkspaceRootManifest(source) {
  const output = parse(source);
  const { tokens } = output;
  const significant = tokens.filter((token3) => token3.type !== "WHITESPACE" && token3.type !== "EOF");
  const diagnostics = [];
  if (!output.success) {
    diagnostics.push({
      code: "parse_error",
      message: "Workspace manifest did not parse successfully."
    });
  }
  for (let index = 0; index < significant.length; index += 1) {
    const frame = matchFrameHeader(significant, index);
    if (!frame || frame.name !== "roots") continue;
    const bodyTokens = [];
    let depth = 1;
    index = frame.bodyStartIndex;
    while (++index < significant.length && depth > 0) {
      const token3 = significant[index];
      if (token3.type === "CONTAINER_OPEN" && token3.kind === "{") {
        depth += 1;
      } else if (token3.type === "CONTAINER_CLOSE" && token3.kind === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
      bodyTokens.push(token3);
    }
    if (depth !== 0) {
      diagnostics.push({
        code: "unterminated_roots_frame",
        message: "Workspace roots frame does not have a closing body delimiter."
      });
    }
    const parsed = parseRootEntries(bodyTokens);
    if (parsed.invalidRootDeclaration) {
      diagnostics.push({
        code: "invalid_root_declaration",
        message: 'Workspace roots must use @sigil: ~"path" declarations.'
      });
    }
    if (parsed.declarations.length === 0) {
      diagnostics.push({
        code: "empty_roots_frame",
        message: "Workspace roots frame contains no valid root declarations."
      });
    }
    const seen = /* @__PURE__ */ new Set();
    for (const declaration of parsed.declarations) {
      if (seen.has(declaration.sigil)) {
        diagnostics.push({
          code: "duplicate_root_sigil",
          message: `Workspace root @${declaration.sigil} is declared more than once.`,
          sigil: declaration.sigil
        });
      }
      seen.add(declaration.sigil);
    }
    return {
      status: diagnostics.length === 0 ? "valid" : "invalid",
      declarations: parsed.declarations,
      diagnostics
    };
  }
  diagnostics.push({
    code: "missing_roots_frame",
    message: 'Workspace manifest has no ^"roots" or ^["roots"] frame.'
  });
  return { status: "invalid", declarations: [], diagnostics };
}
function parseRootEntries(tokens) {
  const roots = [];
  let invalidRootDeclaration = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const at = tokens[index];
    if (at.type === "COMMENT") continue;
    if (at.type !== "OPERATOR" || at.kind !== "@") continue;
    const name = tokens[index + 1];
    const colon2 = tokens[index + 2];
    const tilde = tokens[index + 3];
    const pathToken = tokens[index + 4];
    if (at?.type !== "OPERATOR" || at.kind !== "@" || name?.type !== "IDENTIFIER" || colon2?.type !== "COLON" || tilde?.type !== "OPERATOR" || tilde.kind !== "~" || pathToken?.type !== "STRING") {
      invalidRootDeclaration = true;
      continue;
    }
    roots.push({
      sigil: name.value,
      relativePath: unquote(pathToken.value)
    });
    index += 4;
  }
  return { declarations: roots, invalidRootDeclaration };
}
function matchFrameHeader(tokens, index) {
  const caret = tokens[index];
  if (caret?.type !== "OPERATOR" || caret.kind !== "^") return null;
  const next = tokens[index + 1];
  if (!next) return null;
  if (next.type === "STRING") {
    const brace2 = tokens[index + 2];
    return brace2?.type === "CONTAINER_OPEN" && brace2.kind === "{" ? { name: unquote(next.value), bodyStartIndex: index + 2 } : null;
  }
  if (next.type !== "CONTAINER_OPEN" || next.kind !== "[") return null;
  const label = tokens[index + 2];
  const close = tokens[index + 3];
  const brace = tokens[index + 4];
  if ((label?.type === "STRING" || label?.type === "IDENTIFIER") && close?.type === "CONTAINER_CLOSE" && close.kind === "]" && brace?.type === "CONTAINER_OPEN" && brace.kind === "{") {
    return { name: unquote(label.value), bodyStartIndex: index + 4 };
  }
  return null;
}
function unquote(value) {
  return value.replace(/^["'`]|["'`]$/g, "");
}

// .spw/_workbench/packages/spw-seed/src/derived-surface.ts
var DERIVED_SPW_KINDS = ["expanded"];
var DERIVED_RE = new RegExp(`\\.(${DERIVED_SPW_KINDS.join("|")})\\.spw$`);
function isDerivedSurface(name) {
  return DERIVED_RE.test(name);
}
function sourceSurfaceOf(name) {
  const match = DERIVED_RE.exec(name);
  return match ? name.slice(0, match.index) + ".spw" : null;
}
function derivedSurfaceName(source, kind) {
  return source.replace(/\.spw$/, "") + `.${kind}.spw`;
}

// .spw/_workbench/packages/spw-seed/src/query/types.ts
function isAnd(s) {
  return "and" in s;
}
function isAny(s) {
  return "any" in s;
}
function isCapture(s) {
  return "capture" in s;
}
function isOr(s) {
  return "or" in s;
}
function isNot(s) {
  return "not" in s;
}
function isDescend(s) {
  return "descend" in s;
}
function isSequence(s) {
  return "seq" in s;
}
function isPattern(s) {
  return !isAny(s) && !isCapture(s) && !isAnd(s) && !isOr(s) && !isNot(s) && !isDescend(s) && !isSequence(s);
}
function and(a, b) {
  return { and: [a, b] };
}
function or(a, b) {
  return { or: [a, b] };
}
function not(s) {
  return { not: s };
}
function descend(parent, child) {
  return { descend: [parent, child] };
}
function seq(first, second, ...rest) {
  return { seq: [first, second, ...rest] };
}
function anyNode() {
  return { any: true };
}
function capture(name, selector) {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(name)) {
    throw new TypeError("capture name must be an identifier");
  }
  return { capture: { name, selector } };
}

// .spw/_workbench/packages/spw-seed/src/query/validate.ts
var SIGILS = /* @__PURE__ */ new Set([
  "!",
  "^",
  "~",
  "?",
  "*",
  "=",
  "@",
  "#",
  ".",
  "&",
  "$",
  "%",
  "<>"
]);
var BOUNDARIES = new Set(PAIRED_BOUNDARY_KINDS);
var ATTACHED_BOUNDARIES = /* @__PURE__ */ new Set(["frame", "body"]);
var BRACES = /* @__PURE__ */ new Set(["[]", "{}", "()"]);
var NODE_TYPES = /* @__PURE__ */ new Set([
  "Seed",
  "Expression",
  "Sequence",
  "Binding",
  "Bullet",
  "PathRef",
  "Prose",
  "ProseChunk",
  "Operation",
  "ModifierChain",
  "Capsule",
  "Stream",
  "NRange",
  "Scope",
  "Frame",
  "Body",
  "Reference",
  "Literal",
  "Identifier",
  "Annotation",
  "Particle",
  "Parameter",
  "Condition",
  "Comment",
  "Match",
  "MatchArm",
  "Wildcard",
  "Spread"
]);
var PATTERN_KEYS = /* @__PURE__ */ new Set([
  "sigil",
  "nodeType",
  "brace",
  "brace2",
  "boundary",
  "withBoundaries",
  "modifier",
  "product",
  "aim",
  "value",
  "depth",
  "depthRange",
  "placeholder"
]);
function assertSpwSelector(value) {
  validateSelector(value, "$", true, true, {
    active: /* @__PURE__ */ new WeakSet(),
    captures: /* @__PURE__ */ new Set()
  });
}
function isSpwSelector(value) {
  try {
    assertSpwSelector(value);
    return true;
  } catch {
    return false;
  }
}
function validateSelector(value, path, sequenceAllowed, captureAllowed, context) {
  const record = requireRecord(value, path);
  if (context.active.has(record)) fail(path, "selector graph must be acyclic");
  context.active.add(record);
  try {
    if ("any" in record) {
      requireOnlyKeys(
        record,
        "placeholder" in record ? ["any", "placeholder"] : ["any"],
        path
      );
      if (record.any !== true) fail(`${path}.any`, "must be true");
      if ("placeholder" in record && record.placeholder !== true) {
        fail(`${path}.placeholder`, "must be true when present");
      }
      return;
    }
    if ("capture" in record) {
      if (!captureAllowed) fail(path, "captures are not allowed beneath not/or in query-truth-v1");
      requireOnlyKeys(record, ["capture"], path);
      const capture2 = requireRecord(record.capture, `${path}.capture`);
      requireOnlyKeys(capture2, ["name", "selector"], `${path}.capture`);
      if (typeof capture2.name !== "string" || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(capture2.name)) {
        fail(`${path}.capture.name`, "must be an identifier");
      }
      if (context.captures.has(capture2.name)) {
        fail(`${path}.capture.name`, `duplicate capture ${capture2.name}`);
      }
      context.captures.add(capture2.name);
      validateSelector(capture2.selector, `${path}.capture.selector`, false, true, context);
      return;
    }
    if ("and" in record || "or" in record) {
      const key = "and" in record ? "and" : "or";
      requireOnlyKeys(record, [key], path);
      const pair = requirePair(record[key], `${path}.${key}`);
      const childCapturesAllowed = key === "and" ? captureAllowed : false;
      validateSelector(pair[0], `${path}.${key}[0]`, false, childCapturesAllowed, context);
      validateSelector(pair[1], `${path}.${key}[1]`, false, childCapturesAllowed, context);
      return;
    }
    if ("not" in record) {
      requireOnlyKeys(record, ["not"], path);
      validateSelector(record.not, `${path}.not`, false, false, context);
      return;
    }
    if ("descend" in record) {
      requireOnlyKeys(record, ["descend"], path);
      const pair = requirePair(record.descend, `${path}.descend`);
      validateSelector(pair[0], `${path}.descend[0]`, false, captureAllowed, context);
      validateSelector(pair[1], `${path}.descend[1]`, false, captureAllowed, context);
      return;
    }
    if ("seq" in record) {
      if (!sequenceAllowed) fail(path, "sequence selectors are top-level in query-truth-v1");
      requireOnlyKeys(record, ["seq"], path);
      const selectors = requireSelectorList(record.seq, `${path}.seq`);
      for (let index = 0; index < selectors.length; index += 1) {
        if (!(index in selectors)) fail(`${path}.seq[${index}]`, "missing selector");
        validateSelector(selectors[index], `${path}.seq[${index}]`, false, captureAllowed, context);
      }
      return;
    }
    validatePattern(record, path);
  } finally {
    context.active.delete(record);
  }
}
function validatePattern(record, path) {
  const keys = Object.keys(record);
  if (keys.length === 0) fail(path, "empty patterns are not wildcards; use { any: true }");
  if (keys.every((key) => key === "placeholder")) {
    fail(path, "placeholder metadata requires a structural constraint");
  }
  for (const key of keys) {
    if (!PATTERN_KEYS.has(key)) fail(`${path}.${key}`, "unknown pattern field");
  }
  if ("sigil" in record && !SIGILS.has(record.sigil)) {
    fail(`${path}.sigil`, "unknown operator sigil");
  }
  if ("nodeType" in record && !NODE_TYPES.has(record.nodeType)) {
    fail(`${path}.nodeType`, "unknown AST node type");
  }
  if ("brace" in record && !BRACES.has(record.brace)) {
    fail(`${path}.brace`, "unknown brace selector");
  }
  if ("brace2" in record && !BRACES.has(record.brace2)) {
    fail(`${path}.brace2`, "unknown secondary brace selector");
  }
  if ("brace2" in record && !("brace" in record)) {
    fail(`${path}.brace2`, "requires brace");
  }
  if ("boundary" in record && !BOUNDARIES.has(record.boundary)) {
    fail(`${path}.boundary`, "unknown paired-boundary kind");
  }
  if ("withBoundaries" in record) {
    if (!Array.isArray(record.withBoundaries) || record.withBoundaries.length === 0) {
      fail(`${path}.withBoundaries`, "must be a non-empty boundary array");
    }
    const seen = /* @__PURE__ */ new Set();
    for (const [index, boundary] of record.withBoundaries.entries()) {
      if (!ATTACHED_BOUNDARIES.has(boundary)) {
        fail(`${path}.withBoundaries[${index}]`, "only frame and body can be directly attached");
      }
      if (seen.has(String(boundary))) {
        fail(`${path}.withBoundaries[${index}]`, "duplicate paired-boundary kind");
      }
      seen.add(String(boundary));
    }
  }
  if ("modifier" in record && (typeof record.modifier !== "string" || record.modifier.length === 0)) {
    fail(`${path}.modifier`, "must be a non-empty string");
  }
  if ("value" in record && typeof record.value !== "string") {
    fail(`${path}.value`, "must be a string");
  }
  if ("depth" in record && !isDepth(record.depth)) {
    fail(`${path}.depth`, "must be a non-negative integer");
  }
  if ("depthRange" in record) {
    if (!Array.isArray(record.depthRange) || record.depthRange.length !== 2 || !isDepth(record.depthRange[0]) || !isDepth(record.depthRange[1]) || record.depthRange[0] > record.depthRange[1]) {
      fail(`${path}.depthRange`, "must be an ascending pair of non-negative integers");
    }
  }
  if ("depth" in record && "depthRange" in record) {
    fail(path, "depth and depthRange are mutually exclusive");
  }
  if ("placeholder" in record && record.placeholder !== true) {
    fail(`${path}.placeholder`, "must be true when present");
  }
}
function requireRecord(value, path) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    fail(path, "must be an object");
  }
  return value;
}
function requireOnlyKeys(record, allowed, path) {
  const keys = Object.keys(record);
  if (keys.length !== allowed.length || keys.some((key) => !allowed.includes(key))) {
    fail(path, `must contain only ${allowed.join(", ")}`);
  }
}
function requirePair(value, path) {
  if (!Array.isArray(value) || value.length !== 2) {
    fail(path, "must contain exactly two selectors");
  }
  return value;
}
function requireSelectorList(value, path) {
  if (!Array.isArray(value) || value.length < 2) {
    fail(path, "must contain at least two selectors");
  }
  return value;
}
function isDepth(value) {
  return Number.isInteger(value) && Number(value) >= 0;
}
function fail(path, message) {
  throw new TypeError(`Invalid Spw selector at ${path}: ${message}`);
}

// .spw/_workbench/packages/spw-seed/src/query/match.ts
function toMatchSpan(node) {
  return {
    startOffset: node.span.start.offset,
    endOffset: node.span.end.offset,
    startLine: Math.max(0, node.span.start.line - 1),
    startCharacter: Math.max(0, node.span.start.column - 1),
    endLine: Math.max(0, node.span.end.line - 1),
    endCharacter: Math.max(0, node.span.end.column - 1)
  };
}
function getNodeSigil(node) {
  switch (node.type) {
    case "Operation":
      return node.operator.value;
    case "Reference":
      return "@";
    case "PathRef":
      return "~";
    case "Annotation":
      return "#";
    case "Particle":
      return "#";
    default:
      return void 0;
  }
}
function getNodeAim(node) {
  if (node.type !== "Particle") return void 0;
  return node.aim;
}
function getNodeBrace(node) {
  const record = node;
  if (record.frame && isNodeType(record.frame, "Frame")) return "[]";
  if (record.body && isNodeType(record.body, "Body")) return "{}";
  if (node.type === "Scope") return "()";
  return void 0;
}
function getNodeBrace2(node) {
  const record = node;
  const primary = getNodeBrace(node);
  if (primary === "[]" && record.body && isNodeType(record.body, "Body")) return "{}";
  if (primary === "{}" && record.frame && isNodeType(record.frame, "Frame")) return "[]";
  return void 0;
}
function getNodeBoundary(node) {
  switch (node.type) {
    case "Frame":
      return "frame";
    case "Body":
      return "body";
    case "Scope":
      return "scope";
    case "Capsule":
      return "capsule";
    case "Stream":
      return "stream";
    case "NRange":
      return "nrange";
    default:
      return void 0;
  }
}
function getAttachedBoundaries(node) {
  if (node.type !== "Operation" && node.type !== "Capsule") return [];
  const owner = node;
  const boundaries = [];
  if (owner.frame) boundaries.push("frame");
  if (owner.body) boundaries.push("body");
  return boundaries;
}
function getNodeModifier(node) {
  if (node.type !== "Operation") return void 0;
  return node.modifiers?.modifiers?.[0]?.value;
}
function getNodeProduct(node) {
  if (node.type !== "Operation") return void 0;
  const op = node;
  const sigil = getNodeSigil(node);
  if (sigil === "=" && op.body) return "bias";
  const hasFrameOnly = Boolean(op.frame && !op.body && !op.subject);
  const hasBodyOnly = Boolean(op.body && !op.frame && !op.subject);
  if (sigil === "." && hasBodyOnly) return "facet";
  if (hasFrameOnly && (sigil === "#" || sigil === "&" || sigil === "?")) return "select";
  return void 0;
}
function getNodeValue(node) {
  switch (node.type) {
    case "PathRef": {
      return unquote2(node.path.token.value);
    }
    case "Reference":
      return node.raw ?? void 0;
    case "Identifier":
      return node.token.value;
    case "Literal":
      return unquote2(node.token.value);
    case "Operation": {
      return node.operatorLabel?.value;
    }
    case "Particle":
      return node.name?.value;
    case "Capsule":
      return node.tag?.value;
    case "Frame":
    case "Body":
    case "Scope":
    case "Stream":
    case "NRange":
      return firstScalarValue(node);
    default:
      return void 0;
  }
}
function firstScalarValue(root) {
  if (!root) return void 0;
  const queue = [...getNodeChildren(root)];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node.type === "Identifier") {
      return node.token.value;
    }
    if (node.type === "Literal") {
      return unquote2(node.token.value);
    }
    if (node.type === "Reference") return node.raw ?? void 0;
    if (node.type === "PathRef") return unquote2(node.path.token.value);
    queue.push(...getNodeChildren(node));
  }
  return void 0;
}
function unquote2(value) {
  return decodeQuotedToken(value);
}
function matchPattern2(node, pattern, depth) {
  if (pattern.sigil !== void 0 && getNodeSigil(node) !== pattern.sigil) return false;
  if (pattern.nodeType !== void 0 && node.type !== pattern.nodeType) return false;
  if (pattern.brace !== void 0 && getNodeBrace(node) !== pattern.brace) return false;
  if (pattern.brace2 !== void 0 && getNodeBrace2(node) !== pattern.brace2) return false;
  if (pattern.boundary !== void 0 && getNodeBoundary(node) !== pattern.boundary) return false;
  if (pattern.withBoundaries !== void 0) {
    const attached = getAttachedBoundaries(node);
    if (!pattern.withBoundaries.every((kind) => attached.includes(kind))) return false;
  }
  if (pattern.modifier !== void 0 && getNodeModifier(node) !== pattern.modifier) return false;
  if (pattern.product !== void 0 && getNodeProduct(node) !== pattern.product) return false;
  if (pattern.aim !== void 0 && getNodeAim(node) !== pattern.aim) return false;
  if (pattern.value !== void 0 && getNodeValue(node) !== pattern.value) return false;
  if (pattern.depth !== void 0 && depth !== pattern.depth) return false;
  if (pattern.depthRange !== void 0) {
    const [minimum, maximum] = pattern.depthRange;
    if (depth < minimum || depth > maximum) return false;
  }
  return true;
}
function evaluateNode(candidate, selector) {
  if (isPattern(selector)) {
    return matchPattern2(candidate.node, selector, candidate.depth) ? evaluation(candidate, selector.placeholder === true) : null;
  }
  if (isAny(selector)) return evaluation(candidate, selector.placeholder === true);
  if (isCapture(selector)) {
    const inner = evaluateNode(candidate, selector.capture.selector);
    if (!inner) return null;
    inner.captures.set(selector.capture.name, inner.anchor);
    return inner;
  }
  if (isAnd(selector)) {
    const left = evaluateNode(candidate, selector.and[0]);
    if (!left) return null;
    const right = evaluateNode(candidate, selector.and[1]);
    if (!right) return null;
    return mergeEvaluations(left, right);
  }
  if (isOr(selector)) {
    return evaluateNode(candidate, selector.or[0]) ?? evaluateNode(candidate, selector.or[1]);
  }
  if (isNot(selector)) {
    return evaluateNode(candidate, selector.not) ? null : evaluation(candidate, false);
  }
  if (isDescend(selector)) {
    const child = evaluateNode(candidate, selector.descend[1]);
    if (!child) return null;
    for (let index = candidate.path.length - 1; index >= 0; index -= 1) {
      const ancestor = candidate.path[index];
      const parent = evaluateNode({
        node: ancestor,
        path: candidate.path.slice(0, index),
        depth: index
      }, selector.descend[0]);
      if (parent) return mergeEvaluations(child, parent, child.anchor);
    }
    return null;
  }
  if (isSequence(selector)) return null;
  return null;
}
function evaluation(candidate, placeholder) {
  return {
    anchor: { candidate, placeholder },
    captures: /* @__PURE__ */ new Map()
  };
}
function mergeEvaluations(left, right, anchor = left.anchor) {
  return {
    anchor: {
      candidate: anchor.candidate,
      placeholder: sameCandidate(left.anchor.candidate, anchor.candidate) && left.anchor.placeholder || sameCandidate(right.anchor.candidate, anchor.candidate) && right.anchor.placeholder
    },
    captures: new Map([...left.captures, ...right.captures])
  };
}
function sameCandidate(left, right) {
  return left.node === right.node && left.slot?.expressionIndex === right.slot?.expressionIndex && left.slot?.termIndex === right.slot?.termIndex;
}
function nodeMatch(result) {
  return buildMatch("node", [result.anchor], result.captures);
}
function sequenceMatches(root, selector) {
  const matches = [];
  walkAST(root, (node, path) => {
    if (node.type === "Sequence") {
      matchSlotGroups(termSlotsForSequence(node, path), selector, matches);
      return;
    }
    if (node.type === "Expression" && path[path.length - 1]?.type !== "Sequence") {
      matchSlotGroups(termSlotsForExpression(node, path), selector, matches);
    }
  });
  return matches.sort(
    (left, right) => left.evidence.envelope.startOffset - right.evidence.envelope.startOffset
  );
}
function matchSlotGroups(slots, selector, matches) {
  const width = selector.seq.length;
  for (let index = 0; index + width <= slots.length; index += 1) {
    const evaluations = [];
    for (let offset = 0; offset < width; offset += 1) {
      const result = evaluateNode(slots[index + offset], selector.seq[offset]);
      if (!result) break;
      evaluations.push(result);
    }
    if (evaluations.length !== width) continue;
    matches.push(buildMatch(
      "adjacent-term-slots",
      evaluations.map((result) => result.anchor),
      new Map(evaluations.flatMap((result) => [...result.captures]))
    ));
  }
}
function termSlotsForSequence(sequence2, path) {
  const ownerSpan = toMatchSpan(sequence2);
  const slots = [];
  sequence2.expressions.forEach((expression, expressionIndex) => {
    expression.terms.forEach((term, termIndex) => {
      slots.push({
        node: term,
        path: [...path, sequence2, expression],
        depth: path.length + 2,
        slot: {
          ownerKind: "sequence",
          ownerSpan,
          expressionIndex,
          termIndex,
          separatorBefore: separatorBefore(expression, expressionIndex, termIndex)
        }
      });
    });
  });
  return slots;
}
function termSlotsForExpression(expression, path) {
  const ownerSpan = toMatchSpan(expression);
  return expression.terms.map((term, termIndex) => ({
    node: term,
    path: [...path, expression],
    depth: path.length + 1,
    slot: {
      ownerKind: "expression",
      ownerSpan,
      expressionIndex: 0,
      termIndex,
      separatorBefore: separatorBefore(expression, 0, termIndex)
    }
  }));
}
function separatorBefore(expression, expressionIndex, termIndex) {
  if (termIndex > 0) {
    const connector2 = expression.connectors[termIndex - 1];
    return connector2 ? { kind: "connector", value: connector2.value } : null;
  }
  return expressionIndex > 0 ? { kind: "expression" } : null;
}
function buildMatch(relation, anchors, captureDrafts) {
  const drafts = [...anchors];
  for (const captured of captureDrafts.values()) {
    if (!drafts.some((draft) => sameCandidate(draft.candidate, captured.candidate))) {
      drafts.push(captured);
    }
  }
  const captures = Object.fromEntries(
    [...captureDrafts].map(([name, captured]) => [
      name,
      drafts.findIndex((draft) => sameCandidate(draft.candidate, captured.candidate))
    ])
  );
  const captureNamesByIndex = /* @__PURE__ */ new Map();
  for (const [name, index] of Object.entries(captures)) {
    const names = captureNamesByIndex.get(index) ?? [];
    names.push(name);
    captureNamesByIndex.set(index, names);
  }
  const participants = drafts.map((draft, index) => participant(
    draft,
    captureNamesByIndex.get(index)
  ));
  const envelope = spanEnvelope(drafts.map((draft) => toMatchSpan(draft.candidate.node)));
  const evidence = { relation, envelope, participants, captures };
  return { ...participants[0], evidence };
}
function participant(draft, captureNames) {
  const { candidate, placeholder } = draft;
  const coupling = couplingForNode(candidate.node);
  return {
    node: candidate.node,
    span: toMatchSpan(candidate.node),
    path: [...candidate.path],
    depth: candidate.depth,
    placeholder,
    captureNames: captureNames ?? [],
    ...candidate.slot ? { slot: candidate.slot } : {},
    ...coupling ? { coupling } : {}
  };
}
function couplingForNode(node) {
  const boundary = getNodeBoundary(node);
  if (boundary) return COUPLING_DESCRIPTORS[boundary];
  if (node.type === "Operation" && getNodeSigil(node) === "<>") {
    return COUPLING_DESCRIPTORS.couple;
  }
  return void 0;
}
function spanEnvelope(spans) {
  return spans.reduce((envelope, span) => ({
    startOffset: Math.min(envelope.startOffset, span.startOffset),
    endOffset: Math.max(envelope.endOffset, span.endOffset),
    startLine: span.startOffset < envelope.startOffset ? span.startLine : envelope.startLine,
    startCharacter: span.startOffset < envelope.startOffset ? span.startCharacter : envelope.startCharacter,
    endLine: span.endOffset > envelope.endOffset ? span.endLine : envelope.endLine,
    endCharacter: span.endOffset > envelope.endOffset ? span.endCharacter : envelope.endCharacter
  }));
}
function isNodeType(value, type) {
  return !!value && typeof value === "object" && value.type === type;
}
function matchAll(root, selector) {
  assertSpwSelector(selector);
  if (isSequence(selector)) return sequenceMatches(root, selector);
  const matches = [];
  walkAST(root, (node, path) => {
    const result = evaluateNode({ node, path: [...path], depth: path.length }, selector);
    if (result) matches.push(nodeMatch(result));
  });
  return matches.sort((left, right) => left.span.startOffset - right.span.startOffset);
}
function matchAt(root, line, character, selector) {
  const containing = matchAll(root, selector).filter((match) => {
    const span = match.evidence.envelope;
    if (line < span.startLine || line > span.endLine) return false;
    if (line === span.startLine && character < span.startCharacter) return false;
    if (line === span.endLine && character > span.endCharacter) return false;
    return true;
  });
  containing.sort((left, right) => {
    const leftSpan = left.evidence.envelope;
    const rightSpan = right.evidence.envelope;
    return leftSpan.endOffset - leftSpan.startOffset - (rightSpan.endOffset - rightSpan.startOffset);
  });
  return containing[0] ?? null;
}

// .spw/_workbench/packages/spw-seed/src/query/spwq.ts
function spwq(ast, selector) {
  return matchAll(ast, selector);
}
spwq.at = function spwqAt(ast, position, selector) {
  return matchAt(ast, position.line, position.character, selector);
};
spwq.fromSource = function spwqFromSource(source, selector) {
  const output = parse(source);
  if (!output.ast) return [];
  return matchAll(output.ast, selector);
};

// .spw/_workbench/packages/spw-seed/src/query/presets.ts
var PATH_REFS = { sigil: "~", nodeType: "PathRef" };
var REFERENCES = { sigil: "@", nodeType: "Reference" };
var NAVIGABLE = or(PATH_REFS, REFERENCES);
var DOMAIN_ROOTS = { sigil: "^", withBoundaries: ["frame"] };
var DOMAIN_ROOTS_FULL = {
  sigil: "^",
  withBoundaries: ["frame", "body"]
};
var HYDRATE_OPS = { sigil: "!", nodeType: "Operation" };
var DEFER_OPS = { sigil: "~", nodeType: "Operation" };
var QUERY_OPS = { sigil: "?", nodeType: "Operation" };
var CONFIG_OPS = { sigil: "=", nodeType: "Operation" };
var BIAS = { sigil: "=", product: "bias" };
var PARTICLES = { nodeType: "Particle" };
var ANCHORS = { nodeType: "Particle", aim: ">" };
var ANNOTATION_OPS = { sigil: "#", nodeType: "Operation" };
var OPS_WITH_FRAMES = {
  nodeType: "Operation",
  withBoundaries: ["frame"]
};
var OPS_WITH_BODIES = {
  nodeType: "Operation",
  withBoundaries: ["body"]
};
var SCOPES = { nodeType: "Scope", boundary: "scope" };
var BOON_OPS = { sigil: "!", nodeType: "Operation", modifier: "boon" };
var BONE_OPS = { sigil: "!", nodeType: "Operation", modifier: "bone" };
var ANY = { any: true };

// .spw/_workbench/packages/spw-seed/src/query/selector-expr.ts
var SelectorParseError = class extends Error {
  constructor(message, position) {
    super(`SelectorParseError at character ${position}: ${message}`);
    this.position = position;
    this.name = "SelectorParseError";
  }
};
var SIGILS2 = /* @__PURE__ */ new Set([
  "!",
  "~",
  "@",
  "^",
  "#",
  ".",
  "?",
  "=",
  "&",
  "*",
  "$",
  "%",
  "<>"
]);
var BOUNDARY_LEXEMES = [
  { kind: "stream", open: "<<", close: ">>", allowValue: true },
  { kind: "nrange", open: "((", close: "))", allowValue: true },
  { kind: "frame", open: "[", close: "]", allowValue: true },
  { kind: "body", open: "{", close: "}", allowValue: true },
  { kind: "capsule", open: "<", close: ">", allowValue: true },
  // A non-empty `(expr)` is grouping. `()` and `(_)` remain Scope selectors.
  { kind: "scope", open: "(", close: ")", allowValue: false }
];
function tokenize2(input) {
  const tokens = [];
  let offset = 0;
  while (offset < input.length) {
    const char = input[offset];
    if (isWhitespace(char)) {
      offset += 1;
      continue;
    }
    if (input.startsWith("..", offset)) {
      throw new SelectorParseError(
        "`..` is reserved for range and slice selectors; ordered query spelling is not assigned",
        offset
      );
    }
    if (input.startsWith("<>", offset)) {
      tokens.push({ type: "sigil", value: "<>", offset });
      offset += 2;
      continue;
    }
    if (char === "$" && tokens[tokens.length - 1]?.type !== "query" && startsQueryEnvelope(input, offset + 1)) {
      tokens.push({ type: "query", offset });
      offset += 1;
      continue;
    }
    const boundary = readBoundary(
      input,
      offset,
      tokens[tokens.length - 1]?.type === "query"
    );
    if (boundary) {
      tokens.push(boundary.token);
      offset = boundary.nextOffset;
      continue;
    }
    if (char === "|") {
      tokens.push({ type: "pipe", offset });
      offset += 1;
      continue;
    }
    if (char === "/") {
      tokens.push({ type: "slash", offset });
      offset += 1;
      continue;
    }
    if (char === "-") {
      tokens.push({ type: "dash", offset });
      offset += 1;
      continue;
    }
    if (char === "(") {
      tokens.push({ type: "lparen", offset });
      offset += 1;
      continue;
    }
    if (char === ")") {
      tokens.push({ type: "rparen", offset });
      offset += 1;
      continue;
    }
    if (char === "_") {
      tokens.push({ type: "placeholder", offset });
      offset += 1;
      continue;
    }
    if (char === "&") {
      if (isSymbolicAnd(input, offset, tokens)) {
        tokens.push({ type: "amp", offset });
      } else {
        tokens.push({ type: "sigil", value: "&", offset });
      }
      offset += 1;
      continue;
    }
    if (SIGILS2.has(char)) {
      tokens.push({ type: "sigil", value: char, offset });
      offset += 1;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      const quoted = readQuoted(input, offset);
      tokens.push({ type: "string", value: quoted.value, offset });
      offset = quoted.nextOffset;
      continue;
    }
    if (/[0-9]/.test(char)) {
      let end = offset + 1;
      while (end < input.length && /[0-9]/.test(input[end])) end += 1;
      tokens.push({ type: "number", value: Number(input.slice(offset, end)), offset });
      offset = end;
      continue;
    }
    if (/[A-Za-z]/.test(char)) {
      let end = offset + 1;
      while (end < input.length && /[A-Za-z0-9_]/.test(input[end])) end += 1;
      const value = input.slice(offset, end);
      if (value === "not") tokens.push({ type: "bang_not", offset });
      else if (value === "or") tokens.push({ type: "pipe", offset });
      else if (value === "and") tokens.push({ type: "amp", offset });
      else if (value === "any") tokens.push({ type: "any", offset });
      else tokens.push({ type: "modifier", value, offset });
      offset = end;
      continue;
    }
    throw new SelectorParseError(`Unexpected character ${JSON.stringify(char)}`, offset);
  }
  tokens.push({ type: "eof", offset: input.length });
  return tokens;
}
function startsQueryEnvelope(input, from) {
  let offset = from;
  while (offset < input.length && isWhitespace(input[offset])) offset += 1;
  if (offset >= input.length) return false;
  if (input[offset] === "_") return true;
  if (input.startsWith("<>", offset)) return true;
  if (SIGILS2.has(input[offset])) return true;
  return BOUNDARY_LEXEMES.some(({ open }) => input.startsWith(open, offset));
}
function readBoundary(input, offset, allowScopedValue = false) {
  for (const lexeme2 of BOUNDARY_LEXEMES) {
    if (!input.startsWith(lexeme2.open, offset)) continue;
    if (lexeme2.kind === "capsule" && input.startsWith("<>", offset)) continue;
    const contentStart = offset + lexeme2.open.length;
    const closeOffset = findUnquotedClose(input, contentStart, lexeme2.close);
    if (closeOffset < 0) {
      if (lexeme2.kind === "scope" || lexeme2.kind === "nrange") return null;
      throw new SelectorParseError(`Unterminated ${lexeme2.kind} boundary selector`, offset);
    }
    const rawContent = input.slice(contentStart, closeOffset).trim();
    const interior = parseBoundaryInterior(
      rawContent,
      contentStart,
      lexeme2.allowValue || lexeme2.kind === "scope" && allowScopedValue
    );
    if (!interior.accepted) {
      if (lexeme2.kind === "scope" || lexeme2.kind === "nrange") return null;
      throw new SelectorParseError(
        `${lexeme2.kind} selector interior must be empty, _, an identifier, or one quoted literal`,
        contentStart
      );
    }
    return {
      token: {
        type: "boundary",
        kind: lexeme2.kind,
        placeholder: interior.placeholder,
        ...interior.value === void 0 ? {} : { value: interior.value },
        offset
      },
      nextOffset: closeOffset + lexeme2.close.length
    };
  }
  return null;
}
function findUnquotedClose(input, from, close) {
  let quote = null;
  let escaped = false;
  for (let offset = from; offset < input.length; offset += 1) {
    const char = input[offset];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (quote && char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = quote === char ? null : quote ?? char;
      continue;
    }
    if (!quote && input.startsWith(close, offset)) return offset;
  }
  return -1;
}
function parseBoundaryInterior(raw, offset, allowValue) {
  if (raw === "") return { accepted: true, placeholder: false };
  if (raw === "_") return { accepted: true, placeholder: true };
  if (!allowValue) return { accepted: false, placeholder: false };
  if (/^[A-Za-z][A-Za-z0-9_]*$/.test(raw)) {
    return { accepted: true, value: raw, placeholder: false };
  }
  if (raw.length >= 2 && (raw[0] === '"' || raw[0] === "'" || raw[0] === "`") && raw[raw.length - 1] === raw[0]) {
    const quoted = readQuoted(raw, 0);
    if (quoted.nextOffset !== raw.length) {
      throw new SelectorParseError("Boundary literal must consume its interior", offset);
    }
    return { accepted: true, value: quoted.value, placeholder: false };
  }
  return { accepted: false, placeholder: false };
}
function readQuoted(input, offset) {
  const decoded = readDecodedQuotedValue(input, offset);
  if (decoded) return decoded;
  throw new SelectorParseError("Unterminated quoted literal", offset);
}
function isSymbolicAnd(input, offset, tokens) {
  const previous = tokens[tokens.length - 1];
  if (!previous || previous.type === "query" || previous.type === "pipe" || previous.type === "amp" || previous.type === "bang_not" || previous.type === "slash" || previous.type === "lparen") {
    return false;
  }
  const hasSpaceBefore = offset > 0 && isWhitespace(input[offset - 1]);
  const hasSpaceAfter = offset + 1 < input.length && isWhitespace(input[offset + 1]);
  return hasSpaceBefore && hasSpaceAfter;
}
function isWhitespace(char) {
  return char === " " || char === "	" || char === "\n" || char === "\r";
}
var Parser = class {
  constructor(tokens) {
    this.tokens = tokens;
  }
  position = 0;
  parse() {
    const selector = this.parseExpression();
    this.expect("eof");
    assertSpwSelector(selector);
    return selector;
  }
  peek() {
    return this.tokens[this.position] ?? this.tokens[this.tokens.length - 1];
  }
  advance() {
    const token3 = this.peek();
    this.position += 1;
    return token3;
  }
  expect(type) {
    const token3 = this.peek();
    if (token3.type !== type) {
      throw new SelectorParseError(`Expected ${type}, got ${token3.type}`, token3.offset);
    }
    return this.advance();
  }
  parseExpression() {
    let left = this.parsePipeline();
    while (this.peek().type === "pipe") {
      this.advance();
      left = or(left, this.parsePipeline());
    }
    return left;
  }
  parsePipeline() {
    let left = this.parseTerm();
    while (this.peek().type === "slash") {
      this.advance();
      left = descend(left, this.parseTerm());
    }
    return left;
  }
  parseTerm() {
    let left = this.parseFactor();
    while (this.peek().type === "amp") {
      this.advance();
      left = and(left, this.parseFactor());
    }
    return left;
  }
  parseFactor() {
    if (this.peek().type === "bang_not") {
      this.advance();
      return not(this.parseFactor());
    }
    return this.parseAtom();
  }
  parseAtom() {
    const token3 = this.peek();
    if (token3.type === "query") {
      this.advance();
      return this.parseQueryAtom();
    }
    if (token3.type === "any") {
      this.advance();
      return anyNode();
    }
    if (token3.type === "lparen") {
      this.advance();
      const selector = this.parseExpression();
      this.expect("rparen");
      return selector;
    }
    if (token3.type === "modifier") {
      this.advance();
      return { modifier: token3.value };
    }
    if (token3.type === "sigil") return this.parseSigilPattern(false);
    if (token3.type === "boundary") return this.parseBoundaryPattern();
    throw new SelectorParseError(`Unexpected token ${token3.type}`, token3.offset);
  }
  parseQueryAtom() {
    const token3 = this.peek();
    if (token3.type === "placeholder" || token3.type === "any") {
      this.advance();
      return token3.type === "placeholder" ? { any: true, placeholder: true } : anyNode();
    }
    if (token3.type === "sigil") return this.parseSigilPattern(true);
    if (token3.type === "boundary") return this.parseBoundaryPattern();
    throw new SelectorParseError("Query envelope requires a sigil, boundary, or _", token3.offset);
  }
  parseBoundaryPattern() {
    const boundary = this.expect("boundary");
    return {
      boundary: boundary.kind,
      ...boundary.value === void 0 ? {} : { value: boundary.value },
      ...boundary.placeholder ? { placeholder: true } : {}
    };
  }
  parseSigilPattern(queryEnvelope) {
    const sigil = this.expect("sigil");
    const pattern = { sigil: sigil.value };
    const withBoundaries = [];
    let anonymousPlaceholder = false;
    while (this.peek().type === "boundary") {
      const boundary = this.expect("boundary");
      if (!isAttachedBoundary(boundary.kind)) {
        throw new SelectorParseError(
          `${boundary.kind} is a direct boundary selector, not an attachable operation boundary`,
          boundary.offset
        );
      }
      if (withBoundaries.includes(boundary.kind)) {
        throw new SelectorParseError(`Duplicate ${boundary.kind} boundary selector`, boundary.offset);
      }
      withBoundaries.push(boundary.kind);
      anonymousPlaceholder ||= boundary.placeholder;
      if (boundary.value !== void 0) {
        throw new SelectorParseError(
          "Attached boundary literal matching is unassigned; select the boundary node directly",
          boundary.offset
        );
      }
    }
    if (withBoundaries.length > 0) {
      if (queryEnvelope) {
        pattern.withBoundaries = withBoundaries;
      } else {
        pattern.brace = braceSurface(withBoundaries[0]);
        if (withBoundaries[1]) pattern.brace2 = braceSurface(withBoundaries[1]);
      }
    }
    if (this.peek().type === "modifier") {
      pattern.modifier = this.expect("modifier").value;
    }
    let hasValueSurface = false;
    if (this.peek().type === "string") {
      const literal2 = this.expect("string").value;
      hasValueSurface = true;
      if (queryEnvelope && literal2 === "_") anonymousPlaceholder = true;
      else pattern.value = literal2;
    }
    if (this.peek().type === "placeholder") {
      this.advance();
      anonymousPlaceholder = true;
    }
    if (anonymousPlaceholder) pattern.placeholder = true;
    if (queryEnvelope) {
      if (sigil.value === "@" && withBoundaries.length === 0 && pattern.modifier === void 0) pattern.nodeType = "Reference";
      else if (sigil.value === "~" && hasValueSurface) pattern.nodeType = "PathRef";
      else pattern.nodeType = "Operation";
    }
    const depth = this.peek();
    if (depth.type === "sigil" && depth.value === "@") {
      this.advance();
      const minimum = this.expect("number");
      if (this.peek().type === "dash") {
        this.advance();
        const maximum = this.expect("number");
        if (maximum.value < minimum.value) {
          throw new SelectorParseError("Depth range must be ascending", maximum.offset);
        }
        pattern.depthRange = [minimum.value, maximum.value];
      } else {
        pattern.depth = minimum.value;
      }
    }
    return pattern;
  }
};
function isAttachedBoundary(kind) {
  return kind === "frame" || kind === "body";
}
function braceSurface(kind) {
  return kind === "frame" ? "[]" : "{}";
}
function parseSelector(input) {
  return new Parser(tokenize2(input)).parse();
}
function tryParseSelector(input) {
  try {
    return parseSelector(input);
  } catch {
    return null;
  }
}
export {
  $domain,
  $frame,
  $layer,
  $register,
  ANCHORS,
  ANNOTATION_OPS,
  ANY,
  BIAS,
  BONE_OPS,
  BOON_OPS,
  BOUNDARY_AXIS_IMPLICATIONS,
  BOUNDARY_LADDERS,
  BUILTIN_MUTATION_RULES,
  CONFIG_OPS,
  COUPLING_DESCRIPTORS,
  CoverageCollector,
  DEFAULT_LEX_PROFILE,
  DEFAULT_OPTIONS,
  DEFER_OPS,
  DERIVED_SPW_KINDS,
  DOMAIN_ROOTS,
  DOMAIN_ROOTS_FULL,
  DomainId,
  EventStream,
  FORMAT_PROFILES,
  FORMULA_CATALOG,
  FORM_GEOMETRY_PROFILE,
  FORM_LADDER_PROFILE,
  FORM_MOBILITY_APPLICATION_PROFILE,
  FrameId,
  HIGHER_ORDER_FORMS,
  HYDRATE_OPS,
  INDEX_PRESETS,
  INDEX_TRADEOFFS,
  LayerId,
  MOBILITY_RULES,
  MUTATION_PROFILES,
  MetricsCollector,
  NAVIGABLE,
  OPERATIONAL_SEQUENCES,
  OPERATOR_LADDERS,
  OPS_WITH_BODIES,
  OPS_WITH_FRAMES,
  PAIRED_BOUNDARY_KINDS,
  PARTICLES,
  PATH_REFS,
  PROSE_LEX_PROFILE,
  QUERY_OPS,
  REFERENCES,
  REFERENCE_PROGRESSIONS,
  RegisterId,
  SCOPES,
  SPW_MATH_IDIOMS,
  SelectorParseError,
  adjacencyList,
  adjacencyMatrix,
  affinityAllocate,
  aggregateFormulaPatterns,
  analyzeTopography,
  analyzeWorkspaceRootManifest,
  and,
  annotationNode,
  anyNode,
  applyEdits,
  applyEquivScriptTransforms,
  applyMobilityRule,
  applyRangePlan,
  assertSpwSelector,
  auditAST,
  between,
  bisectionRoot,
  bodyNode,
  boundaryCoordinateForSurface,
  boundaryLadder,
  boundaryLadderTable,
  boundarySetForProfile,
  boundedWhile,
  braceProjectionDelta,
  buildConnectorMap,
  buildOperatorMap,
  buildTrace,
  canonicalize,
  capacityStep,
  capture,
  cascadeChain,
  castToBrand,
  choice,
  classifyMutationUsefulness,
  classifyPayload,
  cloneField,
  collectPlannedEdits,
  combineHooks,
  compactFormatter,
  compareFamiliarity,
  composeEditLists,
  composeSequence,
  computationalRuleIds,
  contentHash,
  contourFormLadder,
  cosineSimilarity,
  countNodeTypes,
  couplingDescriptor,
  couplingFrame,
  createCoverageHooks,
  createHooks,
  createMetricsHooks,
  createStreamHooks,
  createTokenStream,
  decayField,
  degreeHubs,
  deixisTable,
  derivedSurfaceName,
  descend,
  desugar,
  detectCycle,
  detectPeriod,
  differentialFromSources,
  diffuseField,
  evalPolynomial,
  eventFilters,
  expandFormContour,
  expressionNode,
  extractBraceProjection,
  extractErrors,
  extractTokens,
  fieldBeat,
  fieldNorm,
  fieldSum,
  filterEvents,
  findNodes,
  fixedPoint,
  flux,
  foldEdits,
  foldTransforms,
  formatAllLadderNotations,
  formatBoundaryAxisTable,
  formatFormContour,
  formatGeometryReport,
  formatHigherOrderForms,
  formatMathIdioms,
  formatMatrix,
  formatMobilityRules,
  formatRangePlan,
  formatSiteGraph,
  frameNode,
  getLexProfile,
  getMaxDepth,
  getNodeChildren,
  getNodePath,
  graphFromEdges,
  graphFromLinks,
  halfLifeToRate,
  hashString,
  heuristicAnnotationHints,
  heuristicFrameCount,
  heuristicSigilHistogram,
  idiomsForFamily,
  implicationsForBoundary,
  inspectGeometry,
  isBoundaryCouplingFrame,
  isDerivedSurface,
  isFormLabel,
  isProseCommentLine,
  isSlashLineComment,
  isSpwSelector,
  jsonFormatter,
  labelSiteGraph,
  lazy,
  lex,
  linearResidual,
  listBoundaryLadders,
  listFormLadders,
  listLexProfiles,
  listOperatorLadders,
  literalNode,
  logisticOrbit,
  many,
  many1,
  map,
  massConserved,
  matchAll,
  matchAt,
  matrixByStratum,
  matrixFromVectors,
  matrixTranspose,
  migrateSlashCommentsToHash,
  mixFields,
  mobilityRule,
  modifierChain,
  mutationRulesAsSequenceContext,
  named,
  noopHooks,
  normalizeToONF,
  not,
  occupancyFromArgs,
  operationNode,
  operatorLadder,
  operatorLadderTable,
  optional,
  or,
  orbit,
  parameterNode,
  parse,
  parseDesugared,
  parseExpression,
  parseRangeFragment,
  parseSelector,
  parseStream,
  parseWithLog,
  parseWorkspaceRootDeclarations,
  particleBindings,
  particleMix,
  particleMixTotal,
  planMutation,
  planSpanTransform,
  previewAST,
  printAST,
  probeBoundaryLadder,
  probeFormLadder,
  probeMutationTopography,
  probeOperatorLadder,
  processEvent,
  productConstraint,
  projectCouplingSemantics,
  rangeFold,
  readBias,
  readCouplingFrame,
  reduceFormContour,
  referenceNode,
  reflowProseBlocks,
  registerLexProfile,
  residual,
  resolveFormatProfile,
  resolveFragment,
  resolveIndexConfig,
  resolveLadderQuery,
  resolveLexProfile,
  resolveMutationRules,
  resolveRange,
  restoreFormContour,
  rulesByMotion,
  rulesByStatus,
  rulesFrom,
  rulesTo,
  runHigherOrderForm,
  runMutationAutomata,
  runOperationalSequence,
  scanFormulas,
  scopeNode,
  seedNode,
  sepBy,
  seq,
  sequence,
  sequenceNode,
  shortestPath,
  snapshotTopography,
  solveLinearSystem,
  sourceSurfaceOf,
  spanToOffsets,
  splitPathFragment,
  spwq,
  summarizeFormulaHits,
  textFormatter,
  token,
  tokenize,
  topoLayers,
  topographyDelta,
  topologicalSort,
  transfer,
  transformEdit,
  transformEditList,
  tryParseSelector,
  validateCouplingSemanticsProfile,
  vectorMagnitude,
  walkAST,
  walkGraph,
  walkReferenceProgression,
  withCoupling,
  wrapWords,
  zeros
};
