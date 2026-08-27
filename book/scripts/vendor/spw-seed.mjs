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

// .spw/_workbench/packages/spw-seed/src/types/token.ts
function isSignificantToken(token2) {
  return token2.type !== "WHITESPACE" && token2.type !== "EOF";
}
function significantTokens(tokens) {
  return tokens.filter(isSignificantToken);
}

// .spw/_workbench/packages/spw-seed/src/types/gaps.ts
var GAP_CLASSES = ["tight", "open", "cadence", "episode"];

// .spw/_workbench/packages/spw-seed/src/types/events.ts
var PARSE_EVENT_POLICIES = ["none", "diagnostics", "trace"];
function retainsParseEvent(policy, event) {
  if (policy === "trace") return true;
  if (policy === "diagnostics") return event.type === "error" || event.type === "warning";
  return false;
}

// .spw/_workbench/packages/spw-seed/src/types/state.ts
var DEFAULT_OPTIONS = {
  includeComments: true,
  includeWhitespace: true,
  maxErrors: 10,
  debug: false,
  eventPolicy: "trace",
  lexProfile: void 0,
  contextMode: "low",
  autoDialect: true,
  dialect: void 0,
  path: void 0
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
  const token2 = {
    type: "WHITESPACE",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "whitespace",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
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
  const token2 = {
    type: "COMMENT",
    value,
    span: { start, end: getPosition(state) },
    kind: "line"
  };
  yield {
    type: "token",
    rule: "lineComment",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
}
function* matchHashLineProse(state, depth) {
  if (peek(state) !== "#") return null;
  const next = peek(state, 1);
  if (next !== void 0 && next !== " " && next !== "	" && next !== "\n" && next !== "\r") {
    return null;
  }
  const start = getPosition(state);
  let value = "#";
  advance(state);
  while (!isAtEnd(state) && peek(state) !== "\n") {
    value += peek(state);
    advance(state);
  }
  const token2 = {
    type: "COMMENT",
    value,
    span: { start, end: getPosition(state) },
    kind: "hash-prose"
  };
  yield {
    type: "token",
    rule: "hashLineProse",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/apposition.ts
function appositionParts(value) {
  const open = value.indexOf("(");
  if (open < 0) return { name: null, body: "" };
  const name = value.slice(2, open);
  const body = value.slice(open + 1, value.lastIndexOf(")"));
  return { name: name.length > 0 ? name : null, body };
}
function* matchApposition(state, depth) {
  if (peek(state) !== "~" || peek(state, 1) !== "#") return null;
  let ahead = 2;
  while (/[a-zA-Z0-9_-]/.test(peek(state, ahead))) ahead++;
  if (peek(state, ahead) !== "(") return null;
  const start = getPosition(state);
  let value = "";
  for (let i = 0; i < ahead; i++) {
    value += peek(state);
    advance(state);
  }
  let depthCount = 0;
  let closed = false;
  while (!isAtEnd(state)) {
    const char = peek(state);
    if (char === "\n") break;
    value += char;
    advance(state);
    if (char === "(") depthCount++;
    else if (char === ")") {
      depthCount--;
      if (depthCount === 0) {
        closed = true;
        break;
      }
    }
  }
  if (!closed) {
    yield {
      type: "error",
      rule: "apposition",
      position: start,
      data: {
        message: "Unterminated apposition",
        expected: [")"],
        found: isAtEnd(state) ? "end of input" : "newline",
        recoverable: true
      },
      timestamp: performance.now(),
      depth
    };
  }
  const token2 = {
    type: "APPOSITION",
    value,
    span: { start, end: getPosition(state) },
    kind: appositionParts(value).name ? "named" : "anonymous"
  };
  yield {
    type: "token",
    rule: "apposition",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
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
  const token2 = {
    type: "PARTICLE",
    value,
    span: { start, end: getPosition(state) },
    kind: aim
  };
  yield {
    type: "token",
    rule: "particle",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
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
  // Longer digraphs first (createConnectorMatcher sorts by length).
  "||": "||",
  // parallel schedule inside <<>> / flow CA
  "|": "|",
  "/": "/",
  ";": ";"
  // sequential schedule (streams, CA pipelines, claim lists)
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
      const token2 = {
        type: "OPERATOR",
        value: ".",
        span: { start, end: getPosition(state) },
        kind: operatorMap["."]
      };
      yield {
        type: "token",
        rule: "operator",
        position: start,
        data: { token: token2 },
        timestamp: performance.now(),
        depth
      };
      return token2;
    }
    for (const tokenValue2 of tokens) {
      if (tokenValue2.length === 1) {
        if (char !== tokenValue2) continue;
      } else if (peekString(state, tokenValue2.length) !== tokenValue2) {
        continue;
      }
      if (tokenValue2 === "=" && peek(state, 1) === "=") return null;
      if (tokenValue2 === "!" && peek(state, 1) === "=") return null;
      advance(state, tokenValue2.length);
      const token2 = {
        type: "OPERATOR",
        value: tokenValue2,
        span: { start, end: getPosition(state) },
        kind: operatorMap[tokenValue2]
      };
      yield {
        type: "token",
        rule: "operator",
        position: start,
        data: { token: token2 },
        timestamp: performance.now(),
        depth
      };
      return token2;
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
    for (const tokenValue2 of tokens) {
      if (tokenValue2.length === 1) {
        if (peek(state) !== tokenValue2) continue;
      } else if (peekString(state, tokenValue2.length) !== tokenValue2) {
        continue;
      }
      advance(state, tokenValue2.length);
      const token2 = {
        type: "CONNECTOR",
        value: tokenValue2,
        span: { start, end: getPosition(state) },
        kind: connectorMap[tokenValue2]
      };
      yield {
        type: "token",
        rule: "connector",
        position: start,
        data: { token: token2 },
        timestamp: performance.now(),
        depth
      };
      return token2;
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
    const token2 = {
      type: "STREAM_OPEN",
      value: "<<",
      span: { start, end: getPosition(state) },
      kind: "<<"
    };
    yield {
      type: "token",
      rule: "streamOpen",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  if (two === ">>") {
    advance(state, 2);
    const token2 = {
      type: "STREAM_CLOSE",
      value: ">>",
      span: { start, end: getPosition(state) },
      kind: ">>"
    };
    yield {
      type: "token",
      rule: "streamClose",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  if (two === "((") {
    advance(state, 2);
    const token2 = {
      type: "NRANGE_OPEN",
      value: "((",
      span: { start, end: getPosition(state) },
      kind: "(("
    };
    yield {
      type: "token",
      rule: "nrangeOpen",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  if (two === "))") {
    advance(state, 2);
    const token2 = {
      type: "NRANGE_CLOSE",
      value: "))",
      span: { start, end: getPosition(state) },
      kind: "))"
    };
    yield {
      type: "token",
      rule: "nrangeClose",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  if (char === "<") {
    advance(state);
    const token2 = {
      type: "CAPSULE_OPEN",
      value: "<",
      span: { start, end: getPosition(state) },
      kind: "<"
    };
    yield {
      type: "token",
      rule: "capsuleOpen",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  if (char === ">") {
    advance(state);
    const token2 = {
      type: "CAPSULE_CLOSE",
      value: ">",
      span: { start, end: getPosition(state) },
      kind: ">"
    };
    yield {
      type: "token",
      rule: "capsuleClose",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  const openContainers = { "(": "(", "[": "[", "{": "{" };
  const closeContainers = { ")": ")", "]": "]", "}": "}" };
  if (char in openContainers) {
    advance(state);
    const token2 = {
      type: "CONTAINER_OPEN",
      value: char,
      span: { start, end: getPosition(state) },
      kind: openContainers[char]
    };
    yield {
      type: "token",
      rule: "container",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
  }
  if (char in closeContainers) {
    advance(state);
    const token2 = {
      type: "CONTAINER_CLOSE",
      value: char,
      span: { start, end: getPosition(state) },
      kind: closeContainers[char]
    };
    yield {
      type: "token",
      rule: "container",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
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
      const token2 = {
        type: "MODIFIER",
        value: mod,
        span: { start, end: getPosition(state) },
        kind: mod
      };
      yield {
        type: "token",
        rule: "modifier",
        position: start,
        data: { token: token2 },
        timestamp: performance.now(),
        depth
      };
      return token2;
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
    const token2 = {
      type: "STRING",
      value,
      span: { start, end: getPosition(state) },
      kind: quote
    };
    yield {
      type: "token",
      rule: "string",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
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
  const token2 = {
    type: "NUMBER",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "number",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
}
function* matchBoolean(state, depth) {
  const start = getPosition(state);
  for (const bool of ["true", "false"]) {
    if (peekString(state, bool.length) === bool) {
      const nextChar = peek(state, bool.length);
      if (nextChar && /[a-zA-Z0-9_]/.test(nextChar)) continue;
      advance(state, bool.length);
      const token2 = {
        type: "BOOLEAN",
        value: bool,
        span: { start, end: getPosition(state) }
      };
      yield {
        type: "token",
        rule: "boolean",
        position: start,
        data: { token: token2 },
        timestamp: performance.now(),
        depth
      };
      return token2;
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
    const token3 = {
      type: "HOLE",
      value: "_",
      span: { start, end: getPosition(state) }
    };
    yield {
      type: "token",
      rule: "hole",
      position: start,
      data: { token: token3 },
      timestamp: performance.now(),
      depth
    };
    return token3;
  }
  let value = firstChar;
  advance(state);
  while (!isAtEnd(state)) {
    const char = peek(state);
    if (/[a-zA-Z0-9_-]/.test(char)) {
      value += char;
      advance(state);
      continue;
    }
    if (char === "." && /[a-zA-Z_]/.test(peek(state, 1) ?? "")) {
      value += char;
      advance(state);
      continue;
    }
    break;
  }
  const segments = value.split(".");
  const token2 = {
    type: "IDENTIFIER",
    value,
    span: { start, end: getPosition(state) },
    identifier: {
      segments,
      qualified: segments.length > 1
    }
  };
  yield {
    type: "token",
    rule: "identifier",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
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
  const token2 = {
    type: "ANNOTATION",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "annotation",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
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
  const token2 = {
    type: "PHRASE",
    value,
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "phrase",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
}

// .spw/_workbench/packages/spw-seed/src/lexer/matchers/patterns.ts
function* matchSpread(state, depth) {
  if (peek(state) === "." && peek(state, 1) === "." && peek(state, 2) === ".") {
    if (peek(state, 3) !== ".") {
      const start = getPosition(state);
      advance(state, 3);
      const token2 = {
        type: "SPREAD",
        value: "...",
        span: { start, end: getPosition(state) }
      };
      yield {
        type: "token",
        rule: "spread",
        position: start,
        data: { token: token2 },
        timestamp: performance.now(),
        depth
      };
      return token2;
    }
  }
  return null;
}
function* matchArrow(state, depth) {
  if (peek(state) === "=" && peek(state, 1) === ">") {
    const start = getPosition(state);
    advance(state, 2);
    const token2 = {
      type: "ARROW",
      value: "=>",
      span: { start, end: getPosition(state) }
    };
    yield {
      type: "token",
      rule: "arrow",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
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
  const token2 = {
    type: "COLON",
    value: ":",
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "colon",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
}
function* matchComma(state, depth) {
  if (peek(state) !== ",") return null;
  const start = getPosition(state);
  advance(state);
  const token2 = {
    type: "COMMA",
    value: ",",
    span: { start, end: getPosition(state) }
  };
  yield {
    type: "token",
    rule: "comma",
    position: start,
    data: { token: token2 },
    timestamp: performance.now(),
    depth
  };
  return token2;
}
function* matchComparison(state, depth) {
  const start = getPosition(state);
  const twoChar = peekString(state, 2);
  const twoCharOps = ["==", "!=", "<=", ">="];
  if (twoCharOps.includes(twoChar)) {
    advance(state, 2);
    const token2 = {
      type: "COMPARISON",
      value: twoChar,
      span: { start, end: getPosition(state) },
      kind: twoChar
    };
    yield {
      type: "token",
      rule: "comparison",
      position: start,
      data: { token: token2 },
      timestamp: performance.now(),
      depth
    };
    return token2;
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
    // Before operator `#`: narrative titles `# Title - subtitle`
    matchHashLineProse,
    matchSpread,
    connectorMatcher,
    matchComparison,
    matchArrow,
    matchParticle,
    operatorMatcher,
    matchContainer,
    matchModifier,
    matchBoolean,
    // Both open with `~#`; the apposition form must claim `~#(` and `~#name(`
    // before the annotation matcher takes the name and stops.
    matchApposition,
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
        const token2 = {
          type: "TEXT",
          value: char,
          span: { start: pos, end: getPosition(state) }
        };
        tokens.push(token2);
        yield {
          type: "token",
          rule: "text",
          position: pos,
          data: { token: token2 },
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

// .spw/_workbench/packages/spw-seed/src/lexer/gaps.ts
function isGapAnchor(token2) {
  return token2.type !== "WHITESPACE" && token2.type !== "COMMENT" && token2.type !== "EOF";
}
function countLineBreaks(raw) {
  return raw.match(/\r\n|\r|\n/g)?.length ?? 0;
}
function classifyGap(raw) {
  if (raw.length === 0) return "tight";
  const lineBreaks = countLineBreaks(raw);
  if (lineBreaks >= 2) return "episode";
  if (lineBreaks === 1) return "cadence";
  return "open";
}
function classifyTokenGaps(source, tokens) {
  const anchors = tokens.map((token2, tokenIndex) => ({ token: token2, tokenIndex })).filter(({ token: token2 }) => isGapAnchor(token2));
  const gaps = [];
  for (let index = 0; index < anchors.length - 1; index++) {
    const left = anchors[index];
    const right = anchors[index + 1];
    const startOffset = left.token.span.end.offset;
    const endOffset = right.token.span.start.offset;
    const raw = source.slice(startOffset, endOffset);
    const triviaTokenIndices = [];
    for (let tokenIndex = left.tokenIndex + 1; tokenIndex < right.tokenIndex; tokenIndex++) {
      const token2 = tokens[tokenIndex];
      if (token2?.type === "WHITESPACE" || token2?.type === "COMMENT") {
        triviaTokenIndices.push(tokenIndex);
      }
    }
    gaps.push({
      index,
      class: classifyGap(raw),
      raw,
      span: { start: left.token.span.end, end: right.token.span.start },
      leftTokenIndex: left.tokenIndex,
      rightTokenIndex: right.tokenIndex,
      triviaTokenIndices,
      lineBreaks: countLineBreaks(raw)
    });
  }
  return gaps;
}

// .spw/_workbench/packages/spw-seed/src/lexer/lex.ts
function lex(input, options = {}) {
  const gen = tokenize(input, 0, options);
  const eventPolicy = options.eventPolicy ?? "trace";
  const events = [];
  let generated = 0;
  let result = gen.next();
  while (!result.done) {
    generated++;
    if (retainsParseEvent(eventPolicy, result.value)) events.push(result.value);
    result = gen.next();
  }
  return {
    tokens: result.value,
    gaps: classifyTokenGaps(input, result.value),
    events,
    eventPolicy,
    eventCounts: { generated, retained: events.length }
  };
}

// .spw/_workbench/packages/spw-seed/src/combinators/stream.ts
function createTokenStream(tokens, contextMode = "low") {
  return {
    tokens,
    position: 0,
    marks: [],
    contextMode,
    streamDepth: 0
  };
}
function current(stream) {
  return stream.tokens[stream.position] ?? stream.tokens[stream.tokens.length - 1];
}
function peek2(stream, offset = 0) {
  return stream.tokens[stream.position + offset];
}
function advance2(stream) {
  const token2 = current(stream);
  if (stream.position < stream.tokens.length - 1) {
    stream.position++;
  }
  return token2;
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
function sepByOptional(item, separator) {
  return function* sepByOptionalParser(stream, depth) {
    const pos = getPosition2(stream);
    yield {
      type: "enter",
      rule: "sepByOptional",
      position: pos,
      data: { input: current(stream).value },
      timestamp: performance.now(),
      depth
    };
    const results = [];
    let totalConsumed = 0;
    while (!isAtEnd2(stream)) {
      mark(stream);
      const itemGen = item(stream, depth + 1);
      let itemStep = itemGen.next();
      while (!itemStep.done) {
        yield itemStep.value;
        itemStep = itemGen.next();
      }
      if (!itemStep.value.success || itemStep.value.consumed === 0) {
        reset(stream);
        break;
      }
      unmark(stream);
      results.push(itemStep.value.value);
      totalConsumed += itemStep.value.consumed;
      mark(stream);
      const sepGen = separator(stream, depth + 1);
      let sepStep = sepGen.next();
      while (!sepStep.done) {
        yield sepStep.value;
        sepStep = sepGen.next();
      }
      if (sepStep.value.success) {
        unmark(stream);
        totalConsumed += sepStep.value.consumed;
      } else {
        reset(stream);
      }
    }
    yield {
      type: "exit",
      rule: "sepByOptional",
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
var phraseLit = lexeme(token("PHRASE"));
var annotation = lexeme(token("ANNOTATION"));
var particle = lexeme(token("PARTICLE"));
var apposition = lexeme(token("APPOSITION"));
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
      booleanLit,
      phraseLit
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
function isReferencePathToken(token2) {
  if (token2.type === "IDENTIFIER" || token2.type === "TEXT" || token2.type === "NUMBER" || token2.type === "DOT") {
    return true;
  }
  if (token2.type === "CONNECTOR" && (token2.value === "/" || token2.value === "..")) {
    return true;
  }
  if (token2.type === "OPERATOR" && token2.value === ".") {
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
function isBarePathStartToken(token2) {
  if (token2.type === "OPERATOR" && token2.value === ".") return true;
  if (token2.type === "CONNECTOR" && (token2.value === ".." || token2.value === "/")) return true;
  return false;
}
function isBarePathToken(token2) {
  if (token2.type === "IDENTIFIER" || token2.type === "NUMBER") return true;
  if (token2.type === "CONNECTOR" && (token2.value === "/" || token2.value === "..")) return true;
  if (token2.type === "OPERATOR" && (token2.value === "." || token2.value === "*")) return true;
  return false;
}
function isPathShapedRaw(raw) {
  if (!raw) return false;
  if (raw.startsWith("./") || raw.startsWith("../") || raw.startsWith("/")) return true;
  if (raw.includes("/")) return true;
  if (/\.[A-Za-z][\w-]{0,7}$/.test(raw)) return true;
  return false;
}
function isContiguous(left, right) {
  return left.span.end.offset === right.span.start.offset;
}
function peekBoundedPathTokens(stream) {
  const tokens = [];
  let cursor = stream.position;
  let previous;
  while (cursor < stream.tokens.length) {
    const token2 = stream.tokens[cursor];
    if (!token2) break;
    if (token2.type === "CAPSULE_CLOSE") {
      return tokens.length > 0 ? tokens : [];
    }
    if (!isBarePathToken(token2)) break;
    if (previous && !isContiguous(previous, token2)) break;
    tokens.push(token2);
    previous = token2;
    cursor += 1;
  }
  return [];
}
function peekBarePathTokens(stream) {
  const first = stream.tokens[stream.position];
  if (!first || !isBarePathStartToken(first)) return [];
  const tokens = [];
  let cursor = stream.position;
  let previous;
  while (cursor < stream.tokens.length) {
    const token2 = stream.tokens[cursor];
    if (!token2 || !isBarePathToken(token2)) break;
    if (previous && !isContiguous(previous, token2)) break;
    tokens.push(token2);
    previous = token2;
    cursor += 1;
  }
  if (tokens.length === 0) return [];
  const raw = tokens.map((token2) => token2.value).join("");
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
  const raw = tokens.map((token2) => token2.value).join("");
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
      const token2 = current(stream);
      if (!isReferencePathToken(token2)) break;
      if (token2.type === "CONNECTOR" && token2.value === "..") {
        const prevWasSlash = pathTokens[pathTokens.length - 1]?.type === "CONNECTOR" && pathTokens[pathTokens.length - 1]?.value === "/";
        const next = peek2(stream, 1);
        const nextIsSlash = next?.type === "CONNECTOR" && next.value === "/";
        if (!hasSlash && !prevWasSlash && !nextIsSlash) break;
      }
      pathTokens.push(token2);
      if (token2.type === "CONNECTOR" && token2.value === "/") {
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
      const boundedPath = peekBoundedPathTokens(stream);
      if (boundedPath.length > 0) {
        const raw = boundedPath.map((t) => t.value).join("");
        if (isPathShapedRaw(raw)) {
          const pathToken = stringTokenFromBarePath(boundedPath);
          consumeTokenCount(stream, boundedPath.length);
          consumed += boundedPath.length;
          skipWhitespace(stream);
          const boundedCloseGen = capsuleClose(stream, depth + 1);
          let boundedCloseStep = boundedCloseGen.next();
          while (!boundedCloseStep.done) {
            yield boundedCloseStep.value;
            boundedCloseStep = boundedCloseGen.next();
          }
          if (!boundedCloseStep.value.success) {
            return { success: false, consumed: 0, error: boundedCloseStep.value.error };
          }
          consumed += boundedCloseStep.value.consumed;
          const endPos2 = getPosition2(stream);
          return {
            success: true,
            value: {
              type: "PathRef",
              span: { start: startPos, end: endPos2 },
              operator: tildeToken,
              path: { type: "Literal", span: pathToken.span, token: pathToken }
            },
            consumed
          };
        }
        return {
          success: false,
          consumed: 0,
          error: {
            message: 'Bounded ~<\u2026> PathRef requires a path-shaped interior (./ ../ / or file extension). Use ~"\u2026" for paths; ~<name> is membrane potential.',
            expected: ["path-shaped interior", "string path after tag"],
            found: current(stream).type,
            recoverable: true
          }
        };
      }
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
      skipWhitespace(stream);
      if (current(stream).type !== "STRING" && peekBarePathTokens(stream).length === 0) {
        return {
          success: false,
          consumed: 0,
          error: {
            message: 'Labeled path form is ~<tag>"path". Bare ~<name> is membrane potential, not PathRef.',
            expected: ["string path"],
            found: current(stream).type,
            recoverable: true
          }
        };
      }
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
var appositionNode = named(
  "apposition",
  function* appositionParser(stream, depth) {
    const startPos = getPosition2(stream);
    const appositionGen = apposition(stream, depth + 1);
    let appositionStep = appositionGen.next();
    while (!appositionStep.done) {
      yield appositionStep.value;
      appositionStep = appositionGen.next();
    }
    if (!appositionStep.value.success) {
      return { success: false, consumed: 0, error: appositionStep.value.error };
    }
    const appositionToken = appositionStep.value.value;
    const parts = appositionParts(appositionToken.value);
    const node = {
      type: "Annotation",
      span: { start: startPos, end: getPosition2(stream) },
      name: {
        type: "IDENTIFIER",
        value: parts.name ?? "",
        span: appositionToken.span
      },
      apposition: { body: parts.body, anonymous: parts.name === null }
    };
    return { success: true, value: node, consumed: appositionStep.value.consumed };
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
function readLineText(stream, marker) {
  const markerLine = marker.span.start.line;
  const collected = [];
  let consumed = 0;
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
  return {
    chunk: {
      type: "ProseChunk",
      span: startIdx <= endIdx ? { start: collected[startIdx].span.start, end: collected[endIdx].span.end } : { start: marker.span.end, end: marker.span.end },
      text
    },
    consumed
  };
}
var streamEntryNode = named(
  "streamEntry",
  function* streamEntryParser(stream, _depth) {
    if (stream.streamDepth > 0) return { success: false, consumed: 0 };
    if (current(stream).type !== "STREAM_CLOSE") return { success: false, consumed: 0 };
    const startPos = getPosition2(stream);
    const marker = current(stream);
    advance2(stream);
    let consumed = 1;
    const { chunk, consumed: textConsumed } = readLineText(stream, marker);
    consumed += textConsumed;
    yield* [];
    return {
      success: true,
      value: {
        type: "Bullet",
        span: { start: startPos, end: getPosition2(stream) },
        marker,
        item: chunk
      },
      consumed
    };
  }
);
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
    const { chunk, consumed: textConsumed } = readLineText(stream, marker);
    consumed += textConsumed;
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

// .spw/_workbench/packages/spw-seed/src/grammar/block-scalar.ts
function isTrivia(token2) {
  return token2.type === "WHITESPACE";
}
function firstSignificantColumnOnLine(tokens, pipeIndex) {
  const line = tokens[pipeIndex].span.start.line;
  let column = tokens[pipeIndex].span.start.column;
  for (let index = pipeIndex - 1; index >= 0; index--) {
    const token2 = tokens[index];
    if (token2.span.end.line < line) break;
    if (token2.span.start.line === line && !isTrivia(token2) && token2.type !== "COMMENT") {
      column = Math.min(column, token2.span.start.column);
    }
  }
  return column;
}
function nextNonWhitespace(tokens, from) {
  for (let index = from; index < tokens.length; index++) {
    const token2 = tokens[index];
    if (!isTrivia(token2)) return token2;
  }
  return void 0;
}
function normalizeBlockText(raw) {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  while (lines.length > 0 && lines[0].trim() === "") lines.shift();
  while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();
  const indents = lines.filter((line) => line.trim().length > 0).map((line) => line.match(/^[ \t]*/)?.[0].length ?? 0);
  const indent = indents.length > 0 ? Math.min(...indents) : 0;
  return lines.map((line) => line.slice(Math.min(indent, line.length))).join("\n");
}
var blockScalarNode = named(
  "blockScalar",
  function* blockScalarParser(stream, _depth) {
    yield* [];
    const pipeIndex = stream.position;
    const pipe = current(stream);
    if (pipe.type !== "CONNECTOR" || pipe.value !== "|") {
      return {
        success: false,
        consumed: 0,
        error: {
          message: "Expected an indentation-bounded block scalar",
          expected: ["| followed by an indented line"],
          found: pipe.type,
          recoverable: true
        }
      };
    }
    const afterPipe = nextNonWhitespace(stream.tokens, pipeIndex + 1);
    if (afterPipe && afterPipe.span.start.line === pipe.span.start.line) {
      return {
        success: false,
        consumed: 0,
        error: {
          message: "Inline | remains a connector",
          expected: ["newline after |"],
          found: afterPipe.type,
          recoverable: true
        }
      };
    }
    const baseColumn = firstSignificantColumnOnLine(stream.tokens, pipeIndex);
    const collected = [];
    let consumed = 1;
    advance2(stream);
    while (true) {
      const token2 = current(stream);
      if (token2.type === "EOF") break;
      const next = isTrivia(token2) ? nextNonWhitespace(stream.tokens, stream.position + 1) : token2;
      if (!next || next.type === "EOF") break;
      if (next.span.start.line > pipe.span.start.line && next.span.start.column <= baseColumn) {
        break;
      }
      collected.push(token2);
      advance2(stream);
      consumed++;
    }
    const last = collected[collected.length - 1] ?? pipe;
    return {
      success: true,
      consumed,
      value: {
        type: "ProseChunk",
        span: { start: pipe.span.start, end: last.span.end },
        text: normalizeBlockText(collected.map((token2) => token2.value).join(""))
      }
    };
  }
);

// .spw/_workbench/packages/spw-seed/src/grammar/expressions.ts
var INLINE_PAYLOAD_OPERATORS = /* @__PURE__ */ new Set(["#", "?"]);
var INLINE_PAYLOAD_PUNCT = /* @__PURE__ */ new Set([".", "#", "?", "!"]);
var LOW_CONTEXT_PATH_SUGAR_ERROR = 'Unquoted local path references are high-context sugar. Use ~"..." or parse with contextMode: "high".';
function isBarePathStartToken2(token2) {
  if (token2.type === "OPERATOR" && token2.value === ".") return true;
  if (token2.type === "CONNECTOR" && (token2.value === ".." || token2.value === "/")) return true;
  return false;
}
function lastSignificantLine(stream) {
  for (let i = stream.position - 1; i >= 0; i--) {
    const tok = stream.tokens[i];
    if (tok.type === "WHITESPACE" || tok.type === "COMMENT") continue;
    return tok.span.end.line;
  }
  return void 0;
}
function startsItsLine(stream, opIndex) {
  for (let i = opIndex - 1; i >= 0; i--) {
    const tok = stream.tokens[i];
    if (tok.type !== "WHITESPACE") return false;
    if (tok.value.includes("\n")) return true;
  }
  return true;
}
function shouldStopLinePayload(token2, previous, openDepth = 0, headerLine = false) {
  if (token2.type === "CONTAINER_CLOSE" && openDepth === 0) return true;
  if (headerLine) return false;
  if (token2.type === "COMMENT") return true;
  if (token2.type === "CONNECTOR") return true;
  if (token2.type === "CAPSULE_OPEN" || token2.type === "CAPSULE_CLOSE") return true;
  if (token2.type === "STREAM_OPEN" || token2.type === "STREAM_CLOSE") return true;
  if (token2.type === "NRANGE_OPEN" || token2.type === "NRANGE_CLOSE") return true;
  if ((token2.type === "COMMA" || token2.type === "ARROW") && openDepth === 0) return true;
  if (token2.type === "WHITESPACE" && token2.value.includes("\n")) return true;
  if (token2.type === "OPERATOR") {
    const prevWasWhitespace = !previous || previous.type === "WHITESPACE";
    const isPunctuation = INLINE_PAYLOAD_PUNCT.has(token2.value);
    return prevWasWhitespace || !isPunctuation;
  }
  return false;
}
function readLinePayload(stream, opToken, headerLine = false) {
  const opLine = opToken.span.start.line;
  const collected = [];
  let consumed = 0;
  let prev;
  let openDepth = 0;
  while (true) {
    const token2 = current(stream);
    if (token2.type === "EOF") break;
    if (token2.span.start.line !== opLine) break;
    if (shouldStopLinePayload(token2, prev, openDepth, headerLine)) break;
    if (token2.type === "CONTAINER_OPEN") openDepth++;
    else if (token2.type === "CONTAINER_CLOSE") openDepth--;
    collected.push(token2);
    prev = token2;
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
    const opIndex = stream.position;
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
    if (!modifiers && current(stream).type === "MODIFIER" && current(stream).span.start.line === operatorToken.span.end.line) {
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
    if (!modifiers && current(stream).type === "IDENTIFIER" && !current(stream).value.startsWith("_") && current(stream).span.start.line === operatorToken.span.end.line) {
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
    } else if (operatorToken.value === "~") {
      skipWhitespace(stream);
      if (current(stream).type === "CAPSULE_OPEN") {
        const subjGen = capsuleNode(stream, depth + 1);
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
    } else if (operatorToken.value === "@") {
      skipWhitespace(stream);
      if (current(stream).type === "STRING") {
        const litGen = literalNode(stream, depth + 1);
        let litStep = litGen.next();
        while (!litStep.done) {
          yield litStep.value;
          litStep = litGen.next();
        }
        if (litStep.value.success) {
          subject = litStep.value.value;
          consumed += litStep.value.consumed;
        }
      } else if (current(stream).type === "OPERATOR" && current(stream).value === "~") {
        const subjGen = pathRefNode(stream, depth + 1);
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
    if (!frame && !body && !subject && INLINE_PAYLOAD_OPERATORS.has(operatorToken.value) && current(stream).type !== "COLON") {
      skipWhitespace(stream);
      const payload = readLinePayload(stream, operatorToken, startsItsLine(stream, opIndex));
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
    const token2 = current(stream);
    const nextToken = peek2(stream, 1);
    if (token2.type === "OPERATOR" && token2.value === "?" && nextToken?.type === "IDENTIFIER" && nextToken.value === "match") {
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
    if (token2.type === "OPERATOR" && token2.value === "@" && nextToken?.type === "IDENTIFIER" && nextToken.value.startsWith("_")) {
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
      blockScalarNode,
      streamEntryNode,
      bulletNode,
      appositionNode,
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
    let postfixFrame;
    let postfixBody;
    let postfixScope;
    let postfixCapsule;
    const headLine = headTerm.span.end.line;
    while (true) {
      const saved = stream.position;
      skipWhitespace(stream);
      const opener = current(stream);
      if (opener.span.start.line !== headLine) {
        stream.position = saved;
        break;
      }
      if (!postfixFrame && opener.value === "[") {
        const frameGen = frameNode(stream, depth + 1);
        let frameStep = frameGen.next();
        while (!frameStep.done) {
          yield frameStep.value;
          frameStep = frameGen.next();
        }
        if (!frameStep.value.success) {
          return { success: false, consumed: 0, error: frameStep.value.error };
        }
        postfixFrame = frameStep.value.value;
        consumed += frameStep.value.consumed;
        continue;
      }
      if (!postfixBody && opener.value === "{") {
        const bodyGen = bodyNode(stream, depth + 1);
        let bodyStep = bodyGen.next();
        while (!bodyStep.done) {
          yield bodyStep.value;
          bodyStep = bodyGen.next();
        }
        if (!bodyStep.value.success) {
          return { success: false, consumed: 0, error: bodyStep.value.error };
        }
        postfixBody = bodyStep.value.value;
        consumed += bodyStep.value.consumed;
        continue;
      }
      if (!postfixScope && opener.value === "(" && opener.type === "CONTAINER_OPEN") {
        const scopeGen = scopeNode(stream, depth + 1);
        let scopeStep = scopeGen.next();
        while (!scopeStep.done) {
          yield scopeStep.value;
          scopeStep = scopeGen.next();
        }
        if (!scopeStep.value.success) {
          return { success: false, consumed: 0, error: scopeStep.value.error };
        }
        postfixScope = scopeStep.value.value;
        consumed += scopeStep.value.consumed;
        continue;
      }
      if (!postfixCapsule && opener.type === "CAPSULE_OPEN" && (postfixFrame || postfixBody || postfixScope)) {
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
        postfixCapsule = capStep.value.value;
        consumed += capStep.value.consumed;
        continue;
      }
      stream.position = saved;
      break;
    }
    while (!(postfixFrame || postfixBody || postfixScope || postfixCapsule)) {
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
        connectors: [],
        frame: postfixFrame,
        body: postfixBody,
        scope: postfixScope,
        capsule: postfixCapsule
      };
      return { success: true, value: node2, consumed };
    }
    while (true) {
      skipWhitespace(stream);
      const connTok = current(stream);
      if (connTok.type !== "CONNECTOR") break;
      if (connTok.span.start.line !== lastSignificantLine(stream)) break;
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
      if (current(stream).span.start.line !== connTok.span.start.line) break;
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
      connectors,
      frame: postfixFrame,
      body: postfixBody,
      scope: postfixScope,
      capsule: postfixCapsule
    };
    return { success: true, value: node, consumed };
  }
);
var SEQUENCE_SEPARATOR_TYPES = ["COMMA", "ARROW"];
var SEQUENCE_SEPARATOR_SET = new Set(SEQUENCE_SEPARATOR_TYPES);
function isSequenceSeparator(token2) {
  return SEQUENCE_SEPARATOR_SET.has(token2.type);
}
var sequenceImpl = named(
  "sequence",
  function* sequenceParser(stream, depth) {
    const startPos = getPosition2(stream);
    const expressions = [];
    const separators = [];
    let consumed = 0;
    while (true) {
      skipWhitespace(stream);
      const curr = current(stream);
      if (curr.type === "EOF" || curr.type === "CONTAINER_CLOSE" || curr.type === "STREAM_CLOSE" && stream.streamDepth > 0 || curr.type === "NRANGE_CLOSE" || curr.type === "CAPSULE_CLOSE") {
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
      const sep = current(stream);
      if (isSequenceSeparator(sep)) {
        advance2(stream);
        consumed += 1;
        separators.push(sep);
      } else {
        separators.push(void 0);
      }
    }
    separators.length = Math.max(0, expressions.length - 1);
    const endPos = getPosition2(stream);
    const node = {
      type: "Sequence",
      span: { start: startPos, end: endPos },
      expressions,
      separators
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
  sepByOptional(
    choice(
      parameterNode,
      referenceNode,
      literalNode,
      operationNode
    ),
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
    stream.streamDepth += 1;
    const seqGen = sequenceNode(stream, depth + 1);
    let seqStep = seqGen.next();
    while (!seqStep.done) {
      yield seqStep.value;
      seqStep = seqGen.next();
    }
    stream.streamDepth -= 1;
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
    const openConsumed = openStep.value.consumed;
    const afterOpen = stream.position;
    let consumed = openConsumed;
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
    let closeGen = capsuleClose(stream, depth + 1);
    let closeStep = closeGen.next();
    while (!closeStep.done) {
      yield closeStep.value;
      closeStep = closeGen.next();
    }
    let interior;
    if (!closeStep.value.success) {
      stream.position = afterOpen;
      consumed = openConsumed;
      tag = void 0;
      channel = void 0;
      frame = void 0;
      body = void 0;
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
      closeGen = capsuleClose(stream, depth + 1);
      closeStep = closeGen.next();
      while (!closeStep.done) {
        yield closeStep.value;
        closeStep = closeGen.next();
      }
      if (!closeStep.value.success) {
        return { success: false, consumed: 0, error: closeStep.value.error };
      }
      const seq2 = seqStep.value.value;
      if (seq2.expressions.length === 0) {
        return { success: false, consumed: 0 };
      }
      interior = seq2;
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
      interior,
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
function isSpwTrigger(token2) {
  if (token2.type === "OPERATOR") return true;
  if (token2.type === "PARTICLE") return true;
  if (token2.type === "CAPSULE_OPEN") return true;
  if (token2.type === "STREAM_OPEN") return true;
  if (token2.type === "NRANGE_OPEN") return true;
  if (token2.type === "CONTAINER_OPEN") return true;
  return false;
}
function collectFallbackText(stream) {
  const first = current(stream);
  const start = first.span.start;
  let end = first.span.end;
  let text = first.value;
  let consumed = 0;
  while (!isAtEnd2(stream)) {
    const token2 = current(stream);
    if (token2.type === "EOF") break;
    if (consumed > 0 && isSpwTrigger(token2)) break;
    text += token2.value;
    end = token2.span.end;
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
      const token2 = current(stream);
      if (token2.type === "EOF") break;
      if (isSpwTrigger(token2)) break;
      text += token2.value;
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
      const token2 = current(stream);
      if (token2.type === "EOF") break;
      if (isSpwTrigger(token2)) {
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
      const leading = current(stream).type;
      if (leading !== "ANNOTATION" && leading !== "APPOSITION") break;
      const annGen = leading === "APPOSITION" ? appositionNode(stream, depth + 1) : annotationNode(stream, depth + 1);
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
      const stall = current(stream);
      if (!reachedEOF) {
        stream.position = savedPos;
      }
      if (!reachedEOF || !(exprResult.success && exprResult.consumed > 0)) {
        yield {
          type: "warning",
          rule: "seed",
          position: stall.span.start,
          data: {
            message: reachedEOF ? "Structured parse consumed nothing; surface degraded to prose." : `Structured parse stopped at ${stall.type} ${JSON.stringify(stall.value)}; surface degraded to prose.`,
            code: "prose-degradation",
            found: stall.type
          },
          timestamp: performance.now(),
          depth
        };
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

// .spw/_workbench/packages/spw-seed/src/parser/completeness.ts
function satisfiesRoot(actualRoot, expectedRootKind) {
  if (!actualRoot) return false;
  if (expectedRootKind === "Seed") return actualRoot.type === "Seed";
  return actualRoot.type === "Expression" || actualRoot.type === "Sequence";
}
function buildParseCompletenessReceipt(input) {
  const first = input.tokens[0];
  const last = input.tokens[input.tokens.length - 1];
  const sourceStart = first?.span.start ?? { offset: 0, line: 1, column: 1 };
  const sourceEnd = last?.span.end ?? sourceStart;
  const remainingStart = input.remainingToken && input.remainingToken.type !== "EOF" ? input.remainingToken.span.start : sourceEnd;
  const proseFallback = input.proseFallback === true;
  return {
    complete: remainingStart.offset >= input.source.length && satisfiesRoot(input.actualRoot, input.expectedRootKind) && !proseFallback,
    consumed: {
      start: sourceStart,
      end: remainingStart
    },
    remaining: {
      span: {
        start: remainingStart,
        end: sourceEnd
      },
      text: input.source.slice(remainingStart.offset)
    },
    expectedRootKind: input.expectedRootKind,
    actualRootKind: input.actualRoot?.type,
    proseFallback
  };
}

// .spw/_workbench/packages/spw-seed/src/parser/parse-stream.ts
function* parseStream(input, options = {}) {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events = [];
  const errors = [];
  const warnings = [];
  let generatedEvents = 0;
  const observeEvent = (event) => {
    generatedEvents++;
    if (event.type === "error") errors.push(event);
    if (event.type === "warning") warnings.push(event);
    if (!retainsParseEvent(opts.eventPolicy, event)) return false;
    events.push(event);
    return true;
  };
  const lexProfile = resolveLexProfile(opts.lexProfile);
  const lexGen = tokenize(input, 0, { profile: lexProfile });
  let lexStep = lexGen.next();
  while (!lexStep.done) {
    if (observeEvent(lexStep.value)) yield lexStep.value;
    lexStep = lexGen.next();
  }
  const tokens = lexStep.value;
  const filteredTokens = tokens.filter((token2) => {
    if (!opts.includeWhitespace && token2.type === "WHITESPACE") return false;
    if (!opts.includeComments && token2.type === "COMMENT") return false;
    return true;
  });
  const stream = createTokenStream(filteredTokens, opts.contextMode);
  const parseGen = seedNode(stream, 0);
  let parseStep = parseGen.next();
  while (!parseStep.done) {
    if (observeEvent(parseStep.value)) yield parseStep.value;
    parseStep = parseGen.next();
  }
  const result = parseStep.value;
  let success = result.success;
  let outputError = result.success ? void 0 : result.error;
  if (success) {
    skipWhitespace(stream);
    if (current(stream).type !== "EOF") {
      success = false;
      const found = current(stream);
      outputError = {
        message: `Unexpected trailing tokens starting at ${found.type} (${JSON.stringify(found.value)})`,
        expected: ["EOF"],
        found: found.type,
        recoverable: false
      };
      const event = {
        type: "error",
        rule: "parse",
        position: getPosition2(stream),
        data: {
          ...outputError,
          recoverable: false
        },
        timestamp: performance.now(),
        depth: 0
      };
      if (observeEvent(event)) yield event;
    }
  }
  const completeness = buildParseCompletenessReceipt({
    source: input,
    tokens,
    expectedRootKind: "Seed",
    actualRoot: result.value,
    remainingToken: current(stream),
    proseFallback: result.value?.expression.type === "Prose"
  });
  const duration = performance.now() - startTime;
  return {
    success,
    completeness,
    ast: result.value,
    tokens,
    gaps: classifyTokenGaps(input, tokens),
    events,
    eventPolicy: opts.eventPolicy,
    eventCounts: { generated: generatedEvents, retained: events.length },
    errors,
    warnings,
    error: outputError,
    duration,
    lexProfile: lexProfile.id
  };
}

// .spw/_workbench/packages/spw-seed/src/dialect/types.ts
var DEFAULT_DIALECT = "Spw.b";
var DIALECT_IDS = [
  "Spw.b",
  "Spw.l",
  "Spw.m",
  "Spw.x",
  "Spw.q",
  "Spw.f",
  "Spw.p",
  "Spw.t"
];

// .spw/_workbench/packages/spw-seed/src/dialect/detect.ts
var PROFILE_AT = /@profile\s*:\s*(Spw\.[blmxqfpt])\b/i;
var DIALECT_AT = /^@dialect\s*:\s*(Spw\.[blmxqfpt])\b/im;
var DIALECT_PRAGMA = /^#:\s*dialect\b[^\n]*?(Spw\.[blmxqfpt])\b/im;
var PROFILE_LINE = /^@profile\s*:\s*(Spw\.[blmxqfpt])\b/im;
var SEED_HEAD = /^\s*\^seed\[[^\]]{0,400}\]/m;
var ALLOWED = new Set(DIALECT_IDS.map((d) => d.toLowerCase()));
function normalizeDialectId(raw) {
  const key = raw.trim();
  const canon = DIALECT_IDS.find((d) => d.toLowerCase() === key.toLowerCase());
  return canon;
}
function detectDialect(source) {
  const head = source.slice(0, Math.min(source.length, 4096));
  const dAt = DIALECT_AT.exec(head);
  if (dAt?.[1]) {
    const id = normalizeDialectId(dAt[1]);
    if (id) {
      return {
        id,
        source: "pragma",
        raw: dAt[0],
        spanHint: { start: dAt.index, end: dAt.index + dAt[0].length }
      };
    }
  }
  const pragma = DIALECT_PRAGMA.exec(head);
  if (pragma?.[1]) {
    const id = normalizeDialectId(pragma[1]);
    if (id) {
      return {
        id,
        source: "pragma",
        raw: pragma[0],
        spanHint: { start: pragma.index, end: pragma.index + pragma[0].length }
      };
    }
  }
  const seed = SEED_HEAD.exec(head);
  const searchIn = seed ? seed[0] : head;
  const searchBase = seed ? seed.index : 0;
  const pAt = PROFILE_AT.exec(searchIn);
  if (pAt?.[1]) {
    const id = normalizeDialectId(pAt[1]);
    if (id) {
      const start = searchBase + pAt.index;
      return {
        id,
        source: "header",
        raw: pAt[0],
        spanHint: { start, end: start + pAt[0].length }
      };
    }
  }
  const any = PROFILE_LINE.exec(head);
  if (any?.[1]) {
    const id = normalizeDialectId(any[1]);
    if (id) {
      return {
        id,
        source: "header",
        raw: any[0],
        spanHint: { start: any.index, end: any.index + any[0].length }
      };
    }
  }
  return { id: DEFAULT_DIALECT, source: "default" };
}
function isDialectId(value) {
  return ALLOWED.has(value.toLowerCase());
}
function applyDialectPreprocess(source, dialect, newlineAsSpace) {
  if (!newlineAsSpace) return source;
  if (dialect !== "Spw.l" && dialect !== "Spw.q") return source;
  return source.replace(/\r\n/g, "\n").replace(/\n+/g, " ").replace(/[ \t]{2,}/g, " ").trim() + "\n";
}

// .spw/_workbench/packages/spw-seed/src/dialect/syntax-stack.ts
var DIALECT_DEFAULTS = {
  "Spw.b": {
    lex: "default",
    contextMode: "low",
    mutation: "none",
    domain: "general",
    format: "pretty",
    reading: "author",
    metasyntax: {
      newlineAsSpace: false,
      unknownAsText: false,
      highContext: false,
      machineLint: false,
      flowGlyphs: false,
      planStream: false
    }
  },
  "Spw.l": {
    lex: "default",
    contextMode: "high",
    mutation: "none",
    domain: "query",
    format: "canonical",
    reading: "author",
    metasyntax: {
      newlineAsSpace: true,
      unknownAsText: false,
      highContext: true,
      machineLint: false,
      flowGlyphs: false,
      planStream: false
    }
  },
  "Spw.m": {
    // Machine / ONF: hygiene mutation + machineLint train static-analysis literacy
    lex: "default",
    contextMode: "low",
    mutation: "hygiene",
    domain: "general",
    format: "layout",
    reading: "author",
    metasyntax: {
      newlineAsSpace: false,
      unknownAsText: false,
      highContext: false,
      machineLint: true,
      flowGlyphs: false,
      planStream: false
    }
  },
  "Spw.x": {
    // Hot / executable: measure-first; research reading rewards cache literacy
    lex: "default",
    contextMode: "low",
    mutation: "measure",
    domain: "canon",
    format: "pretty",
    reading: "research",
    metasyntax: {
      newlineAsSpace: false,
      unknownAsText: false,
      highContext: false,
      machineLint: true,
      flowGlyphs: false,
      planStream: false
    }
  },
  "Spw.q": {
    lex: "default",
    contextMode: "high",
    mutation: "none",
    domain: "query",
    format: "canonical",
    reading: "author",
    metasyntax: {
      newlineAsSpace: true,
      unknownAsText: false,
      highContext: true,
      machineLint: false,
      flowGlyphs: false,
      planStream: false
    }
  },
  "Spw.f": {
    // Flow / CA: explore mutation + flow glyphs; research reading for schedules
    lex: "default",
    contextMode: "low",
    mutation: "explore",
    domain: "flow",
    format: "pretty",
    reading: "research",
    metasyntax: {
      newlineAsSpace: false,
      unknownAsText: false,
      highContext: false,
      machineLint: false,
      flowGlyphs: true,
      planStream: false
    }
  },
  "Spw.p": {
    // Plan / agent streams: plan domain + planStream; prompt reading for agent wip
    lex: "default",
    contextMode: "low",
    mutation: "none",
    domain: "plan",
    format: "pretty",
    reading: "prompt",
    metasyntax: {
      newlineAsSpace: false,
      unknownAsText: false,
      highContext: false,
      machineLint: false,
      flowGlyphs: false,
      planStream: true
    }
  },
  "Spw.t": {
    // Template / expand lineage: high context slots; prompt reading; never index expanded
    lex: "default",
    contextMode: "high",
    mutation: "none",
    domain: "general",
    format: "pretty",
    reading: "prompt",
    metasyntax: {
      newlineAsSpace: false,
      unknownAsText: false,
      highContext: true,
      machineLint: false,
      flowGlyphs: false,
      planStream: false
    }
  }
};
function detectReviewProfile(normalizedPath) {
  const p = normalizedPath.replace(/\\/g, "/");
  if (p.includes("/_archive/") || p.startsWith("docs/archive/") || p.startsWith("lib/spw-v0.1.0-alpha/") || p.startsWith("lib/spw-v0.2.0-alpha/")) {
    return "historical";
  }
  if (p.startsWith(".agents/plans/") || p.includes("/.agents/plans/")) {
    return "plan_surface";
  }
  if (p.startsWith(".agents/")) {
    return "agent_surface";
  }
  if (p.endsWith(".state.spw") || p.startsWith(".agents/state/") || p.startsWith(".spw/state/")) {
    return "runtime_state";
  }
  if (p.includes("mutation-flow") || p.includes("/flow/") || p.endsWith("mutation-flow-automata.spw")) {
    return "flow_surface";
  }
  if (p.includes("/query/") || p.includes("selector") || p.endsWith(".q.spw")) {
    return "query_surface";
  }
  if (p === "index.spw" || p === ".spw" || p.startsWith(".spw/")) {
    return "canon_surface";
  }
  if (p.startsWith("docs/") || p.startsWith("lib/") || p.includes("/docs/")) {
    return "narrative_surface";
  }
  if (p.startsWith("prompts/")) {
    return "narrative_surface";
  }
  return "strict_surface";
}
function detectDialectFromPath(normalizedPath) {
  const p = normalizedPath.replace(/\\/g, "/");
  const review = detectReviewProfile(p);
  if (review === "plan_surface" || review === "agent_surface") return "Spw.p";
  if (review === "flow_surface") return "Spw.f";
  if (review === "query_surface") return "Spw.q";
  if (review === "strict_surface" && p.startsWith("packages/")) return "Spw.m";
  if (review === "canon_surface") return "Spw.b";
  if (review === "narrative_surface") return "Spw.b";
  if (review === "historical") return "Spw.b";
  return void 0;
}
function formatForReview(review) {
  switch (review) {
    case "strict_surface":
      return "layout";
    case "historical":
      return "canonical";
    case "narrative_surface":
      return "prose";
    case "query_surface":
      return "canonical";
    default:
      return "pretty";
  }
}
function resolveSurfaceProfile(source, options = {}) {
  const path = (options.path ?? "").replace(/\\/g, "/");
  let dialect;
  let dialectSource;
  if (options.dialect) {
    dialect = options.dialect;
    dialectSource = "option";
  } else {
    const detected = detectDialect(source);
    if (detected.source !== "default") {
      dialect = detected.id;
      dialectSource = detected.source;
    } else {
      const fromPath = path ? detectDialectFromPath(path) : void 0;
      if (fromPath) {
        dialect = fromPath;
        dialectSource = "path";
      } else {
        dialect = DEFAULT_DIALECT;
        dialectSource = "default";
      }
    }
  }
  const base = DIALECT_DEFAULTS[dialect];
  const review = options.review ?? (path ? detectReviewProfile(path) : "canon_surface");
  const format = options.format ?? formatForReview(review);
  return {
    dialect,
    dialectSource,
    review,
    format,
    lex: base.lex,
    mutation: options.mutation ?? base.mutation,
    reading: options.reading ?? base.reading,
    domain: options.domain ?? base.domain,
    contextMode: base.contextMode,
    metasyntax: { ...base.metasyntax }
  };
}
function collectMachineLintWarnings(source) {
  const out = [];
  if (/^\s*\^"/m.test(source)) {
    out.push('Spw.m: quoted frame ^"\u2026" is discouraged; prefer ^["id"]');
  }
  if (/@domain\s*:/.test(source)) {
    out.push("Spw.m: @domain: is historical meta; prefer #:layer / structured facets");
  }
  if ((source.match(/~#/g) ?? []).length > 24) {
    out.push("Spw.m: high ~# trait density; consider explicit .{} facets for machine surfaces");
  }
  return out;
}

// .spw/_workbench/packages/spw-seed/src/experimental/syntax-catalog.ts
var SYNTAX_CATALOG = [
  {
    id: "dialect.stack",
    status: "partial",
    docs: "packages/spw-seed/src/dialect/syntax-stack.ts",
    runtimeHook: "parse",
    summary: "Multi-axis SurfaceProfileStack (dialect \xD7 review \xD7 format \xD7 \u2026)"
  },
  {
    id: "dialect.detect",
    status: "implemented",
    docs: "packages/spw-seed/src/dialect/detect.ts",
    runtimeHook: "parse",
    summary: "Header/pragma/path dialect detection for Spw.b/l/m/x/q/f/p/t"
  },
  {
    id: "dialect.preprocess.newline",
    status: "implemented",
    dialect: "Spw.l",
    docs: "packages/spw-seed/src/dialect/detect.ts",
    runtimeHook: "parse",
    summary: "Newline-as-space preprocess for Spw.l / Spw.q"
  },
  {
    id: "dialect.machine_lint",
    status: "partial",
    dialect: "Spw.m",
    docs: "packages/spw-seed/src/dialect/syntax-stack.ts",
    runtimeHook: "lint",
    summary: "Soft warnings for quoted frames / @domain on machine dialect"
  },
  {
    id: "flow.sigma_chain",
    status: "proposed",
    dialect: "Spw.f",
    docs: "docs/theory/spw/mutation-flow-automata.spw",
    runtimeHook: "lower",
    summary: "Intermediate \u03C3 pipeline << ~ ; ? ; % ; ! ; * ; ^ >>"
  },
  {
    id: "flow.phi",
    status: "proposed",
    dialect: "Spw.f",
    docs: "docs/theory/spw/mutation-flow-automata.spw",
    runtimeHook: "lower",
    summary: "Mutation profile \u03C6 as cellular rule table"
  },
  {
    id: "flow.cell",
    status: "proposed",
    dialect: "Spw.f",
    docs: "docs/theory/spw/mutation-flow-automata.spw",
    runtimeHook: "none",
    summary: "CA cell (locus, \u03C3, \u2202) and neighborhood N(c)"
  },
  {
    id: "flow.schedule_par",
    status: "proposed",
    dialect: "Spw.f",
    docs: "docs/theory/spw/mutation-flow-automata.spw",
    runtimeHook: "lower",
    summary: "Parallel schedule || vs sequential ; in pulse pipelines"
  },
  {
    id: "refactor.plan_v1",
    status: "proposed",
    docs: ".agents/plans/refactor-experiment-lifecycle/PLAN.md",
    runtimeHook: "lower",
    summary: "spw.refactor.plan/1 select\u2192plan\u2192check\u2192apply lifecycle"
  },
  {
    id: "refactor.worktree_l1",
    status: "proposed",
    docs: ".agents/plans/refactor-experiment-lifecycle/PLAN.md",
    runtimeHook: "none",
    summary: "Multi-file apply in git worktree (effect.l1.worktree)"
  },
  {
    id: "measure.eval_scheme",
    status: "partial",
    docs: "packages/spw-seed/src/canonical/measure-protocol.ts",
    runtimeHook: "lower",
    summary: "EvalScheme exact|band|tol|ratio|profile|prior \u2014 general measure, not mass-only"
  },
  {
    id: "measure.context_kernel",
    status: "partial",
    docs: ".spw/registries/measure-context.spw",
    runtimeHook: "parse",
    summary: "Spw-defined families/algorithms; %mass is thrift specialization of measure kernel"
  },
  {
    id: "measure.attention_scope_walk",
    status: "proposed",
    docs: "docs/theory/spw/measure-context-kernel.spw",
    runtimeHook: "none",
    summary: "Algorithm: process SelectionIR across perceptive planes into MeasureIR"
  },
  {
    id: "measure.lsp_diag",
    status: "proposed",
    docs: ".agents/plans/measure-invariant-generalization/PLAN.md",
    runtimeHook: "lint",
    summary: "LSP diagnostics for mass/authority drift"
  },
  {
    id: "form.material_packet",
    status: "partial",
    docs: ".agents/plans/form-geometry-editor/PLAN.md",
    runtimeHook: "lint",
    summary: "Brace coupling occupancy/payload hover packet"
  },
  {
    id: "form.formContext",
    status: "proposed",
    docs: ".agents/plans/form-geometry-editor/PLAN.md",
    runtimeHook: "lower",
    summary: "spw/formContext revision-addressed geometry probe"
  },
  {
    id: "curiosity.visit_set",
    status: "proposed",
    dialect: "Spw.f",
    docs: ".agents/plans/curiosity-mutation-ergonomics/PLAN.md",
    runtimeHook: "none",
    summary: "Combinator cell visit/invite/stabilize memory"
  },
  {
    id: "lsp.stack_hover",
    status: "partial",
    docs: ".agents/plans/shape-syntax-ecology/PLAN.md",
    runtimeHook: "lint",
    summary: "Hover shows dialect stack + experimental refs"
  },
  {
    id: "cli.profile_show",
    status: "proposed",
    docs: ".agents/plans/syntax-profile-stack/PLAN.md",
    runtimeHook: "none",
    summary: "spw profile --show <file> stack dump"
  },
  {
    id: "editor.gestalt_tokens",
    status: "partial",
    docs: ".agents/plans/vscode-cognitive-surface/PLAN.md",
    runtimeHook: "parse",
    summary: "Semantic tokens emphasize operator/brace gestalt for shape literacy"
  },
  {
    id: "cognitive.dual_read_policy",
    status: "proposed",
    docs: ".agents/plans/vscode-cognitive-surface/PLAN.md",
    runtimeHook: "lint",
    summary: "Screenshot/LLM play requires AST dual-read before edit trust"
  },
  {
    id: "brace.capture_vs_shield",
    status: "proposed",
    docs: "docs/theory/spw/brace-charge-crawl.spw",
    runtimeHook: "none",
    summary: "Paired bounds as capture (charge in) vs shield (channel/membrane wall)"
  },
  {
    id: "charge.portable_triple",
    status: "partial",
    docs: "docs/theory/spw/brace-charge-crawl.spw",
    runtimeHook: "none",
    summary: "Portable charge carriers: value \xB7 subject \xB7 substrate + provenance"
  },
  {
    id: "crawl.verb_set",
    status: "partial",
    docs: "docs/theory/spw/brace-charge-crawl.spw",
    runtimeHook: "none",
    summary: "Crawl verbs: potentiate accumulate distribute confluence collate discharge"
  },
  {
    id: "channel.stability",
    status: "partial",
    docs: "packages/spw-runtime/src/session/channels.ts",
    runtimeHook: "none",
    summary: "Stability channels orthogonal to dialect; cache key includes channel"
  },
  {
    id: "fixity.prefix_postfix_dual",
    status: "partial",
    docs: "docs/theory/spw/fixity-brace-phrases.spw",
    runtimeHook: "parse",
    summary: "Act fixity dual: prefix (primary) vs postfix (L\u2192R); ONF frames.fixity"
  },
  {
    id: "phrase.brace_family",
    status: "proposed",
    docs: "docs/theory/spw/fixity-brace-phrases.spw",
    runtimeHook: "lint",
    summary: "Named brace phrases (Act\xD7Bound silhouettes) as emergent grammar units"
  },
  {
    id: "phrase.opt_cache",
    status: "proposed",
    dialect: "Spw.x",
    docs: "docs/theory/spw/fixity-brace-phrases.spw",
    runtimeHook: "lower",
    summary: "Phrase rewrite optimization under fixity laws + OptCacheIR key"
  },
  {
    id: "regional.ocean_o",
    status: "proposed",
    dialect: "Spw.o",
    docs: ".spw/biome/ocean/experiments/syntax.spw",
    runtimeHook: "none",
    summary: "Ocean regional dense dialect Spw.o \u2014 channel=ocean|experimental only"
  },
  {
    id: "flow.protocol_module",
    status: "partial",
    docs: "packages/spw-seed/src/canonical/flow-protocol.ts",
    runtimeHook: "parse",
    summary: "Sigil\xD7brace\xD7adjacency roles: flow/routine/strategy/procedure/bias/probe"
  },
  {
    id: "resonance.geometric",
    status: "partial",
    docs: "packages/spw-seed/src/canonical/geometric-resonance.ts",
    runtimeHook: "parse",
    summary: "Form-geometry and schedule adjacency resonances (not only substrate events)"
  },
  {
    id: "probe.measure_substrate",
    status: "partial",
    docs: "packages/spw-runtime/src/session/probe-measure.ts",
    runtimeHook: "none",
    summary: "Wonder/probe/metric census + substrate write vibration"
  }
];
var BY_ID = new Map(SYNTAX_CATALOG.map((e) => [e.id, e]));
function getSyntaxCatalogEntry(id) {
  return BY_ID.get(id);
}
function listSyntaxCatalog(filter) {
  return SYNTAX_CATALOG.filter((e) => {
    if (filter?.status && e.status !== filter.status) return false;
    if (filter?.dialect && e.dialect !== filter.dialect) return false;
    if (filter?.runtimeHook && e.runtimeHook !== filter.runtimeHook) return false;
    return true;
  });
}
function formatCatalogEntryMarkdown(entry) {
  const lines = [
    `**\`${entry.id}\`** \u2014 *${entry.status}* \xB7 hook=\`${entry.runtimeHook}\``,
    "",
    entry.summary,
    "",
    `docs: \`${entry.docs}\``
  ];
  if (entry.dialect) lines.push(`dialect: \`${entry.dialect}\``);
  if (entry.runtimeHook === "none" || entry.status === "proposed") {
    lines.push("", "_Reference only \u2014 not executed as runtime law._");
  }
  return lines.join("\n");
}

// .spw/_workbench/packages/spw-seed/src/experimental/scan-refs.ts
var EXP_ID_RE = /=\s*exp\s*\[\s*id\s*:\s*([a-zA-Z][a-zA-Z0-9_.]*)/g;
var DIALECT_MARK_RE = /@(?:dialect|profile)\s*:\s*(Spw\.[blmxqfpt])\b|#:\s*dialect\b[^\n]*(Spw\.[blmxqfpt])\b/gi;
function scanExperimentalRefs(source) {
  const expRefs = [];
  const idSet = /* @__PURE__ */ new Set();
  const dialectMarks = [];
  EXP_ID_RE.lastIndex = 0;
  let m;
  while ((m = EXP_ID_RE.exec(source)) !== null) {
    const id = m[1];
    idSet.add(id);
    const idStart = m.index + m[0].lastIndexOf(id);
    expRefs.push({
      id,
      offset: idStart,
      length: id.length,
      entry: getSyntaxCatalogEntry(id)
    });
  }
  DIALECT_MARK_RE.lastIndex = 0;
  while ((m = DIALECT_MARK_RE.exec(source)) !== null) {
    const raw = (m[1] ?? m[2] ?? "").replace(/^spw\./i, "Spw.");
    if (raw) dialectMarks.push(raw.startsWith("Spw.") ? raw : `Spw.${raw}`);
  }
  return {
    expRefs,
    ids: [...idSet],
    dialectMarks: [...new Set(dialectMarks)]
  };
}
function resolveCitedCatalogEntries(source) {
  const { ids } = scanExperimentalRefs(source);
  return ids.map((id) => getSyntaxCatalogEntry(id)).filter((e) => e != null);
}

// .spw/_workbench/packages/spw-seed/src/ir/progressive.ts
var PROGRESSIVE_PRODUCT_SURFACE = "spw.progressive-product/1";
function buildProgressiveProduct(input) {
  const omitted = input.omitted ?? [];
  const fieldCount = input.included.length + omitted.length;
  const completeness = fieldCount === 0 ? 1 : input.included.length / fieldCount;
  return {
    surface: PROGRESSIVE_PRODUCT_SURFACE,
    product: input.product,
    revision: input.revision,
    ir: input.ir,
    sequence: { ...input.sequence },
    stage: input.stage,
    status: omitted.length === 0 ? "complete" : "partial",
    completeness: {
      basis: "requested-fields",
      value: completeness,
      included: [...input.included],
      omitted: [...omitted]
    },
    deferred: [...input.deferred ?? []],
    elapsedMs: input.elapsedMs,
    data: input.data
  };
}

// .spw/_workbench/packages/spw-seed/src/parser/products.ts
var SOURCE_PRODUCT_DEPTHS = ["tokens", "structure", "trace"];
var SOURCE_PRODUCT_IDS = {
  tokens: "source.tokens/1",
  structure: "source.structure/1",
  trace: "source.trace/1"
};
var PRODUCT_TOTALS = {
  tokens: 1,
  structure: 2,
  trace: 3
};
function produceSourceProducts(input, options = {}, observe) {
  const through = options.through ?? options.product ?? "structure";
  return runSourcePipeline(input, options, { through, collect: true, observe });
}
function parseSourceStructure(input, options = {}) {
  const result = runSourcePipeline(input, options, {
    through: "structure",
    collect: false
  });
  return result.output;
}
function runSourcePipeline(input, options, controls) {
  const startedAt = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  if (controls.through === "trace") opts.eventPolicy = "trace";
  const products = [];
  const events = [];
  const errors = [];
  const warnings = [];
  let generatedEvents = 0;
  const publish = (product) => {
    if (controls.collect) products.push(product);
    controls.observe?.(product);
  };
  const observeEvent = (event) => {
    generatedEvents++;
    if (event.type === "error") errors.push(event);
    if (event.type === "warning") warnings.push(event);
    if (retainsParseEvent(opts.eventPolicy, event)) events.push(event);
  };
  const auto = opts.autoDialect !== false;
  let preparedSource = input;
  let dialect;
  let dialectSource;
  let dialectPreprocessed = false;
  if (auto || opts.dialect || opts.path) {
    const explicit = opts.dialect && isDialectId(opts.dialect) ? opts.dialect : void 0;
    const stack = resolveSurfaceProfile(input, { dialect: explicit, path: opts.path });
    dialect = stack.dialect;
    dialectSource = stack.dialectSource;
    if (!opts.contextMode || options.contextMode === void 0) opts.contextMode = stack.contextMode;
    if (!opts.lexProfile) {
      opts.lexProfile = stack.lex === "prose" || stack.metasyntax.unknownAsText ? "prose" : stack.lex;
    }
    if (stack.metasyntax.newlineAsSpace) {
      const next = applyDialectPreprocess(input, stack.dialect, true);
      if (next !== input) {
        preparedSource = next;
        dialectPreprocessed = true;
      }
    }
    if (stack.metasyntax.machineLint) {
      for (const message of collectMachineLintWarnings(input)) {
        observeEvent({
          type: "warning",
          rule: "dialect.machine_lint",
          position: { offset: 0, line: 1, column: 1 },
          data: { message },
          timestamp: performance.now(),
          depth: 0
        });
      }
    }
  }
  const lexProfile = resolveLexProfile(opts.lexProfile);
  const lexGen = tokenize(preparedSource, 0, { profile: lexProfile });
  let lexStep = lexGen.next();
  while (!lexStep.done) {
    observeEvent(lexStep.value);
    lexStep = lexGen.next();
  }
  const tokens = lexStep.value;
  const gaps = classifyTokenGaps(preparedSource, tokens);
  const identity = {
    uri: options.uri ?? options.path ?? "<memory>",
    sourceLength: input.length
  };
  const profile = {
    dialect,
    dialectSource,
    lexProfile: lexProfile.id,
    dialectPreprocessed
  };
  const eventReceipt = () => ({
    policy: opts.eventPolicy,
    generated: generatedEvents,
    retained: events.length
  });
  const diagnostics = () => ({
    errors: [...errors],
    warnings: [...warnings]
  });
  const total = PRODUCT_TOTALS[controls.through];
  if (controls.collect || controls.observe) {
    publish(buildProgressiveProduct({
      product: SOURCE_PRODUCT_IDS.tokens,
      revision: 1,
      ir: "lex",
      sequence: { index: 1, total },
      stage: "lex",
      included: ["source", "profile", "tokens", "gaps", "diagnostics", "eventCounts"],
      deferred: ["ast", "trace", "index", "semantic"],
      elapsedMs: performance.now() - startedAt,
      data: {
        source: identity,
        profile,
        tokens,
        gaps,
        diagnostics: diagnostics(),
        events: eventReceipt()
      }
    }));
  }
  if (controls.through === "tokens") {
    return { through: controls.through, request: controls.through, products };
  }
  const filteredTokens = tokens.filter((token2) => {
    if (!opts.includeWhitespace && token2.type === "WHITESPACE") return false;
    if (!opts.includeComments && token2.type === "COMMENT") return false;
    return true;
  });
  const stream = createTokenStream(filteredTokens, opts.contextMode);
  const parseGen = seedNode(stream, 0);
  let parseStep = parseGen.next();
  while (!parseStep.done) {
    observeEvent(parseStep.value);
    parseStep = parseGen.next();
  }
  const result = parseStep.value;
  let success = result.success;
  let outputError = result.success ? void 0 : result.error;
  if (success) {
    skipWhitespace(stream);
    if (current(stream).type !== "EOF") {
      success = false;
      const found = current(stream);
      outputError = {
        message: `Unexpected trailing tokens starting at ${found.type} (${JSON.stringify(found.value)})`,
        expected: ["EOF"],
        found: found.type,
        recoverable: false
      };
      observeEvent({
        type: "error",
        rule: "parse",
        position: getPosition2(stream),
        data: {
          message: `Unexpected trailing tokens starting at ${found.type} (${JSON.stringify(found.value)})`,
          expected: ["EOF"],
          found: found.type,
          recoverable: false
        },
        timestamp: performance.now(),
        depth: 0
      });
    }
  }
  const experimentalRefs = scanExperimentalRefs(input).ids;
  const duration = performance.now() - startedAt;
  const completeness = buildParseCompletenessReceipt({
    source: input,
    tokens,
    expectedRootKind: "Seed",
    actualRoot: result.value,
    remainingToken: current(stream),
    proseFallback: result.value?.expression.type === "Prose"
  });
  const output = {
    success,
    completeness,
    ast: result.value,
    tokens,
    gaps,
    events,
    eventPolicy: opts.eventPolicy,
    eventCounts: { generated: generatedEvents, retained: events.length },
    errors,
    warnings,
    error: outputError,
    duration,
    lexProfile: lexProfile.id,
    dialect,
    dialectSource,
    dialectPreprocessed,
    experimentalRefs: experimentalRefs.length > 0 ? experimentalRefs : void 0
  };
  if (controls.collect || controls.observe) {
    const structureProduct = buildProgressiveProduct({
      product: SOURCE_PRODUCT_IDS.structure,
      revision: 1,
      ir: "parse",
      sequence: { index: 2, total },
      stage: "parse",
      included: result.value ? ["source", "profile", "ast", "diagnostics", "eventCounts"] : ["source", "profile", "diagnostics", "eventCounts"],
      omitted: result.value ? [] : ["ast"],
      deferred: ["trace", "index", "semantic"],
      elapsedMs: duration,
      data: {
        source: identity,
        profile,
        success,
        ast: result.value,
        error: output.error,
        diagnostics: diagnostics(),
        events: eventReceipt(),
        experimentalRefs: output.experimentalRefs
      }
    });
    publish({
      ...structureProduct,
      completeness: {
        ...structureProduct.completeness,
        ...output.completeness
      }
    });
  }
  if (controls.through === "trace" && (controls.collect || controls.observe)) {
    publish(buildProgressiveProduct({
      product: SOURCE_PRODUCT_IDS.trace,
      revision: 1,
      ir: "parse",
      sequence: { index: 3, total },
      stage: "trace",
      included: ["events", "eventCounts"],
      deferred: ["index", "semantic"],
      elapsedMs: performance.now() - startedAt,
      data: {
        source: identity,
        profile,
        events: [...events],
        counts: { generated: generatedEvents, retained: events.length }
      }
    }));
  }
  return { through: controls.through, request: controls.through, products, output };
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
  return parseSourceStructure(input, options);
}

// .spw/_workbench/packages/spw-seed/src/parser/parse-expression.ts
function standaloneNode(sequence2) {
  if (sequence2.expressions.length === 1 && sequence2.separators?.length === 0) {
    return sequence2.expressions[0];
  }
  return sequence2;
}
function parseExpression(input, options = {}) {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const events = [];
  const errors = [];
  const warnings = [];
  let generatedEvents = 0;
  const observeEvent = (event) => {
    generatedEvents++;
    if (event.type === "error") errors.push(event);
    if (event.type === "warning") warnings.push(event);
    if (retainsParseEvent(opts.eventPolicy, event)) events.push(event);
  };
  const lexProfile = resolveLexProfile(opts.lexProfile);
  const lexed = lex(input, { profile: lexProfile, eventPolicy: "none" });
  const { tokens, gaps } = lexed;
  generatedEvents += lexed.eventCounts.generated;
  const filteredTokens = tokens.filter((token2) => {
    if (!opts.includeWhitespace && token2.type === "WHITESPACE") return false;
    if (!opts.includeComments && token2.type === "COMMENT") return false;
    return true;
  });
  const stream = createTokenStream(filteredTokens, opts.contextMode);
  const parseGen = sequenceNode(stream, 0);
  let parseStep = parseGen.next();
  while (!parseStep.done) {
    observeEvent(parseStep.value);
    parseStep = parseGen.next();
  }
  const structured = parseStep.value;
  skipWhitespace(stream);
  const structuredStall = current(stream);
  const hasStructuredPrefix = structured.success && structured.consumed > 0;
  let ast = hasStructuredPrefix ? standaloneNode(structured.value) : void 0;
  let success = hasStructuredPrefix && structuredStall.type === "EOF";
  let proseFallback = false;
  let error = structured.error;
  if (hasStructuredPrefix && !success) {
    const message = `Unexpected trailing tokens starting at ${structuredStall.type} (${JSON.stringify(structuredStall.value)})`;
    error = {
      message,
      expected: ["EOF"],
      found: structuredStall.type,
      recoverable: false
    };
    observeEvent({
      type: "error",
      rule: "parseExpression",
      position: getPosition2(stream),
      data: error,
      timestamp: performance.now(),
      depth: 0
    });
  } else if (!hasStructuredPrefix) {
    proseFallback = true;
    const message = structuredStall.type === "EOF" ? "Structured expression parse consumed nothing; surface degraded to prose." : `Structured expression parse stopped at ${structuredStall.type} ${JSON.stringify(structuredStall.value)}; surface degraded to prose.`;
    observeEvent({
      type: "warning",
      rule: "parseExpression",
      position: structuredStall.span.start,
      data: {
        message,
        code: "prose-degradation",
        found: structuredStall.type
      },
      timestamp: performance.now(),
      depth: 0
    });
    stream.position = 0;
    const proseGen = proseNode(stream, 0);
    let proseStep = proseGen.next();
    while (!proseStep.done) {
      observeEvent(proseStep.value);
      proseStep = proseGen.next();
    }
    if (proseStep.value.success) ast = proseStep.value.value;
    skipWhitespace(stream);
    success = false;
    error = structured.error ?? {
      message: "Expected a structured expression; input degraded to prose.",
      expected: ["Expression"],
      found: structuredStall.type,
      recoverable: false
    };
  }
  const completeness = buildParseCompletenessReceipt({
    source: input,
    tokens,
    expectedRootKind: "Expression",
    actualRoot: ast,
    remainingToken: current(stream),
    proseFallback
  });
  const duration = performance.now() - startTime;
  return {
    success,
    completeness,
    ast,
    tokens,
    gaps,
    events,
    eventPolicy: opts.eventPolicy,
    eventCounts: { generated: generatedEvents, retained: events.length },
    errors,
    warnings,
    error,
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
    onToken: (token2) => {
      hookSets.forEach((h) => h.onToken?.(token2));
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
      const token2 = event.data.token;
      return token2?.type !== "WHITESPACE" && token2?.type !== "COMMENT";
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
   * `layout` at four-space indent.
   *
   * Two spaces reads narrow at depth, but the convention is corpus-wide and not
   * worth flipping at once. This makes the wider indent nameable so it can be
   * adopted per file or per directory, and `spw format --pulse --mode wide`
   * shows exactly what it would do before anything is written.
   */
  wide: {
    normalizeNewlines: true,
    trimTrailingWhitespace: true,
    ensureFinalNewline: true,
    collapseBlankLines: true,
    indentBraces: true,
    indentSize: 4,
    alignComments: true,
    commentColumn: 40,
    blankLineBetweenFrames: true,
    reflowProse: false,
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

// .spw/_workbench/packages/spw-seed/src/canonical/authority.ts
var AUTHORITY_FACETS = {
  "!writes": "writes",
  "&joins": "joins",
  "!reads": "reads"
};
function walk(node, visit) {
  if (!node || typeof node !== "object") return;
  const obj = node;
  if (typeof obj.type === "string") visit(obj);
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, visit);
    } else if (value && typeof value === "object") {
      walk(value, visit);
    }
  }
}
function loneTerm(expr) {
  const e = expr;
  if (!e?.terms || e.terms.length !== 1) return void 0;
  return e.terms[0];
}
function unquote(raw) {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    if ((first === '"' || first === "'" || first === "`") && trimmed.endsWith(first)) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}
function facetName(key) {
  const k = key;
  if (k?.type !== "Operation") return void 0;
  const sigil = k.operator?.value;
  const label = k.operatorLabel?.value;
  if (!sigil || !label) return void 0;
  return `${sigil}${label}`;
}
function splitClaims(interior, interiorStart, kind, source) {
  const out = [];
  let cursor = 0;
  for (const piece of interior.split(/[;,\n]/)) {
    const start = cursor;
    cursor += piece.length + 1;
    const raw = piece.trim();
    if (!raw) continue;
    const offset = interiorStart + start + piece.indexOf(raw);
    const match = /^([^[\s]+)(?:\[([^\]]*)\])?/.exec(raw);
    if (!match) continue;
    out.push({
      kind,
      name: match[1],
      qualifier: match[2]?.trim() || void 0,
      raw,
      span: {
        start: offsetToSpanPoint(source, offset),
        end: offsetToSpanPoint(source, offset + raw.length)
      }
    });
  }
  return out;
}
function offsetToSpanPoint(source, offset) {
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < offset && i < source.length; i++) {
    if (source[i] === "\n") {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: offset - lastNewline, offset };
}
function readAuthorityDeclarations(source) {
  const result = parse(source);
  if (!result.ast) return [];
  const selves = [];
  const claims = [];
  let span;
  walk(result.ast, (node) => {
    if (node.type === "Seed") span = node.span;
    if (node.type === "Binding") {
      const term = loneTerm(node.value);
      const key = node.key;
      if (key?.type === "Reference" && key.raw?.trim() === "self") {
        if (term?.type === "PathRef") {
          const token2 = term.path?.token;
          if (token2?.value) {
            selves.push({
              path: unquote(token2.value),
              offset: term.span.start.offset
            });
          }
        }
        return;
      }
      const facet2 = facetName(node.key);
      const kind = facet2 ? AUTHORITY_FACETS[facet2] : void 0;
      if (!kind || term?.type !== "Stream") return;
      const open = term.open;
      const close = term.close;
      const from = open.span.end.offset;
      const to = close?.span.start.offset ?? from;
      claims.push(...splitClaims(source.slice(from, to), from, kind, source));
    }
  });
  if (claims.length === 0) return [];
  const grouped = /* @__PURE__ */ new Map();
  const pathFor = /* @__PURE__ */ new Map();
  for (const claim of claims) {
    const owner = selves.filter((s) => s.offset < claim.span.start.offset).reduce(
      (best, cur) => !best || cur.offset > best.offset ? cur : best,
      void 0
    );
    const key = owner ? `${owner.offset}` : "";
    pathFor.set(key, owner?.path);
    const bucket = grouped.get(key);
    if (bucket) bucket.push(claim);
    else grouped.set(key, [claim]);
  }
  return [...grouped.entries()].map(([key, group]) => ({
    self: pathFor.get(key),
    claims: group,
    span
  }));
}
function reconcileAuthority(declared, observed) {
  const findings = [];
  const matchedClaims = /* @__PURE__ */ new Set();
  for (const obs of observed) {
    const claim = declared.find(
      (c) => c.kind === obs.kind && (c.name === obs.name || c.qualifier === "*" && c.name === obs.name)
    );
    if (claim) {
      matchedClaims.add(claim);
      findings.push({
        kind: obs.kind,
        name: obs.name,
        verdict: "declared",
        sites: obs.sites,
        span: claim.span
      });
      continue;
    }
    findings.push({ kind: obs.kind, name: obs.name, verdict: "leak", sites: obs.sites });
  }
  for (const claim of declared) {
    if (matchedClaims.has(claim)) continue;
    findings.push({ kind: claim.kind, name: claim.name, verdict: "stale", span: claim.span });
  }
  return findings;
}

// .spw/_workbench/packages/spw-seed/src/canonical/self-mass.ts
var MEASURABLE_KEYS = ["lines", "bytes"];
function unquote2(raw) {
  const trimmed = raw.trim();
  if (trimmed.length >= 2) {
    const first = trimmed[0];
    const last = trimmed[trimmed.length - 1];
    if ((first === '"' || first === "'" || first === "`") && first === last) {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
}
function walk2(node, visit) {
  if (!node || typeof node !== "object") return;
  const obj = node;
  if (typeof obj.type === "string") visit(obj);
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) {
      for (const item of value) walk2(item, visit);
    } else if (value && typeof value === "object") {
      walk2(value, visit);
    }
  }
}
function loneTerm2(expr) {
  const e = expr;
  if (!e?.terms || e.terms.length !== 1) return void 0;
  return e.terms[0];
}
function bindingKeyName(key) {
  const k = key;
  if (!k) return void 0;
  if (k.type === "Identifier") {
    return (k.token?.value ?? "").trim() || void 0;
  }
  if (k.type === "Reference") {
    return k.raw?.trim() || void 0;
  }
  return void 0;
}
function readMassDeclarations(source) {
  const result = parse(source);
  if (!result.ast) return [];
  const selves = [];
  const masses = [];
  walk2(result.ast, (node) => {
    if (node.type === "Binding" && bindingKeyName(node.key) === "self") {
      const term = loneTerm2(node.value);
      if (term?.type === "PathRef") {
        const token2 = term.path?.token;
        if (token2?.value) {
          selves.push({ path: unquote2(token2.value), span: term.span });
        }
      }
      return;
    }
    if (node.type === "Operation" && node.operator?.value === "%" && node.operatorLabel?.value === "mass") {
      const measures = {};
      const otherKeys = [];
      const sequence2 = node.body?.sequence;
      for (const expr of sequence2?.expressions ?? []) {
        const term = loneTerm2(expr);
        if (term?.type !== "Binding") continue;
        const key = bindingKeyName(term.key);
        if (!key) continue;
        const valueTerm = loneTerm2(term.value);
        const token2 = valueTerm?.token;
        if (valueTerm?.type === "Literal" && token2?.type === "NUMBER") {
          measures[key] = {
            key,
            value: Number(token2.value),
            span: valueTerm.span
          };
        } else {
          otherKeys.push(key);
        }
      }
      masses.push({ span: node.span, measures, otherKeys });
    }
  });
  return selves.map((self, i) => {
    const next = selves[i + 1];
    const mass = masses.find(
      (m) => m.span.start.offset > self.span.start.offset && (!next || m.span.start.offset < next.span.start.offset)
    );
    return {
      self: self.path,
      selfSpan: self.span,
      measures: mass?.measures ?? {},
      otherKeys: mass?.otherKeys ?? [],
      massSpan: mass?.span
    };
  });
}
function measureMass(text) {
  let lines = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "\n") lines++;
  }
  return {
    lines,
    bytes: Buffer.byteLength(text, "utf8")
  };
}
function reconcileMass(declaration, measured) {
  const out = [];
  for (const key of MEASURABLE_KEYS) {
    const declared = declaration.measures[key];
    const actual = measured[key];
    if (!declared) {
      out.push({ key, measured: actual, verdict: "undeclared" });
      continue;
    }
    out.push({
      key,
      declared: declared.value,
      measured: actual,
      verdict: declared.value === actual ? "match" : "drift",
      span: declared.span
    });
  }
  for (const [key, declared] of Object.entries(declaration.measures)) {
    if (MEASURABLE_KEYS.includes(key)) continue;
    out.push({ key, declared: declared.value, verdict: "unmeasurable", span: declared.span });
  }
  for (const key of declaration.otherKeys) {
    out.push({ key, verdict: "unmeasurable" });
  }
  return out;
}
function applyMassCorrections(source, entries) {
  const edits = entries.filter((e) => e.verdict === "drift" && e.span && e.measured !== void 0).sort((a, b) => b.span.start.offset - a.span.start.offset);
  let next = source;
  for (const edit of edits) {
    const { start, end } = edit.span;
    next = next.slice(0, start.offset) + String(edit.measured) + next.slice(end.offset);
  }
  return { source: next, applied: edits.length };
}

// .spw/_workbench/packages/spw-seed/src/canonical/snippet.ts
var SPW_SNIPPET_VERSION = "spw.snippet/1";
var HYDRATE_SLOT = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?:=([^}]*))?\}/g;
var CORE_SNIPPETS = [
  {
    id: "seed.header",
    prefix: "seed",
    family: "general",
    description: "Seed with profile and intent",
    body: [
      "^seed[${Name=Demo} v:0.1 @profile:Spw.${dialect=b} @intent:${intent=sketch}]",
      "$0"
    ]
  },
  {
    id: "frame.named",
    prefix: "frame",
    family: "form",
    description: 'Named integrate frame ^["label"]{ }',
    body: ['^["${label=name}"]{', "  $0", "}"]
  },
  {
    id: "roots.bind",
    prefix: "roots",
    family: "nav",
    description: "Roots frame with @name path binds",
    body: [
      '^["roots"]{',
      '  @${name=self}: ~"${path=./path}"',
      "  $0",
      "}"
    ]
  },
  {
    id: "wonder.probe",
    prefix: "wonder",
    family: "wonder",
    description: "Wonder block with depth, probe, measure",
    body: [
      "#>${id=wonder_id}",
      '?["${question=What holds?}"]{',
      "  #:depth #!${depth=computational}",
      "  !probe{ =id[${probe=p1}] }",
      "  $%[${metric=Hold}]",
      "}"
    ]
  },
  {
    id: "measure.mass",
    prefix: "mass",
    family: "measure",
    description: "Thrift family: @self + %mass (measure kernel specialization)",
    docs: ".spw/registries/measure-context.spw",
    body: [
      '^["${label=module}"]{',
      '  @self: ~"${subject=./src/file.ts}"',
      "  %mass{ lines: ${lines=0}, bytes: ${bytes=0} }",
      "}"
    ]
  },
  {
    id: "measure.density",
    prefix: "density",
    family: "measure",
    description: "Syntax plane %density (proposed family)",
    docs: ".spw/registries/measure-context.spw",
    body: [
      '^["${label=surface}"]{',
      "  %density{ ops: ${ops=0}, depth: ${depth=0}, frames: ${frames=0} }",
      "}"
    ]
  },
  {
    id: "flow.schedule",
    prefix: "schedule",
    family: "flow",
    dialect: "Spw.f",
    description: "CA / stream schedule with ; and ||",
    docs: "docs/theory/spw/flow-protocol-sigils.spw",
    body: [
      "@dialect:Spw.f",
      "=phi[ id: ${id=soft} ]{ << ~ ; ? ; % ; ! ; ^ >> }",
      "=ceiling[ ${ceiling=l0} ]"
    ]
  },
  {
    id: "flow.pipeline",
    prefix: "pipeline",
    family: "flow",
    description: "Bare sequential schedule stream",
    body: ["<< ~ ; ? ; % ; ! ; * ; ^ >>"]
  },
  {
    id: "dialect.header",
    prefix: "dialect",
    family: "dialect",
    description: "Dialect mark + seed stack",
    body: [
      "@dialect:Spw.${dialect=b}",
      "^seed[${Name=Surface} v:0.1 @profile:Spw.${dialect=b}]",
      "$0"
    ]
  },
  {
    id: "sense.surface_card",
    prefix: "surface",
    family: "sense",
    description: "Minimal surface stack card seed",
    body: [
      "@dialect:Spw.${dialect=b}",
      "^seed[${Name=Card} v:0.1 @profile:Spw.${dialect=b} @intent:${intent=sense}]",
      '^["roots"]{',
      '  @here: ~"."',
      "}",
      '^["intent"]{',
      '  ~#goal: "${goal=describe this surface}"',
      "}"
    ]
  },
  {
    id: "ref.dual_read",
    prefix: "dualref",
    family: "nav",
    description: "Point and follow dual-read (ref-deref literacy)",
    docs: "docs/theory/spw/reference-deref-geometry.spw",
    body: [
      '@self: ~"${path=./mod.spw}"',
      '$~"${path=./mod.spw}"'
    ]
  },
  {
    id: "exp.cite",
    prefix: "exp",
    family: "general",
    description: "Cite experimental catalog id",
    body: ["=exp[ id: ${id=flow.sigma_chain} , status: ${status=proposed} ]"]
  },
  {
    id: "plan.stream",
    prefix: "planstream",
    family: "plan",
    dialect: "Spw.p",
    description: "Plan stream + open question",
    body: [
      "@dialect:Spw.p",
      '^["stream"]{',
      '  >>["${date=2026-07-27}"] "${type=note}: ${message=\u2026}"',
      "}",
      '^["open"]{',
      '  ?[${qid=x}]: "${question=\u2026}"',
      "}"
    ]
  },
  {
    id: "form.wrap",
    prefix: "formwrap",
    family: "form",
    description: "Confluence wrap sequence",
    body: ["& => {&} => {&[#${label=label}]} => {&<#${tag=tag}>_${label=label}}"]
  },
  {
    id: "episode.commit",
    prefix: "episode",
    family: "plan",
    description: "Commit episode block",
    body: [
      "#[episode]{",
      '  ~[scene]{ "${scene=\u2026}" }',
      "  ![change]{ ${change=\u2026} }",
      "  *[verify]{ ${verify=\u2026} }",
      "}"
    ]
  },
  {
    id: "path.ref",
    prefix: "tref",
    family: "nav",
    description: "Tilde path reference",
    body: ['~"${path=./path.spw}"']
  },
  {
    id: "probe.block",
    prefix: "probe",
    family: "wonder",
    description: "Bare !probe cell",
    body: ["!probe{ =id[${id=p}] }"]
  }
];
var BY_ID2 = new Map(CORE_SNIPPETS.map((s) => [s.id, s]));
function getSnippet(id) {
  return BY_ID2.get(id);
}
function listSnippets(filter) {
  return CORE_SNIPPETS.filter((s) => {
    if (filter?.family && s.family !== filter.family) return false;
    if (filter?.prefix && !s.prefix.startsWith(filter.prefix) && s.prefix !== filter.prefix) {
      return false;
    }
    if (filter?.dialect && s.dialect && s.dialect !== filter.dialect) return false;
    return true;
  });
}
function snippetSource(snippet) {
  return snippet.body.join("\n");
}
function hydrateSnippet(snippet, bindings = {}, opts = {}) {
  const id = typeof snippet === "string" ? "inline" : snippet.id;
  const source = typeof snippet === "string" ? snippet : snippetSource(snippet);
  const applyDefaults = opts.applyDefaults !== false;
  const filled = [];
  const defaultsUsed = [];
  const open = /* @__PURE__ */ new Set();
  const text = source.replace(HYDRATE_SLOT, (match, name, def) => {
    if (/^\d+$/.test(name)) return match;
    if (bindings[name] !== void 0) {
      filled.push(name);
      return bindings[name];
    }
    if (applyDefaults && def !== void 0) {
      defaultsUsed.push(name);
      return def;
    }
    open.add(name);
    return match;
  });
  const openList = [...open].sort();
  const complete = openList.length === 0;
  if (opts.strict && !complete) {
    throw new Error(`snippet hydrate incomplete: open ${openList.join(", ")}`);
  }
  return {
    version: SPW_SNIPPET_VERSION,
    id,
    text,
    filled: [...new Set(filled)],
    defaultsUsed: [...new Set(defaultsUsed)],
    open: openList,
    complete
  };
}
function toVscodeSnippets(snippets = CORE_SNIPPETS) {
  const out = {};
  for (const s of snippets) {
    let tab = 1;
    const body = s.body.map(
      (line) => line.replace(HYDRATE_SLOT, (_m, name, def) => {
        if (/^\d+$/.test(name)) return _m;
        if (name === "0" || _m === "$0") return "$0";
        const n = tab++;
        return def !== void 0 ? `\${${n}:${def}}` : `\${${n}:${name}}`;
      })
    );
    const title = s.id.split(".").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");
    out[title] = {
      prefix: s.prefix,
      body,
      description: s.description
    };
  }
  return out;
}
function formatVscodeSnippetsJson(snippets) {
  return `${JSON.stringify(toVscodeSnippets(snippets), null, 4)}
`;
}
function parseBindings(pairs) {
  const out = {};
  for (const p of pairs) {
    const i = p.indexOf("=");
    if (i <= 0) continue;
    out[p.slice(0, i)] = p.slice(i + 1);
  }
  return out;
}

// .spw/_workbench/packages/spw-seed/src/canonical/measure-protocol.ts
var MASS_FAMILY = {
  id: "mass",
  operator: "%",
  identifier: "mass",
  plane: "thrift",
  scopeKind: "subject_file",
  subjectBind: "self",
  keys: ["lines", "bytes"],
  defaultScheme: "exact",
  algorithm: "thrift.file_physics",
  form: "vector",
  note: "Legacy compelling product; specialization of measure protocol, not the kernel."
};
var THRIFT_FILE_ALGORITHM = {
  id: "thrift.file_physics",
  plane: "thrift",
  scopeKind: "subject_file",
  form: "vector",
  steps: [
    "resolve subject from surface bind (self \u2192 path)",
    "read host bytes",
    "count lines and bytes",
    "return ObservedMetric[]"
  ],
  ir: { consumes: ["selection", "identity"], produces: ["measure"] },
  host: "fs",
  note: "CLI/host implements observation; seed reconciles only."
};
var BUILTIN_FAMILIES = [
  MASS_FAMILY,
  {
    id: "density",
    operator: "%",
    identifier: "density",
    plane: "syntax",
    scopeKind: "surface",
    subjectBind: "none",
    keys: ["ops", "depth", "frames"],
    defaultScheme: "band",
    algorithm: "syntax.form_density",
    form: "vector",
    note: "Proposed \u2014 observe via FormIR / geometry."
  },
  {
    id: "authority",
    operator: "%",
    identifier: "authority",
    plane: "authority",
    scopeKind: "subject_file",
    subjectBind: "self",
    keys: ["writes", "joins", "reads"],
    defaultScheme: "exact",
    algorithm: "authority.host_extract",
    form: "table",
    note: "Claim streams !writes/&joins remain; %authority is measure-shaped twin."
  }
];
var BUILTIN_ALGORITHMS = [
  THRIFT_FILE_ALGORITHM,
  {
    id: "syntax.form_density",
    plane: "syntax",
    scopeKind: "surface",
    form: "vector",
    steps: [
      "parse surface (or reuse ParseIR)",
      "inspectGeometry / FormIR",
      "emit ops%, maxDepth, frame count"
    ],
    ir: { consumes: ["parse", "form"], produces: ["measure"] },
    host: "seed-geometry"
  },
  {
    id: "attention.scope_walk",
    plane: "graph",
    scopeKind: "selection",
    form: "stream",
    steps: [
      "take AttentionalScope / SelectionIR",
      "apply lens stack",
      "for each uri: open perceptive plane",
      "precipitate MeasureIR rows",
      "optional crystallize window"
    ],
    ir: {
      consumes: ["selection", "attention", "lens"],
      produces: ["measure", "stream", "precipitate"]
    },
    host: "runtime-session",
    note: "Scalable kernel loop: Spw describes the walk; host runs extractors per plane."
  }
];
function defaultScheme(id = "exact") {
  return { id };
}
function reconcileMetric(declared, observed, scheme = defaultScheme("exact")) {
  const key = declared?.key ?? observed?.key ?? "?";
  if (!declared) {
    return {
      family: "",
      key,
      observed: observed?.value,
      scheme,
      verdict: "undeclared"
    };
  }
  if (!observed || observed.unmeasurable || observed.value === void 0) {
    return {
      family: "",
      key: declared.key,
      declared: declared.value,
      scheme,
      verdict: "unmeasurable",
      span: declared.span
    };
  }
  const d = declared.value;
  const o = observed.value;
  const sch = declared.scheme ?? scheme;
  let verdict = "drift";
  switch (sch.id) {
    case "exact":
      verdict = d === o ? "match" : "drift";
      break;
    case "tol": {
      const abs = sch.abs ?? 0;
      const rel = sch.rel ?? 0;
      const ok = Math.abs(d - o) <= abs || d !== 0 && Math.abs(d - o) / Math.abs(d) <= rel;
      verdict = ok ? "match" : "drift";
      break;
    }
    case "band": {
      const lo = sch.lo ?? d;
      const hi = sch.hi ?? d;
      verdict = o >= lo && o <= hi ? "band_ok" : "drift";
      break;
    }
    case "ratio": {
      if (d === 0) verdict = o === 0 ? "match" : "drift";
      else {
        const r = o / d;
        const lo = sch.lo ?? 0.9;
        const hi = sch.hi ?? 1.1;
        verdict = r >= lo && r <= hi ? "match" : "soft_miss";
      }
      break;
    }
    default:
      verdict = "scheme_mismatch";
  }
  return {
    family: "",
    key: declared.key,
    declared: d,
    observed: o,
    scheme: sch,
    verdict,
    span: declared.span
  };
}
function reconcileFamily(family, metrics, observations, scheme = defaultScheme("exact"), knownKeys) {
  const keys = /* @__PURE__ */ new Set([
    ...Object.keys(metrics),
    ...Object.keys(observations),
    ...knownKeys ?? []
  ]);
  const out = [];
  for (const key of keys) {
    const row = reconcileMetric(metrics[key], observations[key], scheme);
    row.family = family;
    if (knownKeys && !knownKeys.includes(key) && metrics[key] && !observations[key]) {
      row.verdict = "unmeasurable";
    }
    out.push(row);
  }
  return out;
}
function productKey(operator2, identifier2) {
  return `${operator2}${identifier2}`;
}
function bootstrapMeasureRegistry() {
  const families = [...BUILTIN_FAMILIES];
  const algorithms = [...BUILTIN_ALGORITHMS];
  const byProduct = {};
  for (const f of families) {
    byProduct[productKey(f.operator, f.identifier)] = f.id;
  }
  return { families, algorithms, byProduct };
}
function loadMeasureContextFromSpw(source, base = bootstrapMeasureRegistry()) {
  const result = parse(source);
  if (!result.ast) return base;
  const families = [...base.families];
  const algorithms = [...base.algorithms];
  const byProduct = { ...base.byProduct };
  const famById = new Map(families.map((f) => [f.id, f]));
  const algoById = new Map(algorithms.map((a) => [a.id, a]));
  walk3(result.ast, (node) => {
    if (node.type !== "Operation") return;
    const op = node;
    if (op.operator?.value !== "^") return;
    const label = frameLabel(op.frame);
    if (label !== "family" && label !== "algorithm") return;
    const fields = bodyFields(op.body);
    if (label === "family") {
      const id = strField(fields, "id") ?? strField(fields, "identifier") ?? "anon";
      const identifier2 = strField(fields, "identifier") ?? id;
      const operator2 = strField(fields, "operator") ?? "%";
      const prev = famById.get(id);
      const def = {
        id,
        operator: operator2,
        identifier: identifier2,
        plane: strField(fields, "plane") ?? prev?.plane ?? "thrift",
        scopeKind: strField(fields, "scope") ?? prev?.scopeKind ?? "subject_file",
        subjectBind: strField(fields, "subject") ?? prev?.subjectBind ?? "self",
        keys: listField(fields, "keys") ?? prev?.keys ?? ["lines", "bytes"],
        defaultScheme: strField(fields, "scheme") ?? prev?.defaultScheme ?? "exact",
        algorithm: strField(fields, "algorithm") ?? prev?.algorithm ?? "thrift.file_physics",
        form: strField(fields, "form") ?? prev?.form ?? "vector",
        note: strField(fields, "note") ?? prev?.note
      };
      famById.set(id, def);
      byProduct[productKey(operator2, identifier2)] = id;
    }
    if (label === "algorithm") {
      const id = strField(fields, "id") ?? "anon";
      const prev = algoById.get(id);
      const def = {
        id,
        plane: strField(fields, "plane") ?? prev?.plane ?? "thrift",
        scopeKind: strField(fields, "scope") ?? prev?.scopeKind ?? "surface",
        form: strField(fields, "form") ?? prev?.form ?? "vector",
        steps: listField(fields, "steps") ?? prev?.steps ?? [],
        host: strField(fields, "host") ?? prev?.host,
        note: strField(fields, "note") ?? prev?.note,
        ir: prev?.ir
      };
      algoById.set(id, def);
    }
  });
  return {
    families: [...famById.values()],
    algorithms: [...algoById.values()],
    byProduct
  };
}
function resolveFamily(registry2, operator2, identifier2) {
  const id = registry2.byProduct[productKey(operator2, identifier2)];
  if (!id) return void 0;
  return registry2.families.find((f) => f.id === id);
}
function contextForFamily(family, subject) {
  return {
    scope: { kind: family.scopeKind, target: subject },
    plane: family.plane,
    form: family.form,
    algorithm: family.algorithm
  };
}
function walk3(node, visit) {
  if (!node || typeof node !== "object") return;
  const obj = node;
  if (typeof obj.type === "string") visit(obj);
  for (const value of Object.values(obj)) {
    if (Array.isArray(value)) for (const item of value) walk3(item, visit);
    else if (value && typeof value === "object") walk3(value, visit);
  }
}
function frameLabel(frame) {
  const f = frame;
  if (!f?.content?.length) return void 0;
  for (const c of f.content) {
    const t = c;
    if (t.type === "Literal" || t.type === "Identifier") {
      return unquote3(t.token?.value ?? "");
    }
    if (t.type === "Expression" && t.terms?.[0]) {
      const term = t.terms[0];
      if (term.token?.value) return unquote3(term.token.value);
    }
  }
  return void 0;
}
function bodyFields(body) {
  const out = {};
  const b = body;
  if (!b?.content) return out;
  for (const item of b.content) {
    walk3(item, (n2) => {
      if (n2.type !== "Binding" && n2.type !== "Expression") return;
    });
    const n = item;
    if (n.type === "Binding") {
      const key = bindingKey(n.key);
      if (key) out[key] = n.value;
    }
    if (n.type === "Expression") {
      const terms = n.terms ?? [];
      for (const term of terms) {
        const t = term;
        if (t.type === "Binding") {
          const key = bindingKey(t.key);
          if (key) out[key] = t.value;
        }
      }
    }
  }
  walk3(body, (n) => {
    if (n.type !== "Binding") return;
    const key = bindingKey(n.key);
    if (key && out[key] === void 0) out[key] = n.value;
  });
  return out;
}
function bindingKey(key) {
  const k = key;
  if (!k) return void 0;
  if (k.type === "Identifier") return (k.token?.value ?? "").trim() || void 0;
  if (k.type === "Reference") return k.raw?.trim() || void 0;
  if (k.type === "Expression") {
    const terms = k.terms;
    if (terms?.[0]) return bindingKey(terms[0]);
  }
  return void 0;
}
function unquote3(raw) {
  const t = raw.trim();
  if (t.length >= 2) {
    const a = t[0];
    const b = t[t.length - 1];
    if ((a === '"' || a === "'" || a === "`") && a === b) return t.slice(1, -1);
  }
  return t;
}
function strField(fields, name) {
  const v = fields[name];
  if (v === void 0) return void 0;
  return scalarString(v);
}
function listField(fields, name) {
  const v = fields[name];
  if (v === void 0) return void 0;
  const node = v;
  const content = node.content ?? node.terms ?? (node.type === "Expression" ? node.terms : void 0);
  if (!Array.isArray(content)) {
    const s = scalarString(v);
    return s ? [s] : void 0;
  }
  const out = [];
  for (const c of content) {
    const s = scalarString(c);
    if (s) out.push(s);
  }
  return out.length ? out : void 0;
}
function scalarString(node) {
  if (typeof node === "string" || typeof node === "number") return String(node);
  const n = node;
  if (!n || typeof n !== "object") return void 0;
  if (n.type === "Literal" || n.type === "Identifier") {
    return unquote3(n.token?.value ?? "");
  }
  if (n.type === "Reference") return n.raw ?? void 0;
  if (n.type === "Expression" && Array.isArray(n.terms) && n.terms.length === 1) {
    return scalarString(n.terms[0]);
  }
  return void 0;
}

// .spw/_workbench/packages/spw-seed/src/canonical/format-pulses.ts
var FORMAT_CAPABILITIES = [
  "normalizeNewlines",
  "trimTrailingWhitespace",
  "migrateSlashComments",
  "reflowProse",
  "indentBraces",
  "alignComments",
  "blankLineBetweenFrames",
  "collapseBlankLines",
  "ensureFinalNewline"
];
var CAPABILITY_LABELS = {
  normalizeNewlines: "normalize line endings",
  trimTrailingWhitespace: "trim trailing whitespace",
  migrateSlashComments: "migrate // comments to # light",
  reflowProse: "reflow # prose to print width",
  indentBraces: "indent by brace depth",
  alignComments: "align trailing comments",
  blankLineBetweenFrames: "blank line between frames",
  collapseBlankLines: "collapse blank line runs",
  ensureFinalNewline: "ensure final newline"
};
function countChangedLines(before, after) {
  const a = before.split("\n");
  const b = after.split("\n");
  let changed = Math.abs(a.length - b.length);
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] !== b[i]) changed++;
  }
  return changed;
}
function formatPulses(input, profile = "canonical", overrides = {}) {
  const options = resolveFormatProfile(profile, overrides);
  const enabled = FORMAT_CAPABILITIES.filter((cap) => options[cap] === true);
  const pulses = [];
  let before = input;
  const applied = {};
  for (const cap of FORMAT_CAPABILITIES) applied[cap] = false;
  for (const cap of enabled) {
    applied[cap] = true;
    const after = canonicalize(input, { ...options, ...applied }).source;
    pulses.push({
      capability: cap,
      label: CAPABILITY_LABELS[cap],
      before,
      after,
      changed: before !== after,
      linesChanged: countChangedLines(before, after)
    });
    before = after;
  }
  const formatted = canonicalize(input, options).source;
  return {
    version: "spw.format.pulse/1",
    profile: String(profile),
    options,
    pulses,
    original: input,
    formatted,
    changedCount: pulses.filter((p) => p.changed).length
  };
}
function diffLines(before, after, context = 2) {
  const a = before.split("\n");
  const b = after.split("\n");
  let start = 0;
  while (start < a.length && start < b.length && a[start] === b[start]) start++;
  let endA = a.length - 1;
  let endB = b.length - 1;
  while (endA >= start && endB >= start && a[endA] === b[endB]) {
    endA--;
    endB--;
  }
  if (start > endA && start > endB) return [];
  const out = [];
  for (let i = Math.max(0, start - context); i < start; i++) {
    out.push({ kind: "context", text: a[i], line: i + 1 });
  }
  const lenA = endA - start + 1;
  const lenB = endB - start + 1;
  if (lenA === lenB) {
    for (let i = 0; i < lenA; i++) {
      const left = a[start + i];
      const right = b[start + i];
      if (left === right) {
        out.push({ kind: "context", text: left, line: start + i + 1 });
        continue;
      }
      out.push({ kind: "remove", text: left, line: start + i + 1 });
      out.push({ kind: "add", text: right, line: start + i + 1 });
    }
  } else {
    for (let i = start; i <= endA; i++) {
      out.push({ kind: "remove", text: a[i], line: i + 1 });
    }
    for (let i = start; i <= endB; i++) {
      out.push({ kind: "add", text: b[i], line: i + 1 });
    }
  }
  for (let i = endA + 1; i < Math.min(a.length, endA + 1 + context); i++) {
    out.push({ kind: "context", text: a[i], line: i + 1 });
  }
  return out;
}
function compareFormatProfiles(input, profiles, overrides = {}) {
  return profiles.map((profile) => {
    const options = resolveFormatProfile(profile, overrides);
    const formatted = canonicalize(input, options).source;
    return {
      profile: String(profile),
      formatted,
      changed: formatted !== input,
      linesChanged: countChangedLines(input, formatted),
      capabilities: FORMAT_CAPABILITIES.filter((cap) => options[cap] === true)
    };
  });
}

// .spw/_workbench/packages/spw-seed/src/canonical/differential.ts
var EVIDENCE_BASES = ["observed", "derived", "reported"];
var EVIDENCE_DOMAINS = [
  "source",
  "syntax",
  "structure",
  "topology",
  "layout",
  "runtime",
  "architecture",
  "preference"
];
var EVIDENCE_ROLES = ["match", "filter", "projection", "annotation"];
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
  next = next.replace(/\.([!?~@&*=%#$^_])/g, (_match, token2) => {
    counts.dotPostfixNormalized += 1;
    return token2;
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
  return tokens.every((token2) => {
    if (token2.type === "PHRASE") {
      return token2.value.startsWith("`") && endsWithUnescapedDelimiter(token2.value, "`");
    }
    if (token2.type === "STRING") {
      const q = token2.value[0];
      return (q === '"' || q === "'") && token2.value.startsWith(q) && endsWithUnescapedDelimiter(token2.value, q);
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
  const significantTokens2 = tokens.filter(
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
    significantTokens: significantTokens2,
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

// .spw/_workbench/packages/spw-seed/src/canonical/apposition-scan.ts
var APPOSITION_SCAN_VERSION = "spw.apposition.scan/1";
function scanAppositions(source, options = {}) {
  const cells = [];
  const len = source.length;
  let i = 0;
  while (i < len - 1) {
    if (source[i] !== "~" || source[i + 1] !== "#") {
      i++;
      continue;
    }
    let ahead = i + 2;
    while (ahead < len && /[a-zA-Z0-9_-]/.test(source[ahead])) ahead++;
    if (ahead >= len || source[ahead] !== "(") {
      i++;
      continue;
    }
    const start = i;
    let raw = source.slice(i, ahead + 1);
    i = ahead + 1;
    let depth = 1;
    let closed = false;
    while (i < len) {
      const ch = source[i];
      if (ch === "\n") break;
      raw += ch;
      i++;
      if (ch === "(") depth++;
      else if (ch === ")") {
        depth--;
        if (depth === 0) {
          closed = true;
          break;
        }
      }
    }
    if (!closed) {
      if (options.strict) {
        break;
      }
      if (i === start) i = start + 2;
      continue;
    }
    const parts = appositionParts(raw);
    const end = start + raw.length;
    cells.push({
      name: parts.name,
      body: parts.body,
      raw,
      span: { start, end },
      mask: hashString(raw),
      bodyMask: hashString(parts.body),
      anonymous: parts.name == null
    });
  }
  const names = new Set(cells.map((c) => c.name).filter((n) => n != null));
  return {
    version: APPOSITION_SCAN_VERSION,
    substrateHash: hashString(source),
    cells,
    namedCount: cells.filter((c) => !c.anonymous).length,
    anonymousCount: cells.filter((c) => c.anonymous).length,
    distinctNames: names.size
  };
}
function appositionMasksEqual(a, b) {
  return a.mask === b.mask;
}
function appositionSpectrum(lattice) {
  const byName = {};
  for (const cell of lattice.cells) {
    if (cell.name == null) continue;
    byName[cell.name] = (byName[cell.name] ?? 0) + 1;
  }
  return {
    version: lattice.version,
    substrateHash: lattice.substrateHash,
    total: lattice.cells.length,
    named: lattice.namedCount,
    anonymous: lattice.anonymousCount,
    distinctNames: lattice.distinctNames,
    byName
  };
}
function diffAppositionLattices(before, after) {
  const beforeByMask = new Map(before.cells.map((c) => [c.mask, c]));
  const afterByMask = new Map(after.cells.map((c) => [c.mask, c]));
  const added = [];
  const removed = [];
  let stableMasks = 0;
  for (const [mask, cell] of afterByMask) {
    if (beforeByMask.has(mask)) stableMasks++;
    else added.push(cell);
  }
  for (const [mask, cell] of beforeByMask) {
    if (!afterByMask.has(mask)) removed.push(cell);
  }
  const remasked = [];
  const removedNamed = removed.filter((c) => c.name != null);
  const addedNamed = added.filter((c) => c.name != null);
  for (const r of removedNamed) {
    const a = addedNamed.find((x) => x.name === r.name && x.mask !== r.mask);
    if (a) remasked.push({ name: r.name, before: r, after: a });
  }
  return { added, removed, remasked, stableMasks };
}

// .spw/_workbench/packages/spw-seed/src/canonical/spw-card.ts
function escapeStr(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
function needsQuotes(s) {
  if (s.length === 0) return true;
  if (/^-?\d+(\.\d+)?$/.test(s)) return false;
  if (/^[A-Za-z_#][\w./:@+-]*$/.test(s)) return false;
  if (/^[0-9a-f]{6,}$/i.test(s)) return false;
  return true;
}
function renderFlag(v) {
  if (v === true || v === "yes") return "#yes";
  if (v === false || v === "no") return "#no";
  if (v === "eq" || v === "moved" || v === "none") return `#${v}`;
  return v == null || v === "" ? "_" : String(v);
}
function renderState(v) {
  if (v === true || v === "eq" || v === "yes") return "#eq";
  if (v === false || v === "moved" || v === "no") return "#moved";
  if (v === "none") return "#none";
  if (v == null || v === "") return "_";
  const s = String(v);
  return s.startsWith("#") ? s : `#${s}`;
}
function renderList(items) {
  if (items.length === 0) return "#[]";
  const body = items.map((x) => needsQuotes(x) ? `"${escapeStr(x)}"` : x).join(" ; ");
  return `#[ ${body} ]`;
}
function renderValue(facet2) {
  const { value, as } = facet2;
  if (value === null || value === void 0 || value === "") return "_";
  const mode = as ?? (typeof value === "boolean" ? "flag" : Array.isArray(value) ? "list" : typeof value === "number" ? "atom" : "atom");
  switch (mode) {
    case "flag":
      return renderFlag(value);
    case "state":
      return renderState(value);
    case "path": {
      const s = String(value);
      return s === "_" ? "_" : `~"${escapeStr(s)}"`;
    }
    case "string":
      return `"${escapeStr(String(value))}"`;
    case "list":
      return renderList(Array.isArray(value) ? value : [String(value)]);
    case "raw":
      return String(value);
    case "atom":
    default: {
      if (Array.isArray(value)) return renderList(value);
      const s = String(value);
      return needsQuotes(s) ? `"${escapeStr(s)}"` : s;
    }
  }
}
function isFacet(p) {
  return "key" in p && typeof p.key === "string";
}
function isGroup(p) {
  return "group" in p && typeof p.group === "string";
}
function collectFacetKeys(parts) {
  const keys = [];
  for (const p of parts) {
    if (isFacet(p)) keys.push(p.key);
  }
  return keys;
}
function emitParts(parts, indentUnit, depth, align, maxKeyPad) {
  const pad2 = " ".repeat(indentUnit * depth);
  const facetKeys = collectFacetKeys(parts);
  const keyWidth = align ? Math.min(maxKeyPad, Math.max(0, ...facetKeys.map((k) => k.length))) : 0;
  const lines = [];
  for (const part of parts) {
    if ("blank" in part && part.blank) {
      if (lines.length && lines[lines.length - 1] !== "") lines.push("");
      continue;
    }
    if (isGroup(part)) {
      lines.push(`${pad2}^["${escapeStr(part.group)}"]{`);
      lines.push(...emitParts(part.parts, indentUnit, depth + 1, align, maxKeyPad));
      lines.push(`${pad2}}`);
      continue;
    }
    if (isFacet(part)) {
      const key = align ? part.key.padEnd(keyWidth) : part.key;
      lines.push(`${pad2}~#${key}: ${renderValue(part)}`);
    }
  }
  return lines;
}
function formatSpwCard(title, parts, options = {}) {
  const indentUnit = options.indent ?? 2;
  const align = options.align === true;
  const maxKeyPad = options.maxKeyPad ?? 16;
  const base = options.baseIndent ?? 0;
  if (options.bodyOnly) {
    return emitParts(parts, indentUnit, base, align, maxKeyPad).join("\n");
  }
  const pad0 = " ".repeat(indentUnit * base);
  const lines = [
    `${pad0}^["${escapeStr(title)}"]{`,
    ...emitParts(parts, indentUnit, base + 1, align, maxKeyPad),
    `${pad0}}`
  ];
  return lines.join("\n");
}
function formatSpwCards(cards) {
  return cards.filter(Boolean).join("\n\n");
}
var facet = {
  flag: (key, v) => ({ key, value: v, as: "flag" }),
  state: (key, v) => ({
    key,
    value: v,
    as: "state"
  }),
  atom: (key, v) => ({ key, value: v, as: "atom" }),
  str: (key, v) => ({
    key,
    value: v && v.length ? v : "_",
    as: v && v.length ? "string" : "atom"
  }),
  path: (key, v) => ({
    key,
    value: v && v.length ? v : "_",
    as: v && v.length ? "path" : "atom"
  }),
  list: (key, items) => ({
    key,
    value: items,
    as: "list"
  }),
  raw: (key, v) => ({ key, value: v, as: "raw" }),
  blank: () => ({ blank: true }),
  group: (name, parts) => ({
    group: name,
    parts
  })
};

// book/scripts/tools/crypto-browser-shim.mjs
function createHash(algorithm) {
  if (algorithm !== "sha256") {
    throw new Error(`[crypto-browser-shim] unsupported algorithm: ${algorithm}`);
  }
  const parts = [];
  return {
    update(data) {
      if (typeof data === "string") {
        parts.push(data);
      } else if (data instanceof Uint8Array) {
        parts.push(new TextDecoder().decode(data));
      } else if (ArrayBuffer.isView(data)) {
        parts.push(new TextDecoder().decode(data));
      } else {
        parts.push(String(data ?? ""));
      }
      return this;
    },
    digest(encoding) {
      const hex = sha256hex(parts.join(""));
      if (encoding === "hex" || encoding == null) {
        return hex;
      }
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < bytes.length; i += 1) {
        bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
      }
      return bytes;
    }
  };
}
function sha256hex(message) {
  const bytes = new TextEncoder().encode(message);
  const padded = pad(bytes);
  const H = new Uint32Array([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);
  const W = new Uint32Array(64);
  for (let i = 0; i < padded.length; i += 64) {
    for (let t = 0; t < 16; t += 1) {
      const o = i + t * 4;
      W[t] = (padded[o] << 24 | padded[o + 1] << 16 | padded[o + 2] << 8 | padded[o + 3]) >>> 0;
    }
    for (let t = 16; t < 64; t += 1) {
      const s0 = rotr(W[t - 15], 7) ^ rotr(W[t - 15], 18) ^ W[t - 15] >>> 3;
      const s1 = rotr(W[t - 2], 17) ^ rotr(W[t - 2], 19) ^ W[t - 2] >>> 10;
      W[t] = W[t - 16] + s0 + W[t - 7] + s1 >>> 0;
    }
    let a = H[0];
    let b = H[1];
    let c = H[2];
    let d = H[3];
    let e = H[4];
    let f = H[5];
    let g = H[6];
    let h = H[7];
    for (let t = 0; t < 64; t += 1) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = e & f ^ ~e & g;
      const temp1 = h + S1 + ch + K[t] + W[t] >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = a & b ^ a & c ^ b & c;
      const temp2 = S0 + maj >>> 0;
      h = g;
      g = f;
      f = e;
      e = d + temp1 >>> 0;
      d = c;
      c = b;
      b = a;
      a = temp1 + temp2 >>> 0;
    }
    H[0] = H[0] + a >>> 0;
    H[1] = H[1] + b >>> 0;
    H[2] = H[2] + c >>> 0;
    H[3] = H[3] + d >>> 0;
    H[4] = H[4] + e >>> 0;
    H[5] = H[5] + f >>> 0;
    H[6] = H[6] + g >>> 0;
    H[7] = H[7] + h >>> 0;
  }
  return [...H].map((n) => n.toString(16).padStart(8, "0")).join("");
}
function pad(bytes) {
  const bitLen = bytes.length * 8;
  const withOne = bytes.length + 1;
  const paddedLen = withOne + 8 + 63 & ~63;
  const out = new Uint8Array(paddedLen);
  out.set(bytes);
  out[bytes.length] = 128;
  const view = new DataView(out.buffer);
  view.setUint32(paddedLen - 4, bitLen >>> 0);
  view.setUint32(paddedLen - 8, Math.floor(bitLen / 4294967296));
  return out;
}
function rotr(n, x) {
  return (n >>> x | n << 32 - x) >>> 0;
}
var K = new Uint32Array([
  1116352408,
  1899447441,
  3049323471,
  3921009573,
  961987163,
  1508970993,
  2453635748,
  2870763221,
  3624381080,
  310598401,
  607225278,
  1426881987,
  1925078388,
  2162078206,
  2614888103,
  3248222580,
  3835390401,
  4022224774,
  264347078,
  604807628,
  770255983,
  1249150122,
  1555081692,
  1996064986,
  2554220882,
  2821834349,
  2952996808,
  3210313671,
  3336571891,
  3584528711,
  113926993,
  338241895,
  666307205,
  773529912,
  1294757372,
  1396182291,
  1695183700,
  1986661051,
  2177026350,
  2456956037,
  2730485921,
  2820302411,
  3259730800,
  3345764771,
  3516065817,
  3600352804,
  4094571909,
  275423344,
  430227734,
  506948616,
  659060556,
  883997877,
  958139571,
  1322822218,
  1537002063,
  1747873779,
  1955562222,
  2024104815,
  2227730452,
  2361852424,
  2428436474,
  2756734187,
  3204031479,
  3329325298
]);

// .spw/_workbench/packages/spw-seed/src/canonical/nest-path.ts
var NEST_PATH_VERSION = "spw.nest_path/1";
var NEST_PATH_ALPHABET = "<>(){}[]";
function shortHash(s) {
  return createHash("sha256").update(s).digest("hex").slice(0, 12);
}
function tokenValue(tok) {
  if (!tok || typeof tok !== "object") return void 0;
  const v = tok.value;
  return typeof v === "string" && v.length > 0 ? v : void 0;
}
function channelLabel(node) {
  const n = node;
  if (n.tag?.value) return n.tag.value;
  if (n.channel?.token?.value != null) return String(n.channel.token.value);
  if (typeof n.channel?.value === "string") return n.channel.value;
  return void 0;
}
function frameParamLabel(node) {
  if (node.type !== "Frame") return void 0;
  const content = node.content;
  if (!Array.isArray(content) || content.length === 0) return void 0;
  const first = content[0];
  if (first?.type === "Parameter" && first.value?.type === "Expression") {
    const terms = first.value.terms ?? [];
    if (terms.length === 1 && terms[0]?.type === "Identifier") {
      return tokenValue(terms[0].token);
    }
    if (terms.length === 1 && terms[0]?.type === "Literal") {
      return tokenValue(terms[0].token);
    }
  }
  return void 0;
}
function containerLabel(node, kind) {
  const n = node;
  if (n.openLabel?.value) return n.openLabel.value;
  if (kind === "scope" && n.name?.value) return n.name.value;
  if (kind === "capsule") return channelLabel(node);
  if (kind === "frame") {
    return frameParamLabel(node) ?? (n.closeLabel?.value || void 0);
  }
  if (n.closeLabel?.value) return n.closeLabel.value;
  return void 0;
}
function asNestNode(node) {
  switch (node.type) {
    case "Frame":
      return {
        kind: "frame",
        glyph: "[]",
        label: containerLabel(node, "frame"),
        children: []
      };
    case "Body":
      return {
        kind: "body",
        glyph: "{}",
        label: containerLabel(node, "body"),
        children: []
      };
    case "Scope":
      return {
        kind: "scope",
        glyph: "()",
        label: containerLabel(node, "scope"),
        children: []
      };
    case "Capsule":
      return {
        kind: "capsule",
        glyph: "<>",
        label: containerLabel(node, "capsule"),
        children: []
      };
    case "Stream":
      return {
        kind: "stream",
        glyph: "<<>>",
        label: containerLabel(node, "stream"),
        children: []
      };
    case "NRange":
      return {
        kind: "nrange",
        glyph: "(())",
        label: containerLabel(node, "nrange"),
        children: []
      };
    case "Operation": {
      const op = node;
      if (op.operator?.value === "<>") {
        return {
          kind: "couple",
          glyph: "<>",
          children: []
        };
      }
      return null;
    }
    default:
      return null;
  }
}
function extractForest(node) {
  const out = [];
  for (const child of getNodeChildren(node)) {
    const nest = asNestNode(child);
    if (nest) {
      nest.children = extractForest(child);
      out.push(nest);
    } else {
      out.push(...extractForest(child));
    }
  }
  return out;
}
function openGlyph(g) {
  switch (g) {
    case "[]":
      return "[";
    case "{}":
      return "{";
    case "()":
      return "(";
    case "<>":
      return "<";
    case "<<>>":
      return "<<";
    case "(())":
      return "((";
  }
}
function closeGlyph(g) {
  switch (g) {
    case "[]":
      return "]";
    case "{}":
      return "}";
    case "()":
      return ")";
    case "<>":
      return ">";
    case "<<>>":
      return ">>";
    case "(())":
      return "))";
  }
}
function formatNode(node, withLabels) {
  const open = openGlyph(node.glyph);
  const close = closeGlyph(node.glyph);
  const lab = withLabels && node.label ? node.label : "";
  const inner = node.children.map((c) => formatNode(c, withLabels)).join("");
  if (node.glyph === "<>") {
    return `<${lab}>${inner}`;
  }
  if (lab) return `${open}${lab}${inner}${close}`;
  return `${open}${inner}${close}`;
}
function formatForest(roots, withLabels) {
  return roots.map((r) => formatNode(r, withLabels)).join("");
}
function collectPaths(node, prefix, withLabels, paths) {
  const open = openGlyph(node.glyph);
  const close = closeGlyph(node.glyph);
  let piece;
  if (node.glyph === "<>") {
    piece = withLabels && node.label ? `<${node.label}>` : "<>";
  } else if (withLabels && node.label) {
    piece = `${open}${node.label}${close}`;
  } else {
    piece = `${open}${close}`;
  }
  const path = prefix + piece;
  paths.push(path);
  for (const c of node.children) {
    collectPaths(c, path, withLabels, paths);
  }
}
function collectLabels(node, out) {
  if (node.label) out.push(node.label);
  for (const c of node.children) collectLabels(c, out);
}
function emptyLattice(parseOk) {
  return {
    version: NEST_PATH_VERSION,
    roots: [],
    skeleton: "",
    labeledSkeleton: "",
    paths: [],
    labeledPaths: [],
    labels: [],
    clusterKey: shortHash(""),
    labeledClusterKey: shortHash(""),
    parseOk
  };
}
function scanNestPaths(sourceOrAst) {
  let root;
  let parseOk = true;
  if (typeof sourceOrAst === "string") {
    const result = parse(sourceOrAst);
    root = result.ast ?? null;
    parseOk = Boolean(result.success && root);
  } else {
    root = sourceOrAst;
    parseOk = root != null;
  }
  if (!root) return emptyLattice(false);
  const roots = extractForest(root);
  const skeleton = formatForest(roots, false);
  const labeledSkeleton = formatForest(roots, true);
  const paths = [];
  const labeledPaths = [];
  const labelBag = [];
  for (const r of roots) {
    collectPaths(r, "", false, paths);
    collectPaths(r, "", true, labeledPaths);
    collectLabels(r, labelBag);
  }
  const labels = [...labelBag].sort();
  return {
    version: NEST_PATH_VERSION,
    roots,
    skeleton,
    labeledSkeleton,
    paths,
    labeledPaths,
    labels,
    clusterKey: shortHash(skeleton),
    labeledClusterKey: shortHash(labeledSkeleton),
    parseOk
  };
}
function multisetDiff2(before, after) {
  const a = [...after];
  const removed = [];
  for (const x of before) {
    const i = a.indexOf(x);
    if (i >= 0) a.splice(i, 1);
    else removed.push(x);
  }
  return { added: a, removed };
}
function nestPathDelta(before, after) {
  const skeletonEqual = before.skeleton === after.skeleton;
  const labeledEqual = before.labeledSkeleton === after.labeledSkeleton;
  const { added: labelsAdded, removed: labelsRemoved } = multisetDiff2(before.labels, after.labels);
  const labelsEqual = labelsAdded.length === 0 && labelsRemoved.length === 0;
  const findings = [];
  if (skeletonEqual) findings.push("nest skeleton equal");
  else findings.push(`nest skeleton ${before.skeleton || "\u2205"} \u2192 ${after.skeleton || "\u2205"}`);
  if (!labelsEqual) {
    if (labelsAdded.length) findings.push(`labels +${labelsAdded.join(",")}`);
    if (labelsRemoved.length) findings.push(`labels -${labelsRemoved.join(",")}`);
  } else if (before.labels.length) {
    findings.push("container labels equal");
  }
  if (skeletonEqual && !labeledEqual) {
    findings.push("nest form holds; labeled skeleton moved (container label rename)");
  }
  return {
    skeletonEqual,
    labeledEqual,
    labelsEqual,
    labelsAdded,
    labelsRemoved,
    beforeSkeleton: before.skeleton,
    afterSkeleton: after.skeleton,
    beforeLabeled: before.labeledSkeleton,
    afterLabeled: after.labeledSkeleton,
    findings
  };
}
function nestPathSpectrum(lattices, top = 24) {
  const counts = /* @__PURE__ */ new Map();
  for (const lat of lattices) {
    for (const p of lat.paths) {
      counts.set(p, (counts.get(p) ?? 0) + 1);
    }
  }
  return [...counts.entries()].map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count || a.path.localeCompare(b.path)).slice(0, top);
}
function formatNestPathSpw(lat) {
  return formatSpwCard("nest_path", [
    facet.group("product", [
      facet.atom("version", lat.version),
      facet.flag("parseOk", lat.parseOk)
    ]),
    facet.group("form", [
      facet.str("skeleton", lat.skeleton || void 0),
      facet.str("labeled", lat.labeledSkeleton || void 0),
      facet.atom("cluster", lat.clusterKey),
      facet.atom("labeledCluster", lat.labeledClusterKey),
      facet.list("labels", lat.labels)
    ])
  ]);
}

// .spw/_workbench/packages/spw-seed/src/canonical/change-report.ts
var CHANGE_REPORT_VERSION = "spw.change_report/1";
var TRIVIA_TYPES = /* @__PURE__ */ new Set(["WHITESPACE", "COMMENT", "EOF"]);
function isTrivia2(t) {
  return TRIVIA_TYPES.has(t.type);
}
function tokenKey(t) {
  return {
    type: t.type,
    value: t.value,
    trivia: isTrivia2(t)
  };
}
function keyEquals(a, b) {
  return a.type === b.type && a.value === b.value;
}
function structuralKeys(tokens) {
  return tokens.filter((t) => !isTrivia2(t)).map(tokenKey);
}
function lcsOps(before, after) {
  const n = before.length;
  const m = after.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
  for (let i2 = 1; i2 <= n; i2++) {
    for (let j2 = 1; j2 <= m; j2++) {
      if (keyEquals(before[i2 - 1], after[j2 - 1])) {
        dp[i2][j2] = dp[i2 - 1][j2 - 1] + 1;
      } else {
        dp[i2][j2] = Math.max(dp[i2 - 1][j2], dp[i2][j2 - 1]);
      }
    }
  }
  const ops = [];
  let i = n;
  let j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && keyEquals(before[i - 1], after[j - 1])) {
      ops.push({ kind: "equal", before: before[i - 1], after: after[j - 1] });
      i--;
      j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      ops.push({ kind: "insert", after: after[j - 1] });
      j--;
    } else if (i > 0) {
      ops.push({ kind: "delete", before: before[i - 1] });
      i--;
    }
  }
  ops.reverse();
  const coalesced = [];
  for (let k = 0; k < ops.length; k++) {
    const cur = ops[k];
    const next = ops[k + 1];
    if (cur.kind === "delete" && next?.kind === "insert") {
      coalesced.push({ kind: "replace", before: cur.before, after: next.after });
      k++;
    } else {
      coalesced.push(cur);
    }
  }
  return coalesced;
}
var SAMPLE_CAP = 24;
function compareLex(before, after) {
  const beforeTokens = lex(before).tokens;
  const afterTokens = lex(after).tokens;
  const bStruct = structuralKeys(beforeTokens);
  const aStruct = structuralKeys(afterTokens);
  const ops = lcsOps(bStruct, aStruct);
  let inserted = 0;
  let deleted = 0;
  let replaced = 0;
  let equal = 0;
  for (const op of ops) {
    switch (op.kind) {
      case "insert":
        inserted++;
        break;
      case "delete":
        deleted++;
        break;
      case "replace":
        replaced++;
        break;
      case "equal":
        equal++;
        break;
    }
  }
  const structuralOps = inserted + deleted + replaced;
  const triviaBefore = beforeTokens.filter(isTrivia2).length;
  const triviaAfter = afterTokens.filter(isTrivia2).length;
  return {
    beforeCount: beforeTokens.length,
    afterCount: afterTokens.length,
    triviaBefore,
    triviaAfter,
    structuralBefore: bStruct.length,
    structuralAfter: aStruct.length,
    inserted,
    deleted,
    replaced,
    equal,
    triviaOnly: structuralOps === 0,
    structuralOps,
    sampleOps: ops.filter((o) => o.kind !== "equal").slice(0, SAMPLE_CAP)
  };
}
function compareAst(before, after) {
  const bProj = extractBraceProjection(before);
  const aProj = extractBraceProjection(after);
  const brace = braceProjectionDelta(bProj, aProj);
  const nestBefore = scanNestPaths(before);
  const nestAfter = scanNestPaths(after);
  const nest = nestPathDelta(nestBefore, nestAfter);
  const findings = [...brace.findings, ...nest.findings];
  if (brace.equal) {
    findings.push("brace path-match equal");
  } else {
    findings.push(`brace severity: ${brace.severity}`);
  }
  const pathMatch = brace.equal && nest.skeletonEqual;
  if (pathMatch) findings.push("nest skeleton path-match");
  return {
    braceEqual: brace.equal,
    brace,
    nestBefore,
    nestAfter,
    nest,
    pathMatch,
    findings
  };
}
function buildChangeReport(before, after, options = {}) {
  const beforeHash = hashString(before).slice(0, 16);
  const afterHash = hashString(after).slice(0, 16);
  const identity = before === after;
  const lexReport = compareLex(before, after);
  const astReport = compareAst(before, after);
  const differential = differentialFromSources(
    before,
    after,
    "change_report",
    "source",
    hashString
  );
  const layoutOnly = !identity && astReport.braceEqual && astReport.nest.skeletonEqual && astReport.nest.labelsEqual && lexReport.structuralOps === 0 && lexReport.triviaOnly;
  const noteParts = [
    options.uri ? `uri=${options.uri}` : "",
    identity ? "identity" : layoutOnly ? "layout-only" : "structural-or-surface",
    `lexOps=${lexReport.structuralOps}`,
    `brace=${astReport.braceEqual ? "eq" : astReport.brace.severity}`,
    `nest=${astReport.nest.skeletonEqual ? "eq" : "moved"}`,
    `labels=${astReport.nest.labelsEqual ? "eq" : "moved"}`
  ].filter(Boolean);
  return {
    version: CHANGE_REPORT_VERSION,
    beforeHash,
    afterHash,
    identity,
    lex: lexReport,
    ast: astReport,
    layoutOnly,
    editSpans: differential.edits.length,
    note: noteParts.join(" \xB7 ")
  };
}
function formatChangeReportSpw(report) {
  const nest = report.ast.nest;
  const labelBits = [
    ...nest.labelsRemoved.map((l) => `-${l}`),
    ...nest.labelsAdded.map((l) => `+${l}`)
  ];
  return formatSpwCard("delta", [
    facet.group("identity", [
      facet.atom("version", report.version),
      facet.atom("before", report.beforeHash),
      facet.atom("after", report.afterHash),
      facet.flag("identity", report.identity),
      facet.flag("layoutOnly", report.layoutOnly),
      facet.atom("editSpans", report.editSpans)
    ]),
    facet.group("lex", [
      facet.atom("ops", report.lex.structuralOps),
      facet.flag("trivia", report.lex.triviaOnly),
      facet.atom("insert", report.lex.inserted),
      facet.atom("delete", report.lex.deleted),
      facet.atom("replace", report.lex.replaced)
    ]),
    facet.group("form", [
      facet.flag("braceEq", report.ast.braceEqual),
      facet.atom("brace", report.ast.brace.severity),
      facet.flag("pathMatch", report.ast.pathMatch),
      facet.state("nest", nest.skeletonEqual),
      facet.str("nestBefore", nest.beforeSkeleton || void 0),
      facet.str("nestAfter", nest.afterSkeleton || void 0),
      facet.str("labeledBefore", nest.beforeLabeled || void 0),
      facet.str("labeledAfter", nest.afterLabeled || void 0),
      facet.state("labels", nest.labelsEqual),
      facet.list("labelDelta", labelBits)
    ]),
    facet.group("note", [facet.str("text", report.note)])
  ]);
}

// .spw/_workbench/packages/spw-seed/src/canonical/stencil.ts
var STENCIL_VERSION = "spw.stencil/1";
var STENCIL_SCHEMA = "spw.stencil/1";
function shortId(parts) {
  return createHash("sha256").update(parts).digest("hex").slice(0, 12);
}
function buildStencilMask(source, options = {}) {
  const nest = scanNestPaths(source);
  const brace = extractBraceProjection(source);
  return {
    nestSkeleton: nest.skeleton,
    braceSignature: brace.signature,
    layoutOnlyCandidate: options.layoutOnlyCandidate ?? false,
    dialect: options.dialect
  };
}
function cutStencil(input) {
  const mask = buildStencilMask(input.source, {
    layoutOnlyCandidate: input.layoutOnlyCandidate,
    dialect: input.dialect
  });
  const id = shortId(
    [
      input.profile,
      input.sequence ?? "",
      (input.rules ?? []).join(","),
      mask.braceSignature,
      mask.nestSkeleton,
      input.result.inputHash,
      input.result.plannedOutputHash
    ].join("|")
  );
  return {
    version: STENCIL_VERSION,
    schema: STENCIL_SCHEMA,
    id,
    profile: input.profile,
    sequence: input.sequence ?? null,
    rules: input.rules?.length ? [...input.rules] : void 0,
    channel: input.channel,
    mask,
    sourceUri: input.sourceUri,
    inputHash: input.result.inputHash,
    plannedHash: input.result.plannedOutputHash,
    transfer: "replan",
    planCeiling: input.planCeiling ?? "effect.l0.measure",
    note: input.note ?? `stencil ${input.profile}` + (input.layoutOnlyCandidate ? " layout-only-candidate" : "") + (input.result.changed ? " would-change" : " fixed-point")
  };
}
function gateStencilMask(stencil, targetSource, mode = "soft") {
  const targetMask = buildStencilMask(targetSource, {
    dialect: stencil.mask.dialect
  });
  const findings = [];
  if (mode === "off") {
    return { ok: true, mode, findings: ["mask gate off \u2014 replan only"], targetMask };
  }
  const braceOk = stencil.mask.braceSignature === targetMask.braceSignature;
  const nestOk = stencil.mask.nestSkeleton === targetMask.nestSkeleton;
  if (!braceOk) findings.push("brace signature mismatch");
  if (!nestOk) findings.push("nest skeleton mismatch");
  if (mode === "strict") {
    const ok2 = braceOk && nestOk;
    if (ok2) findings.push("strict mask match");
    return { ok: ok2, mode, findings, targetMask };
  }
  const ok = braceOk || nestOk;
  if (ok) {
    findings.push(
      braceOk && nestOk ? "soft mask: brace+nest match" : braceOk ? "soft mask: brace match" : "soft mask: nest match"
    );
  } else {
    findings.push("soft mask: neither brace nor nest match \u2014 refuse transfer");
  }
  return { ok, mode, findings, targetMask };
}
function stencilToAutomataConfig(stencil, options = {}) {
  const config = {
    profile: stencil.profile,
    dryRun: options.dryRun ?? false,
    effectCeiling: options.effectCeiling ?? "effect.l1.memory"
  };
  if (stencil.rules?.length) config.enabledRules = stencil.rules;
  return config;
}
function applyStencil(targetSource, stencil, options = {}) {
  const maskMode = options.maskMode ?? "soft";
  const gate = gateStencilMask(stencil, targetSource, maskMode);
  if (!gate.ok) {
    return {
      ok: false,
      refused: gate.findings.join("; "),
      gate
    };
  }
  if (stencil.transfer !== "replan") {
    return {
      ok: false,
      refused: `unsupported transfer mode ${stencil.transfer}`,
      gate
    };
  }
  const result = runMutationAutomata(
    targetSource,
    stencilToAutomataConfig(stencil, {
      dryRun: options.dryRun,
      effectCeiling: options.effectCeiling
    })
  );
  return { ok: true, gate, result };
}
function formatStencilSpw(stencil) {
  return formatSpwCard("stencil", [
    facet.group("product", [
      facet.atom("version", stencil.version),
      facet.atom("id", stencil.id),
      facet.atom("transfer", stencil.transfer),
      facet.atom("ceiling", stencil.planCeiling)
    ]),
    facet.group("program", [
      facet.atom("profile", stencil.profile),
      facet.atom("sequence", stencil.sequence ?? "_"),
      facet.list("rules", stencil.rules ?? []),
      facet.atom("channel", stencil.channel ?? "_")
    ]),
    facet.group("mask", [
      facet.str("nest", stencil.mask.nestSkeleton || void 0),
      facet.str("brace", stencil.mask.braceSignature),
      facet.flag("layoutOnly", stencil.mask.layoutOnlyCandidate),
      facet.atom("dialect", stencil.mask.dialect ?? "_")
    ]),
    facet.group("hashes", [
      facet.atom("input", stencil.inputHash.slice(0, 16)),
      facet.atom("planned", stencil.plannedHash.slice(0, 16)),
      facet.path("donor", stencil.sourceUri)
    ]),
    facet.group("note", [facet.str("text", stencil.note)])
  ]);
}

// .spw/_workbench/packages/spw-seed/src/canonical/composition-forms.ts
var COMPOSITION_FORM_VERSION = "spw.composition_form/1";
function unquote4(value) {
  if (value.startsWith('"') && value.endsWith('"') || value.startsWith("`") && value.endsWith("`") || value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  return value;
}
function termOf(expr) {
  if (!expr?.terms?.length) return void 0;
  if (expr.terms.length === 1) return expr.terms[0];
  return void 0;
}
function isOp(term, value) {
  return !!term && term.type === "Operation" && term.operator?.value === value;
}
function isCapsule(term) {
  return !!term && term.type === "Capsule";
}
function isLiteralString(term) {
  return !!term && term.type === "Literal" && term.token?.type === "STRING";
}
function isPathRef(term) {
  return !!term && term.type === "PathRef";
}
function isScope(term) {
  return !!term && term.type === "Scope";
}
function isHeadBody(term) {
  return !!term && term.type === "Operation" && !!term.body && (term.operator?.value === "!" || term.operator?.value === "?");
}
function headOf(term) {
  return term.operator?.value === "?" ? "?" : "!";
}
function capsuleChannelName(cap) {
  if (cap.tag?.value) return cap.tag.value;
  if (cap.channel?.type === "Identifier") return cap.channel.token?.value;
  if (cap.channel?.type === "Literal") return unquote4(String(cap.channel.token?.value ?? ""));
  const interior = cap.interior;
  if (interior?.expressions?.length === 1) {
    const expr = interior.expressions[0];
    const terms = expr.terms ?? [];
    if (terms.length === 1 && terms[0]?.type === "Identifier") {
      return terms[0].token?.value;
    }
    if (terms.length > 1) {
      const parts = [];
      for (let i = 0; i < terms.length; i++) {
        const t = terms[i];
        if (t?.type === "Identifier") parts.push(t.token.value);
        else if (t?.type === "Literal") parts.push(unquote4(String(t.token.value)));
        else return void 0;
        const conn = expr.connectors?.[i];
        if (conn && i < terms.length - 1) {
          parts.push(conn.value === ".." ? ".." : conn.value);
        }
      }
      if (expr.connectors?.length) {
        let raw = "";
        for (let i = 0; i < terms.length; i++) {
          const t = terms[i];
          if (t.type === "Identifier") raw += t.token.value;
          else if (t.type === "Literal") raw += unquote4(String(t.token.value));
          if (i < (expr.connectors?.length ?? 0)) {
            raw += expr.connectors[i].value;
          }
        }
        return raw || void 0;
      }
      return parts.join("/") || void 0;
    }
  }
  return void 0;
}
function lensFromTerm(term) {
  if (!term) return void 0;
  if (isLiteralString(term)) return unquote4(String(term.token.value));
  if (isPathRef(term)) return unquote4(String(term.path.token.value));
  if (isOp(term, "@") && term.subject) return lensFromTerm(term.subject);
  return void 0;
}
function recognizeCompositionSequence(sequence2) {
  const exprs = sequence2.expressions ?? [];
  if (exprs.length < 2) return null;
  const terms = exprs.map((e) => termOf(e)).filter(Boolean);
  {
    const probe = recognizeConceptualProbe(terms);
    if (probe) return probe;
  }
  {
    const ac = recognizeActConsequence(terms);
    if (ac) return ac;
  }
  return null;
}
function recognizeConceptualProbe(terms) {
  if (terms.length < 2) return null;
  let i = 0;
  let scopedHost = false;
  let host = terms[0];
  if (isScope(host)) {
    scopedHost = true;
    const inner = host.sequence?.expressions?.[0] ? termOf(host.sequence.expressions[0]) : void 0;
    if (!inner) return null;
    host = inner;
    i = 0;
  }
  if (!isCapsule(host) && !isPathRef(host) && host.type !== "Identifier") {
    if (!scopedHost) return null;
  }
  const rest = scopedHost ? terms.slice(1) : terms.slice(1);
  if (rest.length === 0) return null;
  let lens;
  let probe = false;
  let j = 0;
  if (isOp(rest[j], "@")) {
    lens = lensFromTerm(rest[j]);
    if (!lens && rest[j + 1]) {
      lens = lensFromTerm(rest[j + 1]);
      if (lens) j += 1;
    }
    j += 1;
  } else {
    return null;
  }
  if (!lens) return null;
  if (rest[j] && isOp(rest[j], "?")) {
    probe = true;
    j += 1;
  }
  if (j < rest.length) {
    return null;
  }
  return {
    version: COMPOSITION_FORM_VERSION,
    kind: "conceptual_probe",
    host,
    lens,
    probe,
    scopedHost
  };
}
function recognizeActConsequence(terms) {
  if (terms.length < 2) return null;
  let act;
  let scoped = false;
  let consequence;
  if (isHeadBody(terms[0])) {
    act = terms[0];
    consequence = terms[1];
  } else if (isScope(terms[0])) {
    scoped = true;
    const innerExprs = terms[0].sequence?.expressions ?? [];
    const only = innerExprs.length === 1 ? termOf(innerExprs[0]) : void 0;
    if (!isHeadBody(only)) {
      const head = innerExprs.map((e) => termOf(e)).find((t) => isHeadBody(t));
      if (!isHeadBody(head)) return null;
      act = head;
    } else {
      act = only;
    }
    consequence = terms[1];
  } else {
    return null;
  }
  if (!act || !consequence) return null;
  let consequenceName;
  if (isOp(consequence, "~")) {
    if (isCapsule(consequence.subject)) {
      consequenceName = capsuleChannelName(consequence.subject);
    } else if (isPathRef(consequence.subject)) {
      consequenceName = unquote4(
        String(consequence.subject.path?.token?.value ?? "")
      );
    }
  } else if (isPathRef(consequence)) {
    const raw = unquote4(String(consequence.path.token.value));
    if (!raw.includes("/") && !raw.startsWith(".") && !/\.\w+$/.test(raw)) {
      consequenceName = raw;
    } else {
      return null;
    }
  } else {
    return null;
  }
  return {
    version: COMPOSITION_FORM_VERSION,
    kind: "act_consequence",
    act,
    head: headOf(act),
    consequence,
    scoped,
    consequenceName
  };
}
function recognizeCompositionSource(source) {
  const result = parse(source.trim());
  if (!result.success || !result.ast) return null;
  const seed = result.ast;
  const expr = seed.expression;
  if (!expr) return null;
  if (expr.type === "Sequence") {
    return recognizeCompositionSequence(expr);
  }
  if (expr.type === "Expression") {
    return recognizeCompositionSequence({
      type: "Sequence",
      span: expr.span,
      expressions: [expr],
      separators: []
    });
  }
  return null;
}
function hostLabel(host) {
  if (isCapsule(host)) {
    return capsuleChannelName(host) ?? "file";
  }
  if (isPathRef(host)) {
    return unquote4(String(host.path.token.value));
  }
  if (host.type === "Identifier") {
    return host.token.value;
  }
  return "host";
}
function compositionToProduct(form) {
  if (form.kind === "conceptual_probe") {
    return {
      version: COMPOSITION_FORM_VERSION,
      kind: form.kind,
      frames: {
        host: hostLabel(form.host),
        lens: form.lens,
        probe: form.probe,
        scopedHost: form.scopedHost,
        reg: "perspective",
        eval: "within_host_conceptual_space"
      }
    };
  }
  return {
    version: COMPOSITION_FORM_VERSION,
    kind: form.kind,
    frames: {
      head: form.head,
      act: form.head,
      consequence: form.consequenceName ?? "membrane",
      scoped: form.scoped,
      reg: form.head === "?" ? "probe" : "hydrate",
      link: form.head === "?" ? "probe_then_potential_membrane" : "act_then_potential_membrane"
    }
  };
}
function formatCompositionSpw(form) {
  if (form.kind === "conceptual_probe") {
    return formatSpwCard("conceptual_probe", [
      facet.group("geometry", [
        facet.atom("host", hostLabel(form.host)),
        facet.path("lens", form.lens),
        facet.flag("probe", form.probe),
        facet.flag("scoped", form.scopedHost)
      ]),
      facet.group("eval", [
        facet.str("space", "within host membrane"),
        facet.str("lens", "perspective @"),
        facet.str("tail", form.probe ? "probe ?" : "open")
      ])
    ]);
  }
  return formatSpwCard("act_consequence", [
    facet.group("geometry", [
      facet.atom("head", form.head),
      facet.atom("consequence", form.consequenceName ?? "membrane"),
      facet.flag("scoped", form.scoped)
    ]),
    facet.group("link", [
      facet.str(
        "from",
        form.head === "?" ? "probe body" : "discharge body"
      ),
      facet.str("to", "potential membrane"),
      facet.str("not", "PathRef")
    ])
  ]);
}
function actBodySketch(act) {
  const body = act.body;
  const exprs = body?.sequence?.expressions ?? [];
  const parts = [];
  for (const e of exprs.slice(0, 6)) {
    const t = termOf(e);
    if (!t) continue;
    if (t.type === "Identifier") parts.push(t.token.value);
    else if (t.type === "Literal") parts.push(unquote4(String(t.token.value)));
    else parts.push(t.type);
  }
  return parts.join(" ") || "\u2026";
}

// .spw/_workbench/packages/spw-seed/src/canonical/corpus-disclosure.ts
function formatPopulationSpw(rows, options = {}) {
  const limit = options.limit ?? 40;
  const shown = rows.slice(0, limit);
  const among = options.among ?? [];
  const rowParts = shown.map(
    (r) => facet.group("row", [
      facet.path("of", r.file),
      facet.atom("role", r.role),
      facet.atom("lines", r.lines),
      facet.atom("degree", r.inDegree + r.outDegree),
      facet.atom("in", r.inDegree),
      facet.atom("out", r.outDegree),
      facet.atom("pathRefs", r.pathRefs),
      facet.atom("rootRefs", r.rootRefs),
      facet.atom("frames", r.frames),
      facet.str("sigils", r.sigilTop || void 0)
    ])
  );
  return formatSpwCard("population", [
    facet.list("among", among),
    facet.atom("n", rows.length),
    facet.atom("shown", shown.length),
    ...rows.length > shown.length ? [facet.atom("more", rows.length - shown.length)] : [],
    ...rowParts
  ]);
}
function formatTopographySpw(topo, options = {}) {
  const hubLimit = options.hubLimit ?? 12;
  const brokenLimit = options.brokenLimit ?? 24;
  const among = options.among ?? [];
  const hubParts = topo.hubs.slice(0, hubLimit).map(
    (h) => facet.group("hub", [
      facet.path("of", h.id),
      facet.atom("in", h.inDegree),
      facet.atom("out", h.outDegree),
      facet.atom("degree", h.total)
    ])
  );
  const strandParts = topo.strands.slice(0, 12).map(
    (s) => facet.group("strand", [
      facet.atom("id", s.id),
      facet.atom("score", Number(s.score.toFixed(3))),
      facet.str("detail", s.detail.slice(0, 64) || void 0)
    ])
  );
  const broken = topo.brokenTargets.slice(0, brokenLimit);
  const parts = [
    facet.group("product", [
      facet.atom("view", options.label ?? "_"),
      facet.list("among", among),
      facet.atom("files", topo.files),
      facet.atom("links", topo.links),
      facet.flag("cyclic", topo.cyclic),
      facet.atom("under", options.memo ?? "_")
    ])
  ];
  if (topo.cyclic && topo.cycleWitness?.length) {
    parts.push(facet.list("cycle", topo.cycleWitness));
  }
  if (hubParts.length) {
    parts.push(facet.group("hubs", hubParts));
  }
  if (strandParts.length) {
    parts.push(facet.group("strands", strandParts));
  }
  if (broken.length) {
    parts.push(
      facet.group("broken", [
        facet.list("targets", broken),
        ...topo.brokenTargets.length > broken.length ? [facet.atom("more", topo.brokenTargets.length - broken.length)] : []
      ])
    );
  }
  if (topo.orphans.length > 0 && topo.orphans.length <= 24) {
    parts.push(facet.list("orphans", topo.orphans));
  }
  return formatSpwCard("graph", parts);
}
function formatCorpusProductSpw(product, options = {}) {
  const includeRows = options.includeRows !== false;
  const rowLimit = options.rowLimit ?? 24;
  const roleBits = Object.entries(product.stats.byRole).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}:${v}`).join(" ");
  const head = formatSpwCard("corpus", [
    facet.group("product", [
      facet.atom("version", product.version),
      facet.atom("fingerprint", product.fingerprint.slice(0, 16)),
      facet.list("among", product.roots),
      facet.atom("files", product.stats.files),
      facet.atom("lines", product.stats.lines),
      facet.atom("links", product.topography.links),
      facet.flag("cyclic", product.topography.cyclic),
      facet.atom("under", product.memoPlane ?? "fresh"),
      facet.str("roles", roleBits || void 0),
      facet.atom("broken", product.topography.brokenTargets.length)
    ]),
    facet.group("hubs", [
      facet.list(
        "paths",
        product.topography.hubs.slice(0, 8).map((h) => h.id)
      )
    ])
  ]);
  if (!includeRows) return head;
  const pop = formatPopulationSpw(product.population, {
    among: product.roots,
    limit: rowLimit
  });
  return formatSpwCards([head, pop]);
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
      return unquote5(node.path.token.value);
    }
    case "Reference":
      return node.raw ?? void 0;
    case "Identifier":
      return node.token.value;
    case "Literal":
      return unquote5(node.token.value);
    case "Operation": {
      return node.operatorLabel?.value;
    }
    case "Particle":
      return node.name?.value;
    case "Annotation":
      return node.name?.value?.replace(/^\W+/, "");
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
      return unquote5(node.token.value);
    }
    if (node.type === "Reference") return node.raw ?? void 0;
    if (node.type === "PathRef") return unquote5(node.path.token.value);
    queue.push(...getNodeChildren(node));
  }
  return void 0;
}
function unquote5(value) {
  return decodeQuotedToken(value);
}
function matchPattern(node, pattern, depth) {
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
    return matchPattern(candidate.node, selector, candidate.depth) ? evaluation(candidate, selector.placeholder === true) : null;
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

// .spw/_workbench/packages/spw-seed/src/ir/ref.ts
function irRefKey(ref) {
  const segs = [
    `k:${ref.kind}`,
    ref.uri ? `u:${ref.uri}` : "",
    ref.contentHash ? `h:${ref.contentHash}` : "",
    ref.dialect ? `d:${ref.dialect}` : "",
    ref.channel ? `ch:${ref.channel}` : "",
    ref.lens ? `lens:${ref.lens.level}:${ref.lens.id}` : "",
    ref.schema ? `s:${ref.schema}` : "",
    ref.producer ? `p:${ref.producer}` : ""
  ].filter(Boolean);
  return segs.join("|");
}
function irRef(kind, parts = {}) {
  return { kind, ...parts };
}

// .spw/_workbench/packages/spw-seed/src/canonical/patch.ts
var PATCH_VERSION = "spw.patch/1";
var PATCH_SCHEMA = "spw.patch/1";
var PATCH_PRODUCER = "seed.patch";
function hashSource(s) {
  return createHash("sha256").update(s).digest("hex");
}
function shortHash2(s) {
  return hashSource(s).slice(0, 16);
}
function narrativeFromReport(r) {
  return {
    identity: r.identity,
    layoutOnly: r.layoutOnly,
    pathMatch: r.ast.pathMatch,
    nestSkeletonEqual: r.ast.nest.skeletonEqual,
    labelsEqual: r.ast.nest.labelsEqual,
    braceSeverity: r.ast.brace.severity,
    note: r.note
  };
}
function emptyNarrative(identity, note) {
  return {
    identity,
    layoutOnly: false,
    pathMatch: identity,
    nestSkeletonEqual: identity,
    labelsEqual: identity,
    braceSeverity: identity ? "none" : "unknown",
    note
  };
}
function selectionFromSource(source, options = {}) {
  const nest = scanNestPaths(source);
  return {
    uri: options.uri,
    contentHash: options.contentHash ?? shortHash2(source),
    span: options.span,
    selector: options.selector,
    nestSkeleton: options.nestSkeleton ?? nest.skeleton,
    nestLabeled: options.nestLabeled ?? nest.labeledSkeleton,
    nodeTypes: options.nodeTypes
  };
}
function buildPatch(before, after, options = {}) {
  const includeReport = options.includeReport !== false;
  const report = includeReport ? buildChangeReport(before, after, { uri: options.uri }) : void 0;
  const differential = differentialFromSources(
    before,
    after,
    options.ruleId ?? "patch",
    "source",
    hashSource
  );
  const selection = selectionFromSource(before, {
    ...options.selection,
    uri: options.selection?.uri ?? options.uri,
    contentHash: options.selection?.contentHash ?? shortHash2(before)
  });
  const ref = irRef("patch", {
    uri: selection.uri,
    contentHash: shortHash2(
      `${differential.beforeHash}|${differential.afterHash}|${selection.nestSkeleton ?? ""}`
    ),
    dialect: options.dialect,
    channel: options.channel,
    schema: PATCH_SCHEMA,
    producer: PATCH_PRODUCER,
    lens: selection.selector ? {
      level: "frame",
      id: typeof selection.selector === "string" ? selection.selector : "pattern"
    } : selection.span ? { level: "body", id: `${selection.span.start}:${selection.span.end}` } : { level: "file", id: "whole" }
  });
  return {
    version: PATCH_VERSION,
    schema: PATCH_SCHEMA,
    ref,
    selection,
    differential,
    report,
    narrative: report ? narrativeFromReport(report) : emptyNarrative(
      differential.identity,
      differential.identity ? "identity" : `edits=${differential.edits.length}`
    ),
    effectCeiling: options.effectCeiling ?? "effect.l1.memory",
    applyTarget: options.applyTarget ?? "file",
    store: options.store ?? "memory"
  };
}
function buildPatchFromEdits(before, edits, options = {}) {
  const after = applyEdits(before, edits);
  return buildPatch(before, after, {
    ...options,
    ruleId: options.ruleId ?? "patch_edits"
  });
}
function editsIntersectSpan(edit, span) {
  return edit.start < span.end && edit.end > span.start;
}
function nodeSpansFromSelector(source, selector, ast) {
  const root = ast !== void 0 ? ast : parse(source).ast ?? null;
  if (!root) return [];
  const spans = [];
  for (const m of matchAll(root, selector)) {
    spans.push({
      start: m.node.span.start.offset,
      end: m.node.span.end.offset,
      type: m.node.type
    });
  }
  return spans;
}
function filterEditsForSelection(source, edits, selection, ast) {
  if (!selection.span && !selection.selector) {
    return [...edits];
  }
  const zones = [];
  if (selection.span) zones.push(selection.span);
  if (selection.selector && typeof selection.selector !== "string") {
    zones.push(
      ...nodeSpansFromSelector(source, selection.selector, ast).map((s) => ({
        start: s.start,
        end: s.end
      }))
    );
  }
  if (zones.length === 0) {
    return [];
  }
  return edits.filter((e) => zones.some((z) => editsIntersectSpan(e, z)));
}
function applyPatch(source, patch, options = {}) {
  const requireHash = options.requireHashMatch !== false;
  const beforeHash = hashSource(source);
  if (requireHash && beforeHash !== patch.differential.beforeHash) {
    return {
      ok: false,
      source,
      applied: 0,
      skipped: patch.differential.edits.length,
      reason: "beforeHash mismatch \u2014 stale patch or wrong surface"
    };
  }
  const selection = options.selection ?? patch.selection;
  const scoped = filterEditsForSelection(
    source,
    patch.differential.edits,
    selection,
    options.ast
  );
  const skipped = patch.differential.edits.length - scoped.length;
  if (selection.selector && typeof selection.selector === "string" && !selection.span && scoped.length === 0 && patch.differential.edits.length > 0) {
    return {
      ok: false,
      source,
      applied: 0,
      skipped: patch.differential.edits.length,
      reason: "selector is citation-only string; provide SpwPattern or span for node apply"
    };
  }
  if (scoped.length === 0) {
    return {
      ok: true,
      source,
      applied: 0,
      skipped,
      reason: patch.differential.identity ? "identity patch" : "no edits in selection",
      afterHash: shortHash2(source)
    };
  }
  try {
    const next = applyEdits(source, scoped);
    return {
      ok: true,
      source: next,
      applied: scoped.length,
      skipped,
      afterHash: shortHash2(next)
    };
  } catch (err) {
    return {
      ok: false,
      source,
      applied: 0,
      skipped: patch.differential.edits.length,
      reason: err instanceof Error ? err.message : String(err)
    };
  }
}
function applyPatchToFiles(targets, patch, options = {}) {
  return targets.map((t) => ({
    uri: t.uri,
    ...applyPatch(t.source, patch, {
      requireHashMatch: options.requireHashMatch,
      selection: { ...patch.selection, uri: t.uri }
    })
  }));
}
var PatchMemoryBank = class {
  map = /* @__PURE__ */ new Map();
  set(patch, store = "memory") {
    const next = { ...patch, store };
    this.map.set(irRefKey(next.ref), next);
    return next;
  }
  get(ref) {
    const key = typeof ref === "string" ? ref : irRefKey(ref);
    return this.map.get(key);
  }
  delete(ref) {
    const key = typeof ref === "string" ? ref : irRefKey(ref);
    return this.map.delete(key);
  }
  list() {
    return [...this.map.values()];
  }
  clear() {
    this.map.clear();
  }
};
function formatPatchSpw(patch) {
  const n = patch.narrative;
  const sel = patch.selection;
  const span = sel.span != null ? `${sel.span.start}:${sel.span.end}` : void 0;
  return formatSpwCard("patch", [
    facet.group("product", [
      facet.atom("version", patch.version),
      facet.atom("schema", patch.schema),
      facet.str("ref", irRefKey(patch.ref)),
      facet.atom("store", patch.store),
      facet.atom("apply", patch.applyTarget),
      facet.atom("ceiling", patch.effectCeiling)
    ]),
    facet.group("payload", [
      facet.atom("before", patch.differential.beforeHash.slice(0, 16)),
      facet.atom("after", patch.differential.afterHash.slice(0, 16)),
      facet.atom("edits", patch.differential.edits.length),
      facet.flag("identity", n.identity),
      facet.flag("layoutOnly", n.layoutOnly),
      facet.flag("pathMatch", n.pathMatch),
      facet.state("nest", n.nestSkeletonEqual),
      facet.state("labels", n.labelsEqual)
    ]),
    facet.group("selection", [
      facet.path("uri", sel.uri),
      facet.str("nestForm", sel.nestSkeleton || void 0),
      facet.str("nestLabeled", sel.nestLabeled || void 0),
      facet.atom("span", span)
    ]),
    facet.group("note", [facet.str("text", n.note)])
  ]);
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
  const degradations = collectDegradations(source);
  const lessons = buildLessons(braces, operators, nesting, degradations);
  return {
    version: "spw.geometry/1",
    braces,
    operators,
    nesting,
    degradations,
    lessons
  };
}
function collectDegradations(source) {
  const out = [];
  for (const w of parse(source).warnings) {
    const data = w.data;
    if (data?.code !== "prose-degradation") continue;
    out.push({
      line: w.position.line,
      column: w.position.column,
      found: data.found,
      message: data.message ?? "Surface degraded to prose."
    });
  }
  return out;
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
function buildLessons(braces, operators, nesting, degradations) {
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
  if (degradations.length > 0) {
    const where = degradations.slice(0, 3).map((d) => `line ${d.line}${d.found ? ` (${d.found})` : ""}`).join(", ");
    const more = degradations.length > 3 ? `, +${degradations.length - 3} more` : "";
    out.push(
      `${degradations.length} surface${degradations.length === 1 ? "" : "s"} degraded to prose at ${where}${more} \u2014 structure was written but not parsed.`
    );
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
  if (r.degradations.length > 0) {
    lines.push("", "degraded to prose");
    for (const d of r.degradations.slice(0, 12)) {
      lines.push(`  ! ${d.line}:${d.column}  ${d.message}`);
    }
    if (r.degradations.length > 12) {
      lines.push(`  \u2026 +${r.degradations.length - 12} more`);
    }
  }
  lines.push("", "lessons");
  for (const L of r.lessons) lines.push(`  \xB7 ${L}`);
  return lines.join("\n");
}

// .spw/_workbench/packages/spw-seed/src/canonical/flow-protocol.ts
var ROLE_ZERO = () => ({
  flow: 0,
  routine: 0,
  strategy: 0,
  procedure: 0,
  bias: 0,
  probe: 0,
  measure: 0,
  hold: 0,
  unknown: 0
});
function lineOf(source, index) {
  return source.slice(0, index).split("\n").length;
}
function push(units, unit, source) {
  units.push({
    ...unit,
    line: unit.line ?? lineOf(source, unit.index)
  });
}
function scanFlowProtocol(source, moduleId) {
  const units = [];
  const schedules = [];
  const biasAxes = [];
  const hooks = [];
  const roles = ROLE_ZERO();
  const streamRe = /<<([\s\S]*?)>>/g;
  let m;
  while ((m = streamRe.exec(source)) !== null) {
    const inner = m[1] ?? "";
    const hasSeq = inner.includes(";");
    const hasPar = inner.includes("||");
    if (hasSeq || hasPar || /[~?!*^%@#.&$]/.test(inner)) {
      const surface = m[0];
      schedules.push(surface.length > 80 ? `${surface.slice(0, 77)}...` : surface);
      push(
        units,
        {
          role: "flow",
          fixity: "schedule",
          surface,
          index: m.index,
          bound: "stream",
          spacing: "schedule",
          confidence: hasSeq || hasPar ? 0.95 : 0.7,
          note: hasPar ? "parallel||" : hasSeq ? "sequential;" : "stream"
        },
        source
      );
    }
  }
  const biasRe = /=(?:\[([^\]]+)\]|([A-Za-z_][\w]*)\s*\[)/g;
  while ((m = biasRe.exec(source)) !== null) {
    const axis = (m[1] ?? m[2] ?? "").trim();
    if (axis) biasAxes.push(axis);
    const isHook = /^(phi|ceiling|exp|lock|channel|id)\b/i.test(axis) || m[0].startsWith("=phi") || m[0].startsWith("=ceiling") || m[0].startsWith("=exp");
    if (isHook || /phi|ceiling|exp|lock|channel/i.test(m[0])) {
      hooks.push(m[0].slice(0, 40));
    }
    push(
      units,
      {
        role: /phi|strategy|soft|hard/i.test(axis) ? "strategy" : "bias",
        fixity: "prefix",
        sigil: "=",
        surface: m[0],
        index: m.index,
        bound: "frame",
        spacing: "tight",
        confidence: 0.9,
        note: axis ? `axis:${axis}` : void 0
      },
      source
    );
  }
  const probeRe = /!probe\s*\{|\?\["[^"]*"\]\s*\{/g;
  while ((m = probeRe.exec(source)) !== null) {
    push(
      units,
      {
        role: "probe",
        fixity: "prefix",
        sigil: m[0].startsWith("!") ? "!" : "?",
        surface: m[0],
        index: m.index,
        bound: "body",
        spacing: m[0].includes(" ") ? "spaced" : "tight",
        confidence: 0.95
      },
      source
    );
  }
  const measureRe = /\$%?\[[^\]]*\]|%\[([^\]]+)\]/g;
  while ((m = measureRe.exec(source)) !== null) {
    push(
      units,
      {
        role: "measure",
        fixity: "prefix",
        sigil: "%",
        surface: m[0],
        index: m.index,
        bound: "frame",
        spacing: "tight",
        confidence: 0.9
      },
      source
    );
  }
  const procRe = /!(?:[a-zA-Z_][\w]*)?\s*(?:\{|\[)/g;
  while ((m = procRe.exec(source)) !== null) {
    if (m[0].startsWith("!probe")) continue;
    push(
      units,
      {
        role: "procedure",
        fixity: "prefix",
        sigil: "!",
        surface: m[0],
        index: m.index,
        bound: m[0].includes("{") ? "body" : "frame",
        spacing: /\s/.test(m[0]) ? "spaced" : "tight",
        confidence: 0.85
      },
      source
    );
  }
  const routineRe = /\^\s*\[[^\]]*\]\s*\{/g;
  while ((m = routineRe.exec(source)) !== null) {
    push(
      units,
      {
        role: "routine",
        fixity: "prefix",
        sigil: "^",
        surface: m[0],
        index: m.index,
        bound: "body",
        spacing: /\s/.test(m[0].slice(1, 3)) ? "spaced" : "tight",
        confidence: 0.85
      },
      source
    );
  }
  const holdRe = /@\([^)]*\)/g;
  while ((m = holdRe.exec(source)) !== null) {
    push(
      units,
      {
        role: "hold",
        fixity: "prefix",
        sigil: "@",
        surface: m[0],
        index: m.index,
        bound: "scope",
        spacing: "tight",
        confidence: 0.8
      },
      source
    );
  }
  const postRe = /\b([A-Za-z_][\w]*)~/g;
  while ((m = postRe.exec(source)) !== null) {
    push(
      units,
      {
        role: "flow",
        fixity: "postfix",
        sigil: "~",
        surface: m[0],
        index: m.index,
        bound: "none",
        spacing: "tight",
        confidence: 0.75,
        note: "postfix potential"
      },
      source
    );
  }
  const collapseRe = /\*(?:[a-zA-Z_][\w]*)?\s*\{/g;
  while ((m = collapseRe.exec(source)) !== null) {
    push(
      units,
      {
        role: "procedure",
        fixity: "prefix",
        sigil: "*",
        surface: m[0],
        index: m.index,
        bound: "body",
        spacing: /\s/.test(m[0]) ? "spaced" : "tight",
        confidence: 0.85,
        note: "collapse discharge"
      },
      source
    );
  }
  units.sort((a, b) => a.index - b.index);
  for (const u of units) {
    roles[u.role] = (roles[u.role] ?? 0) + 1;
  }
  return {
    id: moduleId,
    units,
    roles,
    schedules: [...new Set(schedules)],
    biasAxes: [...new Set(biasAxes)],
    hooks: [...new Set(hooks)]
  };
}
function formatFlowProtocolSummary(mod) {
  const parts = Object.entries(mod.roles).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]).map(([r, n]) => `${r}\xD7${n}`);
  const sched = mod.schedules.length ? ` schedules=${mod.schedules.length}` : "";
  const bias = mod.biasAxes.length ? ` bias=[${mod.biasAxes.slice(0, 4).join(",")}]` : "";
  return `flow-protocol ${parts.join(" ")}${sched}${bias}`;
}

// .spw/_workbench/packages/spw-seed/src/canonical/geometric-resonance.ts
var WEIGHT_SCHEME_DEFAULT = {
  id: "default",
  description: "Balanced form + flow coupling for general surfaces",
  typeWeights: {
    "op-cooccur": 1,
    "phrase-adjacent": 1,
    "schedule-slot": 1.1,
    "probe-measure": 1.2,
    "bias-pole": 0.9,
    "depth-band": 0.85
  },
  features: {
    frequency: 1,
    proximity: 1,
    schedule: 0.8,
    depth: 0.75,
    probeMeasure: 1,
    bias: 0.7
  },
  floor: 0.12,
  ceiling: 1,
  limit: 48
};
var WEIGHT_SCHEME_AGENT = {
  id: "agent",
  description: "Agent corpus: prefer probe/measure + schedule over op/adjacency noise",
  typeWeights: {
    "op-cooccur": 0.55,
    "phrase-adjacent": 0.75,
    "schedule-slot": 1.25,
    "probe-measure": 1.45,
    "bias-pole": 1.1,
    "depth-band": 0.7
  },
  features: {
    frequency: 0.85,
    proximity: 0.95,
    schedule: 1.1,
    depth: 0.6,
    probeMeasure: 1.2,
    bias: 0.9
  },
  floor: 0.18,
  ceiling: 1,
  limit: 36
};
var WEIGHT_SCHEME_THRIFT = {
  id: "thrift",
  description: "Thrift sense: measure coupling + depth cost as mass pressure",
  typeWeights: {
    "op-cooccur": 0.7,
    "phrase-adjacent": 0.9,
    "schedule-slot": 1,
    "probe-measure": 1.5,
    "bias-pole": 0.8,
    "depth-band": 1.2
  },
  features: {
    frequency: 0.8,
    proximity: 1,
    schedule: 0.9,
    depth: 1.1,
    probeMeasure: 1.3,
    bias: 0.6
  },
  floor: 0.15,
  ceiling: 1,
  limit: 40
};
var WEIGHT_SCHEMES = {
  default: WEIGHT_SCHEME_DEFAULT,
  agent: WEIGHT_SCHEME_AGENT,
  thrift: WEIGHT_SCHEME_THRIFT
};
function resolveWeightScheme(id) {
  if (!id) return WEIGHT_SCHEME_DEFAULT;
  if (typeof id === "object") return id;
  return WEIGHT_SCHEMES[id] ?? WEIGHT_SCHEME_DEFAULT;
}
function portableHash(text) {
  let h = 0xcbf29ce484222325n;
  const prime = 0x100000001b3n;
  for (let i = 0; i < text.length; i++) {
    h ^= BigInt(text.charCodeAt(i));
    h = h * prime & 0xffffffffffffffffn;
  }
  return h.toString(16).padStart(16, "0");
}
function topOperators(report, n = 8) {
  return report.operators.map((r) => ({ op: r.sigil, count: r.count })).filter((r) => r.count > 0).sort((a, b) => b.count - a.count).slice(0, n);
}
function braceKindsMap(report) {
  const out = {};
  for (const [k, n] of Object.entries(report.braces.kinds)) {
    if (n > 0) out[k] = n;
  }
  return out;
}
function braceKindsList(report) {
  return Object.keys(braceKindsMap(report));
}
function compileGeometryBytecode(source, options = {}) {
  const geometry = options.geometry ?? inspectGeometry(source);
  const flow = options.flow ?? scanFlowProtocol(source, options.uri);
  const opCounts = {};
  for (const e of geometry.operators) {
    if (e.count > 0) opCounts[e.sigil] = e.count;
  }
  const opVector = SIGIL_CHARS.map((s) => opCounts[s] ?? 0);
  return {
    version: "spw.geometry.bc/1",
    contentHash: portableHash(source),
    opCounts,
    opVector,
    braceKinds: braceKindsMap(geometry),
    maxDepth: geometry.nesting.maxDepth,
    deepLines: geometry.nesting.deepLines,
    flowRoles: { ...flow.roles },
    unitCount: flow.units.length,
    scheduleCount: flow.schedules.length,
    biasAxisCount: flow.biasAxes.length,
    uri: options.uri
  };
}
function bytecodeOpSimilarity(a, b) {
  const va = a.opVector;
  const vb = b.opVector;
  let dot = 0;
  let na = 0;
  let nb = 0;
  const n = Math.max(va.length, vb.length);
  for (let i = 0; i < n; i++) {
    const x = va[i] ?? 0;
    const y = vb[i] ?? 0;
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}
function clamp(n, floor, ceiling) {
  return Math.min(ceiling, Math.max(floor, n));
}
function applyScheme(raw, scheme, uri) {
  const typeW = scheme.typeWeights[raw.type] ?? 1;
  const feat = raw.features ?? {};
  let featureScore = raw.strength;
  if (Object.keys(feat).length) {
    let acc = 0;
    let wsum = 0;
    for (const [k, v] of Object.entries(feat)) {
      const gain = k in scheme.features ? scheme.features[k] : 1;
      acc += v * gain;
      wsum += gain;
    }
    if (wsum > 0) featureScore = acc / wsum;
  }
  const strength = Math.round(clamp(featureScore * typeW, 0, scheme.ceiling) * 1e3) / 1e3;
  if (strength < scheme.floor) return null;
  return {
    ...raw,
    strength,
    uri: raw.uri ?? uri
  };
}
function detectOpCooccur(ctx) {
  const out = [];
  const { tops } = ctx;
  for (let i = 0; i < tops.length; i++) {
    for (let j = i + 1; j < tops.length; j++) {
      const a = tops[i];
      const b = tops[j];
      const freq = Math.min(1, (a.count + b.count) / 40);
      if (freq < 0.12) continue;
      out.push({
        type: "op-cooccur",
        ends: [a.op, b.op],
        strength: freq,
        features: { frequency: freq },
        evidence: `ops ${a.op}\xD7${a.count} with ${b.op}\xD7${b.count}`
      });
    }
  }
  return out;
}
function detectPhraseAdjacent(ctx) {
  const out = [];
  const { units } = ctx;
  for (let i = 0; i < units.length; i++) {
    for (let j = i + 1; j < units.length; j++) {
      const u = units[i];
      const v = units[j];
      const gap = v.index - (u.index + u.surface.length);
      if (gap < 0 || gap > 80) break;
      if (u.role === v.role && u.role === "unknown") continue;
      const proximity = gap < 8 ? 0.9 : gap < 40 ? 0.55 : 0.3;
      out.push({
        type: "phrase-adjacent",
        ends: [
          `${u.role}:${u.sigil ?? u.surface.slice(0, 12)}`,
          `${v.role}:${v.sigil ?? v.surface.slice(0, 12)}`
        ],
        strength: proximity,
        features: { proximity },
        evidence: `gap=${gap} line~${u.line}`,
        line: u.line
      });
    }
  }
  return out;
}
function detectScheduleSlot(ctx) {
  const out = [];
  const { source, flow, units } = ctx;
  for (const sched of flow.schedules) {
    const idx = source.indexOf(sched);
    if (idx < 0) continue;
    const end = idx + sched.length;
    const inside = units.filter((u) => u.index >= idx && u.index < end);
    for (let i = 0; i < inside.length; i++) {
      for (let j = i + 1; j < inside.length; j++) {
        out.push({
          type: "schedule-slot",
          ends: [inside[i].role, inside[j].role],
          strength: 0.8,
          features: { schedule: 0.8 },
          evidence: "same <<>> schedule",
          line: inside[i].line
        });
      }
    }
  }
  return out;
}
function detectProbeMeasure(ctx) {
  const out = [];
  const { units } = ctx;
  const probes = units.filter((u) => u.role === "probe");
  const measures = units.filter((u) => u.role === "measure");
  for (const p of probes) {
    for (const m of measures) {
      const gap = Math.abs(p.index - m.index);
      if (gap > 120) continue;
      const probeMeasure = gap < 40 ? 0.95 : 0.5;
      out.push({
        type: "probe-measure",
        ends: ["probe", "measure"],
        strength: probeMeasure,
        features: { probeMeasure, proximity: 1 - gap / 120 },
        evidence: `probe\u2194measure gap=${gap}`,
        line: p.line
      });
    }
  }
  return out;
}
function detectBiasPole(ctx) {
  return ctx.flow.biasAxes.map((axis) => ({
    type: "bias-pole",
    ends: ["bias", axis],
    strength: 0.7,
    features: { bias: 0.7 },
    evidence: `axis ${axis}`
  }));
}
function detectDepthBand(ctx) {
  const depth = ctx.geometry.nesting.maxDepth;
  if (depth < 4) return [];
  const depthFeat = Math.min(1, depth / 8);
  return [
    {
      type: "depth-band",
      ends: ["depth", String(depth)],
      strength: depthFeat,
      features: { depth: depthFeat },
      evidence: `maxDepth=${depth}`
    }
  ];
}
var DEFAULT_RESONANCE_DETECTORS = [
  detectOpCooccur,
  detectPhraseAdjacent,
  detectScheduleSlot,
  detectProbeMeasure,
  detectBiasPole,
  detectDepthBand
];
function dedup(resonances) {
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const r of resonances.sort((a, b) => b.strength - a.strength)) {
    const k = `${r.uri ?? ""}|${r.type}|${r.ends[0]}|${r.ends[1]}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  return out;
}
function buildResonanceContext(source, options = {}) {
  const geometry = options.geometry ?? inspectGeometry(source);
  const flow = options.flow ?? scanFlowProtocol(source, options.uri);
  const scheme = resolveWeightScheme(options.scheme);
  const bytecode = compileGeometryBytecode(source, {
    uri: options.uri,
    geometry,
    flow
  });
  return {
    source,
    uri: options.uri,
    geometry,
    flow,
    bytecode,
    tops: topOperators(geometry, 8),
    units: flow.units,
    scheme
  };
}
function runResonanceDetectors(ctx, detectors = DEFAULT_RESONANCE_DETECTORS, scheme = ctx.scheme) {
  const raw = [];
  for (const detect of detectors) {
    raw.push(...detect(ctx));
  }
  const weighted = [];
  for (const r of raw) {
    const next = applyScheme(r, scheme, ctx.uri);
    if (next) weighted.push(next);
  }
  return dedup(weighted).slice(0, scheme.limit);
}
function detectGeometricResonances(source, options = {}) {
  const ctx = buildResonanceContext(source, options);
  const resonances = runResonanceDetectors(ctx);
  const depth = ctx.geometry.nesting.maxDepth;
  return {
    version: "spw.geometry.resonance/1",
    geometry: {
      version: ctx.geometry.version,
      lessons: ctx.geometry.lessons,
      braceKinds: braceKindsList(ctx.geometry),
      topOps: ctx.tops,
      maxDepth: depth
    },
    flow: ctx.flow,
    bytecode: ctx.bytecode,
    scheme: ctx.scheme.id,
    resonances
  };
}
function buildGeometryField(surfaces, options = {}) {
  const scheme = resolveWeightScheme(options.scheme);
  const wantResonance = options.resonance !== false;
  const theme = options.theme?.toLowerCase();
  const floor = options.floor ?? scheme.floor;
  const limit = options.limit ?? Math.max(scheme.limit, 64);
  const simFloor = options.similarityFloor ?? 0.82;
  const cards = [];
  const strandMap = /* @__PURE__ */ new Map();
  const opMerge = {};
  const bytecodes = [];
  for (const s of surfaces) {
    const report = wantResonance ? detectGeometricResonances(s.text, { uri: s.uri, scheme }) : null;
    const bytecode = report?.bytecode ?? compileGeometryBytecode(s.text, { uri: s.uri });
    const flow = report?.flow ?? scanFlowProtocol(s.text, s.uri);
    const roles = { ...flow.roles };
    if (theme) {
      const roleHit = Object.entries(roles).some(
        ([r, n]) => n > 0 && r.toLowerCase().includes(theme)
      );
      const typeHit = report?.resonances.some((r) => r.type.includes(theme) || r.ends.some((e) => e.includes(theme))) ?? false;
      if (!roleHit && !typeHit && theme !== "all") continue;
    }
    for (const [op, n] of Object.entries(bytecode.opCounts)) {
      opMerge[op] = (opMerge[op] ?? 0) + n;
    }
    cards.push({
      uri: s.uri,
      contentHash: bytecode.contentHash,
      bytecode,
      topOps: report?.geometry.topOps ?? topOperators(inspectGeometry(s.text), 6),
      maxDepth: bytecode.maxDepth,
      resonanceCount: report?.resonances.length ?? 0,
      roles
    });
    bytecodes.push(bytecode);
    if (report) {
      for (const r of report.resonances) {
        const key = `${r.type}|${r.ends[0]}|${r.ends[1]}`;
        const prev = strandMap.get(key);
        if (prev) {
          prev.weight = Math.min(scheme.ceiling, prev.weight + r.strength * 0.35);
          if (!prev.surfaces.includes(s.uri)) prev.surfaces.push(s.uri);
        } else {
          strandMap.set(key, {
            type: r.type,
            ends: r.ends,
            weight: r.strength,
            surfaces: [s.uri],
            evidence: r.evidence
          });
        }
      }
    }
  }
  for (let i = 0; i < bytecodes.length; i++) {
    for (let j = i + 1; j < bytecodes.length; j++) {
      const a = bytecodes[i];
      const b = bytecodes[j];
      const sim = bytecodeOpSimilarity(a, b);
      if (sim < simFloor) continue;
      const ua = cards[i]?.uri ?? a.uri ?? `s${i}`;
      const ub = cards[j]?.uri ?? b.uri ?? `s${j}`;
      const key = `op-similarity|${ua}|${ub}`;
      strandMap.set(key, {
        type: "op-similarity",
        ends: [ua, ub],
        weight: sim,
        surfaces: [ua, ub],
        evidence: `op-vector cosine=${sim.toFixed(3)}`
      });
    }
  }
  const strands = [...strandMap.values()].filter((s) => s.weight >= floor).sort((a, b) => b.weight - a.weight || b.surfaces.length - a.surfaces.length).slice(0, limit);
  const fieldOps = Object.entries(opMerge).map(([op, count]) => ({ op, count })).sort((a, b) => b.count - a.count);
  return {
    version: "spw.geometry.field/1",
    scheme: scheme.id,
    surfaces: cards,
    strands,
    fieldOps,
    theme
  };
}
function formatResonanceSummary(report) {
  const top = report.resonances.slice(0, 6).map((r) => `${r.type}:${r.ends.join("\u2194")}=${r.strength.toFixed(2)}`).join(" ");
  return `resonance scheme=${report.scheme} n=${report.resonances.length} bc=${report.bytecode.contentHash} ${top || "\u2014"}`;
}
function formatGeometryFieldSummary(field) {
  const strandPreview = field.strands.slice(0, 5).map((s) => `${s.type}\xD7${s.surfaces.length}@${s.weight.toFixed(2)}`).join(" ");
  return `geometry-field scheme=${field.scheme} surfaces=${field.surfaces.length} strands=${field.strands.length}` + (field.theme ? ` theme=${field.theme}` : "") + (strandPreview ? `  ${strandPreview}` : "");
}
function spwQuote(s) {
  return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}
function formatResonanceAsSpw(report, uri) {
  const edges = report.resonances.slice(0, 16).map((r) => {
    const a = spwQuote(r.ends[0]);
    const b = spwQuote(r.ends[1]);
    return `  .{ type: ${r.type}, strength: ${r.strength}, ends: #[ ${a} ; ${b} ]${r.line != null ? `, line: ${r.line}` : ""} }`;
  }).join("\n");
  const ops = report.geometry.topOps.slice(0, 8).map((o) => `${o.op}\xD7${o.count}`).join(" ; ");
  return [
    `^["resonance"]{`,
    `  scheme: ${report.scheme}`,
    `  bytecode: ${report.bytecode.contentHash}`,
    uri ? `  uri: ~"${uri}"` : null,
    `  depth: ${report.geometry.maxDepth}`,
    `  topOps: #[ ${ops || "_"} ]`,
    `  edges: #[`,
    edges || "    _",
    `  ]`,
    `}`
  ].filter((line) => line != null).join("\n");
}
function formatGeometryFieldAsSpw(field) {
  const surfaces = field.surfaces.slice(0, 20).map(
    (s) => `  .{ uri: ~"${s.uri}", hash: ${s.contentHash.slice(0, 8)}, depth: ${s.maxDepth}, reso: ${s.resonanceCount} }`
  ).join("\n");
  const strands = field.strands.slice(0, 16).map((s) => {
    const a = spwQuote(s.ends[0]);
    const b = spwQuote(s.ends[1]);
    return `  .{ type: ${s.type}, weight: ${s.weight}, ends: #[ ${a} ; ${b} ], n: ${s.surfaces.length} }`;
  }).join("\n");
  const ops = field.fieldOps.slice(0, 10).map((o) => `${o.op}\xD7${o.count}`).join(" ; ");
  return [
    `// geometry-field  scheme=${field.scheme}${field.theme ? `  theme=${field.theme}` : ""}`,
    `^seed[Geometry.Field v:0.1 @profile:Spw.b @intent:workspace_field]`,
    `^["field"]{`,
    `  scheme: ${field.scheme}`,
    field.theme ? `  theme: ${field.theme}` : null,
    `  surfaces: ${field.surfaces.length}`,
    `  strands: ${field.strands.length}`,
    `  ops: #[ ${ops || "_"} ]`,
    `}`,
    `^["surfaces"]{`,
    surfaces || "  _",
    `}`,
    `^["strands"]{`,
    strands || "  _",
    `}`
  ].filter((line) => line != null).join("\n");
}

// .spw/_workbench/packages/spw-seed/src/canonical/geometry-inspect-position.ts
var CHILD_PROPS = [
  "expression",
  "expressions",
  "sequence",
  "terms",
  "frame",
  "body",
  "content",
  "annotations",
  "modifiers",
  "key",
  "value",
  "item",
  "input",
  "arms",
  "pattern",
  "handler",
  "subject",
  "linePayload",
  "operatorLabel",
  "operator",
  "tag",
  "channel",
  "left",
  "right",
  "open",
  "close",
  "sink",
  "name",
  "path",
  "chunks"
];
function isASTNode2(val) {
  return Boolean(
    val && typeof val === "object" && "type" in val && "span" in val
  );
}
function nodeContainsOffset(node, offset) {
  const start = node.span?.start?.offset;
  const end = node.span?.end?.offset;
  if (typeof start !== "number" || typeof end !== "number") return false;
  if (start === end) return offset === start;
  if (offset >= start && offset < end) return true;
  return false;
}
function childCandidates(node) {
  const out = [];
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (isASTNode2(child)) out.push(child);
    }
  }
  for (const prop of CHILD_PROPS) {
    const value = node[prop];
    if (!value) continue;
    if (Array.isArray(value)) {
      for (const child of value) {
        if (isASTNode2(child)) out.push(child);
      }
    } else if (isASTNode2(value)) {
      out.push(value);
    }
  }
  return out;
}
function findNodePathAtOffset(node, offset) {
  const start = node.span?.start?.offset;
  const end = node.span?.end?.offset;
  if (typeof start !== "number" || typeof end !== "number") return [];
  const inNode = offset >= start && (offset < end || offset === end);
  if (!inNode) return [];
  const path = [node];
  const children = childCandidates(node);
  for (let i = children.length - 1; i >= 0; i--) {
    const childPath = findNodePathAtOffsetStrict(children[i], offset);
    if (childPath.length > 0) return [...path, ...childPath];
  }
  return path;
}
function findNodePathAtOffsetStrict(node, offset) {
  if (!nodeContainsOffset(node, offset)) return [];
  const path = [node];
  const children = childCandidates(node);
  for (let i = children.length - 1; i >= 0; i--) {
    const childPath = findNodePathAtOffsetStrict(children[i], offset);
    if (childPath.length > 0) return [...path, ...childPath];
  }
  return path;
}
function findNodeAtOffset(node, offset) {
  const path = findNodePathAtOffset(node, offset);
  return path.length > 0 ? path[path.length - 1] : null;
}
function positionToOffset(source, pos) {
  const lines = source.split("\n");
  let offset = 0;
  for (let i = 0; i < pos.line && i < lines.length; i++) {
    offset += lines[i].length + 1;
  }
  return offset + pos.character;
}
function offsetToPosition(source, offset) {
  const clamped = Math.max(0, Math.min(offset, source.length));
  const lines = source.split("\n");
  let remaining = clamped;
  for (let line = 0; line < lines.length; line++) {
    const lineLen = lines[line].length;
    if (remaining <= lineLen) {
      return { line, character: remaining };
    }
    remaining -= lineLen + 1;
  }
  const last = Math.max(0, lines.length - 1);
  return { line: last, character: lines[last]?.length ?? 0 };
}

// .spw/_workbench/packages/spw-seed/src/canonical/geometry-resolver.ts
function isASTNode3(val) {
  return Boolean(
    val && typeof val === "object" && "type" in val && "span" in val
  );
}
function nodeSpan(node) {
  const start = node?.span?.start?.offset;
  const end = node?.span?.end?.offset;
  if (typeof start !== "number" || typeof end !== "number") return null;
  return { start, end };
}
function readIdentifierLabel(node) {
  if (!node) return null;
  if (node.type === "Identifier") {
    const tokenValue2 = node.token?.value ?? node.value;
    return typeof tokenValue2 === "string" && tokenValue2.length > 0 ? tokenValue2 : null;
  }
  if (node.type === "IDENTIFIER") {
    const value = node.value;
    return typeof value === "string" && value.length > 0 ? value : null;
  }
  return null;
}
function structuralParent(parents) {
  for (let i = parents.length - 1; i >= 0; i--) {
    const p = parents[i];
    if (p.type === "Expression" || p.type === "Sequence") continue;
    return p;
  }
  return void 0;
}
function findAncestor(path, type) {
  for (let i = path.length - 1; i >= 0; i--) {
    if (path[i].type === type) return path[i];
  }
  return void 0;
}
function operatorKind(node) {
  if (!node || node.type !== "Operation") return null;
  const op = node.operator;
  return op?.kind ?? op?.value ?? null;
}
function adjacentPrefixOperator(path, leaf) {
  for (let i = path.length - 1; i >= 1; i--) {
    const seq2 = path[i];
    if (seq2.type !== "Sequence") continue;
    const expressions = seq2.expressions;
    if (!Array.isArray(expressions) || expressions.length < 2) continue;
    const leafOffset = leaf.span?.start?.offset;
    if (typeof leafOffset !== "number") continue;
    let idx = -1;
    for (let e = 0; e < expressions.length; e++) {
      const expr = expressions[e];
      const start = expr.span?.start?.offset;
      const end = expr.span?.end?.offset;
      if (typeof start !== "number" || typeof end !== "number") continue;
      if (leafOffset >= start && leafOffset <= end) {
        idx = e;
        break;
      }
    }
    if (idx <= 0) continue;
    const prev = expressions[idx - 1];
    const prevTerms = prev.terms;
    const term = Array.isArray(prevTerms) ? prevTerms[0] : prev;
    if (isASTNode3(term) && term.type === "Operation") {
      const kind = operatorKind(term);
      if (kind === "@" || kind === "$") return kind;
    }
  }
  return null;
}
function expandSurfaceForPrefixScope(source, path, leaf, prefix) {
  const leafStart = leaf.span?.start?.offset;
  if (typeof leafStart !== "number") return null;
  let at = leafStart - 1;
  while (at >= 0 && /\s/.test(source[at] ?? "")) at--;
  if (source[at] !== "(") return null;
  at--;
  while (at >= 0 && /\s/.test(source[at] ?? "")) at--;
  if (source[at] !== prefix) return null;
  const start = at;
  let end = leaf.span?.end?.offset ?? leafStart;
  while (end < source.length && source[end] !== ")") end++;
  if (source[end] === ")") end++;
  void path;
  return { start, end };
}
function deepestIdentifier(node) {
  const label = readIdentifierLabel(node);
  if (node.type === "Identifier" || node.type === "IDENTIFIER") {
    return label ? node : null;
  }
  let found = null;
  const visit = (n) => {
    if (found) return;
    if (n.type === "Identifier" || n.type === "IDENTIFIER") {
      if (readIdentifierLabel(n)) {
        found = n;
        return;
      }
    }
    for (const key of Object.keys(n)) {
      if (key === "span" || key === "token") continue;
      const value = n[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isASTNode3(child)) visit(child);
        }
      } else if (isASTNode3(value)) {
        visit(value);
      }
    }
  };
  visit(node);
  return found;
}
function pathFromAncestor(ancestor, target) {
  const path = [];
  let found = false;
  const walk4 = (n) => {
    path.push(n);
    if (n === target) return true;
    for (const key of Object.keys(n)) {
      if (key === "span" || key === "token") continue;
      const value = n[key];
      if (Array.isArray(value)) {
        for (const child of value) {
          if (isASTNode3(child) && walk4(child)) return true;
        }
      } else if (isASTNode3(value)) {
        if (walk4(value)) return true;
      }
    }
    path.pop();
    return false;
  };
  found = walk4(ancestor);
  return found ? path : [];
}
function resolveLabelPosition(node, parents) {
  const depth = parents.length;
  const parent = structuralParent(parents);
  const immediate = parents[parents.length - 1];
  const pos = {
    site: "free",
    liminal: "exterior",
    depth
  };
  if ((node.type === "Identifier" || node.type === "IDENTIFIER") && immediate?.type === "Operation") {
    pos.site = "operator_adjacent";
    pos.liminal = "aperture";
    return pos;
  }
  if (node.type === "Identifier" || node.type === "IDENTIFIER") {
    if (parent?.type === "Parameter" || findAncestor([...parents, node], "Parameter")) {
      const frame = findAncestor([...parents, node], "Frame");
      pos.site = "frame_param";
      pos.liminal = "chamber";
      if (frame) pos.boundary = "frame";
      return pos;
    }
    if (parent?.type === "Binding" || immediate?.type === "Binding") {
      const binding = parent?.type === "Binding" ? parent : immediate;
      const key = binding.key;
      if (key && (key === node || readIdentifierLabel(key) === readIdentifierLabel(node))) {
        pos.site = "facet_key";
        pos.liminal = "chamber";
        if (findAncestor(parents, "Body")) pos.boundary = "body";
        return pos;
      }
    }
    if (parent?.type === "Capsule" || findAncestor(parents, "Capsule")) {
      const capsule = parent?.type === "Capsule" ? parent : findAncestor(parents, "Capsule");
      const tag = capsule?.tag;
      if (tag && (tag === node || readIdentifierLabel(tag) === readIdentifierLabel(node))) {
        pos.site = "capsule_tag";
        pos.liminal = "membrane";
        pos.boundary = "capsule";
        return pos;
      }
    }
    if (parent?.type === "Annotation" || findAncestor(parents, "Annotation")) {
      pos.site = "register_meta";
      pos.liminal = "published";
      return pos;
    }
    if (parent?.type === "Reference") {
      pos.site = "ref_handle";
      pos.liminal = "published";
      return pos;
    }
    if (findAncestor(parents, "Scope")) {
      const prefix = adjacentPrefixOperator(parents, node);
      if (prefix === "@") {
        pos.site = "ref_handle";
        pos.liminal = "published";
        pos.boundary = "scope";
        return pos;
      }
      if (prefix === "$") {
        pos.site = "register_meta";
        pos.liminal = "published";
        return pos;
      }
    }
    if (parent?.type === "Operation") {
      pos.site = "operator_adjacent";
      pos.liminal = "aperture";
      return pos;
    }
    if (parent?.type === "PathRef" || findAncestor(parents, "PathRef")) {
      pos.site = "path_node";
      pos.liminal = "exterior";
      return pos;
    }
  }
  if (node.type === "Literal") {
    if (parent?.type === "PathRef" || findAncestor(parents, "PathRef")) {
      pos.site = "path_node";
      pos.liminal = "exterior";
    }
    const frame = findAncestor(parents, "Frame");
    const op = findAncestor(parents, "Operation");
    if (frame && op && operatorKind(op) === "^") {
      pos.site = "header";
      pos.liminal = "published";
      pos.boundary = "body";
    }
  }
  if (node.type === "Annotation") {
    pos.site = "register_meta";
    pos.liminal = "published";
  } else if (node.type === "Frame") {
    pos.site = "frame_param";
    pos.liminal = node.children && node.children.length > 0 ? "chamber" : "void";
    pos.boundary = "frame";
  } else if (node.type === "Body") {
    pos.site = "interior_term";
    pos.liminal = node.children && node.children.length > 0 ? "chamber" : "void";
    pos.boundary = "body";
  } else if (node.type === "Operation" && operatorKind(node)) {
    const label = node.operatorLabel;
    if (label) {
      pos.site = "operator_adjacent";
      pos.liminal = "aperture";
    }
  }
  if (node.children && node.children.length > 0) {
    if (pos.liminal === "void") pos.liminal = "chamber";
  }
  return pos;
}
function resolveLabelContext(path, source) {
  if (path.length === 0) {
    return {
      label: null,
      position: { site: "free", liminal: "exterior", depth: 0 },
      surface: null,
      node: null,
      path
    };
  }
  let leaf = path[path.length - 1];
  let parents = path.slice(0, -1);
  if (leaf.type === "Operation") {
    const opLabel = leaf.operatorLabel;
    if (opLabel) {
      const label2 = readIdentifierLabel(opLabel) ?? opLabel.value ?? null;
      return {
        label: label2 ?? null,
        position: {
          site: "operator_adjacent",
          liminal: "aperture",
          depth: path.length
        },
        surface: nodeSpan(leaf),
        node: leaf,
        path
      };
    }
  }
  if (leaf.type === "OPERATOR" || leaf.type === "Operation") {
    const op = leaf.type === "Operation" ? leaf : parents[parents.length - 1];
    if (op?.type === "Operation") {
      const opLabel = op.operatorLabel;
      if (opLabel) {
        return {
          label: readIdentifierLabel(opLabel) ?? opLabel.value ?? null,
          position: {
            site: "operator_adjacent",
            liminal: "aperture",
            depth: path.length
          },
          surface: nodeSpan(op),
          node: op,
          path
        };
      }
    }
  }
  if (leaf.type === "Scope") {
    const interior = deepestIdentifier(leaf);
    if (interior) {
      const innerPath = pathFromAncestor(leaf, interior);
      if (innerPath.length > 0) {
        path = [...parents, ...innerPath];
        parents = path.slice(0, -1);
        leaf = path[path.length - 1];
      }
    }
  }
  let position = resolveLabelPosition(leaf, parents);
  let label = readIdentifierLabel(leaf);
  let surface = nodeSpan(leaf);
  let node = leaf;
  if (!label && leaf.type === "Literal") {
    const raw = leaf.token?.value ?? leaf.value;
    if (typeof raw === "string") {
      label = raw.replace(/^["'`]|["'`]$/g, "");
    }
  }
  if (position.site === "operator_adjacent") {
    const op = leaf.type === "Operation" ? leaf : findAncestor(path, "Operation");
    if (op) {
      node = op;
      surface = nodeSpan(op);
      if (!label) {
        const opLabel = op.operatorLabel;
        label = readIdentifierLabel(opLabel) ?? opLabel?.value ?? null;
      }
      position = {
        site: "operator_adjacent",
        liminal: "aperture",
        depth: path.length
      };
    }
  } else if (position.site === "frame_param") {
    const frame = findAncestor(path, "Frame") ?? (leaf.type === "Frame" ? leaf : void 0);
    if (frame) {
      node = frame;
      surface = nodeSpan(frame);
      position = {
        ...position,
        site: "frame_param",
        boundary: "frame",
        liminal: position.liminal === "exterior" ? "chamber" : position.liminal
      };
    }
  } else if (position.site === "ref_handle") {
    const expanded = expandSurfaceForPrefixScope(source, path, leaf, "@");
    if (expanded) surface = expanded;
    position = {
      site: "ref_handle",
      liminal: "published",
      boundary: "scope",
      depth: path.length
    };
  } else if (position.site === "register_meta") {
    const expanded = expandSurfaceForPrefixScope(source, path, leaf, "$");
    if (expanded) surface = expanded;
    position = {
      site: "register_meta",
      liminal: "published",
      depth: path.length
    };
  } else if (position.site === "capsule_tag") {
    const capsule = findAncestor(path, "Capsule");
    if (capsule) {
      node = capsule;
      surface = nodeSpan(capsule);
    }
  } else if (position.site === "header") {
    const op = findAncestor(path, "Operation");
    if (op && operatorKind(op) === "^") {
      node = op;
      const body = op.body;
      const start = op.span?.start?.offset;
      const end = body?.span?.end?.offset ?? op.span?.end?.offset;
      if (typeof start === "number" && typeof end === "number") {
        surface = { start, end };
      }
    }
  } else if (position.site === "facet_key") {
    const binding = findAncestor(path, "Binding");
    const body = findAncestor(path, "Body");
    const op = findAncestor(path, "Operation");
    if (op && operatorKind(op) === "." && body) {
      node = op;
      const start = op.span?.start?.offset;
      const end = body.span?.end?.offset;
      if (typeof start === "number" && typeof end === "number") surface = { start, end };
    } else if (binding) {
      node = binding;
      surface = nodeSpan(binding);
    }
  } else if (position.site === "free" && label) {
    surface = nodeSpan(leaf);
  }
  if (position.site === "free" && label) {
    const prefix = adjacentPrefixOperator(path, leaf);
    if (prefix === "@") {
      position = {
        site: "ref_handle",
        liminal: "published",
        boundary: "scope",
        depth: path.length
      };
      surface = expandSurfaceForPrefixScope(source, path, leaf, "@") ?? surface;
    } else if (prefix === "$") {
      position = {
        site: "register_meta",
        liminal: "published",
        depth: path.length
      };
      surface = expandSurfaceForPrefixScope(source, path, leaf, "$") ?? surface;
    }
  }
  return {
    label,
    position,
    surface,
    node,
    path
  };
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
function matchPattern2(pos, pattern) {
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
  return MOBILITY_RULES.filter((r) => matchPattern2(pos, r.from));
}
function rulesTo(pos) {
  return MOBILITY_RULES.filter((r) => matchPattern2(pos, r.to));
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
      start: offsetToPosition2(input.source, startOffset),
      end: offsetToPosition2(input.source, endOffset)
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
function offsetToPosition2(source, offset) {
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
      const pad2 = " ".repeat(size);
      newSlice = lines.map((l) => l.length ? pad2 + l : l).join("\n");
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
var EXCLUDE = ["node_modules", "dist", "_workbench", ".git", ".spw/gen"];
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
    dialectColumn: true,
    bytecodeHash: false,
    labels: false,
    biasAxes: false,
    skipDerivedAndGen: true,
    maxFiles: 200,
    concurrency: 4,
    excludeSubstrings: [...EXCLUDE]
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
    dialectColumn: true,
    bytecodeHash: true,
    labels: true,
    biasAxes: true,
    skipDerivedAndGen: true,
    maxFiles: 2e3,
    concurrency: 8,
    excludeSubstrings: [...EXCLUDE]
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
    dialectColumn: true,
    bytecodeHash: true,
    labels: true,
    biasAxes: true,
    skipDerivedAndGen: true,
    maxFiles: 0,
    concurrency: 8,
    excludeSubstrings: [...EXCLUDE]
  }
};
var INDEX_TRADEOFFS = {
  minimal: "Navigation-only: pathRefs + dialect column. Misses concepts, labels, geometry.",
  standard: "Default: path refs, annotations, op census, bytecode hash, labels, bias axes. No full ONF.",
  full: "Parse-heavy: brace signatures, ONF products, stream meta. Audits / offline invent."
};
function resolveIndexConfig(depthOrPartial) {
  if (!depthOrPartial) return { ...INDEX_PRESETS.standard };
  if (typeof depthOrPartial === "string") {
    return { ...INDEX_PRESETS[depthOrPartial] };
  }
  const base = INDEX_PRESETS[depthOrPartial.depth ?? "standard"];
  return { ...base, ...depthOrPartial, version: "spw.index/1" };
}
function applyDialectIndexBias(config, bias) {
  if (!bias || bias === config.depth) return config;
  const from = INDEX_PRESETS[bias];
  return {
    ...config,
    depth: rankDepth(config.depth) >= rankDepth(bias) ? config.depth : bias,
    braceGeometry: config.braceGeometry || from.braceGeometry,
    onfProducts: config.onfProducts || from.onfProducts,
    streamMeta: config.streamMeta || from.streamMeta,
    bytecodeHash: config.bytecodeHash || from.bytecodeHash,
    labels: config.labels || from.labels,
    biasAxes: config.biasAxes || from.biasAxes
  };
}
function rankDepth(d) {
  return d === "minimal" ? 0 : d === "standard" ? 1 : 2;
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

// .spw/_workbench/packages/spw-seed/src/canonical/semantic-edit.ts
var DEFAULT_CEILING = "effect.l2.workspace";
function nodeOffsets(node) {
  return { start: node.span.start.offset, end: node.span.end.offset };
}
function planSemanticEdits(source, rules, options = {}) {
  const ceiling = options.ceiling ?? DEFAULT_CEILING;
  const ast = options.ast !== void 0 ? options.ast : parse(source).ast ?? null;
  const plan = { edits: [], conflicts: [], withheld: [], matched: 0 };
  if (!ast) return plan;
  const proposed = [];
  for (const rule of rules) {
    if (!effectGradeAtMost(rule.effectGrade, ceiling)) {
      plan.withheld.push({
        ruleId: rule.id,
        effectGrade: rule.effectGrade,
        reason: `demands ${rule.effectGrade}, ceiling is ${ceiling}`
      });
      continue;
    }
    for (const match of matchAll(ast, rule.select)) {
      plan.matched += 1;
      const rewrite = rule.rewrite(match.node, source, ast);
      if (!rewrite) continue;
      const range = rewrite.range ?? nodeOffsets(match.node);
      if (range.end < range.start) continue;
      if (source.slice(range.start, range.end) === rewrite.newText) continue;
      proposed.push({
        start: range.start,
        end: range.end,
        newText: rewrite.newText,
        ruleId: rule.id,
        stratum: rule.stratum,
        reason: rewrite.reason,
        nodeType: match.node.type,
        effectGrade: rule.effectGrade
      });
    }
  }
  return { ...plan, ...partitionOverlaps(proposed) };
}
function partitionOverlaps(proposed) {
  const ordered = [...proposed].sort((a, b) => a.start - b.start || a.end - b.end);
  const edits = [];
  const conflicts = [];
  let group = [];
  let groupEnd = -1;
  const flush = () => {
    if (group.length === 1) edits.push(group[0]);
    else if (group.length > 1) {
      conflicts.push({
        reason: `${group.length} edits claim overlapping ranges`,
        edits: group
      });
    }
    group = [];
  };
  for (const edit of ordered) {
    if (group.length > 0 && edit.start < groupEnd) {
      group.push(edit);
      groupEnd = Math.max(groupEnd, edit.end);
      continue;
    }
    flush();
    group = [edit];
    groupEnd = edit.end;
  }
  flush();
  return { edits, conflicts };
}
function applySemanticPlan(source, plan) {
  return applyEdits(source, plan.edits);
}
function renamedMarkText(sourceText, to) {
  return sourceText.replace(/[A-Za-z_]\w*$/, to);
}
function nameRange(node) {
  const name = node.name;
  if (!name) return null;
  return { start: name.span.start.offset, end: name.span.end.offset };
}
function renameMark(from, to) {
  return {
    id: `rename_mark:${from}\u2192${to}`,
    description: `Rename annotation mark ${from} to ${to}`,
    select: { nodeType: "Annotation", value: from },
    stratum: "reference",
    effectGrade: "effect.l2.workspace",
    rewrite(node, source) {
      const range = nameRange(node);
      if (!range) return null;
      return {
        range,
        newText: renamedMarkText(source.slice(range.start, range.end), to),
        reason: `mark ${from} renamed to ${to}`
      };
    }
  };
}
function renameParticle(aim, from, to) {
  return {
    id: `rename_particle:#${aim}${from}\u2192${to}`,
    description: `Rename ${aim === ">" ? "anchor" : aim === ":" ? "case" : "mood"} ${from} to ${to}`,
    select: { nodeType: "Particle", aim, value: from },
    stratum: "reference",
    effectGrade: "effect.l2.workspace",
    rewrite(node, source) {
      const range = nameRange(node);
      if (!range) return null;
      return {
        range,
        newText: renamedMarkText(source.slice(range.start, range.end), to),
        reason: `#${aim}${from} renamed to #${aim}${to}`
      };
    }
  };
}

// .spw/_workbench/packages/spw-seed/src/canonical/derived-marks.ts
function rewrap(currentSlice, value) {
  const quote = currentSlice[0];
  if ((quote === '"' || quote === "'" || quote === "`") && currentSlice.endsWith(quote)) {
    return `${quote}${value}${quote}`;
  }
  return value;
}
function deriveMark(name, derive) {
  return {
    id: `derive_mark:${name}`,
    description: `Refresh ${name} from the surface`,
    select: { nodeType: "Annotation", value: name },
    stratum: "source",
    // Recomputing a summary of the document is a workspace edit like any other.
    effectGrade: "effect.l2.workspace",
    rewrite(node, source, root) {
      const value = node.value;
      if (value?.type !== "Literal") return null;
      const span = value.span;
      const derived = derive({ node, root, source });
      if (derived === null) return null;
      const raw = source.slice(span.start.offset, span.end.offset);
      const lead = raw.length - raw.trimStart().length;
      return {
        range: { start: span.start.offset + lead, end: span.end.offset },
        newText: rewrap(raw.slice(lead), derived),
        reason: `${name} derived from the surface`
      };
    }
  };
}
function findFrameBody(root, label) {
  const stack = [root];
  while (stack.length > 0) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }
    if (!node || typeof node !== "object") continue;
    const typed = node;
    if (typed.type === "Operation" && typed.operator?.value === "^") {
      if (frameLabelOf(typed) === label) {
        return typed.body ?? null;
      }
    }
    for (const key of Object.keys(typed)) {
      if (key === "span" || key === "token") continue;
      stack.push(typed[key]);
    }
  }
  return null;
}
function frameLabelOf(operation) {
  const frame = operation.frame;
  if (!frame) return null;
  const stack = [frame];
  while (stack.length > 0) {
    const node = stack.pop();
    if (Array.isArray(node)) {
      stack.push(...node);
      continue;
    }
    if (!node || typeof node !== "object") continue;
    const typed = node;
    if (typed.type === "Literal") {
      const raw = typed.token?.value ?? "";
      return raw.replace(/^["'`]|["'`]$/g, "");
    }
    for (const key of Object.keys(typed)) {
      if (key === "span" || key === "token") continue;
      stack.push(typed[key]);
    }
  }
  return null;
}
function countOps(frameLabel2, operator2) {
  return ({ root }) => {
    const body = findFrameBody(root, frameLabel2);
    if (!body) return null;
    let count = 0;
    const stack = [body];
    while (stack.length > 0) {
      const node = stack.pop();
      if (Array.isArray(node)) {
        stack.push(...node);
        continue;
      }
      if (!node || typeof node !== "object") continue;
      const typed = node;
      if (typed.type === "Operation" && typed.operator?.value === operator2) {
        count += 1;
      }
      for (const key of Object.keys(typed)) {
        if (key === "span" || key === "token") continue;
        stack.push(typed[key]);
      }
    }
    return String(count);
  };
}
var TIMESTAMP = /\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}/g;
function findFrameRegionByTokens(source, label) {
  const sig = significantTokens(parse(source).tokens);
  for (let i = 0; i < sig.length; i += 1) {
    if (sig[i].type !== "OPERATOR" || sig[i].kind !== "^") continue;
    let j = i + 1;
    if (sig[j]?.type === "CONTAINER_OPEN" && sig[j]?.kind === "[") j += 1;
    const nameTok = sig[j];
    const name = nameTok && (nameTok.type === "STRING" || nameTok.type === "IDENTIFIER") ? nameTok.value.replace(/^["'`]|["'`]$/g, "") : null;
    if (name !== label) continue;
    while (j < sig.length && !(sig[j].type === "CONTAINER_OPEN" && sig[j].kind === "{")) j += 1;
    const open = sig[j];
    if (!open) continue;
    let depth = 0;
    for (let k = j; k < sig.length; k += 1) {
      const tok = sig[k];
      if (tok.type === "CONTAINER_OPEN" && tok.kind === "{") depth += 1;
      else if (tok.type === "CONTAINER_CLOSE" && tok.kind === "}") {
        depth -= 1;
        if (depth === 0) {
          return { start: open.span.end.offset, end: tok.span.start.offset };
        }
      }
    }
  }
  return null;
}
function latestTimestamp(frameLabel2) {
  return ({ source }) => {
    const region = findFrameRegionByTokens(source, frameLabel2);
    if (!region) return null;
    const text = source.slice(region.start, region.end);
    const stamps = text.match(TIMESTAMP);
    if (!stamps || stamps.length === 0) return null;
    return stamps.map((s) => s.replace("T", " ")).sort().at(-1) ?? null;
  };
}

// .spw/_workbench/packages/spw-seed/src/canonical/catalog.ts
var MEDIAL_CAPSULE_CHANNELS = [
  { name: "couples", description: "entanglement / resonance relation", category: "relational" },
  { name: "resonates", description: "soft geometric or protocol couple", category: "relational" },
  { name: "depends-on", description: "dependency graph edge", category: "structural" },
  { name: "contains", description: "structural containment edge", category: "structural" },
  { name: "bounds", description: "boundary / constraint envelope", category: "structural" },
  { name: "maps-to", description: "functional transformation mapping", category: "semantic" },
  { name: "implements", description: "specification fulfillment edge", category: "semantic" },
  { name: "refines", description: "specification refinement edge", category: "semantic" },
  { name: "projects", description: "view / projection of a form", category: "semantic" },
  { name: "cites", description: "pathref / handle citation", category: "semantic" },
  { name: "scheduled", description: "stream / schedule timing channel", category: "temporal" },
  { name: "affects", description: "mutation vector or state effect", category: "semantic" }
];
var VALENCE_PARTICLES = {
  boon: { name: "boon", role: "growth / implemented", description: "Expansive growth, completed deliverable, positive outcome" },
  bane: { name: "bane", role: "hazard / error", description: "Destructive hazard, blocking issue, error state" },
  bone: { name: "bone", role: "scaffold / partial", description: "Structural scaffold, partial implementation, incomplete" },
  bonk: { name: "bonk", role: "conflict / interruption", description: "Boundary collision, interruption, unexpected conflict" },
  honk: { name: "honk", role: "signal / telemetry", description: "High-priority signal, announcement, telemetry alert" }
};
var TEMPLATE_SLOTS = [
  { name: "label", description: "frame or facet identifier" },
  { name: "path", description: "tilde path reference payload" },
  { name: "profile", description: "dialect / surface profile id" },
  { name: "intent", description: "seed intent phrase" },
  { name: "subject", description: "@self or subject path" },
  { name: "scheme", description: "measure or resonance weight scheme" },
  { name: "channel", description: "stability or medial channel id" },
  { name: "claim", description: "falsifiable assertion text" },
  { name: "from", description: "source origin (bias / edge)" },
  { name: "to", description: "target destination (bias / edge)" },
  { name: "id", description: "stable handle id" },
  { name: "grade", description: "effect grade or ceiling" }
];
var SIGIL_SNIPPET_CATALOG = {
  "^": [
    { label: '^["section"] {', insert: '^["${1:section}"] {\n	$0\n}', detail: "frame container" },
    { label: "^seed[name]", insert: "^seed[${1:Name} v:0.1 @profile:Spw.${2:b} @intent:${3:sketch}]", detail: "seed declaration" }
  ],
  "!": [
    { label: '!boon["label"]', insert: '!boon["${1:label}"]', detail: "boon valence (growth)" },
    { label: '!bane["label"]', insert: '!bane["${1:label}"]', detail: "bane valence (hazard)" },
    { label: '!bone["label"]', insert: '!bone["${1:label}"]', detail: "bone valence (scaffold)" },
    { label: '!bonk["label"]', insert: '!bonk["${1:label}"]', detail: "bonk valence (conflict)" },
    { label: '!honk["label"]', insert: '!honk["${1:label}"]', detail: "honk valence (signal)" },
    { label: "!probe{ }", insert: "!probe{ =id[${1:p1}] }", detail: "named probe" }
  ],
  "#": [
    { label: "##>prompt_root", insert: "##>${1:prompt_root}", detail: "prompt-root navigation landmark" },
    { label: "#>anchor", insert: "#>${1:anchor}", detail: "navigation anchor" },
    { label: "#:lens", insert: "#:${1:lens}", detail: "conceptual axis / case particle" },
    { label: "#!intent", insert: "#!${1:intent}", detail: "action orientation / mood particle" }
  ],
  "?": [
    { label: '?["question"]', insert: '?["${1:question}"]{\n	$0\n}', detail: "probe question block" }
  ],
  "~": [
    { label: "~#trait: value", insert: "~#${1:trait}: ${2:value}", detail: "concise aspect trait" },
    { label: '~"path"', insert: '~"${1:path}"', detail: "local path reference" }
  ],
  "&": [
    { label: "& => {&}", insert: "& => {&}", detail: "confluence wrap step" },
    { label: "&[label]", insert: "&[${1:label}]", detail: "subject reference" }
  ],
  "%": [
    { label: "%mass{ }", insert: "%mass{ lines: ${1:0}, bytes: ${2:0} }", detail: "thrift mass facet" },
    { label: "%[measure]", insert: "%[${1:measure.path}]", detail: "scalar observation" }
  ],
  "*": [
    { label: "*variant", insert: "*${1:variant}", detail: "collapse / variant" }
  ],
  "$": [
    { label: '$["selector"]', insert: '$["${1:selector}"]', detail: "selector query" },
    { label: '$~"path"', insert: '$~"${1:path}"', detail: "select pathref (follow)" },
    { label: "$%[register]", insert: "$%[${1:register.path}]", detail: "register state query" }
  ],
  "=": [
    { label: "=bias[axis]", insert: "=${1:axis}[ ${2:id} ]{ ${3:_} }", detail: "bias / schedule axis" },
    { label: "@dialect:", insert: "@dialect:Spw.${1:b}", detail: "dialect mark" }
  ],
  "<": [
    { label: "left<couples>right", insert: "${1:left}<couples>${2:right}", detail: "medial couple (Spw-native)" },
    { label: "left<depends-on>right", insert: "${1:a}<depends-on>${2:b}", detail: "medial dependency" },
    { label: "left<maps-to>right", insert: "${1:from}<maps-to>${2:to}", detail: "medial mapping" }
  ]
};

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
  const head = parts.join(" ");
  const frame = expr.frame ? describeFrame(expr.frame) : "";
  const body = expr.body ? `{${describeBody(expr.body)}}` : "";
  const scope = expr.scope ? describeScope(expr.scope) : "";
  const capsule = expr.capsule ? describeCapsule(expr.capsule) : "";
  return `${head}${frame}${body}${scope}${capsule}`;
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
var CORPUS_PRODUCT_VERSION = "spw.corpus/1";
var CORPUS_PRODUCT_SCHEMA = "spw.corpus/1";
function topSigils(sigils, n = 3) {
  return Object.entries(sigils).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([k, v]) => `${k}${v}`).join(" ");
}
function degreeMapsFromTopo(topo) {
  const inDegree = /* @__PURE__ */ new Map();
  const outDegree = /* @__PURE__ */ new Map();
  for (const node of topo.graph.nodes) {
    inDegree.set(node, 0);
    outDegree.set(node, 0);
  }
  for (const edge of topo.graph.edges) {
    outDegree.set(edge.from, (outDegree.get(edge.from) ?? 0) + 1);
    inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
  }
  for (const hub of topo.hubs) {
    inDegree.set(hub.id, hub.inDegree);
    outDegree.set(hub.id, hub.outDegree);
  }
  return { inDegree, outDegree };
}
function populationRoleOf(file, hubs, orphans, inDegree, outDegree) {
  if (hubs.has(file)) return "hub";
  if (orphans.has(file)) return "orphan";
  if (outDegree === 0 && inDegree > 0) return "leaf";
  if (inDegree === 0 && outDegree > 0) return "source";
  return "node";
}
function buildPopulation(signals, topo) {
  const hubSet = new Set(topo.hubs.map((h) => h.id));
  const orphanSet = new Set(topo.orphans);
  const degree = degreeMapsFromTopo(topo);
  return signals.map((signal) => {
    const inDegree = degree.inDegree.get(signal.file) ?? 0;
    const outDegree = degree.outDegree.get(signal.file) ?? 0;
    return {
      file: signal.file,
      lines: signal.lineCount,
      pathRefs: signal.pathRefCount,
      rootRefs: signal.rootRefCount,
      frames: signal.frameCount,
      annotations: signal.annotationHints,
      sigilTop: topSigils(signal.sigils, 3),
      role: populationRoleOf(signal.file, hubSet, orphanSet, inDegree, outDegree),
      inDegree,
      outDegree
    };
  }).sort((a, b) => a.file.localeCompare(b.file));
}
function populationStats(rows) {
  const byRole = {};
  let lines = 0;
  let pathRefs = 0;
  let rootRefs = 0;
  let frames = 0;
  for (const row of rows) {
    lines += row.lines;
    pathRefs += row.pathRefs;
    rootRefs += row.rootRefs;
    frames += row.frames;
    byRole[row.role] = (byRole[row.role] ?? 0) + 1;
  }
  return { files: rows.length, lines, pathRefs, rootRefs, frames, byRole };
}
function sortPopulation(rows, key) {
  const copy = [...rows];
  const refCount = (row) => row.pathRefs + row.rootRefs;
  const degreeSum = (row) => row.inDegree + row.outDegree;
  copy.sort((a, b) => {
    switch (key) {
      case "lines":
        return b.lines - a.lines || a.file.localeCompare(b.file);
      case "refs":
        return refCount(b) - refCount(a) || a.file.localeCompare(b.file);
      case "frames":
        return b.frames - a.frames || a.file.localeCompare(b.file);
      case "sigils":
        return b.sigilTop.length - a.sigilTop.length || a.file.localeCompare(b.file);
      case "degree":
        return degreeSum(b) - degreeSum(a) || a.file.localeCompare(b.file);
      default:
        return a.file.localeCompare(b.file);
    }
  });
  return copy;
}
function filterPopulation(rows, role) {
  if (!role || role === "all") return rows;
  return rows.filter((row) => row.role === role);
}
function buildCorpusProduct(input) {
  const population = input.population ?? buildPopulation(input.signals, input.topography);
  return {
    version: CORPUS_PRODUCT_VERSION,
    schema: CORPUS_PRODUCT_SCHEMA,
    fingerprint: input.fingerprint,
    roots: [...input.roots],
    hubTop: input.hubTop,
    resolvePaths: input.resolvePaths,
    indexDepth: input.indexDepth,
    scannedAt: input.scannedAt ?? (/* @__PURE__ */ new Date()).toISOString(),
    links: input.links,
    signals: input.signals,
    topography: input.topography,
    population,
    stats: populationStats(population),
    memoHit: input.memoHit,
    memoPlane: input.memoPlane ?? "fresh"
  };
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
  const significant = significantTokens(tokens);
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
      const token2 = significant[index];
      if (token2.type === "CONTAINER_OPEN" && token2.kind === "{") {
        depth += 1;
      } else if (token2.type === "CONTAINER_CLOSE" && token2.kind === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
      bodyTokens.push(token2);
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
      relativePath: unquote6(pathToken.value)
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
    return brace2?.type === "CONTAINER_OPEN" && brace2.kind === "{" ? { name: unquote6(next.value), bodyStartIndex: index + 2 } : null;
  }
  if (next.type !== "CONTAINER_OPEN" || next.kind !== "[") return null;
  const label = tokens[index + 2];
  const close = tokens[index + 3];
  const brace = tokens[index + 4];
  if ((label?.type === "STRING" || label?.type === "IDENTIFIER") && close?.type === "CONTAINER_CLOSE" && close.kind === "]" && brace?.type === "CONTAINER_OPEN" && brace.kind === "{") {
    return { name: unquote6(label.value), bodyStartIndex: index + 4 };
  }
  return null;
}
function unquote6(value) {
  return value.replace(/^["'`]|["'`]$/g, "");
}

// .spw/_workbench/packages/spw-seed/src/derived-surface.ts
var DERIVED_SPW_KINDS = ["expanded"];
var DERIVED_RE = new RegExp(`\\.(${DERIVED_SPW_KINDS.join("|")})\\.spw$`);
var SPW_GEN_ROOT = ".spw/gen";
var SPW_GEN_KINDS = [
  "atlas",
  "geometry",
  "field",
  "resonance",
  "cycle",
  "session",
  "index"
];
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
function isGenPath(name) {
  const p = name.replace(/\\/g, "/");
  return p.includes("/.spw/gen/") || p.startsWith(".spw/gen/") || p === ".spw/gen";
}
function genSurfacePath(kind, stem2, ext = ".spw") {
  const clean = stem2.replace(/^\/+/, "").replace(/\\/g, "/");
  const withExt = clean.endsWith(ext) || /\.[a-z0-9]+$/i.test(clean) ? clean : clean + ext;
  return `${SPW_GEN_ROOT}/${kind}/${withExt}`;
}
function shouldSkipCorpusSurface(name) {
  return isDerivedSurface(name) || isGenPath(name);
}

// .spw/_workbench/packages/spw-seed/src/ir/kinds.ts
var IR_KINDS = [
  "preprocess",
  "lex",
  "parse",
  "onf",
  "stack",
  "identity",
  "form",
  "graph",
  /** Multi-file population (census IR) — rows + roles over a root set. */
  "population",
  /** Full corpus collate product (population + topography + links). */
  "corpus",
  "attention",
  "bias",
  "measure",
  "probe",
  "resonance",
  "selection",
  "plan",
  /** Patch product — selection + differential + narrative (apply under ceiling). */
  "patch",
  "stream",
  "precipitate",
  "cache",
  "algo",
  "opt",
  "envelope",
  "kb",
  "flow",
  "phrase",
  "charge"
];
var IR_EDGE_KINDS = [
  "produces",
  // A → B: stage output
  "consumes",
  // A ← B: input dependency
  "projects",
  // A → view of B
  "resonates",
  // soft geometric/event couple
  "precipitates",
  // stage fallout
  "optimizes",
  // rewrite/memo channel
  "traverses",
  // crawl/lens walk
  "gates",
  // channel forbids/allows
  "cites"
  // pathRef / =exp / bias
];

// .spw/_workbench/packages/spw-seed/src/ir/field-brands.ts
function asContentHash(value) {
  return castToBrand(value);
}
function asRequestEpoch(value) {
  return castToBrand(value);
}
function asSessionBeat(value) {
  return castToBrand(value);
}
function asProducerSchema(value) {
  return castToBrand(value);
}

// .spw/_workbench/packages/spw-seed/src/ir/lens.ts
function makeLens(level, id, extra = {}) {
  return { level, id, ...extra };
}
function openOptChannel(id, on, extra = {}) {
  return { id, on, enabled: true, ...extra };
}
var DEFAULT_OPT_CHANNELS = [
  openOptChannel("phrase_opt", ["phrase", "form", "flow"], {
    scheme: "thrift",
    via: ["optimizes", "projects"]
  }),
  openOptChannel("path_memo", ["graph", "selection"], {
    via: ["traverses", "cites"],
    budget: { nodes: 4096 }
  }),
  openOptChannel("parse_reuse", ["parse", "lex", "preprocess"], {
    via: ["produces", "consumes"]
  }),
  openOptChannel("precipitate_cite", ["precipitate", "onf", "parse"], {
    via: ["precipitates", "projects"]
  }),
  /** Pipe/frame labels as rewrite anchors — expertise reward for named structure. */
  openOptChannel("label_opt", ["phrase", "form", "identity"], {
    scheme: "default",
    via: ["optimizes", "cites"],
    cacheFragment: "label"
  }),
  /** =bias axes reorder attention / neighbor rank. */
  openOptChannel("bias_rank", ["bias", "flow", "attention"], {
    via: ["optimizes", "resonates"],
    cacheFragment: "bias"
  }),
  openOptChannel("schedule_opt", ["flow", "stream"], {
    via: ["resonates", "projects"],
    cacheFragment: "schedule"
  }),
  openOptChannel("probe_opt", ["probe", "measure", "resonance"], {
    scheme: "thrift",
    via: ["resonates", "optimizes"],
    cacheFragment: "probe"
  })
];

// .spw/_workbench/packages/spw-seed/src/ir/graph.ts
function emptyInterconnect(lenses) {
  return {
    schema: "spw.ir.interconnect/1",
    nodes: {},
    edges: [],
    lenses,
    optChannels: lenses?.optChannels ? [...lenses.optChannels] : void 0,
    effects: lenses?.effects ? [...lenses.effects] : void 0
  };
}
function putNode(graph, node) {
  const key = irRefKey(node.ref);
  graph.nodes[key] = node;
  return key;
}
function link(graph, kind, from, to, extra) {
  const fromKey = typeof from === "string" ? from : irRefKey(from);
  const toKey = typeof to === "string" ? to : irRefKey(to);
  const edge = { kind, from: fromKey, to: toKey, ...extra };
  graph.edges.push(edge);
  return edge;
}
function neighbors(graph, key, edgeKind, direction = "out") {
  const out = [];
  for (const e of graph.edges) {
    if (edgeKind && e.kind !== edgeKind) continue;
    if (direction !== "in" && e.from === key && graph.nodes[e.to]) {
      out.push(graph.nodes[e.to]);
    }
    if (direction !== "out" && e.to === key && graph.nodes[e.from]) {
      out.push(graph.nodes[e.from]);
    }
  }
  return out;
}
function enableOpt(graph, channel) {
  const list = graph.optChannels ? [...graph.optChannels] : [];
  const i = list.findIndex((c) => c.id === channel.id);
  if (i >= 0) list[i] = { ...channel, enabled: true };
  else list.push({ ...channel, enabled: true });
  graph.optChannels = list;
}
function pushEffect(graph, effect) {
  graph.effects = [...graph.effects ?? [], effect];
}
function interconnectSummary(graph) {
  const kinds = {};
  for (const n of Object.values(graph.nodes)) {
    kinds[n.ref.kind] = (kinds[n.ref.kind] ?? 0) + 1;
  }
  const edgeKinds = {};
  for (const e of graph.edges) {
    edgeKinds[e.kind] = (edgeKinds[e.kind] ?? 0) + 1;
  }
  return {
    nodeCount: Object.keys(graph.nodes).length,
    edgeCount: graph.edges.length,
    kinds,
    edgeKinds,
    openOpts: (graph.optChannels ?? []).filter((c) => c.enabled).map((c) => c.id)
  };
}

// .spw/_workbench/packages/spw-seed/src/ir/build.ts
function buildSurfaceInterconnect(input) {
  const g = emptyInterconnect(input.lenses);
  const base = {
    uri: input.uri,
    contentHash: input.contentHash,
    dialect: input.dialect ?? input.stack?.dialect,
    channel: input.channel
  };
  const identityKey = putNode(g, {
    ref: irRef("identity", { ...base, producer: "surface" }),
    label: input.uri
  });
  if (input.stack) {
    const k = putNode(g, {
      ref: irRef("stack", base),
      data: input.stack,
      label: input.stack.dialect
    });
    link(g, "projects", identityKey, k);
    link(g, "produces", k, identityKey, { note: "stack feeds card" });
  }
  if (input.form) {
    const k = putNode(g, {
      ref: irRef("form", base),
      data: input.form
    });
    link(g, "projects", identityKey, k);
  }
  if (input.flow) {
    const k = putNode(g, {
      ref: irRef("flow", base),
      data: {
        roles: input.flow.roles,
        schedules: input.flow.schedules,
        biasAxes: input.flow.biasAxes
      }
    });
    link(g, "projects", identityKey, k);
    link(g, "resonates", k, identityKey, { note: "protocol roles" });
  }
  if (input.phrases && Object.keys(input.phrases).length) {
    const k = putNode(g, {
      ref: irRef("phrase", base),
      data: input.phrases
    });
    link(g, "projects", identityKey, k);
    if (input.lenses?.optChannels?.some((c) => c.id === "phrase_opt" && c.enabled)) {
      link(g, "optimizes", k, identityKey, { note: "phrase_opt open" });
    }
    if (input.lenses?.optChannels?.some((c) => c.id === "label_opt" && c.enabled)) {
      link(g, "optimizes", k, identityKey, { note: "label_opt open" });
    }
  }
  if (input.bytecode) {
    const k = putNode(g, {
      ref: irRef("form", { ...base, producer: "bytecode" }),
      data: input.bytecode,
      label: input.bytecode.contentHash
    });
    link(g, "projects", identityKey, k);
    if (input.lenses?.optChannels?.some((c) => c.id === "parse_reuse" && c.enabled)) {
      link(g, "optimizes", k, identityKey, { note: "bytecode cache key" });
    }
  }
  if (input.resonance && input.resonance.edges.length) {
    const k = putNode(g, {
      ref: irRef("resonance", base),
      data: {
        scheme: input.resonance.scheme,
        n: input.resonance.edges.length,
        edges: input.resonance.edges.slice(0, 16)
      },
      label: input.resonance.scheme
    });
    link(g, "resonates", identityKey, k, { note: "geometric resonance" });
    if (input.lenses?.optChannels?.some((c) => c.id === "probe_opt" && c.enabled)) {
      link(g, "optimizes", k, identityKey, { note: "probe_opt open" });
    }
  }
  if (input.biasAxes && input.biasAxes.length) {
    const k = putNode(g, {
      ref: irRef("bias", base),
      data: { axes: input.biasAxes },
      label: input.biasAxes.slice(0, 4).join(",")
    });
    link(g, "projects", identityKey, k);
    if (input.lenses?.optChannels?.some((c) => c.id === "bias_rank" && c.enabled)) {
      link(g, "optimizes", k, identityKey, { note: "bias_rank open" });
    }
  }
  if (input.labels && input.labels.length) {
    const k = putNode(g, {
      ref: irRef("phrase", { ...base, producer: "labels" }),
      data: { labels: input.labels },
      label: `${input.labels.length} labels`
    });
    link(g, "cites", identityKey, k, { note: "label anchors" });
  }
  if (input.selection) {
    const k = putNode(g, {
      ref: irRef("selection", { channel: input.channel }),
      data: input.selection
    });
    link(g, "consumes", identityKey, k);
  }
  if (input.cache) {
    const k = putNode(g, {
      ref: irRef("cache", { ...base, producer: input.cache.key }),
      data: input.cache
    });
    link(g, "projects", identityKey, k);
    if (input.cache.hit) {
      link(g, "optimizes", k, identityKey, { note: "cache hit" });
    }
  }
  for (const p of input.precipitates ?? []) {
    const k = putNode(g, {
      ref: irRef("precipitate", { ...base, producer: p.stage }),
      data: p,
      label: p.stage
    });
    link(g, "precipitates", identityKey, k, { note: p.delta });
  }
  return g;
}

// .spw/_workbench/packages/spw-seed/src/ir/granularity.ts
var DEPTH_RANK = {
  skim: 0,
  card: 1,
  field: 2,
  full: 3
};
var PLANE_RANK = {
  source: 0,
  bytecode: 1,
  resonance: 2,
  interconnect: 3,
  eval: 4
};
var DIALECT_GRAIN = {
  "Spw.b": {
    depth: "card",
    plane: "resonance",
    follow: "soft",
    resonanceScheme: "default",
    indexDepth: "standard",
    volatility: 0.25,
    resonanceLimit: 32
  },
  "Spw.l": {
    depth: "skim",
    plane: "bytecode",
    follow: "point",
    resonanceScheme: "default",
    indexDepth: "minimal",
    volatility: 0.35,
    resonanceLimit: 16
  },
  "Spw.m": {
    depth: "full",
    plane: "interconnect",
    follow: "soft",
    resonanceScheme: "thrift",
    indexDepth: "full",
    volatility: 0.2,
    resonanceLimit: 40
  },
  "Spw.x": {
    depth: "card",
    plane: "eval",
    follow: "hard",
    resonanceScheme: "thrift",
    indexDepth: "standard",
    volatility: 0.55,
    resonanceLimit: 40
  },
  "Spw.q": {
    depth: "skim",
    plane: "bytecode",
    follow: "hard",
    resonanceScheme: "default",
    indexDepth: "standard",
    volatility: 0.3,
    resonanceLimit: 16
  },
  "Spw.f": {
    depth: "card",
    plane: "resonance",
    follow: "soft",
    resonanceScheme: "agent",
    indexDepth: "standard",
    volatility: 0.4,
    resonanceLimit: 36
  },
  "Spw.p": {
    depth: "card",
    plane: "resonance",
    follow: "soft",
    resonanceScheme: "agent",
    indexDepth: "standard",
    volatility: 0.7,
    resonanceLimit: 24
  },
  "Spw.t": {
    depth: "skim",
    plane: "source",
    follow: "point",
    resonanceScheme: "default",
    indexDepth: "minimal",
    volatility: 0.6,
    resonanceLimit: 12
  }
};
var CHANNEL_VOLATILITY = {
  stable: 0.15,
  trial: 0.35,
  draft: 0.5,
  live: 0.45,
  experimental: 0.75,
  consumer: 0.25,
  ocean: 0.8
};
var FALLBACK = DIALECT_GRAIN["Spw.b"];
function resolveGranularity(input = {}) {
  const d = DIALECT_GRAIN[input.dialect ?? ""] ?? FALLBACK;
  const chVol = CHANNEL_VOLATILITY[input.channel ?? ""] ?? 0.3;
  let follow = input.follow ?? d.follow;
  if (input.consumerMode === "mounted-consumer" && !input.follow && follow === "hard") {
    follow = "soft";
  }
  if (!input.follow && (input.channel === "live" || input.channel === "experimental") && (input.dialect === "Spw.x" || input.dialect === "Spw.q")) {
    follow = "hard";
  }
  let plane = input.plane ?? d.plane;
  let depth = input.depth ?? d.depth;
  if (plane === "eval" && DEPTH_RANK[depth] < DEPTH_RANK.card) depth = "card";
  if (plane === "field") depth = "field";
  if (plane === "resonance" && DEPTH_RANK[depth] < DEPTH_RANK.card) depth = "card";
  if (depth === "skim" && !input.plane) {
    plane = "bytecode";
  }
  const volatility = Math.min(
    1,
    Math.max(0, (input.depth ? d.volatility : d.volatility) * 0.6 + chVol * 0.4)
  );
  const baseLimit = input.resonanceLimit ?? d.resonanceLimit;
  const resonanceLimit = Math.max(
    8,
    Math.round(baseLimit * (1 - volatility * 0.35))
  );
  let disclose = input.disclose ?? "spw";
  if (input.consumerMode === "biome-regional" && !input.disclose) disclose = "spw";
  return {
    version: "spw.granularity/1",
    depth,
    plane,
    follow,
    disclose,
    resonanceLimit,
    resonanceScheme: input.resonanceScheme ?? d.resonanceScheme,
    indexDepth: d.indexDepth,
    volatility
  };
}
function grainWantsResonance(g) {
  return PLANE_RANK[g.plane] >= PLANE_RANK.resonance && DEPTH_RANK[g.depth] >= DEPTH_RANK.card;
}
function grainWantsEval(g) {
  return g.plane === "eval" || g.depth === "full";
}
function grainWantsInterconnect(g) {
  return PLANE_RANK[g.plane] >= PLANE_RANK.interconnect || g.depth === "full";
}
function formatGranularityAsSpw(g) {
  return `^["granularity"]{ depth: ${g.depth}, plane: ${g.plane}, follow: ${g.follow}, disclose: ${g.disclose}, scheme: ${g.resonanceScheme}, limit: ${g.resonanceLimit}, volatility: ${g.volatility.toFixed(2)} }`;
}

// .spw/_workbench/packages/spw-seed/src/ir/cache-layer.ts
var CACHE_LAYER_SURFACE = "cache.layer/1";
var CACHE_PLANES = [
  "editor_probe_cache",
  "lsp_session_reflection",
  "runtime_cache",
  "corpus_memo"
];
var CACHE_LAYER_DEFAULTS = {
  editor_probe_cache: {
    source: "editor-local TTL probe cache",
    omission: "this host does not keep an editor probe cache"
  },
  lsp_session_reflection: {
    source: "language-server session reflection",
    omission: "no LSP session in this process",
    next: "open a Spw file in an editor with spw-lsp"
  },
  runtime_cache: {
    source: "hot-session evaluate/inspect cache",
    omission: "runtime cache not sampled here",
    next: "spw inspect cache <file.spw>"
  },
  corpus_memo: {
    source: "corpus product memo",
    omission: "corpus memo not sampled here",
    next: "spw census --json"
  }
};
function omitCacheLayer(plane, overrides = {}) {
  const fallback = CACHE_LAYER_DEFAULTS[plane];
  return {
    surface: CACHE_LAYER_SURFACE,
    plane,
    present: false,
    source: overrides.source ?? fallback.source,
    omission: overrides.omission ?? fallback.omission,
    next: overrides.next ?? fallback.next
  };
}
function presentCacheLayer(plane, source, stats) {
  return {
    surface: CACHE_LAYER_SURFACE,
    plane,
    present: true,
    source,
    stats
  };
}
function assembleCacheLayers(present = {}) {
  return CACHE_PLANES.map((plane) => {
    const filled = present[plane];
    return filled ? presentCacheLayer(plane, filled.source, filled.stats) : omitCacheLayer(plane);
  });
}
function formatCacheLayerLines(layers) {
  const lines = [`# ${CACHE_LAYER_SURFACE}`, ""];
  for (const layer of layers) {
    lines.push(`## ${layer.plane}`);
    lines.push(`present: ${layer.present}`);
    lines.push(`source: ${layer.source}`);
    if (!layer.present && layer.omission) lines.push(`omission: ${layer.omission}`);
    if (layer.next) lines.push(`next: ${layer.next}`);
    if (layer.stats) {
      const stats = Object.entries(layer.stats).filter(([, value]) => value !== void 0).map(([key, value]) => `${key}=${value}`).join(" ");
      if (stats) lines.push(stats);
    }
    lines.push("");
  }
  return lines;
}

// .spw/_workbench/packages/spw-seed/src/ir/refactor-plan.ts
var REFACTOR_PLAN_SURFACE = "spw.refactor.plan/1";
var REFACTOR_PLAN_OMISSIONS = [
  "selection_hashes",
  "parent_plan",
  "worktree_apply",
  "rebase"
];
function buildRefactorPlanCard(input) {
  const mode = input.write ? "write" : "plan";
  const effect = input.write ? "effect.l2.workspace" : "effect.l0.measure";
  const next = [];
  if (!input.write && input.totalEdits > 0 && input.renameSpecs?.length) {
    next.push(`spw refactor . ${input.renameSpecs.map((spec) => `--rename ${spec}`).join(" ")} --write`);
  }
  return {
    surface: REFACTOR_PLAN_SURFACE,
    mode,
    effect,
    write: input.write,
    rules: input.rules,
    files: input.report.length,
    totalEdits: input.totalEdits,
    totalConflicts: input.totalConflicts,
    omitted: [...REFACTOR_PLAN_OMISSIONS],
    next,
    report: input.report
  };
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
    const token2 = this.peek();
    this.position += 1;
    return token2;
  }
  expect(type) {
    const token2 = this.peek();
    if (token2.type !== type) {
      throw new SelectorParseError(`Expected ${type}, got ${token2.type}`, token2.offset);
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
    const token2 = this.peek();
    if (token2.type === "query") {
      this.advance();
      return this.parseQueryAtom();
    }
    if (token2.type === "any") {
      this.advance();
      return anyNode();
    }
    if (token2.type === "lparen") {
      this.advance();
      const selector = this.parseExpression();
      this.expect("rparen");
      return selector;
    }
    if (token2.type === "modifier") {
      this.advance();
      return { modifier: token2.value };
    }
    if (token2.type === "sigil") return this.parseSigilPattern(false);
    if (token2.type === "boundary") return this.parseBoundaryPattern();
    throw new SelectorParseError(`Unexpected token ${token2.type}`, token2.offset);
  }
  parseQueryAtom() {
    const token2 = this.peek();
    if (token2.type === "placeholder" || token2.type === "any") {
      this.advance();
      return token2.type === "placeholder" ? { any: true, placeholder: true } : anyNode();
    }
    if (token2.type === "sigil") return this.parseSigilPattern(true);
    if (token2.type === "boundary") return this.parseBoundaryPattern();
    throw new SelectorParseError("Query envelope requires a sigil, boundary, or _", token2.offset);
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
  APPOSITION_SCAN_VERSION,
  AUTHORITY_FACETS,
  BIAS,
  BONE_OPS,
  BOON_OPS,
  BOUNDARY_AXIS_IMPLICATIONS,
  BOUNDARY_LADDERS,
  BUILTIN_MUTATION_RULES,
  CACHE_LAYER_DEFAULTS,
  CACHE_LAYER_SURFACE,
  CACHE_PLANES,
  CHANGE_REPORT_VERSION,
  COMPOSITION_FORM_VERSION,
  CONFIG_OPS,
  CORE_SNIPPETS,
  CORPUS_PRODUCT_SCHEMA,
  CORPUS_PRODUCT_VERSION,
  COUPLING_DESCRIPTORS,
  CoverageCollector,
  DEFAULT_DIALECT,
  DEFAULT_LEX_PROFILE,
  DEFAULT_OPTIONS,
  DEFAULT_OPT_CHANNELS,
  DEFAULT_RESONANCE_DETECTORS,
  DEFER_OPS,
  DERIVED_SPW_KINDS,
  DIALECT_IDS,
  DOMAIN_ROOTS,
  DOMAIN_ROOTS_FULL,
  DomainId,
  EVIDENCE_BASES,
  EVIDENCE_DOMAINS,
  EVIDENCE_ROLES,
  EventStream,
  FORMAT_CAPABILITIES,
  FORMAT_PROFILES,
  FORMULA_CATALOG,
  FORM_GEOMETRY_PROFILE,
  FORM_LADDER_PROFILE,
  FORM_MOBILITY_APPLICATION_PROFILE,
  FrameId,
  GAP_CLASSES,
  HIGHER_ORDER_FORMS,
  HYDRATE_OPS,
  INDEX_PRESETS,
  INDEX_TRADEOFFS,
  IR_EDGE_KINDS,
  IR_KINDS,
  LayerId,
  MASS_FAMILY,
  MEASURABLE_KEYS,
  MEDIAL_CAPSULE_CHANNELS,
  MOBILITY_RULES,
  MUTATION_PROFILES,
  MetricsCollector,
  NAVIGABLE,
  NEST_PATH_ALPHABET,
  NEST_PATH_VERSION,
  OPERATIONAL_SEQUENCES,
  OPERATOR_LADDERS,
  OPS_WITH_BODIES,
  OPS_WITH_FRAMES,
  PAIRED_BOUNDARY_KINDS,
  PARSE_EVENT_POLICIES,
  PARTICLES,
  PATCH_PRODUCER,
  PATCH_SCHEMA,
  PATCH_VERSION,
  PATH_REFS,
  PROGRESSIVE_PRODUCT_SURFACE,
  PROSE_LEX_PROFILE,
  PatchMemoryBank,
  QUERY_OPS,
  REFACTOR_PLAN_OMISSIONS,
  REFACTOR_PLAN_SURFACE,
  REFERENCES,
  REFERENCE_PROGRESSIONS,
  RegisterId,
  SCOPES,
  SIGIL_SNIPPET_CATALOG,
  SOURCE_PRODUCT_DEPTHS,
  SOURCE_PRODUCT_IDS,
  SPW_GEN_KINDS,
  SPW_GEN_ROOT,
  SPW_MATH_IDIOMS,
  STENCIL_SCHEMA,
  STENCIL_VERSION,
  SYNTAX_CATALOG,
  SelectorParseError,
  TEMPLATE_SLOTS,
  VALENCE_PARTICLES,
  WEIGHT_SCHEMES,
  WEIGHT_SCHEME_AGENT,
  WEIGHT_SCHEME_DEFAULT,
  WEIGHT_SCHEME_THRIFT,
  actBodySketch,
  adjacencyList,
  adjacencyMatrix,
  affinityAllocate,
  aggregateFormulaPatterns,
  analyzeTopography,
  analyzeWorkspaceRootManifest,
  and,
  annotationNode,
  anyNode,
  applyDialectIndexBias,
  applyDialectPreprocess,
  applyEdits,
  applyEquivScriptTransforms,
  applyMassCorrections,
  applyMobilityRule,
  applyPatch,
  applyPatchToFiles,
  applyRangePlan,
  applySemanticPlan,
  applyStencil,
  appositionMasksEqual,
  appositionParts,
  appositionSpectrum,
  asContentHash,
  asProducerSchema,
  asRequestEpoch,
  asSessionBeat,
  assembleCacheLayers,
  assertSpwSelector,
  auditAST,
  between,
  bisectionRoot,
  bodyNode,
  bootstrapMeasureRegistry,
  boundaryCoordinateForSurface,
  boundaryLadder,
  boundaryLadderTable,
  boundarySetForProfile,
  boundedWhile,
  braceProjectionDelta,
  buildChangeReport,
  buildConnectorMap,
  buildCorpusProduct,
  buildGeometryField,
  buildOperatorMap,
  buildPatch,
  buildPatchFromEdits,
  buildPopulation,
  buildProgressiveProduct,
  buildRefactorPlanCard,
  buildResonanceContext,
  buildStencilMask,
  buildSurfaceInterconnect,
  buildTrace,
  bytecodeOpSimilarity,
  canonicalize,
  capacityStep,
  capture,
  cascadeChain,
  castToBrand,
  choice,
  classifyGap,
  classifyMutationUsefulness,
  classifyPayload,
  classifyTokenGaps,
  cloneField,
  collectMachineLintWarnings,
  collectPlannedEdits,
  combineHooks,
  compactFormatter,
  compareAst,
  compareFamiliarity,
  compareFormatProfiles,
  compareLex,
  compileGeometryBytecode,
  composeEditLists,
  composeSequence,
  compositionToProduct,
  computationalRuleIds,
  contentHash,
  contextForFamily,
  contourFormLadder,
  cosineSimilarity,
  countNodeTypes,
  countOps,
  couplingDescriptor,
  couplingFrame,
  createCoverageHooks,
  createHooks,
  createMetricsHooks,
  createStreamHooks,
  createTokenStream,
  cutStencil,
  decayField,
  defaultScheme,
  degreeHubs,
  deixisTable,
  deriveMark,
  derivedSurfaceName,
  descend,
  desugar,
  detectCycle,
  detectDialect,
  detectDialectFromPath,
  detectGeometricResonances,
  detectPeriod,
  detectReviewProfile,
  diffAppositionLattices,
  diffLines,
  differentialFromSources,
  diffuseField,
  emptyInterconnect,
  enableOpt,
  evalPolynomial,
  eventFilters,
  expandFormContour,
  expressionNode,
  extractBraceProjection,
  extractErrors,
  extractTokens,
  facet,
  fieldBeat,
  fieldNorm,
  fieldSum,
  filterEditsForSelection,
  filterEvents,
  filterPopulation,
  findNodeAtOffset,
  findNodePathAtOffset,
  findNodes,
  fixedPoint,
  flux,
  foldEdits,
  foldTransforms,
  formatAllLadderNotations,
  formatBoundaryAxisTable,
  formatCacheLayerLines,
  formatCatalogEntryMarkdown,
  formatChangeReportSpw,
  formatCompositionSpw,
  formatCorpusProductSpw,
  formatFlowProtocolSummary,
  formatFormContour,
  formatGeometryFieldAsSpw,
  formatGeometryFieldSummary,
  formatGeometryReport,
  formatGranularityAsSpw,
  formatHigherOrderForms,
  formatMathIdioms,
  formatMatrix,
  formatMobilityRules,
  formatNestPathSpw,
  formatPatchSpw,
  formatPopulationSpw,
  formatPulses,
  formatRangePlan,
  formatResonanceAsSpw,
  formatResonanceSummary,
  formatSiteGraph,
  formatSpwCard,
  formatSpwCards,
  formatStencilSpw,
  formatTopographySpw,
  formatVscodeSnippetsJson,
  frameNode,
  gateStencilMask,
  genSurfacePath,
  getLexProfile,
  getMaxDepth,
  getNodeChildren,
  getNodePath,
  getSnippet,
  getSyntaxCatalogEntry,
  grainWantsEval,
  grainWantsInterconnect,
  grainWantsResonance,
  graphFromEdges,
  graphFromLinks,
  halfLifeToRate,
  hashString,
  heuristicAnnotationHints,
  heuristicFrameCount,
  heuristicSigilHistogram,
  hostLabel,
  hydrateSnippet,
  idiomsForFamily,
  implicationsForBoundary,
  inspectGeometry,
  interconnectSummary,
  irRef,
  irRefKey,
  isBoundaryCouplingFrame,
  isDerivedSurface,
  isDialectId,
  isFormLabel,
  isGenPath,
  isProseCommentLine,
  isSignificantToken,
  isSlashLineComment,
  isSpwSelector,
  jsonFormatter,
  labelSiteGraph,
  latestTimestamp,
  lazy,
  lex,
  linearResidual,
  link,
  listBoundaryLadders,
  listFormLadders,
  listLexProfiles,
  listOperatorLadders,
  listSnippets,
  listSyntaxCatalog,
  literalNode,
  loadMeasureContextFromSpw,
  logisticOrbit,
  makeLens,
  many,
  many1,
  map,
  massConserved,
  matchAll,
  matchAt,
  matrixByStratum,
  matrixFromVectors,
  matrixTranspose,
  measureMass,
  migrateSlashCommentsToHash,
  mixFields,
  mobilityRule,
  modifierChain,
  mutationRulesAsSequenceContext,
  named,
  neighbors,
  nestPathDelta,
  nestPathSpectrum,
  noopHooks,
  normalizeToONF,
  not,
  occupancyFromArgs,
  offsetToPosition,
  omitCacheLayer,
  openOptChannel,
  operationNode,
  operatorLadder,
  operatorLadderTable,
  optional,
  or,
  orbit,
  parameterNode,
  parse,
  parseBindings,
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
  planSemanticEdits,
  planSpanTransform,
  populationRoleOf,
  populationStats,
  positionToOffset,
  presentCacheLayer,
  previewAST,
  printAST,
  probeBoundaryLadder,
  probeFormLadder,
  probeMutationTopography,
  probeOperatorLadder,
  processEvent,
  produceSourceProducts,
  productConstraint,
  projectCouplingSemantics,
  pushEffect,
  putNode,
  rangeFold,
  readAuthorityDeclarations,
  readBias,
  readCouplingFrame,
  readMassDeclarations,
  recognizeCompositionSequence,
  recognizeCompositionSource,
  reconcileAuthority,
  reconcileFamily,
  reconcileMass,
  reconcileMetric,
  reduceFormContour,
  referenceNode,
  reflowProseBlocks,
  registerLexProfile,
  renameMark,
  renameParticle,
  residual,
  resolveCitedCatalogEntries,
  resolveFamily,
  resolveFormatProfile,
  resolveFragment,
  resolveGranularity,
  resolveIndexConfig,
  resolveLabelContext,
  resolveLabelPosition,
  resolveLadderQuery,
  resolveLexProfile,
  resolveMutationRules,
  resolveRange,
  resolveSurfaceProfile,
  resolveWeightScheme,
  restoreFormContour,
  retainsParseEvent,
  rulesByMotion,
  rulesByStatus,
  rulesFrom,
  rulesTo,
  runHigherOrderForm,
  runMutationAutomata,
  runOperationalSequence,
  runResonanceDetectors,
  scanAppositions,
  scanExperimentalRefs,
  scanFlowProtocol,
  scanFormulas,
  scanNestPaths,
  scopeNode,
  seedNode,
  selectionFromSource,
  sepBy,
  seq,
  sequence,
  sequenceNode,
  shortestPath,
  shouldSkipCorpusSurface,
  significantTokens,
  snapshotTopography,
  snippetSource,
  solveLinearSystem,
  sortPopulation,
  sourceSurfaceOf,
  spanToOffsets,
  splitPathFragment,
  spwq,
  stencilToAutomataConfig,
  summarizeFormulaHits,
  textFormatter,
  toVscodeSnippets,
  token,
  tokenize,
  topSigils,
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
