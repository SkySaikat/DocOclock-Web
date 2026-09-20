/**
 * Drop-in replacement for /supabase.ts used ONLY by `npx vite --config vite.mock.config.ts`.
 *
 * vite.mock.config.ts aliases every relative import of the app's supabase module (`./supabase`,
 * `../supabase`, `../../supabase`, and the dynamic `import('../../supabase')`) to this file, so no
 * app source is modified and no request can reach the real backend: this module does not import
 * @supabase/supabase-js at all.
 *
 * Exports the same name as the real module (`supabase`) plus a few dev helpers.
 */
import { buildSeed } from './fixtures';
import { seedStore, store, TABLE_META } from './engine/db';
import { QueryBuilder } from './engine/queryBuilder';
import { auth, channel, functions, getChannels, removeAllChannels, removeChannel, rpc, storage, registerRpc, registerFunction } from './engine/clientStubs';

seedStore(buildSeed());

// Editing a fixture or engine file must reload the whole page. Left alone, Vite would hot-swap the importers of this module
// (AuthContext, ThemeContext, ...) while this module re-runs with a fresh store, which surfaces as
// "useAuth must be used within an AuthProvider". Making this module the (only) HMR boundary and reloading in its
// accept callback keeps the app tree untouched until the reload.
if ((import.meta as any).hot) (import.meta as any).hot.accept(() => location.reload());

const client = {
  from: (tableName: string) => new QueryBuilder(tableName),
  rpc,
  auth,
  storage,
  functions,
  channel,
  removeChannel,
  removeAllChannels,
  getChannels,
  /** `supabase.schema('public').from(...)` */
  schema: (_name?: string) => client,
  /** Present on the real client; handy for code that pokes at it. */
  realtime: { channel, removeChannel, removeAllChannels, getChannels, setAuth() { /* noop */ }, connect() { /* noop */ }, disconnect() { /* noop */ } },
  supabaseUrl: 'http://mock.supabase.invalid',
};

export const supabase = client;
export { registerRpc, registerFunction };

// Debug handle:  __MOCK_DB__.dump('appointments')  /  __MOCK_DB__.tables()  /  __MOCK_DB__.reset()
if (typeof window !== 'undefined') {
  (window as any).__MOCK_DB__ = {
    store,
    tables: () => Object.fromEntries(Object.entries(store).map(([k, v]) => [k, v.length])),
    dump: (name: string) => JSON.parse(JSON.stringify(store[name] ?? [])),
    reset: () => { seedStore(buildSeed()); return 'store re-seeded'; },
    meta: TABLE_META,
  };
}
