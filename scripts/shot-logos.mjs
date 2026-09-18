import { chromium } from 'playwright';

const [, , htmlPath, outPath] = process.argv;
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1180, height: 900 }, deviceScaleFactor: 2 });
await page.goto('file:///' + htmlPath.replace(/\\/g, '/'));
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(600);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();
