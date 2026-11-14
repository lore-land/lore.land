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
