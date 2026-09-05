import { expect, test } from '@playwright/test';

import config from '../_config';

const site = `http://127.0.0.1:${config.server.port}`;

async function openCasino(page: import('@playwright/test').Page) {
  await page.goto(site);
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
  await page.getByRole('button', { name: 'Open Casino' }).click();
  await expect(page.getByRole('button', { name: 'Drop Ball' })).toBeVisible();
}

test('CV stays labelled and mobile page and desktop fit', async ({ page }) => {
  await page.setViewportSize({ width: 340, height: 760 });
  await page.goto(site);
  await expect(page.getByRole('link', { name: /CV/ })).toHaveAttribute(
    'href',
    'https://cdn.tyulyukov.com/cv.pdf'
  );
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AI nerd.I ship. A lot.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
  await page.getByRole('button', { name: 'Open Casino' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('Plinko charges one bet and resizing or changing bets cannot award free credits', async ({
  page
}) => {
  await openCasino(page);
  await page.getByRole('button', { name: 'Drop Ball' }).click();
  await expect(page.getByRole('button', { name: 'Ball is vibing...' })).toBeDisabled();
  await expect(page.getByRole('button', { name: '25', exact: true })).toBeDisabled();
  await expect(page.getByText('90 fake credits')).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText(/nice bounce|board is evil/)).toBeVisible({ timeout: 9000 });
  await expect(page.locator('#secret-desktop').getByRole('status')).toContainText(
    /nice bounce|board is evil/
  );
  const credits = page.getByText(/fake credits/);
  const beforeResize = await credits.textContent();
  await page.getByRole('button', { name: '25', exact: true }).click();
  await page.setViewportSize({ width: 420, height: 844 });
  await page.waitForTimeout(6500);
  await expect(credits).toHaveText(beforeResize!);
});

test('cash out explodes, dino can start, retry, and return without a reload', async ({ page }) => {
  await openCasino(page);
  await page.getByRole('button', { name: 'Drop Ball' }).click();
  await expect(page.getByRole('button', { name: /Withdraw/ })).toBeEnabled({ timeout: 9000 });
  await page.getByRole('button', { name: /Withdraw/ }).click();
  await expect(page.getByRole('dialog', { name: 'Casino cash-out catastrophe' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip to dino' }).click();
  await page.getByRole('button', { name: 'Start dino game' }).click();
  await expect(page.getByRole('button', { name: 'Jump', exact: true })).toBeVisible();
  await expect(page.getByText('GAME OVER', { exact: true })).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: 'Retry dino game' }).press('Space');
  await expect(page.getByRole('button', { name: 'Jump', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Return to desktop', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Drop Ball' })).toBeVisible();
  expect(
    await page.locator('#root').evaluate((root) => root instanceof HTMLElement && root.inert)
  ).toBe(false);
});

test('reduced motion gives a static explosion and no automatic avatar spin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCasino(page);
  await expect(page.getByRole('button', { name: 'Play avatar rotation' })).toBeAttached();
  await page.getByRole('button', { name: 'Drop Ball' }).click();
  await expect(page.getByRole('button', { name: /Withdraw/ })).toBeEnabled({ timeout: 9000 });
  await page.getByRole('button', { name: /Withdraw/ }).click();
  await expect(page.getByText('BOOM!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to dino' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('avatar renders, pauses and responds to mouse and keyboard', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(site);
  await page.getByRole('button', { name: 'Pause avatar rotation' }).click();
  await expect(page.getByRole('button', { name: 'Play avatar rotation' })).toBeVisible();
  const portrait = page.getByRole('img', { name: /3D portrait/ });
  const before = await portrait.screenshot();
  await page.getByRole('button', { name: 'Rotate avatar right' }).click();
  await page.waitForTimeout(100);
  expect((await portrait.screenshot()).equals(before)).toBe(false);
  await page.getByRole('button', { name: 'Rotate avatar left' }).press('Enter');
  const box = await portrait.boundingBox();
  if (!box) throw new Error('Portrait has no size');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2, { steps: 8 });
  await page.mouse.up();
  expect(errors).toEqual([]);
});

test('failed 3D asset leaves a usable portfolio and poster', async ({ page }) => {
  await page.route('**/avatar.glb*', (route) => route.abort());
  await page.goto(site);
  await expect(
    page.getByText('3D view could not load. Here is the portrait instead.')
  ).toBeVisible();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /CV/ })).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Maksym with his laptop', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('img', { name: /3D portrait/ })).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText('3D view could not load.');
});

test('phone-density canvas fits and leaves vertical touch scrolling available', async ({
  browser
}) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto(site);
  await expect(page.getByRole('button', { name: 'Pause avatar rotation' })).toBeVisible();
  const portrait = page.getByRole('img', { name: /3D portrait/ });
  const canvas = portrait.locator('canvas');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await canvas.evaluate((element) => getComputedStyle(element).touchAction)).toBe('pan-y');
  const canvasBox = await canvas.boundingBox();
  const portraitBox = await portrait.boundingBox();
  expect(canvasBox!.width).toBeLessThanOrEqual(portraitBox!.width);
  expect(canvasBox!.height).toBeLessThanOrEqual(portraitBox!.height);
  await context.close();
});
