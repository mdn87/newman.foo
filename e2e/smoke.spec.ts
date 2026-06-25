import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { inflateSync } from 'node:zlib';

const body = (page: Page) => page.locator('body');
const content = (page: Page) => page.locator('main#content');
const fallback = (page: Page) => page.locator('.fallback-shell');
const sceneCanvas = (page: Page) => page.locator('canvas#scene');

type CanvasSample = {
  width: number;
  height: number;
  pixels: Uint8Array;
};

type CanvasRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

function byte(values: Uint8Array, offset: number) {
  const value = values[offset];
  if (value === undefined) throw new Error(`Missing byte at offset ${offset}`);
  return value;
}

async function readCanvasPixels(canvas: Locator, region?: CanvasRegion): Promise<CanvasSample> {
  const sample = decodePng(await canvas.screenshot());
  return region ? cropSample(sample, region) : sample;
}

function decodePng(png: Buffer): CanvasSample {
  const signature = '89504e470d0a1a0a';
  expect(png.subarray(0, 8).toString('hex')).toBe(signature);

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];

  while (offset < png.length) {
    const length = png.readUInt32BE(offset);
    const type = png.subarray(offset + 4, offset + 8).toString('ascii');
    const data = png.subarray(offset + 8, offset + 8 + length);
    offset += length + 12;

    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = byte(data, 8);
      colorType = byte(data, 9);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }

  expect(bitDepth).toBe(8);
  const channels = channelCount(colorType);
  const rowBytes = width * channels;
  const raw = inflateSync(Buffer.concat(idat));
  const unfiltered = new Uint8Array(rowBytes * height);

  for (let row = 0; row < height; row += 1) {
    const sourceOffset = row * (rowBytes + 1);
    const targetOffset = row * rowBytes;
    const filter = byte(raw, sourceOffset);
    const previous = row === 0 ? null : unfiltered.subarray(targetOffset - rowBytes, targetOffset);

    for (let col = 0; col < rowBytes; col += 1) {
      const value = byte(raw, sourceOffset + 1 + col);
      const left = col >= channels ? byte(unfiltered, targetOffset + col - channels) : 0;
      const up = previous ? byte(previous, col) : 0;
      const upLeft = previous && col >= channels ? byte(previous, col - channels) : 0;
      unfiltered[targetOffset + col] = (value + filterValue(filter, left, up, upLeft)) & 0xff;
    }
  }

  return { width, height, pixels: toRgba(unfiltered, width, height, colorType) };
}

function channelCount(colorType: number) {
  if (colorType === 0) return 1;
  if (colorType === 2) return 3;
  if (colorType === 4) return 2;
  if (colorType === 6) return 4;
  throw new Error(`Unsupported PNG color type: ${colorType}`);
}

function filterValue(filter: number, left: number, up: number, upLeft: number) {
  if (filter === 0) return 0;
  if (filter === 1) return left;
  if (filter === 2) return up;
  if (filter === 3) return Math.floor((left + up) / 2);
  if (filter === 4) return paeth(left, up, upLeft);
  throw new Error(`Unsupported PNG filter: ${filter}`);
}

function paeth(left: number, up: number, upLeft: number) {
  const p = left + up - upLeft;
  const pa = Math.abs(p - left);
  const pb = Math.abs(p - up);
  const pc = Math.abs(p - upLeft);
  if (pa <= pb && pa <= pc) return left;
  return pb <= pc ? up : upLeft;
}

function toRgba(raw: Uint8Array, width: number, height: number, colorType: number) {
  const pixels = new Uint8Array(width * height * 4);
  const channels = channelCount(colorType);

  for (let source = 0, target = 0; source < raw.length; source += channels, target += 4) {
    if (colorType === 0) {
      pixels[target] = byte(raw, source);
      pixels[target + 1] = byte(raw, source);
      pixels[target + 2] = byte(raw, source);
      pixels[target + 3] = 255;
    } else if (colorType === 2) {
      pixels[target] = byte(raw, source);
      pixels[target + 1] = byte(raw, source + 1);
      pixels[target + 2] = byte(raw, source + 2);
      pixels[target + 3] = 255;
    } else if (colorType === 4) {
      pixels[target] = byte(raw, source);
      pixels[target + 1] = byte(raw, source);
      pixels[target + 2] = byte(raw, source);
      pixels[target + 3] = byte(raw, source + 1);
    } else {
      pixels[target] = byte(raw, source);
      pixels[target + 1] = byte(raw, source + 1);
      pixels[target + 2] = byte(raw, source + 2);
      pixels[target + 3] = byte(raw, source + 3);
    }
  }

  return pixels;
}

