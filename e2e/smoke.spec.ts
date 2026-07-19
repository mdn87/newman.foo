import { AxeBuilder } from '@axe-core/playwright';
import { expect, test, devices, type Page } from '@playwright/test';

const body = (page: Page) => page.locator('body');
const sections = (page: Page) => page.locator('main#content section');

test('list toggle from world mode switches to list mode and shows all sections', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expect(page.locator('canvas#scene')).toBeVisible();

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

test('reduced motion with explicit world opt-in still enters world mode', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?mode=world');

  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expect(page.locator('canvas#scene')).toBeVisible();
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

test('home in world mode boots the free-fly galaxy canvas', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  await expect(body(page)).toHaveAttribute('data-mode', 'world');
  await expect(page.locator('canvas#scene')).toBeVisible();
  // .hud-strip belongs to the unused list-mode Hud; the free-fly HUD's control
  // hint lives in the telemetry panel instead (FlightHud, src/hud/flight-hud.ts).
  await expect(page.locator('.flight-telemetry .flight-controls')).toContainText(/move/i, { timeout: 10_000 }); // WASM init can take a moment
});

test('a mission deep-link renders the list surface (portfolio intact)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/missions/maker-bay'); // not the home route -> list
  await expect(body(page)).toHaveAttribute('data-mode', 'list');
  await expect(sections(page)).toHaveCount(6);
  await expect(page.locator('main#content')).toBeVisible();
});

test('the world canvas actually renders the galaxy (non-blank)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  await expect(page.locator('canvas#scene')).toBeVisible();
  const darkPixels = await page.evaluate(async () => {
    const c = document.getElementById('scene') as HTMLCanvasElement;
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext;
    const W = c.width, H = c.height;
    const px = new Uint8Array(W * H * 4);
    let best = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let dark = 0;
      for (let p = 0; p < px.length; p += 4) if (px[p]! < 230 || px[p + 1]! < 230 || px[p + 2]! < 230) dark++;
      best = Math.max(best, dark);
    }
    return best;
  });
  expect(darkPixels).toBeGreaterThan(500);
});

test('world mode HUD renders the three instrument regions, compass bottom-centered', async ({ page }) => {
  // Ported from codex/toroidal-flight-hud's "boots the spaceship world and HUD" +
  // "keeps the compass bottom-centered" tests, adapted: this world has a galaxy
  // and dark-mode tokens (D1), so panels are semi-transparent theme colors, not
  // opaque white -- assert presence/geometry only, not an exact background color.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.setViewportSize({ width: 1280, height: 800 }); // above the 900px HUD breakpoint
  await page.goto('/?mode=world');
  await expect(page.locator('canvas#scene')).toBeVisible();
  await expect(page.locator('.flight-telemetry .flight-wrap')).toContainText(/GRID (OK|WRAP)/, { timeout: 10_000 });

  const minimap = page.locator('.flight-minimap');
  const compass = page.locator('.flight-compass');
  const telemetry = page.locator('.flight-telemetry');
  await expect(minimap).toBeVisible();
  await expect(compass).toBeVisible();
  await expect(telemetry).toBeVisible();

  const [minimapBox, compassBox, telemetryBox] = await Promise.all([
    minimap.boundingBox(), compass.boundingBox(), telemetry.boundingBox(),
  ]);
  if (!minimapBox || !compassBox || !telemetryBox) throw new Error('an instrument region has no layout box');

  const viewportWidth = page.viewportSize()!.width;
  const compassCenterX = compassBox.x + compassBox.width / 2;
  expect(Math.abs(compassCenterX - viewportWidth / 2)).toBeLessThanOrEqual(2); // compass is bottom-centered

  expect(minimapBox.x + minimapBox.width).toBeLessThanOrEqual(compassBox.x); // minimap sits left of the compass
  expect(telemetryBox.x).toBeGreaterThanOrEqual(compassBox.x + compassBox.width); // telemetry sits right of the compass

  // All three instruments hug the same bottom edge (each pinned bottom: 16px at this viewport width).
  const bottoms = [minimapBox, compassBox, telemetryBox].map((b) => b.y + b.height);
  expect(Math.max(...bottoms) - Math.min(...bottoms)).toBeLessThanOrEqual(4);
});

