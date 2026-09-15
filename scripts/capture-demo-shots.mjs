// Captures staged, high-resolution screenshots of the app for the /demo page.
// Usage: node scripts/capture-demo-shots.mjs   (dev server must be running)
// Output: assets/demo/*.png (2x resolution for crisp rendering)

import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const BASE = 'http://localhost:8081';
const OUT = 'assets/demo';
const SIZE = { width: 1280, height: 800 };
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  deviceScaleFactor: 2,
  colorScheme: 'light',
});
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);
const visibleText = (t) => page.getByText(t, { exact: true }).locator('visible=true');
const click = async (t, ms = 1200) => {
  await visibleText(t).first().click();
  await pause(ms);
};
const TAB_X = { Dashboard: 160, Properties: 480, Tasks: 800, Company: 1120 };
const tab = async (name, ms = 1500) => {
  await page.mouse.click(TAB_X[name], SIZE.height - 30);
  await pause(ms);
};
const back = async (ms = 1000) => {
  await page.goBack();
  await pause(ms);
};
const shot = async (name) => {
  await page.screenshot({ path: `${OUT}/${name}.png` });
  console.log(`captured ${name}`);
};

try {
  // Enter demo mode and load the sample portfolio.
  await page.goto(BASE);
  await pause(2500);
  await click('Sign in', 1500);
  await click('Continue offline (demo)', 1800);
  await click('Load sample data', 2500);

  // Act as Alice — the company owner's perspective.
  await tab('Company');
  await click('Act as', 2000); // first row = Alice Okafor (Owner)

  // 1. Dashboard
  await tab('Dashboard', 2200);
  await shot('01-dashboard');

  // 2. Property detail (Maple St Duplex: units, owner card, common systems)
  await tab('Properties');
  await click('Maple St Duplex', 2000);
  await shot('02-property');

  // 3. Appliance detail — the aging water heater (lifespan, history, costs)
  await page.mouse.wheel(0, 900);
  await pause(800);
  await click('Water heater (basement)', 2000);
  await shot('03-appliance-top');
  await page.mouse.wheel(0, 850);
  await pause(900);
  await shot('04-appliance-history');
  await page.mouse.wheel(0, -900);
  await pause(600);

  // 4. Add appliance form (scan button visible)
  await back(); // back to property
  await page.mouse.wheel(0, -900);
  await pause(600);
  await click('+ Add', 1800);
  await shot('05-add-appliance');
  await back(); // back to property
  await back(); // back to properties list

  // 5. Tasks board
  await tab('Tasks', 2200);
  await shot('06-tasks');

  // 6. Member form with role picker (Technician + specific properties)
  await tab('Company');
  await page.mouse.wheel(0, 900);
  await pause(800);
  await click('+ Add', 1600);
  await click('Technician', 900);
  await click('Specific properties', 1200);
  await shot('07-roles');
  await click('Cancel', 1500);

  // 7. The investor's view — act as Maria (condo unit owner), dashboard
  await page.mouse.wheel(0, -900);
  await pause(600);
  await visibleText('Act as').last().click(); // Maria Gomez (last member row)
  await pause(1500);
  await tab('Dashboard', 2200);
  await shot('08-investor');
} finally {
  await context.close();
  await browser.close();
}
console.log('done');