function cropSample(sample: CanvasSample, region: CanvasRegion): CanvasSample {
  const x = Math.max(0, Math.floor(region.x * sample.width));
  const y = Math.max(0, Math.floor(region.y * sample.height));
  const width = Math.max(1, Math.min(sample.width - x, Math.floor(region.width * sample.width)));
  const height = Math.max(1, Math.min(sample.height - y, Math.floor(region.height * sample.height)));
  const pixels = new Uint8Array(width * height * 4);

  for (let row = 0; row < height; row += 1) {
    const sourceStart = ((y + row) * sample.width + x) * 4;
    const sourceEnd = sourceStart + width * 4;
    pixels.set(sample.pixels.subarray(sourceStart, sourceEnd), row * width * 4);
  }

  return { width, height, pixels };
}

function sampledPixelCount(sample: CanvasSample, predicate: (r: number, g: number, b: number, a: number, offset: number) => boolean) {
  const stride = Math.max(4, Math.floor((sample.width * sample.height) / 12_000) * 4);
  let matches = 0;
  let total = 0;

  for (let offset = 0; offset < sample.pixels.length; offset += stride) {
    total += 1;
    if (predicate(
      byte(sample.pixels, offset),
      byte(sample.pixels, offset + 1),
      byte(sample.pixels, offset + 2),
      byte(sample.pixels, offset + 3),
      offset,
    )) {
      matches += 1;
    }
  }

  return { matches, total, ratio: total === 0 ? 0 : matches / total };
}

function nonWhitePixelRatio(sample: CanvasSample) {
  return sampledPixelCount(sample, (r, g, b, a) => a > 0 && (r < 245 || g < 245 || b < 245)).ratio;
}

function changedPixelRatio(before: CanvasSample, after: CanvasSample) {
  expect(after.width).toBe(before.width);
  expect(after.height).toBe(before.height);

  return sampledPixelCount(before, (r, g, b, _a, offset) => {
    const channelDelta =
      Math.abs(r - byte(after.pixels, offset))
      + Math.abs(g - byte(after.pixels, offset + 1))
      + Math.abs(b - byte(after.pixels, offset + 2));
    return channelDelta > 30;
  }).ratio;
}

async function waitForWorldCanvas(page: Page) {
  const canvas = sceneCanvas(page);
  await expect(canvas).toHaveCount(1);
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => {
      const sample = await readCanvasPixels(canvas);
      return nonWhitePixelRatio(sample);
    })
    .toBeGreaterThanOrEqual(0.01);
  return canvas;
}

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

test('bare root in world mode mounts the galaxy canvas without fallback opt-in', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await waitForWorldCanvas(page);
  await expect(content(page)).toBeHidden();
  await expect(page.getByRole('link', { name: /enter world/i })).toHaveCount(0);
  await expectNewmanMetadata(page);
  await expectNoOldPortfolioShell(page);
});

test('world canvas renders visible content and responds to forward input', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');

  const canvas = await waitForWorldCanvas(page);
  await canvas.screenshot();

  const before = await readCanvasPixels(canvas);
  expect(nonWhitePixelRatio(before)).toBeGreaterThanOrEqual(0.01);

  await page.keyboard.down('w');
  await page.waitForTimeout(800);
  await page.keyboard.up('w');

  const after = await readCanvasPixels(canvas);
  expect(changedPixelRatio(before, after)).toBeGreaterThanOrEqual(0.005);
});

test('world canvas shows the avatar near the forward view', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');

  const canvas = await waitForWorldCanvas(page);
  const avatarRegion = await readCanvasPixels(canvas, {
    x: 0.34,
    y: 0.42,
    width: 0.28,
    height: 0.36,
  });

  expect(nonWhitePixelRatio(avatarRegion)).toBeGreaterThanOrEqual(0.01);
});

test('explicit list mode shows the fallback shell and world opt-in', async ({ page }) => {
  await page.goto('/?mode=list');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(content(page)).toBeVisible();
  await expect(fallback(page)).toBeVisible();
  await expect(fallback(page)).toContainText('newman.foo');
  await expect(page.getByRole('link', { name: /enter world/i })).toHaveAttribute('href', '/?mode=world');
  await expect(sceneCanvas(page)).toHaveCount(0);
  await expectNewmanMetadata(page);
  await expectNoOldPortfolioShell(page);
});

test('old mission routes show only the prototype fallback', async ({ page }) => {
  await page.goto('/missions/agent-ops');

  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(fallback(page)).toBeVisible();
  await expect(fallback(page)).toContainText('spiral drift prototype');
  await expect(fallback(page)).not.toContainText('Agent Ops');
  await expect(fallback(page)).not.toContainText('Mission control');
  await expect(sceneCanvas(page)).toHaveCount(0);
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
    await expect(sceneCanvas(page)).toHaveCount(0);
  } finally {
    await context.close();
  }
});
