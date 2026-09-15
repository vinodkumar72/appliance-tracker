// Hunts the "Maximum update depth exceeded" error: visits routes and walks the
// demo-mode app while capturing console errors + component stacks.
import { chromium } from 'playwright';

const BASE = 'http://localhost:8081';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();

const errors = [];
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(msg.text().slice(0, 2000));
});
page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}\n${err.stack?.slice(0, 2000)}`));

const pause = (ms) => page.waitForTimeout(ms);
const visible = (t) => page.getByText(t, { exact: true }).locator('visible=true');
const click = async (t, ms = 1000) => {
  try {
    await visible(t).first().click({ timeout: 8000 });
  } catch {
    errors.push(`(click failed: ${t})`);
  }
  await pause(ms);
};
const TAB_X = { Dashboard: 160, Properties: 480, Tasks: 800, Company: 1120 };
const tab = async (name, ms = 1200) => {
  await page.mouse.click(TAB_X[name], 800 - 30);
  await pause(ms);
};
const report = (label) => {
  if (errors.length) {
    console.log(`\n=== errors after: ${label} ===`);
    for (const e of errors.splice(0)) console.log(e.slice(0, 1200), '\n---');
  } else {
    console.log(`ok: ${label}`);
  }
};

// Public pages
for (const path of ['/', '/sign-in', '/about', '/how-it-works', '/pricing', '/request-invite']) {
  await page.goto(BASE + path);
  await pause(3000);
  report(path);
}

// Into the app via demo mode
await page.goto(BASE + '/sign-in');
await pause(2000);
await click('Continue offline (demo)', 2000);
report('demo mode entry');
await click('Load sample data', 2500);
report('load sample');

for (const t of ['Properties', 'Tasks', 'Company', 'Dashboard']) {
  await tab(t, 1500);
  report(`tab ${t}`);
}

// Walk detail screens + forms
await tab('Properties');
await click('Maple St Duplex', 1500);
report('property detail');
await click('Unit A', 1500);
report('unit detail');
await click('Kitchen refrigerator', 1500);
report('appliance detail');
await page.goBack(); await pause(800);
await page.goBack(); await pause(800);
await click('+ Add property', 1200);
report('property form');
await page.goBack(); await pause(800);
await tab('Company', 1500);
await click('Act as', 1500);
report('act as');
await page.mouse.wheel(0, 900); await pause(600);
await click('+ Add', 1200);
report('member form');

await browser.close();
console.log('hunt done');
