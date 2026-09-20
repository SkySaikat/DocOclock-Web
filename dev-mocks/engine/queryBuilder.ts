/**
 * Chainable, thenable query builder that mimics `@supabase/postgrest-js` against the in-memory store.
 *
 *   await supabase.from('appointments').select('*').eq('doctor_id', id).order('serial_number')
 *   -> { data, error: null, count, status, statusText }
 *
 * Writes (insert / update / upsert / delete) mutate `store` only.
 */
import { table, metaFor, clone, applyDeleteCascades, store } from './db';
import { Pred, Row, makePred, negate, parseOr, parseAnd, compareValues, getCol } from './filters';
import { parseSelect, project, passesInnerJoins } from './select';

export interface MockError {
  message: string;
  details: string | null;
  hint: string | null;
  code: string;
}

export interface MockResult<T = any> {
  data: T | null;
  error: MockError | null;
  count: number | null;
  status: number;
  statusText: string;
}

type Op = 'select' | 'insert' | 'update' | 'upsert' | 'delete';
type Shape = 'many' | 'single' | 'maybe';

const LATENCY_MS = (() => {
  try {
    const q = new URLSearchParams(location.search).get('mockLatency');
    if (q != null && q !== '' && !Number.isNaN(Number(q))) return Math.max(0, Number(q));
  } catch { /* non-browser */ }
  return 25;
})();

const delay = () => new Promise<void>(res => (LATENCY_MS > 0 ? setTimeout(res, LATENCY_MS) : queueMicrotask(res)));

const mkError = (message: string, code: string, details: string | null = null, hint: string | null = null): MockError =>
  ({ message, details, hint, code });

