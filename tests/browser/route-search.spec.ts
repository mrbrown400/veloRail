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

test('@smoke typed endpoints make the route search respond visibly', async ({ page }) => {
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
