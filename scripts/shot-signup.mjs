import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 850 }, deviceScaleFactor: 1.5 });
await p.goto('http://localhost:8081/sign-in?mode=signup');
await p.waitForTimeout(8000);
await p.screenshot({ path: process.argv[2] });
await b.close();