test('seam crossing: sustained boosted thrust wraps the dart across the ±630 torus boundary', async ({ page }) => {
  // The dart-physics unit test (tests/dart-physics.test.ts, "wraps across the +z
  // seam...") proves the wrap teleports position only, preserving velocity/facing.
  // Here we drive the real wired world the same way (thrust + boost, no steering)
  // and poll the telemetry Z reading -- persistent DOM state, unlike the one-frame
  // `wrapped`/`is-wrapped` latch, which is too transient to reliably sample here.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  const canvas = page.locator('canvas#scene');
  await expect(canvas).toBeVisible();
  const xyz = page.locator('.flight-xyz');
  const speedEl = page.locator('.flight-speed');
  await expect(xyz).toHaveText(/X/, { timeout: 10_000 });

  const readZ = async () => parseInt((await xyz.textContent())?.match(/Z\s*([+-]\d+)/)?.[1] ?? '0', 10);
  const readSpeed = async () => parseInt((await speedEl.textContent())?.replace(/[^\d-]/g, '') ?? '0', 10);

  await canvas.click(); // focus the document for key/pointer events
  await page.mouse.down({ button: 'right' }); // boost held -> speed cap raised to boostMaxSpeed (130 u/s)
  await page.keyboard.down('w'); // sustained +z thrust, no yaw/pitch/roll input

  try {
    let climbedNearEdge = false;
    let sawWrap = false;
    // ~630 units at up to 130 u/s (plus ramp-up) is on the order of 5-6s of real
    // time; toPass's 20s budget leaves generous headroom for CI/WASM-boot jitter.
    await expect(async () => {
      const z = await readZ();
      const speed = await readSpeed();
      if (z > 500 && speed > 0) climbedNearEdge = true; // climbing toward the +630 seam
      if (climbedNearEdge && z < 0 && speed > 0) sawWrap = true; // re-entered the opposite face, still moving
      expect(sawWrap).toBe(true);
    }).toPass({ timeout: 20_000 });
  } finally {
    await page.keyboard.up('w');
    await page.mouse.up({ button: 'right' });
  }
});

test('rapier physics: holding W accelerates the dart, releasing glides it back to rest', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  await expect(page.locator('canvas#scene')).toBeVisible();

  const speed = page.locator('.flight-speed');
  await expect(speed).toHaveText('0 u/s', { timeout: 10_000 }); // wait for WASM init + HUD mount

  await page.locator('canvas#scene').click(); // focus the document for key events
  await page.keyboard.down('w');
  await expect(async () => {
    const txt = await speed.textContent();
    expect(parseInt(txt ?? '0', 10)).toBeGreaterThan(5);
  }).toPass({ timeout: 4000 });

  await page.keyboard.up('w');
  await expect(async () => {
    const txt = await speed.textContent();
    expect(parseInt(txt ?? '999', 10)).toBeLessThan(2);
  }).toPass({ timeout: 8000 });
});

test('collision: flying into the galaxy reports reactive star activity', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  const canvas = page.locator('canvas#scene');
  await expect(canvas).toBeVisible();
  await expect(page.locator('.flight-speed')).toHaveText('0 u/s', { timeout: 10_000 });

  await canvas.click();
  await page.keyboard.down('w');
  await expect(async () => {
    expect(Number(await canvas.getAttribute('data-star-hits'))).toBeGreaterThan(0);
  }).toPass({ timeout: 5000 });
  await page.keyboard.up('w');
  expect(Number(await canvas.getAttribute('data-active-stars'))).toBeGreaterThan(0);
});

test('forward thrust emits particles that expire after release', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  const canvas = page.locator('canvas#scene');
  await expect(canvas).toBeVisible();
  await expect(page.locator('.flight-speed')).toHaveText('0 u/s', { timeout: 10_000 });

  await canvas.click();
  await page.keyboard.down('w');
  await expect(async () => {
    expect(Number(await canvas.getAttribute('data-thruster-particles'))).toBeGreaterThan(0);
  }).toPass({ timeout: 2000 });
  await page.keyboard.up('w');
  await expect(canvas).toHaveAttribute('data-thruster-particles', '0', { timeout: 2000 });
});

test('barrel-roll dodge: a single D press side-steps the dart laterally', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  await expect(page.locator('canvas#scene')).toBeVisible();
  const xyz = page.locator('.flight-xyz'); // telemetry panel owns the XYZ readout (D2 removed .flight-readout)
  await page.locator('canvas#scene').click();
  await page.keyboard.press('d'); // one barrel roll + side-step (no forward thrust)
  await page.waitForTimeout(900);
  const x = parseInt((await xyz.textContent())?.match(/X\s*([+-]\d+)/)?.[1] ?? '0', 10);
  expect(Math.abs(x)).toBeGreaterThan(2); // dodged sideways from the lateral impulse
});

