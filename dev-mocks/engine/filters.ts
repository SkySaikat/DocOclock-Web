/**
 * PostgREST-style row filters for the in-memory mock client.
 * Everything here is pure (no store access) so it can be reasoned about in isolation.
 */

export type Row = Record<string, any>;
export type Pred = (row: Row) => boolean;

/** Read a column, supporting `col->key->>leaf` JSON paths. */
export function getCol(row: Row, col: string): any {
  if (col in row) return row[col];
  if (col.includes('->')) {
    const parts = col.split(/->>?/);
    let cur: any = row[parts[0]];
    for (let i = 1; i < parts.length && cur != null; i++) cur = cur[parts[i]];
    return cur;
  }
  return undefined;
}

const isNil = (v: any) => v === null || v === undefined;

/** PostgREST sends every filter value as text, so compare loosely across string/number/boolean. */
function looseEq(a: any, b: any): boolean {
  if (isNil(a) || isNil(b)) return false; // SQL: NULL = anything is never true
  if (typeof a === typeof b) return a === b;
  return String(a) === String(b);
}

/** Total-ish ordering used by both gt/lt filters and .order(). Returns null when incomparable. */
export function compareValues(a: any, b: any): number {
  if (isNil(a) && isNil(b)) return 0;
  if (isNil(a)) return 1; // NULLs sort last (Postgres ASC default)
  if (isNil(b)) return -1;
  if (typeof a === 'number' || typeof b === 'number') {
    const na = Number(a);
    const nb = Number(b);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
  }
  if (typeof a === 'boolean' || typeof b === 'boolean') return Number(a) - Number(b);
  const sa = String(a);
  const sb = String(b);
  return sa < sb ? -1 : sa > sb ? 1 : 0;
}

function likeToRegExp(pattern: string, ci: boolean): RegExp {
  const escaped = String(pattern)
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/[%*]/g, '.*')
    .replace(/_/g, '.');
  return new RegExp(`^${escaped}$`, ci ? 'is' : 's');
}

/** Parse a Postgres array literal like `{a,b}` or `(a,b)` or a JSON-ish list into a JS array. */
function toList(val: any): any[] {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const t = val.trim();
    const inner = /^[({[]/.test(t) ? t.slice(1, -1) : t;
    if (inner === '') return [];
    return inner.split(',').map(s => s.trim().replace(/^"(.*)"$/, '$1'));
  }
  return [val];
}

function containsValue(hay: any, needle: any): boolean {
  if (isNil(hay)) return false;
  if (Array.isArray(hay) || typeof needle === 'string' || Array.isArray(needle)) {
    const h = Array.isArray(hay) ? hay : toList(hay);
    return toList(needle).every(n => h.some((x: any) => looseEq(x, n) || JSON.stringify(x) === JSON.stringify(n)));
  }
  if (typeof hay === 'object' && typeof needle === 'object') {
    return Object.keys(needle).every(k => JSON.stringify(hay[k]) === JSON.stringify(needle[k]));
  }
  return false;
}

/** Build a predicate for `column <op> value`. `op` is a PostgREST operator name. */
export function makePred(col: string, op: string, val: any): Pred {
  switch (op) {
    case 'eq': return r => looseEq(getCol(r, col), val);
    case 'neq': return r => { const v = getCol(r, col); return !isNil(v) && !looseEq(v, val); };
    case 'gt': return r => { const v = getCol(r, col); return !isNil(v) && compareValues(v, val) > 0; };
    case 'gte': return r => { const v = getCol(r, col); return !isNil(v) && compareValues(v, val) >= 0; };
    case 'lt': return r => { const v = getCol(r, col); return !isNil(v) && compareValues(v, val) < 0; };
    case 'lte': return r => { const v = getCol(r, col); return !isNil(v) && compareValues(v, val) <= 0; };
    case 'like': { const re = likeToRegExp(val, false); return r => { const v = getCol(r, col); return !isNil(v) && re.test(String(v)); }; }
    case 'ilike': { const re = likeToRegExp(val, true); return r => { const v = getCol(r, col); return !isNil(v) && re.test(String(v)); }; }
    case 'is': {
      const target = val === null || val === 'null' ? null : val === true || val === 'true' ? true : val === false || val === 'false' ? false : val;
      return r => { const v = getCol(r, col); return target === null ? isNil(v) : v === target; };
    }
    case 'in': { const list = toList(val); return r => { const v = getCol(r, col); return !isNil(v) && list.some(x => looseEq(v, x)); }; }
    case 'cs':
    case 'contains': return r => containsValue(getCol(r, col), val);
    case 'cd':
    case 'containedBy': return r => containsValue(val, getCol(r, col));
    case 'ov':
    case 'overlaps': { const list = toList(val); return r => { const v = getCol(r, col); return Array.isArray(v) && v.some(x => list.some(y => looseEq(x, y))); }; }
    case 'fts':
    case 'plfts':
    case 'phfts':
    case 'wfts':
    case 'textSearch': { const q = String(val).toLowerCase(); return r => String(getCol(r, col) ?? '').toLowerCase().includes(q); }
    default:
      // Unknown operator: match nothing rather than everything, so bad queries are visible.
      return () => false;
  }
}

export const negate = (p: Pred): Pred => r => !p(r);

/** Split on commas that are not inside parentheses / double quotes. */
function splitTopLevel(str: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let quoted = false;
  let cur = '';
  for (const ch of str) {
    if (ch === '"') quoted = !quoted;
    if (!quoted) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}

function parseCondition(token: string): Pred {
  const lower = token.toLowerCase();
  if (lower.startsWith('and(') && token.endsWith(')')) {
    const preds = splitTopLevel(token.slice(4, -1)).map(parseCondition);
    return r => preds.every(p => p(r));
  }
  if (lower.startsWith('or(') && token.endsWith(')')) {
    const preds = splitTopLevel(token.slice(3, -1)).map(parseCondition);
    return r => preds.some(p => p(r));
  }
  // col.op.value  |  col.not.op.value   (value may itself contain dots)
  const first = token.indexOf('.');
  const second = token.indexOf('.', first + 1);
  if (first < 0 || second < 0) return () => false;
  const col = token.slice(0, first);
  let op = token.slice(first + 1, second);
  let rest = token.slice(second + 1);
  let neg = false;
  if (op === 'not') {
    neg = true;
    const third = rest.indexOf('.');
    op = rest.slice(0, third);
    rest = rest.slice(third + 1);
  }
  const value: any = op === 'in' ? toList(rest) : rest.replace(/^"(.*)"$/, '$1');
  const pred = makePred(col, op, value);
  return neg ? negate(pred) : pred;
}

/** Parse the argument of `.or('a.eq.1,b.ilike.x%')` into a predicate. */
export function parseOr(filters: string): Pred {
  const preds = splitTopLevel(filters).map(parseCondition);
  return r => preds.some(p => p(r));
}

/** Parse the argument of `.and('a.eq.1,b.gt.3')` (rare) into a predicate. */
export function parseAnd(filters: string): Pred {
  const preds = splitTopLevel(filters).map(parseCondition);
  return r => preds.every(p => p(r));
}
