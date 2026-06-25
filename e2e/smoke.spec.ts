import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const body = (page: Page) => page.locator('body');
const content = (page: Page) => page.locator('main#content');
const fallback = (page: Page) => page.locator('.fallback-shell');

async function expectNewmanMetadata(page: Page) {
  await expect(page).toHaveTitle('newman.foo');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /free-floating spiral galaxy prototype/i,
  );
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://newman.foo/');
}

async function expectNoOldPortfolioShell(page: Page) {
  await expect(page.locator('html')).not.toContainText('Not An Astronaut');
  await expect(page.locator('html')).not.toContainText('Agent Ops');
  await expect(page.locator('html')).not.toContainText('NODE');
  await expect(page.locator('html')).not.toContainText('Mission control');
}

test('root world mode mounts the galaxy canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expect(page.locator('canvas#scene')).toHaveCount(1);
  await expect(content(page)).toBeHidden();
  await expectNewmanMetadata(page);
  await expectNoOldPortfolioShell(page);
});

test('explicit list mode shows the fallback shell and world opt-in', async ({ page }) => {
  await page.goto('/?mode=list');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(content(page)).toBeVisible();
  await expect(fallback(page)).toBeVisible();
  await expect(fallback(page)).toContainText('newman.foo');
  await expect(page.getByRole('link', { name: /enter world/i })).toHaveAttribute('href', '/?mode=world');
  await expect(page.locator('canvas#scene')).toHaveCount(0);
  await expectNewmanMetadata(page);
  await expectNoOldPortfolioShell(page);
});

test('old mission routes show only the prototype fallback', async ({ page }) => {
  await page.goto('/missions/agent-ops');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(fallback(page)).toBeVisible();
  await expect(fallback(page)).toContainText('spiral drift prototype');
  await expect(page.locator('canvas#scene')).toHaveCount(0);
  await expectNewmanMetadata(page);
  await expectNoOldPortfolioShell(page);
});

test('fallback page passes an axe scan without nested main landmarks', async ({ page }) => {
  await page.goto('/?mode=list');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(page.locator('main')).toHaveCount(1);
  await expect(page.locator('main main')).toHaveCount(0);

  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('fallback works without JavaScript on old mission routes', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    baseURL,
    javaScriptEnabled: false,
  });

  try {
    const page = await context.newPage();
    const response = await page.goto('/missions/agent-ops');

    expect(response?.status()).toBe(200);
    await expect(fallback(page)).toBeVisible();
    await expectNewmanMetadata(page);
    await expectNoOldPortfolioShell(page);
    await expect(page.locator('canvas#scene')).toHaveCount(0);
  } finally {
    await context.close();
  }
});
