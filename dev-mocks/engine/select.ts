/**
 * `select('...')` parsing, projection and embedded-resource resolution.
 *
 * Supports the PostgREST syntax the app actually uses:
 *   *                                 all columns
 *   id, full_name                     explicit columns (also `alias:col` and `col::cast`)
 *   schedules (*)                     to-many embed by table name
 *   chambers!doctor_id(*)             embed disambiguated by FK column
 *   medicines:prescription_medicines(*)  aliased embed
 *   hospital:hospital_id (id, name)   to-one embed by FK column, aliased
 *   x!inner(*)                        inner join (drops parent rows without a match)
 */
import { table, metaFor, clone } from './db';
import type { Row } from './filters';

export interface SelNode {
  kind: 'star' | 'col' | 'embed';
  name: string;
  alias?: string;
  hint?: string;
  inner?: boolean;
  children?: SelNode[];
}

const warned = new Set<string>();
const warnOnce = (msg: string) => {
  if (warned.has(msg)) return;
  warned.add(msg);
  // console.debug (not warn/error): shows up when you tick "Verbose" in devtools but keeps the default console clean.
  console.debug('[dev-mocks]', msg);
};

function splitTop(str: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of str) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map(s => s.trim()).filter(Boolean);
}

export function parseSelect(str: string | undefined): SelNode[] {
  const src = (str ?? '*').trim() || '*';
  return splitTop(src).map<SelNode>(token => {
    if (token === '*') return { kind: 'star', name: '*' };
    const open = token.indexOf('(');
    if (open >= 0) {
      const header = token.slice(0, open).trim();
      const inside = token.slice(open + 1, token.lastIndexOf(')'));
      let alias: string | undefined;
      let rest = header;
      const colon = rest.indexOf(':');
      if (colon >= 0) { alias = rest.slice(0, colon).trim(); rest = rest.slice(colon + 1).trim(); }
      const [name, ...mods] = rest.split('!').map(s => s.trim());
      const inner = mods.includes('inner');
      const hint = mods.find(m => m && m !== 'inner' && m !== 'left');
      return { kind: 'embed', name, alias, hint, inner, children: parseSelect(inside) };
    }
    const noCast = token.split('::')[0].trim();
    const colon = noCast.indexOf(':');
    if (colon >= 0) return { kind: 'col', name: noCast.slice(colon + 1).trim(), alias: noCast.slice(0, colon).trim() };
    return { kind: 'col', name: noCast };
  });
}

interface Relation { target: string; many: boolean; localCol: string; remoteCol: string }

function resolveRelation(parent: string, node: SelNode): Relation | null {
  const pFks = metaFor(parent).fks ?? [];
  // 1. name is an FK column on the parent  -> to-one (`hospital:hospital_id (...)`)
  const byCol = pFks.find(f => f.column === node.name);
  if (byCol) return { target: byCol.ref, many: false, localCol: byCol.column, remoteCol: byCol.refColumn ?? 'id' };
  // 2. name is a table
  const tFks = metaFor(node.name).fks ?? [];
  const hint = node.hint;
  // 2a. parent -> target (to-one)
  const toOne = pFks.filter(f => f.ref === node.name && (!hint || f.column === hint));
  // 2b. target -> parent (to-many)
  const toMany = tFks.filter(f => f.ref === parent && (!hint || f.column === hint));
  if (toMany.length && (!toOne.length || hint)) {
    const f = toMany[0];
    return { target: node.name, many: true, localCol: f.refColumn ?? 'id', remoteCol: f.column };
  }
  if (toOne.length) {
    const f = toOne[0];
    return { target: node.name, many: false, localCol: f.column, remoteCol: f.refColumn ?? 'id' };
  }
  if (toMany.length) {
    const f = toMany[0];
    return { target: node.name, many: true, localCol: f.refColumn ?? 'id', remoteCol: f.column };
  }
  return null;
}

/** Project one raw row through a parsed select list (recursively resolving embeds). */
export function project(tableName: string, row: Row, nodes: SelNode[]): Row {
  const out: Row = {};
  if (nodes.some(n => n.kind === 'star')) Object.assign(out, clone(row));
  for (const node of nodes) {
    if (node.kind === 'col') {
      const key = node.alias ?? node.name;
      if (node.name in row) out[key] = clone(row[node.name]);
      else warnOnce(`select("${node.name}") on "${tableName}": column not present in fixtures (returned undefined)`);
    } else if (node.kind === 'embed') {
      const key = node.alias ?? node.name;
      const rel = resolveRelation(tableName, node);
      if (!rel) {
        warnOnce(`select embed "${node.name}" on "${tableName}": no relationship known (add a foreign key in dev-mocks/engine/db.ts)`);
        out[key] = null;
        continue;
      }
      const kids = node.children ?? [{ kind: 'star', name: '*' } as SelNode];
      const targets = table(rel.target);
      if (rel.many) {
        out[key] = targets
          .filter(t => row[rel.localCol] != null && String(t[rel.remoteCol]) === String(row[rel.localCol]))
          .map(t => project(rel.target, t, kids));
      } else {
        const hit = row[rel.localCol] == null ? undefined : targets.find(t => String(t[rel.remoteCol]) === String(row[rel.localCol]));
        out[key] = hit ? project(rel.target, hit, kids) : null;
      }
    }
  }
  return out;
}

/** Does this raw row survive `!inner` embeds in the select list? */
export function passesInnerJoins(tableName: string, row: Row, nodes: SelNode[]): boolean {
  return nodes.every(n => {
    if (n.kind !== 'embed' || !n.inner) return true;
    const rel = resolveRelation(tableName, n);
    if (!rel) return true;
    const targets = table(rel.target);
    return targets.some(t => row[rel.localCol] != null && String(t[rel.remoteCol]) === String(row[rel.localCol]));
  });
}
