// Playwright smoke test against a running server (default: `npm run preview` on :4173).
// Usage: BASE_URL=http://localhost:4173 SHOTS=/some/dir node tests/smoke.mjs
// Runs in plain Chromium, i.e. the localStorage backend.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const BASE = process.env.BASE_URL ?? 'http://localhost:4173';
const SHOTS = process.env.SHOTS ?? 'test-results';
mkdirSync(SHOTS, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 820 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
const shot = (name) => page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false });
const step = (s) => console.log(`- ${s}`);

// Use the fixture unit only if there is no real content.
await page.goto(`${BASE}/#/today`);
await page.waitForSelector('h1:has-text("Today")');
const noContent = await page.locator('text=No curriculum units found').count();
const q = noContent ? '?fixtures' : '';
if (noContent) await page.goto(`${BASE}/${q}#/today`);
await page.waitForSelector('h1:has-text("Today")');
step(`Today loaded (${noContent ? 'fixture' : 'real'} content)`);
await shot('01-today');

await page.keyboard.press('u');
await page.waitForSelector('h1:has-text("Units")');
step(`Units: ${await page.locator('table.units tbody tr').count()} rows`);
await shot('02-units');

const firstUnit = page.locator('table.units a.title').first();
const unitHref = await firstUnit.getAttribute('href');
await firstUnit.click();
await page.waitForSelector('text=Start drills');
step(`Unit page ${unitHref}`);
await shot('03-unit');

// Drills: answer two items.
await page.keyboard.press('d');
await page.waitForSelector('.drill .q');
for (let i = 0; i < 2; i++) {
  const type = await page.locator('.drill .q').getAttribute('data-type');
  if (type === 'choice') await page.keyboard.press('1');
  else if (type === 'cloze') {
    for (const gap of await page.locator('.drill input.gap').all()) await gap.fill('der');
    await page.keyboard.press('Enter');
  } else {
    await page.locator('.drill input.answer').fill('Ich weiß es nicht');
    await page.keyboard.press('Enter');
  }
  await page.waitForSelector('.feedback');
  if (i === 0) await shot('04-drill-feedback');
  step(`drill ${i + 1} (${type}): ${(await page.locator('.feedback .verdict').innerText()).split('\n')[0]}`);
  await page.keyboard.press('Enter');
}
await page.keyboard.press('Escape');
await page.waitForSelector('text=Start drills');

// Add vocab to reviews.
await page.click('button:has-text("Add vocab to reviews")');
await page.waitForSelector('text=Vocab in reviews');
step('vocab added to reviews');

// Two reviews (new recognition cards).
await page.goto(`${BASE}/${q}#/today`);
await page.waitForSelector('h1:has-text("Today")');
await page.click('button:has-text("Learn new")');
await page.waitForSelector('.review .face');
for (let i = 0; i < 2; i++) {
  const prod = await page.locator('.review input.answer').count();
  if (prod) {
    await page.locator('.review input.answer').fill('der Test');
    await page.keyboard.press('Enter');
  } else await page.keyboard.press('Space');
  await page.waitForSelector('.grades');
  if (i === 0) await shot('05-review-back');
  await page.keyboard.press('3');
  await page.waitForTimeout(150);
}
step('two reviews graded');

// Reload and confirm persistence.
await page.goto(`${BASE}/${q}#/today`);
await page.reload();
await page.waitForSelector('h1:has-text("Today")');
const stored = await page.evaluate(() => ({
  logs: JSON.parse(localStorage.getItem('stufe:review_log') ?? '[]').length,
  cards: Object.keys(JSON.parse(localStorage.getItem('stufe:cards') ?? '{}')).length,
  progress: JSON.parse(localStorage.getItem('stufe:unit_progress') ?? '{}'),
}));
assert.equal(stored.logs, 2, 'two review logs persisted');
assert.ok(stored.cards > 0, 'cards persisted');
const studied = await page.locator('text=2 cards studied today').count();
assert.equal(studied, 1, 'Today shows the 2 studied cards after reload');
const unitId = unitHref.split('/').pop();
assert.equal(stored.progress[unitId]?.status, 'in_progress');
step(`persisted after reload: ${stored.cards} cards, ${stored.logs} logs, unit ${unitId} in_progress`);
await shot('06-today-after');

await page.goto(`${BASE}/${q}#/vocab`);
await page.waitForSelector('h1:has-text("Vocabulary")');
await shot('07-vocab');
await page.goto(`${BASE}/${q}#/stats`);
await page.waitForSelector('h1:has-text("Stats")');
await shot('08-stats');

// Narrow window + dark theme.
await page.emulateMedia({ colorScheme: 'dark' });
await page.setViewportSize({ width: 620, height: 820 });
await page.goto(`${BASE}/${q}#${unitHref.slice(1)}`);
await page.waitForSelector('text=Start drills');
await shot('09-unit-narrow-dark');
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
step(`narrow layout horizontal overflow: ${overflow}`);

await browser.close();
if (errors.length) {
  console.error('Page errors:\n' + errors.join('\n'));
  process.exit(1);
}
console.log('SMOKE OK');
