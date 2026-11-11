/* The two names lore.land imports from the generated bundle (EXPORTS in book/scripts/tools/bundle-spw-seed.mjs). */
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
