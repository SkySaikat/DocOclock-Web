/**
 * DEV-ONLY preview harness — renders every doctor / patient screen with fictional data, no backend.
 *
 *     npx vite --config vite.mock.config.ts --port 3100
 *
 * Extends vite.config.ts (via mergeConfig) and adds, without touching any app file:
 *   1. a regex alias that replaces the app's supabase client module with dev-mocks/supabase.mock.ts
 *   2. an index.html transform that logs you in from ?as=doctor|patient|admin|...  (see dev-mocks/bootstrap.ts)
 *   3. isolation: its own dependency cache and NO .env loading, so real Supabase / Google credentials are never read
 *
 * Docs: dev-mocks/README.md
 */
import path from 'path';
import { defineConfig, mergeConfig, type Plugin, type UserConfig, type ConfigEnv } from 'vite';
import baseConfig from './vite.config';
import { sessionBootstrapScript } from './dev-mocks/bootstrap';

const root = __dirname;
const MOCK_MODULE = path.resolve(root, 'dev-mocks/supabase.mock.ts');

/** Inject the session bootstrap + network guard before any app script. */
function devMockSession(): Plugin {
  return {
    name: 'dococlock-dev-mock-session',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [{ tag: 'script', attrs: { 'data-devmock': 'session' }, children: sessionBootstrapScript(), injectTo: 'head-prepend' as const }];
      },
    },
  };
}

export default defineConfig(async (env: ConfigEnv) => {
  const base: UserConfig = typeof baseConfig === 'function' ? await (baseConfig as any)(env) : (baseConfig as UserConfig);

  return mergeConfig(base, {
    plugins: [devMockSession()],

    resolve: {
      alias: [
        // ./supabase, ../supabase, ../../supabase ... (static and dynamic imports alike) -> the in-memory mock.
        // Anchored on both ends so ../supabase/functions/... or @supabase/supabase-js are never matched.
        { find: /^(?:\.{1,2}\/)+supabase(?:\.ts)?$/, replacement: MOCK_MODULE },
      ],
    },

    // Do not read .env / .env.local: nothing in the preview needs (or should see) real credentials.
    // The dev-mocks folder contains no .env files, so import.meta.env.VITE_* stay undefined.
    envDir: path.resolve(root, 'dev-mocks'),
    define: {
      // If any code path ever builds a URL from these it points at a non-resolving host, never the real project.
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify('http://mock.supabase.invalid'),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify('mock-anon-key'),
    },

    // Separate optimizer cache so the mock server never clobbers the real dev server's node_modules/.vite.
    cacheDir: path.resolve(root, 'node_modules/.vite-mock'),

    server: {
      port: 3100,
      strictPort: true,
      host: '127.0.0.1',
      open: false,
    },
  } satisfies UserConfig);
});
