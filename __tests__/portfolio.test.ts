import { expect, test } from '@playwright/test';

import config from '../_config';

const site = `http://127.0.0.1:${config.server.port}`;
type Page = import('@playwright/test').Page;

async function openDesktop(page: Page) {
  await page.goto(site);
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

test('desktop button opens the native OS dialog', async ({ page }) => {
  await page.goto(site);
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
  await expect(casino.getByRole('button', { name: 'Drop ball' })).toBeEnabled();
  await expect(casino.getByRole('button', { name: '25', exact: true })).toBeDisabled();
  await page.getByRole('button', { name: 'Minimize Lucky Arcade' }).click();
  await page.setViewportSize({ width: 420, height: 844 });
  await page.getByRole('button', { name: 'Open Casino' }).click();
  await expect(status).toContainText(/credits returned|board took/, { timeout: 8_000 });
  await expect(casino.getByRole('button', { name: 'Slots' })).toBeEnabled();
  const settledBalance = await balance.textContent();
  await page.waitForTimeout(750);
  await expect(balance).toHaveText(settledBalance!);
  const afterFirstDrop = Number(await balance.textContent());
  await casino.getByRole('button', { name: 'Plinko' }).click();
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(balance).toHaveText(String(afterFirstDrop - 10));
  await expect(casino.getByRole('button', { name: 'Drop ball' })).toBeEnabled();
  await expect(casino.getByRole('button', { name: 'Slots' })).toBeEnabled({ timeout: 8_000 });
  await casino.getByRole('button', { name: 'Slots' }).click();
  await casino.getByRole('button', { name: 'Plinko' }).click();
  const beforeThirdDrop = Number(await balance.textContent());
  await casino.getByRole('button', { name: 'Drop ball' }).click();
  await expect(balance).toHaveText(String(beforeThirdDrop - 10));
  await expect(casino.getByRole('button', { name: 'Drop ball' })).toBeEnabled();
  await expect(casino.getByRole('button', { name: 'Cash out' })).toBeEnabled({ timeout: 8_000 });
  await expect(status).toContainText(/credits returned|board took/);
});

test('Plinko accepts overlapping drops, reserves each bet, and waits for every ball', async ({
  page
}) => {
  await page.addInitScript(() => {
    let ballsThisFrame = 0;
    let largestBallGroup = 0;
    let arcRadius = 0;
    const context = CanvasRenderingContext2D.prototype;
    const originalArc = context.arc;
    const originalClearRect = context.clearRect;
    const originalFill = context.fill;

    context.arc = function (...arguments_: Parameters<CanvasRenderingContext2D['arc']>) {
      arcRadius = arguments_[2];
      return originalArc.apply(this, arguments_);
    };
    context.clearRect = function (
      ...arguments_: Parameters<CanvasRenderingContext2D['clearRect']>
    ) {
      ballsThisFrame = 0;
      return originalClearRect.apply(this, arguments_);
    };
    context.fill = function (this: CanvasRenderingContext2D) {
      if (arcRadius === 5 && this.fillStyle === '#fbbf24') {
        ballsThisFrame += 1;
        largestBallGroup = Math.max(largestBallGroup, ballsThisFrame);
      }
      return originalFill.apply(this, arguments);
    } as typeof context.fill;
    Object.defineProperty(window, '__largestPlinkoBallGroup', {
      get: () => largestBallGroup
    });
  });
  await openCasino(page);
  const casino = page.getByRole('region', { name: 'Lucky Arcade' });
  const balance = casino.getByLabel('Credit balance');
  const dropBall = casino.getByRole('button', { name: 'Drop ball' });

  await dropBall.evaluate((button) => {
    for (let drop = 0; drop < 12; drop += 1) (button as HTMLButtonElement).click();
  });

  await expect(balance).toHaveText('0');
  await expect(dropBall).toBeDisabled();
  await expect(casino.getByRole('button', { name: 'Slots' })).toBeDisabled();
  await expect(casino.getByRole('button', { name: '10', exact: true })).toBeDisabled();
  await expect(casino.getByRole('button', { name: 'Cash out' })).toBeDisabled();
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          (window as Window & { __largestPlinkoBallGroup?: number }).__largestPlinkoBallGroup ?? 0
      )
    )
    .toBeGreaterThanOrEqual(10);

  await expect(casino.getByRole('button', { name: 'Cash out' })).toBeEnabled({ timeout: 8_000 });
  const settledBalance = await balance.textContent();
  await page.waitForTimeout(750);
  await expect(balance).toHaveText(settledBalance!);
  await expect(casino.getByRole('button', { name: 'Slots' })).toBeEnabled();
  await expect(casino.getByRole('button', { name: '10', exact: true })).toBeEnabled();

  const beforeNextDrop = Number(settledBalance);
  await dropBall.click();
  await expect(balance).toHaveText(String(beforeNextDrop - 10));
});

test('portrait is static and does not open the desktop', async ({ page }) => {
  await page.goto(site);
  const portrait = page.getByRole('img', { name: 'Maksym with his laptop' });
  await expect(portrait).toHaveAttribute('src', '/portrait.webp');
  await portrait.click();
  await expect(page.getByRole('dialog', { name: 'mTOS desktop' })).toHaveCount(0);
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
  await page.getByRole('button', { name: 'psst. open my desktop' }).click();
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

test('reduced motion gives a static explosion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openCasino(page);
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

test('hero uses the static portrait without 3D controls or canvas', async ({ page }) => {
  await page.goto(site);
  const portrait = page.getByRole('img', { name: 'Maksym with his laptop' });
  await expect(portrait).toBeVisible();
  await expect(portrait.locator('canvas')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /avatar rotation|Rotate avatar/ })).toHaveCount(0);
});

test('failed portrait collapses the hero while keeping its text and desktop button', async ({
  page
}) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.route('**/portrait.webp', (route) => route.abort());
  await page.goto(site);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('link', { name: /CV/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'psst. open my desktop' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'Maksym with his laptop' })).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('#about > div')
        .evaluate(
          (element) => getComputedStyle(element).gridTemplateColumns.trim().split(/\s+/).length
        )
    )
    .toBe(1);
});

test('decorative skill images are silent and hide when their files fail', async ({ page }) => {
  await page.route('**/illustrations/*.webp', (route) => route.abort());
  await page.goto(site);
  const skills = page.locator('#skills');
  await skills.scrollIntoViewIfNeeded();
  await expect(skills.getByRole('heading', { name: 'How I work.' })).toBeVisible();
  await expect(skills.getByRole('heading', { name: 'AI is part of the job.' })).toBeVisible();
  for (const image of ['ai-processor', 'code-terminal', 'server-stack']) {
    const decorativeImage = skills.locator(`img[src="/illustrations/${image}.webp"]`);
    await expect(decorativeImage).toHaveAttribute('alt', '');
    await expect(decorativeImage).toBeHidden();
  }
});

test('phone-density portrait fits without horizontal overflow', async ({ browser }) => {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    hasTouch: true
  });
  const page = await context.newPage();
  await page.goto(site);
  const portrait = page.getByRole('img', { name: 'Maksym with his laptop' });
  await expect(portrait).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const portraitBox = await portrait.boundingBox();
  expect(portraitBox!.width).toBeLessThanOrEqual(390);
  await context.close();
});
