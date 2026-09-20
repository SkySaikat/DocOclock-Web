// Example: sample a hover transition (computed style at t=0/90/210/350/800ms) and save clip screenshots.
// Run:  node dev-mocks/tools/hover-example.mjs http://127.0.0.1:3100/?as=guest '.dcf' /tmp/hover-out 9341
import fs from 'node:fs';
import { launch } from './cdp.mjs';
const [url = 'http://127.0.0.1:3100/?as=guest', selector = '.dcf', outDir = '/tmp/hover-out', port = '9341'] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const c = await launch(Number(port));
try {
  await c.viewport(1440, 900, 2);
  await c.goto(url, 3000);
  await c.eval(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'center',behavior:'instant'})`);
  await c.sleep(500);
  const r = JSON.parse(await c.eval(`(()=>{const b=document.querySelector(${JSON.stringify(selector)}).getBoundingClientRect();return JSON.stringify({x:b.left,y:b.top,w:b.width,h:b.height,sy:scrollY})})()`));
  const clip = { x: r.x - 16, y: r.y + r.sy - 16, width: r.w + 32, height: r.h + 32 };
  const probe = (tag) => c.eval(`(()=>{const cs=getComputedStyle(document.querySelector(${JSON.stringify(selector)}));return ${JSON.stringify(tag)}+' '+JSON.stringify({transform:cs.transform,opacity:cs.opacity,boxShadow:cs.boxShadow.slice(0,60),transition:cs.transition.slice(0,120)})})()`).then(console.log);
  await c.shot(`${outDir}/0-rest.png`, { clip }); await probe('rest');
  await c.move(r.x + r.w / 2 - 30, r.y + r.h / 2 - 30); await c.move(r.x + r.w / 2, r.y + r.h / 2);
  for (const [ms, name] of [[90, '1-t90'], [120, '2-t210'], [140, '3-t350'], [450, '4-t800']]) { await c.sleep(ms); await c.shot(`${outDir}/${name}.png`, { clip }); await probe(name); }
} finally { await c.close(); }
