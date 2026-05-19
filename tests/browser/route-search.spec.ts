import { expect, test } from '@playwright/test';

const strictMaps = process.env.PLAYWRIGHT_STRICT_MAPS === '1';

async function ensureMapsAvailable(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const mapErrorVisible = await page.getByText('Error Loading Google Maps').isVisible().catch(() => false);
  if (strictMaps && mapErrorVisible) {
    throw new Error('Required browser tests need a working Google Maps API key.');
  }
  test.skip(mapErrorVisible, 'Browser smoke tests require a working Google Maps API key.');

  await expect(page.getByLabel('Route search')).toBeVisible({ timeout: 20_000 });
}

test('@smoke @VR-304 typed endpoints make the route search respond visibly', async ({ page }) => {
  await ensureMapsAvailable(page);

  await page.locator('.location-status').click();
  await expect(page.getByPlaceholder('Your Location')).toBeVisible();

  await page.getByPlaceholder('Your Location').fill('Union Station Los Angeles');
  await page.getByPlaceholder('Where to?').fill('Hollywood/Vine Station');
  await page.getByRole('button', { name: 'Find Route' }).click();

  await expect.poll(async () => {
    const feedbackVisible = await page.locator('.search-feedback').isVisible().catch(() => false);
    const sidebarVisible = await page.locator('.results-sidebar.open').isVisible().catch(() => false);
    return feedbackVisible || sidebarVisible;
  }, {
    message: 'route search should show progress, an error, or results after clicking Find Route',
    timeout: 15_000
  }).toBe(true);
});

test('@smoke bike settings popover is not clipped by the search card', async ({ page }) => {
  await ensureMapsAvailable(page);

  await page.getByRole('button', { name: 'Bike' }).click();

  const searchCard = page.locator('.search-card');
  const bikePanel = page.locator('.bike-settings-panel');
  await expect(bikePanel).toBeVisible();
  await expect(searchCard).toHaveCSS('overflow', 'visible');

  const panelBox = await bikePanel.boundingBox();
  const viewport = page.viewportSize();

  expect(panelBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.y).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport!.width);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(viewport!.height);
});

test('@VR-101 @VR-102 @VR-103 @VR-105 future transit overlay control is grouped and default off', async ({ page }) => {
  await ensureMapsAvailable(page);

  const futureToggle = page.getByRole('button', {
    name: /official planned, funded, and under-construction future rail lines and stations/i
  });

  await expect(futureToggle).toBeVisible();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'false');

  await futureToggle.click();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'true');

  await futureToggle.click();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'false');
});

test('@VR-303 layer panel groups overlays and exposes a visible legend', async ({ page }) => {
  await ensureMapsAvailable(page);

  const panel = page.getByLabel('Map layers and legend');
  await expect(panel).toBeVisible();

  await expect(panel.locator('.map-layer-group-current')).toContainText('Current');
  await expect(panel.locator('.map-layer-group-future')).toContainText('Future');
  await expect(panel.locator('.map-layer-group-visionary')).toContainText('Visionary');
  await expect(panel.locator('.map-layer-group-nationalized')).toContainText('Nationalized');
  await expect(panel.locator('.map-layer-group-current .map-layer-group__count')).toHaveText('1/2');
  await expect(panel.locator('.map-layer-group-future .map-layer-group__count')).toHaveText('0/1');

  const currentTransitToggle = page.getByRole('button', {
    name: /google maps current transit layer/i
  });
  const futureToggle = page.getByRole('button', {
    name: /official planned, funded, and under-construction future rail lines and stations/i
  });

  await expect(currentTransitToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: /legend/i }).click();
  await expect(page.getByLabel('Visible layer legend')).toBeVisible();
  await expect(page.getByText('Google transit')).toBeVisible();

  await futureToggle.click();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.locator('.map-layer-group-future .map-layer-group__count')).toHaveText('1/1');
  await expect(page.getByText('Future heavy rail')).toBeVisible();
});
