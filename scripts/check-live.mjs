import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 800 } });
const scripts = [];
p.on('request', (r) => {
  if (r.url().includes('entry-')) scripts.push(r.url());
});
await p
  .goto('https://propslane.com/', { waitUntil: 'networkidle', timeout: 45000 })
  .catch((e) => console.log('nav:', e.message));
await p.waitForTimeout(4000);
console.log('LIVE BUNDLE:', scripts.join(', ') || 'none detected');
await p.screenshot({ path: process.argv[2] });
await b.close();
