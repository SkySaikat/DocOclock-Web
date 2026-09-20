/**
 * Minimal headless-Chrome DevTools driver used by the Figma-fidelity checks (real :hover / click / keyboard, computed styles, clip screenshots).
 * The in-app browser pane never sets :hover, so hover/press states MUST be verified through this driver.
 * Usage: import { launch } from './cdp.mjs'; const c = await launch(9341); ... await c.close();   (9341 = a unique CDP port per agent)
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
import os from 'node:os';
import path from 'node:path';
const SCRATCH = process.env.CDP_PROFILE_DIR || path.join(os.tmpdir(), 'dococlock-cdp');

export async function launch(port = 9333) {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${SCRATCH}/chrome-profile-${port}`,
    '--no-first-run', '--no-default-browser-check', '--hide-scrollbars', '--force-color-profile=srgb', 'about:blank',
  ], { stdio: 'ignore' });
  let info;
  for (let i = 0; i < 60; i++) {
    try { info = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break; } catch { await new Promise(r => setTimeout(r, 200)); }
  }
  if (!info) throw new Error('chrome did not start');
  const targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
  const page = targets.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
  let id = 0; const pending = new Map(); const events = [];
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pending.has(d.id)) { const { res, rej } = pending.get(d.id); pending.delete(d.id); d.error ? rej(new Error(JSON.stringify(d.error))) : res(d.result); }
    else if (d.method) events.push(d);
  };
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable'); await send('Runtime.enable');
  const api = {
    send, events,
    async viewport(w, h, dpr = 1, mobile = false) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile }); },
    async goto(url, wait = 2500) { await send('Page.navigate', { url }); await new Promise(r => setTimeout(r, wait)); },
    async eval(expr) { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails)); return r.result.value; },
    async shot(path, opts = {}) { const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: !!opts.full, ...(opts.clip ? { clip: { ...opts.clip, scale: 1 } } : {}) }); fs.writeFileSync(path, Buffer.from(r.data, 'base64')); },
    async move(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); },
    async click(x, y) { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 }); },
    async key(key, code, vk) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: vk }); },
    async media(features) { await send('Emulation.setEmulatedMedia', { features }); },
    sleep: (ms) => new Promise(r => setTimeout(r, ms)),
    async close() { try { await send('Browser.close'); } catch {} ws.close(); proc.kill(); },
  };
  return api;
}
