/* The names lore.land imports from the generated bundle (EXPORTS in book/scripts/tools/bundle-spw-seed.mjs). Only the
 * fields lore.land reads are typed; the workbench's own types are richer. */
export interface ParseCompleteness { complete: boolean; proseFallback: boolean }
export interface ParseIssue {
  position: { line: number; column: number; offset?: number };
  data: { message: string; expected?: string[]; [key: string]: unknown };
}
export interface ParseResult {
  success: boolean;
  completeness: ParseCompleteness;
  ast?: unknown;
  errors: ParseIssue[];
  warnings: ParseIssue[];
  events?: unknown[];
}
export interface ParseOptions { lexProfile?: 'default' | 'prose' }
export interface BiasEdge { anchor: unknown; axis: unknown; targets: unknown[]; sign: unknown }
export function parse(text: string, options?: ParseOptions): ParseResult;
export function readBias(node: unknown): BiasEdge | null;

/** A labeled pair's edge, as scanPairLabels reports it (spw.pair-labels/1). */
export interface PairEdge { kind: string; edge: 'open' | 'close'; at: number; line: number; label?: string; spelling?: 'repeated' | 'mirrored' }
export interface LabeledPair { kind: string; label?: string; open: PairEdge; close?: PairEdge; depth: number }
export interface PairLabelScan { schema: string; direction: string; pairs: LabeledPair[]; [key: string]: unknown }
export function scanPairLabels(text: string, options?: Record<string, unknown>): PairLabelScan;

/** A line said in the names of its parts (spw.spoken/1). */
export interface SpokenClause { role: string; says: string; start: number; end: number; depth: number; [key: string]: unknown }
export interface SpokenLine { schema: string; source: string; clauses: SpokenClause[]; [key: string]: unknown }
export function spokenLine(text: string, options?: Record<string, unknown>): SpokenLine;

/** Slot-level reading and lossless line writing (src/line). */
export type SlotKey = 'word' | 'mode' | 'body' | 'scene' | 'concept';
export type PairKey = 'mode' | 'body' | 'scene' | 'concept';
export interface SlotSpan { text: string; start: number; end: number; innerStart: number; innerEnd: number }
export interface LinePart { text: string; start: number; end: number; reading: SlotReading }
export interface LineCompound { mark: string; bond: string; spaced: boolean; at: number; left: SlotReading; right: SlotReading }
export interface SlotReading {
  source: string;
  start: number;
  end: number;
  charge: string[];
  lead: Array<'scene' | 'concept'>;
  word: SlotSpan;
  slots: Partial<Record<PairKey, SlotSpan>>;
  order: SlotKey[];
  parts: LinePart[];
  separator: string;
  compound?: LineCompound;
  rest: string;
  restStart: number;
  whole: boolean;
}
export interface LineChange {
  charge?: string | null;
  slots?: Partial<Record<SlotKey, string | null>>;
  parts?: readonly string[];
}
export function readLine(text: string): SlotReading;
export function writeLine(reading: SlotReading, change?: LineChange): string;
export function joinParts(parts: readonly string[], separator: string): string;

/** Deterministic slot/content hashing (SHA-256). */
export interface SlotHash {
  seed: string;
  order: SlotKey[];
  components: Record<SlotKey, string | null>;
  unit: Record<SlotKey, number | null>;
  vector: number[];
}
export function slotHash(input: SlotReading | string, options?: { seed?: string; length?: number }): SlotHash;
export function textHash(text: string, length?: number): string;

/** Register stamps ([reg=...]) read and summarized. */
export interface RegisterStamp {
  name: string;
  closes: string | null;
  shape: string | null;
  restates: boolean;
  also: Record<string, string>;
  line: number;
  start: number;
  end: number;
}
export interface RegisterStampSummary {
  contract: string;
  total: number;
  restating: number;
  informing: number;
  names: Record<string, number>;
  informingNames: Record<string, number>;
  detached: number;
}
export function readRegisterStamps(source: string): RegisterStamp[];
export function summarizeRegisterStamps(stamps: ReadonlyArray<RegisterStamp>): RegisterStampSummary;

/** Reader marks and quest line checks (src/learn). */
export interface ReaderMark { mark: string; name: string }
export interface LineReading { operators: ReaderMark[]; containers: ReaderMark[] }
export interface QuestCheckResult {
  step: string;
  check: string;
  line: string;
  pass: boolean;
  parsed: boolean;
  errors: string[];
  matched?: 'try' | 'then';
  reading: LineReading;
}
export function readMarks(root: unknown): LineReading;
export function formatLineReading(reading: LineReading): string;
export function checkLine(line: string, check: string, options?: { role?: 'try' | 'then' }): QuestCheckResult;

/** Template / snippet slot hydration without mutating source templates. */
export interface HydrateResult {
  version: string;
  id: string;
  text: string;
  filled: string[];
  defaultsUsed: string[];
  open: string[];
  complete: boolean;
}
export function hydrateSnippet(
  snippet: string | { id: string; body: string[]; [key: string]: unknown },
  bindings?: Record<string, string>,
  opts?: { applyDefaults?: boolean; strict?: boolean }
): HydrateResult;
export function parseBindings(pairs: string[]): Record<string, string>;
