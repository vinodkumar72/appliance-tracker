// Smoke-test the reports screen in demo mode (dev server must be running).
import { chromium } from 'playwright';

const SIZE = { width: 1100, height: 900 };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: SIZE, deviceScaleFactor: 1.5 });
const pause = (ms) => page.waitForTimeout(ms);
const visible = (t) => page.getByText(t, { exact: true }).locator('visible=true');
const click = async (t, ms = 1200) => {
  await visible(t).first().click();
  await pause(ms);
};

try {
  await page.goto('http://localhost:8081');
  await pause(3000);
  await click('Sign in', 1500);
  await click('Continue offline (demo)', 1800);
  await click('Load sample data', 2500);
  await click('📊 Reports', 2000);

  for (const tab of ['Appliance inventory', 'Costs', 'Warranty expiration', 'Maintenance due']) {
    await click(tab, 1200);
  }
  console.log('reports render:', (await page.getByText('Spend YTD').count()) > 0 ? 'yes' : 'NO');
  await click('Costs', 1200);
  await page.screenshot({ path: process.argv[2] ?? 'reports.png', fullPage: false });
} finally {
  await browser.close();
}
console.log('done');
