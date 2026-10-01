// Smoke-test the appliance replace flow in demo mode (dev server must be running).
import { chromium } from 'playwright';

const SIZE = { width: 880, height: 660 };
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: SIZE });
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

  // Act as the company owner, open the water heater.
  await page.mouse.click(SIZE.width * 0.875, SIZE.height - 30); // Company tab
  await pause(1500);
  await click('Act as', 2000);
  await page.mouse.click(SIZE.width * 0.375, SIZE.height - 30); // Properties tab
  await pause(1500);
  await click('Maple St Duplex', 2000);
  await page.mouse.wheel(0, 900);
  await pause(600);
  await click('Water heater (basement)', 2000);

  // Replace flow.
  await click('Replace…', 1500);
  console.log('retire screen open:', await visible('Reason').count() > 0 ? 'yes' : 'NO');
  await click('Failed', 600);
  await click('Retire & add the new appliance', 2000);
  console.log('add form open:', (await page.getByText('Scan appliance label').count()) > 0 ? 'yes' : 'NO');

  await page.getByPlaceholder('e.g. Kitchen refrigerator').fill('Water heater (new 2026)');
  await pause(300);
  await visible('Add appliance').last().click();
  await pause(2000);

  // Should be back on the appliance/property stack — go to the property page.
  const retiredHeader = await page.getByText(/Replaced & removed \(1\)/).count();
  const oldOnPage = await page.getByText('Water heater (basement)').count();
  console.log('retired section visible:', retiredHeader > 0 ? 'yes' : 'no (maybe on other screen)');
  console.log('old record still listed somewhere:', oldOnPage > 0 ? 'yes' : 'no');
  await page.screenshot({ path: process.argv[2] ?? 'replace-flow.png' });

  // Open the OLD record via the retired section if present.
  if (oldOnPage > 0) {
    await page.getByText('Water heater (basement)').last().click();
    await pause(1500);
    const banner = await page.getByText(/This record is retired/).count();
    const link = await page.getByText(/See its replacement/).count();
    console.log('retired banner on old record:', banner > 0 ? 'yes' : 'NO');
    console.log('link to successor:', link > 0 ? 'yes' : 'NO');
    await page.screenshot({ path: (process.argv[2] ?? 'replace-flow.png').replace('.png', '-old.png') });
  }
} finally {
  await browser.close();
}
console.log('done');
