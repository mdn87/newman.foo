import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const status = (page: Page) => page.locator('.hud-strip .status');
const body = (page: Page) => page.locator('body');
const sections = (page: Page) => page.locator('main#content section');

async function expectHudNode(page: Page, text: string | RegExp, timeout = 5_000) {
  await expect(status(page)).toHaveText(text, { timeout });
}

test('world mode advances through all six nodes and ends at /contact', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expectHudNode(page, /^NODE 01\/06\b/);

  for (const node of [
    'NODE 02/06 · AGENT OPS',
    'NODE 03/06 · FUSION FORGE',
    'NODE 04/06 · MAKER BAY',
    'NODE 05/06 · PRE-FLIGHT HISTORY',
    'NODE 06/06 · OPEN A CHANNEL',
  ]) {
    await page.keyboard.press('ArrowDown');
    await expectHudNode(page, node, 7_000);
  }

  await expect(page).toHaveURL(/\/contact\?mode=world$/);
  expect(new URL(page.url()).pathname).toBe('/contact');
});

test('deep link to maker bay in world mode spawns node 04', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/missions/maker-bay?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expectHudNode(page, 'NODE 04/06 · MAKER BAY');
});

test('list toggle from world mode switches to list mode and shows all sections', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expectHudNode(page, /^NODE 01\/06\b/);

  await page.getByRole('link', { name: /\[\s*list\s*\]/i }).click();

  await expect(page).toHaveURL(/\/\?mode=list$/);
  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(sections(page)).toHaveCount(6);
  await expect(page.locator('main#content')).toBeVisible();
});

test('reduced motion defaults to list mode', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(sections(page)).toHaveCount(6);
  await expect(page.locator('canvas#scene')).toHaveCount(0);
});

test('reduced motion with explicit world opt-in transits instantly', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expectHudNode(page, /^NODE 01\/06\b/);

  await page.keyboard.press('ArrowDown');

  await expectHudNode(page, 'NODE 02/06 · AGENT OPS', 1_000);
  await expect(page).toHaveURL(/\/missions\/agent-ops\?mode=world$/);
});

test('list page passes an axe scan', async ({ page }) => {
  await page.goto('/?mode=list');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('prerendered route serves content without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();
    const response = await page.goto('/missions/maker-bay/');

    expect(response?.status()).toBe(200);
    await expect(page).toHaveTitle('Maker Bay — Not An Astronaut');
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      'href',
      'https://notanastronaut.com/missions/maker-bay',
    );
    await expect(page.locator('#maker-bay')).toContainText('Firmware, toolpaths');
    await expect(sections(page)).toHaveCount(6);
    await expect(page.locator('canvas#scene')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
