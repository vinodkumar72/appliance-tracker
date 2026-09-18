// Renders all PropsLane brand assets (concept C — "Roof Road") from one SVG
// definition, via headless Chromium. Re-run after any artwork tweak:
//   node scripts/render-brand-assets.mjs
import { chromium } from 'playwright';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const OUT = resolve('assets/images');
mkdirSync(OUT, { recursive: true });

const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
    <stop offset="0" stop-color="#3F7DF7"/><stop offset=".6" stop-color="#2158E0"/><stop offset="1" stop-color="#12329B"/>
  </linearGradient>
  <linearGradient id="roof" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#EAF2FF"/><stop offset=".5" stop-color="#FFFFFF"/><stop offset="1" stop-color="#DCE9FF"/>
  </linearGradient>
  <radialGradient id="glow" cx="0.5" cy="0.32" r="0.6">
    <stop offset="0" stop-color="#FFFFFF" stop-opacity=".25"/><stop offset="1" stop-color="#FFFFFF" stop-opacity="0"/>
  </radialGradient>
  <mask id="doorcut">
    <rect x="0" y="0" width="100" height="100" fill="#fff"/>
    <rect x="45.5" y="68" width="9" height="16" rx="2.5" fill="#000"/>
  </mask>
`;

// The full-color mark (roof-road + house + porch light).
const MARK = `
  <path d="M13 60 L50 24 L87 60" fill="none" stroke="url(#roof)" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 60 L50 24 L87 60" fill="none" stroke="#1D4ED8" stroke-width="2.8" stroke-dasharray="6.5 6.5" stroke-linecap="round"/>
  <rect x="34" y="60" width="32" height="24" rx="6" fill="#FFFFFF"/>
  <rect x="45.5" y="68" width="9" height="16" rx="2.5" fill="#2158E0"/>
  <circle cx="61" cy="55" r="4" fill="#FBBF24"/>
`;

// Single-color (white) mark: solid roof, door punched out to transparency.
const MARK_MONO = `
  <path d="M13 60 L50 24 L87 60" fill="none" stroke="#FFFFFF" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/>
  <g mask="url(#doorcut)"><rect x="34" y="60" width="32" height="24" rx="6" fill="#FFFFFF"/></g>
  <circle cx="61" cy="55" r="4" fill="#FFFFFF"/>
`;

const svg = (inner, { size, transparent = false }) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
     <defs>${DEFS}</defs>${inner}</svg>`;

const center = (inner, scale) =>
  `<g transform="translate(${(100 - 100 * scale) / 2} ${(100 - 100 * scale) / 2}) scale(${scale})">${inner}</g>`;

const ASSETS = [
  // App icon: full-bleed square, the OS rounds the corners itself.
  {
    file: 'icon.png', size: 1024, transparent: false,
    body: `<rect width="100" height="100" fill="url(#bg)"/>
           <rect width="100" height="100" fill="url(#glow)"/>${center(MARK, 0.94)}`,
  },
  // Android adaptive: foreground mark inside the safe zone, background separate.
  {
    file: 'android-icon-foreground.png', size: 1024, transparent: true,
    body: center(MARK, 0.6),
  },
  {
    file: 'android-icon-background.png', size: 1024, transparent: false,
    body: `<rect width="100" height="100" fill="url(#bg)"/><rect width="100" height="100" fill="url(#glow)"/>`,
  },
  {
    file: 'android-icon-monochrome.png', size: 1024, transparent: true,
    body: center(MARK_MONO, 0.6),
  },
  // Web favicon + in-app logo mark: rounded badge (browsers don't mask).
  {
    file: 'favicon.png', size: 64, transparent: true,
    body: `<rect width="100" height="100" rx="23" fill="url(#bg)"/>
           <rect width="100" height="100" rx="23" fill="url(#glow)"/>${center(MARK, 0.94)}`,
  },
  {
    file: 'logo-mark.png', size: 256, transparent: true,
    body: `<rect width="100" height="100" rx="23" fill="url(#bg)"/>
           <rect width="100" height="100" rx="23" fill="url(#glow)"/>${center(MARK, 0.94)}`,
  },
  // Splash: white mark on transparent; the splash background color shows
  // through the punched-out door.
  {
    file: 'splash-icon.png', size: 512, transparent: true,
    body: MARK_MONO,
  },
];

const browser = await chromium.launch();
for (const a of ASSETS) {
  const page = await browser.newPage({ viewport: { width: a.size, height: a.size } });
  await page.setContent(
    `<!doctype html><html><body style="margin:0;${a.transparent ? '' : 'background:#000;'}">${svg(a.body, a)}</body></html>`,
  );
  await page.screenshot({
    path: resolve(OUT, a.file),
    omitBackground: a.transparent,
    clip: { x: 0, y: 0, width: a.size, height: a.size },
  });
  await page.close();
  console.log('rendered', a.file, `${a.size}x${a.size}`);
}
await browser.close();
