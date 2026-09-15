// Round 2: modals, forms, pickers, narrow viewport.
import { chromium } from 'playwright';

const BASE = 'http://localhost:8081';
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await context.newPage();
const errors = [];
page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 1500)));
page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
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
const clickLast = async (t, ms = 1000) => {
  try {
    await visible(t).last().click({ timeout: 8000 });
  } catch {
    errors.push(`(clickLast failed: ${t})`);
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
    console.log(`\n=== errors: ${label} ===`);
    for (const e of errors.splice(0)) console.log(e, '\n---');
  } else console.log(`ok: ${label}`);
};

// Enter demo + sample data (platform owner)
await page.goto(BASE + '/sign-in');
await pause(2000);
await click('Continue offline (demo)', 1500);
await click('Load sample data', 2500);
report('setup');

// Account modal
await tab('Company', 1500);
await page.mouse.wheel(0, 1600);
await pause(600);
await click('Account & sync', 1800);
report('account modal');
await page.goBack();
await pause(800);

// Onboard company form incl. plan chips
await page.mouse.wheel(0, -2000);
await pause(600);
await click('+ Onboard company', 1500);
await click('Pro — $499/yr', 800);
await click('Enterprise — $1499/yr', 800).catch(() => {});
report('org-form + plan chips');
await clickLast('Cancel', 1000);

// Plan form
await click('Pro', 1500);
report('plan form open');
await clickLast('Cancel', 1000);

// Subscription form
await click('Plan', 1500);
await click('Start 14-day trial', 1500);
report('subscription form + trial');

// Property form with date picker interaction
await tab('Properties', 1500);
await click('+ Add property', 1500);
report('property form');
await clickLast('Cancel', 1000);

// Appliance form: chips + date field + switch
await click('Maple St Duplex', 1500);
await page.mouse.wheel(0, 900);
await pause(500);
await click('+ Add', 1500);
await click('❄️ HVAC', 800);
await click('🍽️ Dishwasher', 800);
const dateInput = page.locator('input[type="date"]').first();
try {
  await dateInput.fill('2024-05-10');
  await pause(600);
} catch {
  errors.push('(date fill failed)');
}
report('appliance form interactions');
await clickLast('Cancel', 1000);

// Schedule + log forms
await page.mouse.wheel(0, -900);
await pause(400);
await click('Central HVAC', 1500);
await page.mouse.wheel(0, 700);
await pause(400);
await click('+ Add', 1200);
report('schedule form');
await clickLast('Cancel', 800);
await click('+ Log', 1200);
report('log form');
await clickLast('Cancel', 800);

// Narrow viewport pass (phone-ish) over main screens
await page.setViewportSize({ width: 390, height: 780 });
await pause(500);
for (const path of ['/', '/how-it-works', '/pricing']) {
  await page.goto(BASE + path);
  await pause(2500);
  report(`narrow ${path}`);
}

await browser.close();
console.log('hunt2 done');