export class QueryBuilder implements PromiseLike<MockResult> {
  private tableName: string;
  private op: Op = 'select';
  private selectStr = '*';
  private preds: Pred[] = [];
  private orders: { col: string; asc: boolean; nullsFirst?: boolean }[] = [];
  private lim: number | null = null;
  private rangeFrom: number | null = null;
  private rangeTo: number | null = null;
  private countMode: string | null = null;
  private head = false;
  private shape: Shape = 'many';
  private payload: any = null;
  private upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};
  private returning = false;
  private shouldThrow = false;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // ── verbs ─────────────────────────────────────────────────────────────
  select(columns: string = '*', opts?: { count?: 'exact' | 'planned' | 'estimated'; head?: boolean }): this {
    if (this.op === 'select') {
      this.selectStr = columns;
      if (opts?.count) this.countMode = opts.count;
      if (opts?.head) this.head = true;
    } else {
      // insert/update/upsert/delete(...).select() => return the affected rows
      this.returning = true;
      this.selectStr = columns;
    }
    return this;
  }
  insert(values: Row | Row[], _opts?: { count?: string; defaultToNull?: boolean }): this { this.op = 'insert'; this.payload = values; return this; }
  update(values: Row, _opts?: { count?: string }): this { this.op = 'update'; this.payload = values; return this; }
  upsert(values: Row | Row[], opts?: { onConflict?: string; ignoreDuplicates?: boolean; count?: string }): this {
    this.op = 'upsert'; this.payload = values; this.upsertOpts = opts ?? {}; return this;
  }
  delete(_opts?: { count?: string }): this { this.op = 'delete'; return this; }

  // ── filters ───────────────────────────────────────────────────────────
  eq(col: string, val: any): this { this.preds.push(makePred(col, 'eq', val)); return this; }
  neq(col: string, val: any): this { this.preds.push(makePred(col, 'neq', val)); return this; }
  gt(col: string, val: any): this { this.preds.push(makePred(col, 'gt', val)); return this; }
  gte(col: string, val: any): this { this.preds.push(makePred(col, 'gte', val)); return this; }
  lt(col: string, val: any): this { this.preds.push(makePred(col, 'lt', val)); return this; }
  lte(col: string, val: any): this { this.preds.push(makePred(col, 'lte', val)); return this; }
  like(col: string, pattern: string): this { this.preds.push(makePred(col, 'like', pattern)); return this; }
  ilike(col: string, pattern: string): this { this.preds.push(makePred(col, 'ilike', pattern)); return this; }
  is(col: string, val: any): this { this.preds.push(makePred(col, 'is', val)); return this; }
  in(col: string, vals: any[]): this { this.preds.push(makePred(col, 'in', vals)); return this; }
  contains(col: string, val: any): this { this.preds.push(makePred(col, 'contains', val)); return this; }
  containedBy(col: string, val: any): this { this.preds.push(makePred(col, 'containedBy', val)); return this; }
  overlaps(col: string, val: any): this { this.preds.push(makePred(col, 'overlaps', val)); return this; }
  textSearch(col: string, q: string): this { this.preds.push(makePred(col, 'textSearch', q)); return this; }
  not(col: string, op: string, val: any): this { this.preds.push(negate(makePred(col, op, val))); return this; }
  or(filters: string, _opts?: { foreignTable?: string }): this { this.preds.push(parseOr(filters)); return this; }
  and(filters: string): this { this.preds.push(parseAnd(filters)); return this; }
  filter(col: string, op: string, val: any): this { this.preds.push(makePred(col, op, val)); return this; }
  match(query: Row): this { Object.entries(query).forEach(([k, v]) => this.eq(k, v)); return this; }

  // ── modifiers ─────────────────────────────────────────────────────────
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean; foreignTable?: string; referencedTable?: string }): this {
    this.orders.push({ col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst });
    return this;
  }
  limit(n: number): this { this.lim = n; return this; }
  range(from: number, to: number): this { this.rangeFrom = from; this.rangeTo = to; return this; }
  single(): this { this.shape = 'single'; return this; }
  maybeSingle(): this { this.shape = 'maybe'; return this; }
  throwOnError(): this { this.shouldThrow = true; return this; }
  abortSignal(_s: AbortSignal): this { return this; }
  returns<_T = any>(): this { return this; }
  overrideTypes<_T = any>(): this { return this; }
  setHeader(_k: string, _v: string): this { return this; }
  csv(): this { return this; }
  explain(): this { return this; }

  // ── execution ─────────────────────────────────────────────────────────
  then<R1 = MockResult, R2 = never>(
    onfulfilled?: ((value: MockResult) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null,
  ): Promise<R1 | R2> {
    return this.execute().then(onfulfilled as any, onrejected as any);
  }
  catch<R = never>(onrejected?: ((reason: any) => R | PromiseLike<R>) | null): Promise<MockResult | R> {
    return this.execute().catch(onrejected as any);
  }
  finally(onfinally?: (() => void) | null): Promise<MockResult> {
    return this.execute().finally(onfinally as any);
  }

  private async execute(): Promise<MockResult> {
    await delay();
    let result: MockResult;
    try {
      result = this.run();
    } catch (e: any) {
      result = { data: null, error: mkError(e?.message ?? String(e), 'MOCK0', null, 'Unexpected error inside dev-mocks query engine'), count: null, status: 500, statusText: 'Internal Server Error' };
    }
    if (this.shouldThrow && result.error) throw Object.assign(new Error(result.error.message), result.error);
    return result;
  }

  private matching(): Row[] {
    return table(this.tableName).filter(r => this.preds.every(p => p(r)));
  }

  private finish(rows: Row[], status = 200, count: number | null = null): MockResult {
    const nodes = parseSelect(this.selectStr);
    let projected = rows
      .filter(r => passesInnerJoins(this.tableName, r, nodes))
      .map(r => project(this.tableName, r, nodes));

    if (this.shape === 'many') {
      return { data: projected, error: null, count, status, statusText: status === 201 ? 'Created' : 'OK' };
    }
    if (projected.length !== 1) {
      if (this.shape === 'maybe' && projected.length === 0) {
        return { data: null, error: null, count, status: 200, statusText: 'OK' };
      }
      return {
        data: null,
        error: mkError('JSON object requested, multiple (or no) rows returned', 'PGRST116', `The result contains ${projected.length} rows`),
        count: null,
        status: 406,
        statusText: 'Not Acceptable',
      };
    }
    return { data: projected[0], error: null, count, status, statusText: 'OK' };
  }

  private sortRows(rows: Row[]): Row[] {
    if (!this.orders.length) return rows;
    return [...rows].sort((a, b) => {
      for (const o of this.orders) {
        const va = getCol(a, o.col);
        const vb = getCol(b, o.col);
        const aNil = va == null;
        const bNil = vb == null;
        if (aNil || bNil) {
          if (aNil && bNil) continue;
          // Postgres: NULLS LAST for ASC, NULLS FIRST for DESC unless overridden.
          const nullsFirst = o.nullsFirst ?? !o.asc;
          return aNil ? (nullsFirst ? -1 : 1) : (nullsFirst ? 1 : -1);
        }
        const c = compareValues(va, vb);
        if (c !== 0) return o.asc ? c : -c;
      }
      return 0;
    });
  }

  private checkUnique(rows: Row[], incoming: Row, ignore?: Row): MockError | null {
    const meta = metaFor(this.tableName);
    const cols: string[][] = [meta.pk, ...(meta.unique ?? []).map(c => [c])];
    for (const c of cols) {
      if (c.some(k => incoming[k] == null)) continue;
      const clash = rows.find(r => r !== ignore && c.every(k => String(r[k]) === String(incoming[k])));
      if (clash) {
        const name = c === meta.pk ? `${this.tableName}_pkey` : `${this.tableName}_${c[0]}_key`;
        return mkError(`duplicate key value violates unique constraint "${name}"`, '23505', `Key (${c.join(', ')})=(${c.map(k => incoming[k]).join(', ')}) already exists.`);
      }
    }
    return null;
  }

  private insertRows(values: Row | Row[]): { rows: Row[]; error: MockError | null } {
    const meta = metaFor(this.tableName);
    const list = (Array.isArray(values) ? values : [values]).map(v => clone(v));
    const rows = table(this.tableName);
    const inserted: Row[] = [];
    for (const row of list) {
      for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
      meta.defaults?.(row);
      const err = this.checkUnique(rows, row);
      if (err) return { rows: inserted, error: err };
      rows.push(row);
      inserted.push(row);
    }
    return { rows: inserted, error: null };
  }

  private run(): MockResult {
    const name = this.tableName;
    const meta = metaFor(name);

    switch (this.op) {
      case 'select': {
        const all = this.sortRows(this.matching());
        const inner = parseSelect(this.selectStr);
        const visible = all.filter(r => passesInnerJoins(name, r, inner));
        const count = this.countMode ? visible.length : null;
        let page = visible;
        if (this.rangeFrom != null && this.rangeTo != null) page = page.slice(this.rangeFrom, this.rangeTo + 1);
        if (this.lim != null) page = page.slice(0, this.lim);
        if (this.head) return { data: null, error: null, count, status: 200, statusText: 'OK' };
        return this.finish(page, 200, count);
      }

      case 'insert': {
        const { rows, error } = this.insertRows(this.payload);
        if (error) return { data: null, error, count: null, status: 409, statusText: 'Conflict' };
        if (!this.returning) return { data: null, error: null, count: null, status: 201, statusText: 'Created' };
        return this.finish(rows, 201);
      }

      case 'update': {
        const target = this.matching();
        const patch = clone(this.payload) as Row;
        for (const k of Object.keys(patch)) if (patch[k] === undefined) delete patch[k];
        for (const row of target) {
          const next = { ...row, ...patch };
          const err = this.checkUnique(table(name), next, row);
          if (err) return { data: null, error: err, count: null, status: 409, statusText: 'Conflict' };
        }
        const stamp = new Date().toISOString();
        target.forEach(row => {
          Object.assign(row, patch);
          (meta.touchOnUpdate ?? []).forEach(c => { if (!(c in patch)) row[c] = stamp; });
        });
        if (!this.returning) return { data: null, error: null, count: null, status: 204, statusText: 'No Content' };
        return this.finish(target, 200);
      }

      case 'upsert': {
        const conflictCols = (this.upsertOpts.onConflict ? this.upsertOpts.onConflict.split(',').map(s => s.trim()) : meta.pk);
        const list = (Array.isArray(this.payload) ? this.payload : [this.payload]).map((v: Row) => clone(v));
        const rows = table(name);
        const touched: Row[] = [];
        for (const row of list) {
          for (const k of Object.keys(row)) if (row[k] === undefined) delete row[k];
          const existing = conflictCols.every(c => row[c] != null)
            ? rows.find(r => conflictCols.every(c => String(r[c]) === String(row[c])))
            : undefined;
          if (existing) {
            if (this.upsertOpts.ignoreDuplicates) continue;
            Object.assign(existing, row);
            (meta.touchOnUpdate ?? []).forEach(c => { if (!(c in row)) existing[c] = new Date().toISOString(); });
            touched.push(existing);
          } else {
            meta.defaults?.(row);
            const err = this.checkUnique(rows, row);
            if (err) return { data: null, error: err, count: null, status: 409, statusText: 'Conflict' };
            rows.push(row);
            touched.push(row);
          }
        }
        if (!this.returning) return { data: null, error: null, count: null, status: 201, statusText: 'Created' };
        return this.finish(touched, 201);
      }

      case 'delete': {
        const doomed = this.matching();
        store[name] = table(name).filter(r => !doomed.includes(r));
        applyDeleteCascades(name, doomed);
        if (!this.returning) return { data: null, error: null, count: null, status: 204, statusText: 'No Content' };
        return this.finish(doomed, 200);
      }
    }
  }
}