test('dark mode: toggle rethemes the galaxy and persists across reload', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  await expect(page.locator('canvas#scene')).toBeVisible();
  await expect(page.locator('.flight-telemetry .flight-controls')).toContainText(/move/i, { timeout: 10_000 });
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');

  await page.locator('.theme-toggle').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // The WebGL scene actually rethemes: dark-gray background dominates, warm (orange-family) pixels appear.
  const { darkBg, warm } = await page.evaluate(async () => {
    const c = document.getElementById('scene') as HTMLCanvasElement;
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext;
    const W = c.width, H = c.height;
    const px = new Uint8Array(W * H * 4);
    let darkBg = 0, warm = 0;
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      let d = 0, w = 0;
      for (let p = 0; p < px.length; p += 4) {
        const r = px[p]!, g = px[p + 1]!, b = px[p + 2]!;
        // Dark theme's clear color (0x1e2125) reads back at ~rgb(30,33,37). The
        // threshold stays a generous 150 — far above any dark-gray reading and far
        // below the light theme's pure-white (255,255,255) corner — so it cleanly
        // discriminates the two themes without being sensitive to encoding details.
        if (r < 150 && g < 150 && b < 150) d++;
        if (r > 120 && r > b + 30) w++;
      }
      darkBg = Math.max(darkBg, d); warm = Math.max(warm, w);
    }
    return { darkBg, warm };
  });
  expect(darkBg).toBeGreaterThan(10_000);
  expect(warm).toBeGreaterThan(200);

  await page.reload(); // stored theme + pre-paint bootstrap + late obstacles under dark
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('canvas#scene')).toBeVisible();
});

test('nose-pointing: a coasting dart curves toward where you point', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/?mode=world');
  const xyz = page.locator('.flight-xyz'); // telemetry panel owns the XYZ readout (D2 removed .flight-readout)
  await page.locator('canvas#scene').click();
  await expect(xyz).toHaveText(/X/, { timeout: 8000 });

  // This line has no obstacle field, but the dart spawns at the galaxy's origin
  // (0,0,0) -- inside the dense core/arm-root region of a 30000-star field -- so a
  // thrust hold can end in a real star collision (restitution 0.7), which stomps
  // speed/heading independently of alignVelocity. 800ms (the v1 hold) kept working
  // here too: short enough that the dart is usually still just inside the low-
  // density core skirt when thrust releases, not deep in the packed arms.
  await page.keyboard.down('w');
  await page.waitForTimeout(800);
  await page.keyboard.up('w'); // coast from whatever speed survived any star hit

  const size = page.viewportSize()!;
  const cx = size.width / 2, cy = size.height / 2;
  await page.mouse.move(cx, cy);
  await page.mouse.down();
  await page.mouse.move(cx + 320, cy, { steps: 8 }); // drag right: yaw the nose ~90°
  await page.waitForTimeout(400);

  // Sampling window (400ms / 1100ms post-drag) matches v1: with linearDamping 0.8,
  // coast speed decays fast (time constant ~1.25s), so sampling while the dart still
  // carries real speed is what makes the momentum-curving-onto-new-heading visible.
  const xAt = async () => parseInt((await xyz.textContent())?.match(/X\s*([+-]\d+)/)?.[1] ?? '0', 10);
  const x1 = await xAt();
  await page.waitForTimeout(700); // still coasting, no thrust keys
  const x2 = await xAt();
  await page.mouse.up();
  expect(Math.abs(x2 - x1)).toBeGreaterThan(4); // momentum curved onto the new heading without thrust
});

test.describe('mobile / coarse pointer', () => {
  const { defaultBrowserType: _unused, ...iphone13 } = devices['iPhone 13'];
  test.use(iphone13);
  test('falls back to the list surface (no free-fly without a fine pointer)', async ({ page }) => {
    await page.goto('/'); // default rules: coarse pointer -> list
    await expect(body(page)).toHaveAttribute('data-mode', 'list');
    await expect(sections(page)).toHaveCount(6);
    await expect(page.locator('main#content')).toBeVisible();
  });
});
