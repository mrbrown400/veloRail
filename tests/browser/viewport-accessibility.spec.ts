import { expect, test, type Locator, type Page } from '@playwright/test';

const strictMaps = process.env.PLAYWRIGHT_STRICT_MAPS === '1';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function ensureMapsAvailable(page: Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const mapErrorVisible = await page.getByText('Error Loading Google Maps').isVisible().catch(() => false);
  if (strictMaps && mapErrorVisible) {
    throw new Error('Required browser tests need a working Google Maps API key.');
  }
  test.skip(mapErrorVisible, 'MBR-93 viewport tests require a working Google Maps API key.');

  await expect(page.getByRole('region', { name: 'Route search' })).toBeVisible({ timeout: 20_000 });
}

async function dispatchSampleOverlayMetadata(page: Page) {
  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('velorail:map-overlay-metadata-selected', {
      detail: {
        id: 'mbr-93-viewport-test-corridor',
        proposalId: 'mbr-93-viewport-test',
        kind: 'corridor',
        title: 'MBR-93 Viewport Test Corridor',
        subtitle: 'corridor · rail',
        badgeLabel: 'Official future',
        badgeClassName: 'map-overlay-metadata__badge--future',
        statusLabel: 'planned',
        classificationLabel: 'official',
        confidenceLabel: 'high',
        uncertaintyLabel: 'medium',
        disclaimer: 'Approximate geometry shown for viewport and accessibility QA.',
        details: [
          { label: 'Status', value: 'planned' },
          { label: 'Classification', value: 'official' },
          { label: 'Confidence', value: 'high' },
          { label: 'Geometry', value: 'approximate' }
        ],
        sources: [
          {
            title: 'VeloRail MBR-93 viewport test fixture',
            publisher: 'VeloRail',
            sourceType: 'internal',
            accessedAt: '2026-05-27'
          }
        ]
      }
    }));
  });
}

async function getBox(locator: Locator, label: string): Promise<Box> {
  const box = await locator.boundingBox();
  expect(box, `${label} should have a measurable layout box`).not.toBeNull();
  return box!;
}

function expectBoxInsideViewport(box: Box, viewport: { width: number; height: number }, label: string) {
  expect(box.x, `${label} left edge`).toBeGreaterThanOrEqual(0);
  expect(box.y, `${label} top edge`).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, `${label} right edge`).toBeLessThanOrEqual(viewport.width + 1);
  expect(box.y + box.height, `${label} bottom edge`).toBeLessThanOrEqual(viewport.height + 1);
}

function boxesOverlap(first: Box, second: Box, gap = 0): boolean {
  return !(
    first.x + first.width + gap <= second.x
    || second.x + second.width + gap <= first.x
    || first.y + first.height + gap <= second.y
    || second.y + second.height + gap <= first.y
  );
}

function parseCssTimeList(value: string): number[] {
  return value.split(',').map((part) => {
    const trimmed = part.trim();
    if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed) / 1000;
    if (trimmed.endsWith('s')) return Number.parseFloat(trimmed);
    return Number.parseFloat(trimmed);
  }).filter((duration) => Number.isFinite(duration));
}

test('@MBR-93 1440x900 desktop panels preserve app-owned safe areas around the Google map', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await ensureMapsAvailable(page);
  await dispatchSampleOverlayMetadata(page);

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  const searchPanel = page.getByRole('region', { name: 'Route search' });
  const layerPanel = page.getByLabel('Map layers and legend');
  const metadataPanel = page.locator('#map-overlay-metadata-panel');

  await expect(searchPanel).toBeVisible();
  await expect(layerPanel).toBeVisible();
  await expect(metadataPanel).toBeVisible();

  const searchBox = await getBox(searchPanel, 'route search panel');
  const layerBox = await getBox(layerPanel, 'map layer panel');
  const metadataBox = await getBox(metadataPanel, 'metadata panel');

  expectBoxInsideViewport(searchBox, viewport!, 'route search panel');
  expectBoxInsideViewport(layerBox, viewport!, 'map layer panel');
  expectBoxInsideViewport(metadataBox, viewport!, 'metadata panel');

  expect(boxesOverlap(searchBox, layerBox, 16), 'route search and layer panel should not collide').toBe(false);
  expect(boxesOverlap(searchBox, metadataBox, 16), 'route search and metadata panel should not collide').toBe(false);

  expect(layerBox.x + layerBox.width, 'layer panel should leave the right Google controls lane clear').toBeLessThanOrEqual(viewport!.width - 48);
  expect(metadataBox.x + metadataBox.width, 'metadata panel should leave the right Google controls lane clear').toBeLessThanOrEqual(viewport!.width - 48);
  expect(layerBox.y + layerBox.height, 'layer panel should leave a conservative attribution edge').toBeLessThanOrEqual(viewport!.height - 16);
});

test('@MBR-93 768px transition keeps search repair and compact layers inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 900 });
  await ensureMapsAvailable(page);

  const viewport = page.viewportSize();
  expect(viewport).not.toBeNull();

  await page.getByPlaceholder('Where to?').fill('Hollywood/Vine Station');
  await page.getByTestId('find-route-button').click();

  const searchPanel = page.getByRole('region', { name: 'Route search' });
  const findRouteButton = page.getByTestId('find-route-button');
  const originInput = page.getByPlaceholder('Your Location');

  await expect(originInput).toBeFocused();
  await expect(page.getByText('Add a start location or use current location to continue.')).toBeVisible();
  expectBoxInsideViewport(await getBox(searchPanel, 'expanded route search panel'), viewport!, 'expanded route search panel');
  expectBoxInsideViewport(await getBox(findRouteButton, 'find route button'), viewport!, 'find route button');

  const layerTrigger = page.getByRole('button', { name: /layers, \d+ active/i });
  const layerPanel = page.getByLabel('Map layers and legend');

  await expect(layerTrigger).toBeVisible();
  await expect(layerTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(layerPanel).toBeHidden();

  const triggerBox = await getBox(layerTrigger, 'compact layer trigger');
  expectBoxInsideViewport(triggerBox, viewport!, 'compact layer trigger');

  await layerTrigger.click();
  await expect(layerTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(layerPanel).toBeVisible();
  await expect(layerPanel.locator('.map-layer-panel__title')).toBeFocused();

  const panelBox = await getBox(layerPanel, 'compact layer sheet');
  expectBoxInsideViewport(panelBox, viewport!, 'compact layer sheet');

  await page.getByRole('button', { name: 'Close layers' }).click();
  await expect(layerPanel).toBeHidden();
  await expect(layerTrigger).toBeFocused();
});

test('@MBR-93 reduced-motion keeps app-owned layer surfaces usable without long transitions', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 768, height: 900 });
  await ensureMapsAvailable(page);

  const layerTrigger = page.getByRole('button', { name: /layers, \d+ active/i });
  const layerPanel = page.getByLabel('Map layers and legend');

  await layerTrigger.click();
  await expect(layerPanel).toBeVisible();

  const transitionDurations = await layerPanel.evaluate((element) =>
    getComputedStyle(element).transitionDuration
  );
  const durationsSeconds = parseCssTimeList(transitionDurations);

  expect(durationsSeconds.length).toBeGreaterThan(0);
  expect(
    durationsSeconds.every((duration) => duration <= 0.02),
    `expected reduced transition durations, received ${transitionDurations}`
  ).toBe(true);
});
