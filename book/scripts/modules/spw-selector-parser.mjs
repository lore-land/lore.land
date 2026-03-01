/**
 * Spw Selector Expression Parser
 *
 * Ported from spw-workbench query parser for browser-native runtime use.
 * Source lineage:
 * /Development/active/spw-workbench/src/seed/query/selector-expr.ts
 * /Development/active/spw-workbench/src/seed/query/types.ts
 */

export function and(a, b) {
  return { and: [a, b] };
}

export function or(a, b) {
  return { or: [a, b] };
}

export function not(selector) {
  return { not: selector };
}

export function descend(parent, child) {
  return { descend: [parent, child] };
}

export function seq(a, b) {
  return { seq: [a, b] };
}

const SIGILS = new Set(['!', '~', '@', '^', '#', '.', '?', '=', '&', '*', '$', '%']);

function tokenize(input) {
  const tokens = [];
  let i = 0;

  while (i < input.length) {
    const char = input[i];
    if (char === ' ' || char === '\t' || char === '\n') {
      i += 1;
      continue;
    }

    if (char === '<' && input[i + 1] === '>') {
      tokens.push({ type: 'sigil', value: '<>' });
      i += 2;
      continue;
    }

    if (char === '.' && input[i + 1] === '.') {
      tokens.push({ type: 'dotdot' });
      i += 2;
      continue;
    }

    if (char === '[' && input[i + 1] === ']') {
      tokens.push({ type: 'brace', value: '[]' });
      i += 2;
      continue;
    }
    if (char === '{' && input[i + 1] === '}') {
      tokens.push({ type: 'brace', value: '{}' });
      i += 2;
      continue;
    }
    if (char === '(' && input[i + 1] === ')') {
      tokens.push({ type: 'brace', value: '()' });
      i += 2;
      continue;
    }

    if (char === '|') {
      tokens.push({ type: 'pipe' });
      i += 1;
      continue;
    }
    if (char === '/') {
      tokens.push({ type: 'slash' });
      i += 1;
      continue;
    }
    if (char === '-') {
      tokens.push({ type: 'dash' });
      i += 1;
      continue;
    }
    if (char === '(') {
      tokens.push({ type: 'lparen' });
      i += 1;
      continue;
    }
    if (char === ')') {
      tokens.push({ type: 'rparen' });
      i += 1;
      continue;
    }

    if (char === '&') {
      const next = input[i + 1];
      if (next && (SIGILS.has(next) || next === '[' || next === '{' || next === '(' || /[a-zA-Z]/.test(next))) {
        tokens.push({ type: 'sigil', value: '&' });
      } else {
        tokens.push({ type: 'amp' });
      }
      i += 1;
      continue;
    }

    if (SIGILS.has(char)) {
      tokens.push({ type: 'sigil', value: char });
      i += 1;
      continue;
    }

    if (char === '"') {
      i += 1;
      let text = '';
      while (i < input.length && input[i] !== '"') {
        if (input[i] === '\\' && i + 1 < input.length) {
          text += input[i + 1];
          i += 2;
        } else {
          text += input[i];
          i += 1;
        }
      }
      if (i < input.length) {
        i += 1;
      }
      tokens.push({ type: 'string', value: text });
      continue;
    }

    if (/[0-9]/.test(char)) {
      let number = '';
      while (i < input.length && /[0-9]/.test(input[i])) {
        number += input[i];
        i += 1;
      }
      tokens.push({ type: 'number', value: Number.parseInt(number, 10) });
      continue;
    }

    if (/[a-zA-Z_]/.test(char)) {
      let ident = '';
      while (i < input.length && /[a-zA-Z0-9_]/.test(input[i])) {
        ident += input[i];
        i += 1;
      }
      if (ident === 'not') {
        tokens.push({ type: 'bang_not' });
      } else if (ident === 'or') {
        tokens.push({ type: 'pipe' });
      } else if (ident === 'and') {
        tokens.push({ type: 'amp' });
      } else {
        tokens.push({ type: 'modifier', value: ident });
      }
      continue;
    }

    i += 1;
  }

  tokens.push({ type: 'eof' });
  return tokens;
}

export class SelectorParseError extends Error {
  constructor(message, position) {
    super(`SelectorParseError at position ${position}: ${message}`);
    this.name = 'SelectorParseError';
    this.position = position;
  }
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos] || { type: 'eof' };
  }

  advance() {
    const token = this.tokens[this.pos];
    this.pos += 1;
    return token || { type: 'eof' };
  }

  expect(type) {
    const token = this.peek();
    if (token.type !== type) {
      throw new SelectorParseError(`Expected ${type}, got ${token.type}`, this.pos);
    }
    return this.advance();
  }

  parseExpr() {
    let left = this.parsePipeline();
    while (this.peek().type === 'pipe') {
      this.advance();
      const right = this.parsePipeline();
      left = or(left, right);
    }
    return left;
  }

  parsePipeline() {
    let left = this.parseTerm();
    while (true) {
      const token = this.peek();
      if (token.type === 'slash') {
        this.advance();
        left = descend(left, this.parseTerm());
      } else if (token.type === 'dotdot') {
        this.advance();
        left = seq(left, this.parseTerm());
      } else {
        break;
      }
    }
    return left;
  }

  parseTerm() {
    let left = this.parseFactor();
    while (this.peek().type === 'amp') {
      this.advance();
      left = and(left, this.parseFactor());
    }
    return left;
  }

  parseFactor() {
    if (this.peek().type === 'bang_not') {
      this.advance();
      return not(this.parseFactor());
    }
    return this.parseAtom();
  }

  parseAtom() {
    const token = this.peek();
    if (token.type === 'lparen') {
      this.advance();
      const inner = this.parseExpr();
      this.expect('rparen');
      return inner;
    }

    if (token.type === 'modifier') {
      return { modifier: this.advance().value };
    }

    if (token.type === 'sigil') {
      const pattern = { sigil: this.advance().value };
      if (this.peek().type === 'brace') {
        pattern.brace = this.advance().value;
      }
      if (this.peek().type === 'brace') {
        pattern.brace2 = this.advance().value;
      }
      if (this.peek().type === 'modifier') {
        pattern.modifier = this.advance().value;
      }
      if (this.peek().type === 'string') {
        pattern.value = this.advance().value;
      }

      const depthToken = this.peek();
      if (depthToken.type === 'sigil' && depthToken.value === '@') {
        this.advance();
        if (this.peek().type === 'number') {
          const min = this.advance().value;
          if (this.peek().type === 'dash') {
            this.advance();
            const max = this.expect('number').value;
            pattern.depthRange = [min, max];
          } else {
            pattern.depth = min;
          }
        }
      }
      return pattern;
    }

    if (token.type === 'brace') {
      return { brace: this.advance().value };
    }

    throw new SelectorParseError(`Unexpected token: ${token.type}`, this.pos);
  }
}

export function parseSelector(input) {
  const parser = new Parser(tokenize(input));
  return parser.parseExpr();
}

export function tryParseSelector(input) {
  try {
    return parseSelector(input);
  } catch {
    return null;
  }
}
