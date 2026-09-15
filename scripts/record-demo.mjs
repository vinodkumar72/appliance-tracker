// Records a real walkthrough video of the app for the public /demo page.
// Drives the dev server (http://localhost:8081) in offline demo mode:
// landing → sample data → owner's view → add property → add appliance →
// mark maintenance done → invite a member.
//
// Usage: node scripts/record-demo.mjs   (dev server must be running)
// Output: public/demo.webm

import { chromium } from 'playwright';
import { copyFileSync, mkdirSync, readdirSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';

const BASE = 'http://localhost:8081';
const VIDEO_DIR = 'scripts/video-out';
const SIZE = { width: 1280, height: 800 };

rmSync(VIDEO_DIR, { recursive: true, force: true });
mkdirSync(VIDEO_DIR, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: SIZE,
  recordVideo: { dir: VIDEO_DIR, size: SIZE },
  colorScheme: 'light',
});
const page = await context.newPage();
const pause = (ms) => page.waitForTimeout(ms);
// Inactive tab screens stay mounted (hidden) — match visible elements only.
const visibleText = (text) => page.getByText(text, { exact: true }).locator('visible=true');
const click = async (text, ms = 1200) => {
  await visibleText(text).first().click();
  await pause(ms);
};
// Form submit buttons share their label with the page header — click the last match.
const clickLast = async (text, ms = 1200) => {
  await visibleText(text).last().click();
  await pause(ms);
};
// The bottom tab bar intercepts text-based clicks — click by position instead.
// Four tabs across the 1280px width: centers at 160 / 480 / 800 / 1120.
const TAB_X = { Dashboard: 160, Properties: 480, Tasks: 800, Company: 1120 };
const tab = async (name, ms = 1800) => {
  await page.mouse.click(TAB_X[name], SIZE.height - 30);
  await pause(ms);
};
// Detail screens cover the tab bar — go back through browser history first.
const back = async (ms = 1200) => {
  await page.goBack();
  await pause(ms);
};
const fill = async (placeholder, value) => {
  const field = page.getByPlaceholder(placeholder).first();
  await field.click();
  await field.fill(value);
  await pause(400);
};

try {
  // 1. Landing page
  await page.goto(BASE);
  await pause(3000);
  await page.mouse.wheel(0, 500);
  await pause(1500);
  await page.mouse.wheel(0, -500);
  await pause(1000);

  // 2. Into the app via demo mode
  await click('Sign in', 1500);
  await click('Continue offline (demo)', 2000);
  await click('Load sample data', 3000);

  // 3. Owner's perspective: act as Alice (company owner)
  await tab('Company');
  await click('Act as', 2000); // first member row = Alice Okafor (Owner)

  // 4. Add a property
  await tab('Properties');
  await click('+ Add property', 1500);
  await fill('e.g. Maple St Duplex', 'Sunset Villas');
  await fill('Street, city', '77 Sunset Blvd, Springfield');
  await clickLast('Add property', 2200);

  // 5. Add an appliance to it
  await click('Sunset Villas', 1800);
  await click('+ Add', 1500);
  await fill('e.g. Kitchen refrigerator', 'Kitchen refrigerator');
  await fill('e.g. Whirlpool', 'Samsung');
  await fill('Model number', 'RF28T5001SR');
  await page.mouse.wheel(0, 700);
  await pause(800);
  await clickLast('Add appliance', 2200);

  // 6. Open it — recommended maintenance came free; mark one done
  await click('Kitchen refrigerator', 2000);
  await page.mouse.wheel(0, 700);
  await pause(1200);
  await click('Mark done', 2000);
  await page.mouse.wheel(0, -700);
  await pause(800);

  // Back out of the detail screens to reach the tab bar again.
  await back(); // appliance → property
  await back(); // property → properties tab

  // 7. Tasks board
  await tab('Tasks', 2500);

  // 8. Invite a team member (owner's perspective)
  await tab('Company');
  await page.mouse.wheel(0, 900);
  await pause(1000);
  await click('+ Add', 1500);
  await fill('Full name', 'Sam Field');
  await fill('person@company.com', 'sam@sunsetvillas.com');
  await page.mouse.wheel(0, 600);
  await pause(600);
  await click('Add member & send invite', 2500);
  await click('Close', 1500);

  // 9. Finish on the dashboard
  await tab('Dashboard', 3000);
} catch (e) {
  await page.screenshot({ path: 'scripts/debug-fail.png' });
  throw e;
} finally {
  await context.close();
  await browser.close();
}

// Grab the recorded file and place it in public/.
const files = readdirSync(VIDEO_DIR).filter((f) => f.endsWith('.webm'));
if (files.length === 0) throw new Error('No video was recorded.');
const newest = files
  .map((f) => ({ f, t: statSync(path.join(VIDEO_DIR, f)).mtimeMs }))
  .sort((a, b) => b.t - a.t)[0].f;
copyFileSync(path.join(VIDEO_DIR, newest), 'public/demo.webm');
console.log(`Saved public/demo.webm (${Math.round(statSync('public/demo.webm').size / 1024)} KB)`);
