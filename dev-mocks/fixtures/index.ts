/**
 * Fixture entry point. `buildSeed()` merges every fixture module into one `{ table: rows[] }` map.
 *
 * To add fixtures:
 *   - extra rows for an existing table -> edit the matching module (people / facilities / visits / content)
 *   - a brand-new table               -> return it from any module below (and, if it has foreign keys or
 *                                        insert defaults, add an entry to TABLE_META in ../engine/db.ts)
 *   - a whole new module              -> create fixtures/<name>.ts exporting `buildX(): Seed` and add it to MODULES.
 */
import { PROFILES } from './people';
import { buildFacilities } from './facilities';
import { buildVisits } from './visits';
import { buildContent } from './content';
import type { Rows, Seed } from './util';

const MODULES: (() => Seed)[] = [
  () => ({ profiles: PROFILES }),
  buildFacilities,
  buildVisits,
  buildContent,
];

export function buildSeed(): Seed {
  const seed: Record<string, Rows> = {};
  for (const build of MODULES) {
    for (const [table, rows] of Object.entries(build())) {
      seed[table] = (seed[table] ?? []).concat(rows);
    }
  }
  return seed;
}

export { DEMO_PASSWORD } from './people';
