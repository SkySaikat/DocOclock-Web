/**
 * Builds the tiny inline <script> that vite.mock.config.ts injects at the very top of <head>,
 * i.e. BEFORE the app bundle runs:
 *
 *   ?as=doctor | patient | admin | hospital | branch | assistant | guest
 *
 *  - writes the matching localStorage session (keys read by storage.ts, sessionExpiresAt far in the future)
 *  - remembers the choice in sessionStorage so later navigations / reloads without `?as=` keep it
 *  - an in-app logout flips the remembered choice to "guest" (so a reload does not silently log you back in)
 *  - guards against any request to a *.supabase.* host (belt and braces: the mock client never makes one)
 *  - prefixes the document title with [MOCK] so preview tabs are unmistakable
 */
import { AS_ALIASES, IDENTITIES, SESSION_KEYS } from './identities';

export function sessionBootstrapScript(): string {
  const payload = JSON.stringify({ identities: IDENTITIES, aliases: AS_ALIASES, keys: SESSION_KEYS });
  return `(function () {
  var CFG = ${payload};
  var REMEMBER = 'devmock:as';
  var FAR_FUTURE = Date.now() + 10 * 365 * 24 * 3600 * 1000;
  var origRemove = Storage.prototype.removeItem;
  var origSet = Storage.prototype.setItem;

  // ── 0. per-page-load error log (window.__DEVMOCK_ERRORS__) ──────────
  // The browser console buffer accumulates across navigations; this array is reset by every full page load,
  // so  JSON.stringify(window.__DEVMOCK_ERRORS__)  answers "did THIS route log any errors?".
  window.__DEVMOCK_ERRORS__ = [];
  var origConsoleError = console.error;
  console.error = function () {
    try { window.__DEVMOCK_ERRORS__.push({ t: 'console.error', m: Array.prototype.slice.call(arguments).map(function (a) { return a && a.message ? a.message : (typeof a === 'string' ? a : (function () { try { return JSON.stringify(a); } catch (e) { return String(a); } })()); }).join(' ').slice(0, 400) }); } catch (e) {}
    return origConsoleError.apply(console, arguments);
  };
  window.addEventListener('error', function (e) { window.__DEVMOCK_ERRORS__.push({ t: 'window.error', m: String(e.message || e.error).slice(0, 400) }); });
  window.addEventListener('unhandledrejection', function (e) { window.__DEVMOCK_ERRORS__.push({ t: 'unhandledrejection', m: String((e.reason && e.reason.message) || e.reason).slice(0, 400) }); });

  // ── 1. network guard ────────────────────────────────────────────────
  var BLOCK = /(^|\\.)supabase\\.(co|in|net|com)$/i;
  window.__DEVMOCK_BLOCKED__ = [];
  function hostOf(u) { try { return new URL(u, location.href).hostname; } catch (e) { return ''; } }
  function blocked(u) {
    var h = hostOf(u);
    if (BLOCK.test(h)) { window.__DEVMOCK_BLOCKED__.push(h); console.error('[dev-mocks] blocked request to ' + h); return true; }
    return false;
  }
  var origFetch = window.fetch;
  if (origFetch) window.fetch = function (input) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    if (blocked(url)) return Promise.reject(new TypeError('[dev-mocks] blocked request to a Supabase host'));
    return origFetch.apply(this, arguments);
  };
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (m, url) {
    if (blocked(String(url))) throw new TypeError('[dev-mocks] blocked request to a Supabase host');
    return origOpen.apply(this, arguments);
  };
  var OrigWS = window.WebSocket;
  if (OrigWS) window.WebSocket = function (url, protocols) {
    if (blocked(String(url))) throw new TypeError('[dev-mocks] blocked WebSocket to a Supabase host');
    return protocols === undefined ? new OrigWS(url) : new OrigWS(url, protocols);
  };
  if (OrigWS) { window.WebSocket.prototype = OrigWS.prototype; ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'].forEach(function (k) { window.WebSocket[k] = OrigWS[k]; }); }

  // ── 2. session bootstrap ────────────────────────────────────────────
  try {
    var ss = window.sessionStorage;
    var raw = new URLSearchParams(location.search).get('as');
    var fromQuery = raw ? CFG.aliases[raw.toLowerCase().replace(/[^a-z_]/g, '')] : null;
    if (raw && !fromQuery) console.warn('[dev-mocks] unknown ?as=' + raw + ' (use doctor | patient | admin | hospital | branch | assistant | guest)');
    var as = fromQuery || ss.getItem(REMEMBER) || 'guest';
    if (fromQuery) ss.setItem(REMEMBER, fromQuery);

    var id = CFG.identities[as];
    var hasSession = CFG.keys.some(function (k) { return !!localStorage.getItem(k); });
    // Re-write the session when ?as= is present, or when nothing is stored yet. Otherwise leave whatever the app has
    // (e.g. a profile edited during the preview) untouched.
    if (fromQuery || !hasSession) {
      CFG.keys.forEach(function (k) { origRemove.call(localStorage, k); });
      if (id) {
        var session = JSON.parse(JSON.stringify(id.session));
        session.sessionExpiresAt = FAR_FUTURE;
        origSet.call(localStorage, id.storageKey, JSON.stringify(session));
      }
    }

    // In-app logout removes the session key -> remember "guest" so a reload stays logged out.
    Storage.prototype.removeItem = function (k) {
      if (this === window.localStorage && CFG.keys.indexOf(k) >= 0) { try { ss.setItem(REMEMBER, 'guest'); } catch (e) {} }
      return origRemove.apply(this, arguments);
    };
    window.__DEVMOCK_AS__ = as;
    document.documentElement.setAttribute('data-devmock-as', as);
  } catch (e) { console.warn('[dev-mocks] session bootstrap failed', e); }

  // ── 3. title marker ────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function () {
    if (document.title.indexOf('[MOCK]') !== 0) document.title = '[MOCK] ' + document.title;
  });
})();`;
}
