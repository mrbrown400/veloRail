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

  await expect(page.getByRole('region', { name: 'Route search' })).toBeVisible({ timeout: 20_000 });
}

async function dispatchSampleOverlayMetadata(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('velorail:map-overlay-metadata-selected', {
      detail: {
        id: 'vr-305-mobile-test-corridor',
        proposalId: 'vr-305-mobile-test',
        kind: 'corridor',
        title: 'VR-305 Test Corridor',
        subtitle: 'corridor · rail',
        badgeLabel: 'Official future',
        badgeClassName: 'map-overlay-metadata__badge--future',
        statusLabel: 'planned',
        classificationLabel: 'official',
        confidenceLabel: 'high',
        uncertaintyLabel: 'medium',
        disclaimer: 'Approximate geometry shown for interaction testing.',
        details: [
          { label: 'Status', value: 'planned' },
          { label: 'Classification', value: 'official' },
          { label: 'Confidence', value: 'high' },
          { label: 'Geometry', value: 'approximate' }
        ],
        sources: [
          {
            title: 'VeloRail UI test fixture',
            publisher: 'VeloRail',
            sourceType: 'internal',
            accessedAt: '2026-05-19'
          }
        ]
      }
    }));
  });
}

test('@smoke @VR-304 @VR-305 typed endpoints make the route search respond visibly', async ({ page }) => {
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

test('@smoke @VR-306 @VR-307 @VR-308 bike settings popover is not clipped by the search card', async ({ page }) => {
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

test('@VR-305 @VR-307 overlay metadata can be dismissed with Escape', async ({ page }) => {
  await ensureMapsAvailable(page);
  await dispatchSampleOverlayMetadata(page);

  const metadataPanel = page.getByRole('region', { name: 'VR-305 Test Corridor' });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('Approximate geometry');

  await page.keyboard.press('Escape');
  await expect(metadataPanel).toBeHidden();
});

test('@VR-306 @VR-308 mobile overlay panels stay within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ensureMapsAvailable(page);
  await dispatchSampleOverlayMetadata(page);

  const metadataPanel = page.locator('#map-overlay-metadata-panel');
  await expect(metadataPanel).toBeVisible();
  await expect(page.locator('.map-layer-panel')).toHaveCSS('visibility', 'hidden');

  const panelBox = await metadataPanel.boundingBox();
  const viewport = page.viewportSize();

  expect(panelBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.y).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport!.width);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(viewport!.height);
  expect(panelBox!.height).toBeLessThanOrEqual(viewport!.height * 0.52);
});

test('@VR-306 @VR-307 route results can close and reopen when options are available', async ({ page }) => {
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

  const sidebarVisible = await page.locator('.results-sidebar.open').isVisible().catch(() => false);
  test.skip(!sidebarVisible, 'Route API returned no route options in this environment.');

  await page.getByRole('button', { name: 'Close route results' }).click();
  await expect(page.locator('.results-sidebar.open')).toBeHidden();

  const reopenButton = page.getByRole('button', { name: /show \d+ routes?/i });
  await expect(reopenButton).toBeVisible();
  await reopenButton.click();
  await expect(page.locator('.results-sidebar.open')).toBeVisible();
});
