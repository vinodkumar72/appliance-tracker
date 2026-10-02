import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1100, height: 700 }, deviceScaleFactor: 1.5 });
const pause = (ms) => p.waitForTimeout(ms);
const click = async (t, ms = 1200) => {
  await p.getByText(t, { exact: true }).locator('visible=true').first().click();
  await pause(ms);
};
await p.goto('http://localhost:8081');
await pause(3000);
await click('Sign in', 1500);
await click('Continue offline (demo)', 1800);
await click('Load sample data', 2500);
await p.screenshot({ path: process.argv[2] });
await b.close();
