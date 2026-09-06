import { expect, test } from '@playwright/test';

import config from '../_config';

const site = `http://127.0.0.1:${config.server.port}`;
type Page = import('@playwright/test').Page;

async function openDesktop(page: Page) {
  await page.goto(site);
  await expect(page.getByRole('button', { name: /Pause|Play avatar rotation/ })).toBeVisible();
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toBeVisible({ timeout: 5_000 });
}

async function openCasino(page: Page) {
  await openDesktop(page);
  await page.getByRole('button', { name: 'Open Casino' }).click();
  await expect(page.getByRole('region', { name: 'Lucky Arcade' })).toBeVisible();
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
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('desktop entry can cancel, restore the canvas, then complete into the native OS dialog', async ({
  page
}) => {
  await page.goto(site);
  await expect(page.getByRole('button', { name: 'Pause avatar rotation' })).toBeVisible();
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
  await expect(page.getByRole('dialog', { name: 'Opening mTOS' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog', { name: 'Opening mTOS' })).toHaveCount(0);
  await expect(page.getByRole('img', { name: /3D portrait/ }).locator('canvas')).toBeVisible();
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toBeVisible({ timeout: 5_000 });
  await expect(page.getByRole('region', { name: 'Terminal', exact: true })).toBeVisible();
});

test('casino charges immediately, locks game controls, and settles exactly once after resize', async ({
  page
}) => {
  await openCasino(page);
  const casino = page.getByRole('region', { name: 'Lucky Arcade' });
  const balance = casino.getByLabel('Credit balance');
  const status = casino.getByRole('status', { name: 'Game result' });
  await expect(balance).toHaveText('100');
  await expect(casino.getByText(/fake credits/i)).toHaveCount(0);
  await expect(casino.getByRole('button', { name: /Withdraw|Copy/ })).toHaveCount(0);
  await casino.getByRole('button', { name: 'Slots' }).click();
  await casino.getByRole('button', { name: 'Spin 10 credits' }).click();
  await expect(balance).toHaveText('90');
  await expect(casino.getByRole('button', { name: 'Spinning...' })).toBeDisabled();
  await expect(casino.getByRole('button', { name: 'Plinko' })).toBeDisabled();
  await expect(status).toContainText(/credits returned|board took/);
  await casino.getByRole('button', { name: 'Plinko' }).click();
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(casino.getByRole('button', { name: 'Ball in play...' })).toBeDisabled();
  await expect(casino.getByRole('button', { name: '25', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Minimize Lucky Arcade' }).click();
  await page.setViewportSize({ width: 420, height: 844 });
  await page.getByRole('button', { name: 'Open Casino' }).click();
  await expect(status).toContainText(/credits returned|board took/, { timeout: 8_000 });
  const settledBalance = await balance.textContent();
  await page.waitForTimeout(750);
  await expect(balance).toHaveText(settledBalance!);
  const afterFirstDrop = Number(await balance.textContent());
  await casino.getByRole('button', { name: 'Plinko' }).click();
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(balance).toHaveText(String(afterFirstDrop - 10));
  await expect(casino.getByRole('button', { name: 'Ball in play...' })).toBeDisabled();
  await expect(casino.getByRole('button', { name: 'Drop ball' })).toBeEnabled({ timeout: 8_000 });
  await casino.getByRole('button', { name: 'Slots' }).click();
  await casino.getByRole('button', { name: 'Plinko' }).click();
  const beforeThirdDrop = Number(await balance.textContent());
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(balance).toHaveText(String(beforeThirdDrop - 10));
  await expect(casino.getByRole('button', { name: 'Ball in play...' })).toBeDisabled();
  await expect(casino.getByRole('button', { name: 'Drop ball' })).toBeEnabled({ timeout: 8_000 });
  await expect(status).toContainText(/credits returned|board took/);
});

test('the laptop itself opens the desktop', async ({ page }) => {
  await page.goto(site);
  await page.getByRole('button', { name: 'Pause avatar rotation' }).click();
  const portrait = page.getByRole('img', { name: /3D portrait/ });
  const box = await portrait.boundingBox();
  if (!box) throw new Error('Portrait has no size');
  await page.mouse.click(box.x + box.width * 0.5, box.y + box.height * 0.69);
  await expect(page.getByRole('dialog', { name: 'Opening mTOS' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip to desktop' }).click();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toBeVisible();
});

test('Apps menu supports keyboard close and focus restoration', async ({ page }) => {
  await openDesktop(page);
  const apps = page.getByRole('button', { name: /Apps/ });
  await apps.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Terminal', exact: true })).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Terminal', exact: true })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Terminal', exact: true })).toHaveCount(0);
  await expect(apps).toBeFocused();
});

test('cancelling a delayed desktop handoff cannot open mTOS later', async ({ page }) => {
  let releaseModule = () => {};
  const moduleReady = new Promise<void>((resolve) => {
    releaseModule = resolve;
  });
  await page.route('**/src/components/macos/MacOSDesktop.tsx*', async (route) => {
    await moduleReady;
    await route.continue();
  });
  await page.goto(site);
  await page.getByRole('button', { name: 'Pause avatar rotation' }).click();
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
  await page.getByRole('button', { name: 'Skip to desktop' }).click();
  const loading = page.getByRole('dialog', { name: 'Loading mTOS' });
  await expect(loading).toBeVisible();
  await loading.getByRole('button', { name: 'Cancel' }).click();
  releaseModule();
  await expect(page.getByRole('button', { name: 'psst. open my desktop' })).toBeFocused();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toHaveCount(0);
  await page.unroute('**/src/components/macos/MacOSDesktop.tsx*');
});

test('ChatGBT cancels a pending reply, restores history, and survives minimize and dock restore', async ({
  page
}) => {
  await openDesktop(page);
  await page.getByRole('button', { name: 'Open ChatGBT' }).click();
  const chat = page.getByRole('region', { name: 'ChatGBT' });
  const input = chat.getByLabel('Message ChatGBT');
  await input.fill('first chat to preserve');
  await chat.getByRole('button', { name: 'Send message' }).click();
  await expect(input).toBeDisabled();
  await chat
    .getByRole('button', { name: /New chat/ })
    .first()
    .click();
  await expect(input).toBeEnabled();
  await page.waitForTimeout(800);
  await expect(chat.getByRole('log')).not.toContainText(/napkin|plausible|fuck/);
  await input.fill('hello');
  await chat.getByRole('button', { name: 'Send message' }).click();
  await expect(chat.getByRole('log')).toContainText(/fuck/, { timeout: 2_000 });
  await input.fill('bad startup slogan');
  await chat.getByRole('button', { name: 'Send message' }).click();
  await expect(chat.getByRole('log')).toContainText(/sync in asynchronous/, { timeout: 2_000 });
  await chat
    .getByRole('button', { name: /New chat/ })
    .first()
    .click();
  await chat.getByRole('button', { name: 'hello' }).click();
  await expect(chat.getByRole('log')).toContainText(/sync in asynchronous/);
  await page.getByRole('button', { name: 'Minimize ChatGBT' }).click();
  await page.getByRole('button', { name: 'Open ChatGBT' }).click();
  await expect(chat.getByRole('log')).toContainText(/sync in asynchronous/);
});

test('windows drag, maximize, minimize, and fit after a mobile resize', async ({ page }) => {
  await openDesktop(page);
  await page.getByRole('button', { name: 'Open ChatGBT' }).click();
  await page.getByRole('button', { name: 'Open Casino' }).click();
  const terminal = page.getByRole('region', { name: 'Terminal', exact: true });
  const before = await terminal.boundingBox();
  const titlebar = terminal.locator('.mtos-titlebar');
  const titlebarBox = await titlebar.boundingBox();
  if (!before || !titlebarBox) throw new Error('Terminal has no draggable title bar');
  await page.mouse.move(
    titlebarBox.x + titlebarBox.width / 2,
    titlebarBox.y + titlebarBox.height / 2
  );
  await page.mouse.down();
  await page.mouse.move(
    titlebarBox.x + titlebarBox.width / 2 - 120,
    titlebarBox.y + titlebarBox.height / 2 + 90,
    { steps: 8 }
  );
  await expect.poll(async () => (await terminal.boundingBox())?.x).not.toBe(before.x);
  await page.mouse.up();
  const after = await terminal.boundingBox();
  expect(after).not.toEqual(before);
  await page.getByRole('button', { name: 'Maximize Terminal' }).click();
  await expect(terminal).toHaveClass(/mtos-window-maximized/);
  await page.getByRole('button', { name: 'Minimize Terminal' }).click();
  await expect(terminal).toBeHidden();
  await page.setViewportSize({ width: 390, height: 844 });
  for (const name of ['ChatGBT', 'Lucky Arcade']) {
    const box = await page.getByRole('region', { name }).boundingBox();
    expect(box?.x).toBeGreaterThanOrEqual(0);
    expect(box && box.x + box.width).toBeLessThanOrEqual(390);
  }
});

test('cash out can enter dino and return to the still-open desktop without a reload', async ({
  page
}) => {
  await openCasino(page);
  const casino = page.getByRole('region', { name: 'Lucky Arcade' });
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(casino.getByRole('button', { name: 'Cash out' })).toBeEnabled({ timeout: 8_000 });
  await casino.getByRole('button', { name: 'Cash out' }).click();
  await expect(page.getByRole('dialog', { name: 'Casino cash-out catastrophe' })).toBeVisible();
  await page.getByRole('button', { name: 'Skip to dino' }).click();
  await expect(page.getByRole('button', { name: 'Start dino game' })).toBeVisible();
  await page.getByRole('button', { name: 'Return to desktop' }).click();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toBeVisible();
  await expect(casino).toBeVisible();
});

test('exiting mTOS restores page focus and body scrolling', async ({ page }) => {
  await openDesktop(page);
  await page.getByRole('button', { name: 'Exit mTOS' }).click();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'psst. open my desktop' })).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).toBe('');
});

test('reduced motion gives a static explosion and no automatic avatar spin', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCasino(page);
  await expect(page.getByRole('button', { name: 'Play avatar rotation' })).toBeAttached();
  const casino = page.getByRole('region', { name: 'Lucky Arcade' });
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(casino.getByRole('button', { name: 'Cash out' })).toBeEnabled({ timeout: 8_000 });
  await casino.getByRole('button', { name: 'Cash out' }).click();
  await page.getByRole('button', { name: /Cash-out machine/ }).click();
  await expect(page.getByText('BOOM!', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continue to dino' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toBeVisible();
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
