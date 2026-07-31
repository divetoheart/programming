import { chromium } from 'playwright';
import fs from 'node:fs/promises';

await fs.mkdir('artifacts/map-lab', { recursive: true });
const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
const errors = [];
page.on('console', (message) => { if (message.type() === 'error') errors.push(`console: ${message.text()}`); });
page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

await page.goto('http://127.0.0.1:4174/?seed=481516', { waitUntil: 'networkidle' });
await page.waitForFunction(() => document.querySelector('[data-loading]')?.classList.contains('hidden'), null, { timeout: 30000 });
await page.waitForFunction(() => document.querySelectorAll('canvas.map-layer').length === 4);
await page.screenshot({ path: 'artifacts/map-lab/focused-mobile.png', fullPage: true });

const stats = await page.locator('[data-map-stats]').textContent();
if (!stats?.includes('60 tiles') || !stats.includes('20 regions')) throw new Error(`Unexpected map stats: ${stats}`);
const cards = await page.locator('[data-tile-id]').count();
if (cards !== 3) throw new Error(`Expected exactly three selected-region tile cards, received ${cards}`);

await page.locator('[data-world]').click();
await page.waitForTimeout(700);
await page.screenshot({ path: 'artifacts/map-lab/world-mobile.png', fullPage: true });

if (errors.length) throw new Error(errors.join('\n'));
await browser.close();
console.log(JSON.stringify({ stats, cards, errors: 0 }));
