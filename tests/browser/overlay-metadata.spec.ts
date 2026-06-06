import { expect, test } from '@playwright/test';

const strictMaps = process.env.PLAYWRIGHT_STRICT_MAPS === '1';

async function ensureMapsAvailable(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  const mapErrorVisible = await page.getByText('Error Loading Google Maps').isVisible().catch(() => false);
  if (strictMaps && mapErrorVisible) {
    throw new Error('Required browser tests need a working Google Maps API key.');
  }
  test.skip(mapErrorVisible, 'Browser overlay metadata tests require a working Google Maps API key.');

  await expect(page.getByRole('region', { name: 'Route search' })).toBeVisible({ timeout: 20_000 });
}

test('@MBR-102 current-only layer details expose checked-in current transit metadata', async ({ page }) => {
  await ensureMapsAvailable(page);

  const layerPanel = page.getByLabel('Map layers and legend');
  await expect(layerPanel).toContainText('Layer details');
  await expect(layerPanel).toContainText('Red Line');
  await expect(layerPanel).toContainText('rail · Every 6 min');

  const futureOverlayToggle = page.getByRole('button', {
    name: /Official planned, funded, and under-construction future rail and BRT alignments/i
  });
  const visionaryToggle = page.getByRole('button', {
    name: /unofficial visionary rail concepts/i
  });
  const nationalizedToggle = page.getByRole('button', {
    name: /hypothetical passenger-conversion planning over sourced freight corridors; not approved service/i
  });

  await expect(futureOverlayToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(visionaryToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(nationalizedToggle).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: /Red Line.*Google TransitLayer does not expose per-line geometry/i }).click();

  const metadataPanel = page.getByRole('region', { name: /Red Line/i });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('Current');
  await expect(metadataPanel).toContainText('Union Station to North Hollywood');
  await expect(metadataPanel).toContainText('Used by VeloRail routing');
  await expect(metadataPanel).toContainText('No custom current-line highlight until VeloRail current geometry overlay is added');
  await expect(metadataPanel).toContainText('VeloRail-owned checked-in routing data');
  await expect(metadataPanel).toContainText('Google Maps TransitLayer');
});

test('@MBR-85 @MBR-89 @VR-003 @VR-004 @VR-305 @VR-307 @VR-403 @VR-404 @VR-405 @VR-406 @VR-407 @VR-500 @VR-501 @VR-502 @veloRail-967a @veloRail-1581 @veloRail-16bd nationalized overlay exposes hypothetical conversion legend and metadata panel', async ({ page }) => {
  await ensureMapsAvailable(page);

  const nationalizedToggle = page.getByRole('button', {
    name: /hypothetical passenger-conversion planning over sourced freight corridors; not approved service/i
  });

  await expect(nationalizedToggle).toHaveAttribute('aria-pressed', 'false');
  await nationalizedToggle.click();
  await expect(nationalizedToggle).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /legend/i }).click();
  await expect(page.getByLabel('Visible layer legend')).toContainText('Freight corridor');
  await expect(page.getByLabel('Visible layer legend')).toContainText('Passenger conversion');
  await expect(page.getByLabel('Visible layer legend')).toContainText('Nationalized planning notice');
  await expect(page.getByLabel('Visible layer legend')).toContainText('candidates require review');

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('velorail:map-overlay-metadata-selected', {
      detail: {
        id: 'alameda-corridor-south-alameda-passenger-conversion-line',
        proposalId: 'alameda-corridor-south-alameda-passenger-conversion',
        kind: 'line',
        title: 'Alameda Corridor South Alameda passenger conversion concept',
        subtitle: 'line · commuter rail',
        badgeLabel: 'Passenger conversion',
        badgeClassName: 'map-overlay-metadata__badge--converted',
        statusLabel: 'converted passenger',
        classificationLabel: 'speculative',
        confidenceLabel: 'low',
        uncertaintyLabel: 'high',
        disclaimer: 'Hypothetical passenger-conversion planning concept generated from sourced freight corridor data. Not approved Metro, Metrolink, railroad, or public agency service.',
        details: [
          { label: 'Status', value: 'converted passenger' },
          { label: 'Classification', value: 'speculative' },
          { label: 'Confidence', value: 'low' },
          { label: 'Owner', value: 'Alameda Corridor Transportation Authority' },
          { label: 'Operator', value: 'BNSF Railway / Union Pacific Railroad' },
          { label: 'Track usage', value: 'passenger' },
          { label: 'Suitability', value: 'medium' },
          { label: 'Suitability score', value: '70/100' },
          { label: 'Suitability method', value: 'vr-406-transparent-heuristic-v1' },
          { label: 'Missing scoring data', value: 'passenger demand, employment density, freight train volumes' },
          { label: 'Population score', value: 'vr-501-market-anchor-heuristic-v1' },
          { label: 'Bike access score', value: 'vr-502-bike-rail-access-heuristic-v1' },
          { label: 'Source corridor', value: 'la-freight-alameda-corridor' },
          { label: 'Station assumptions', value: 'South Alameda/Slauson is a planning placeholder for the South Alameda feedback corridor, not a sourced station plan.' }
        ],
        sources: [
          {
            title: 'Alameda Corridor Transportation Authority corridor overview',
            publisher: 'Alameda Corridor Transportation Authority',
            url: 'https://www.acta.org/',
            sourceType: 'public_agency',
            accessedAt: '2026-05-19'
          }
        ]
      }
    }));
  });

  const metadataPanel = page.getByRole('region', {
    name: /Alameda Corridor South Alameda passenger conversion concept/i
  });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('Alameda Corridor South Alameda passenger conversion concept');
  await expect(metadataPanel).toContainText('Passenger conversion');
  await expect(metadataPanel).toContainText('speculative');
  await expect(metadataPanel).toContainText('Alameda Corridor Transportation Authority');
  await expect(metadataPanel).toContainText('70/100');
  await expect(metadataPanel).toContainText('vr-406-transparent-heuristic-v1');
  await expect(metadataPanel).toContainText('vr-501-market-anchor-heuristic-v1');
  await expect(metadataPanel).toContainText('vr-502-bike-rail-access-heuristic-v1');
  await expect(metadataPanel).toContainText('passenger demand');
  await expect(metadataPanel).toContainText('la-freight-alameda-corridor');
  await expect(metadataPanel).toContainText('Not approved Metro');
  await expect(metadataPanel).toContainText('Google Maps renders the geometry');
  await expect(metadataPanel).toContainText('public_agency');
  await expect(metadataPanel.getByRole('link', { name: 'Alameda Corridor Transportation Authority corridor overview' })).toHaveAttribute('href', 'https://www.acta.org/');

  await metadataPanel.getByRole('button', { name: 'Close metadata' }).click();
  await expect(metadataPanel).toBeHidden();
});

test('@MBR-85 @MBR-89 @VR-202 @VR-203 @VR-204 @VR-205 @VR-206 visionary overlay exposes speculative legend and metadata panel', async ({ page }) => {
  await ensureMapsAvailable(page);

  const visionaryToggle = page.getByRole('button', {
    name: /unofficial visionary rail concepts/i
  });

  await expect(visionaryToggle).toHaveAttribute('aria-pressed', 'false');
  await visionaryToggle.click();
  await expect(visionaryToggle).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /legend/i }).click();
  const legend = page.getByLabel('Visible layer legend');
  await expect(legend).toContainText('Visionary notice');
  await expect(legend).toContainText('not Google Maps transit data');
  await expect(legend).toContainText('Visionary concept');
  await expect(legend).toContainText('Speculative river rail vision');
  await expect(legend).toContainText('Speculative westside crosstown vision');
  await expect(legend).toContainText('Speculative valley orbital vision');

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('velorail:map-overlay-metadata-selected', {
      detail: {
        id: 'vision-la-river-rail-line',
        proposalId: 'vision-la-river-rail',
        kind: 'line',
        title: 'LA River Rail Vision',
        subtitle: 'line · light rail',
        badgeLabel: 'Visionary',
        badgeClassName: 'map-overlay-metadata__badge--visionary',
        statusLabel: 'vision',
        classificationLabel: 'speculative',
        confidenceLabel: 'low',
        uncertaintyLabel: 'high',
        disclaimer: 'Speculative VeloRail scenario. Not an approved agency project, funded project, or Google Maps transit route.',
        details: [
          { label: 'Status', value: 'vision' },
          { label: 'Classification', value: 'speculative' },
          { label: 'Confidence', value: 'low' },
          { label: 'Geometry', value: 'conceptual' }
        ],
        sources: [
          {
            title: 'VeloRail LA River rail vision registry example',
            publisher: 'VeloRail',
            sourceType: 'internal_example',
            accessedAt: '2026-05-19',
            note: 'Internal scenario record created to exercise the dedicated visionary registry.'
          }
        ]
      }
    }));
  });

  const metadataPanel = page.getByRole('region', { name: /LA River Rail Vision/i });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('LA River Rail Vision');
  await expect(metadataPanel).toContainText('Visionary');
  await expect(metadataPanel).toContainText('speculative');
  await expect(metadataPanel).toContainText('Speculative VeloRail scenario');
  await expect(metadataPanel).toContainText('VeloRail');
  await expect(metadataPanel).toContainText('2026-05-19');
  await expect(metadataPanel).toContainText('internal_example');
  await expect(metadataPanel).toContainText('Internal scenario record');

  await metadataPanel.getByRole('button', { name: 'Close metadata' }).click();
  await expect(metadataPanel).toBeHidden();
});

test('@MBR-85 @MBR-89 @VR-104 @veloRail-a3d0 completed network comparison mode controls official future overlay state', async ({ page }) => {
  await ensureMapsAvailable(page);

  const layerPanel = page.getByLabel('Map layers and legend');
  const presentOnlyMode = page.getByRole('button', { name: /Present Only/i });
  const presentPlusFutureMode = page.getByRole('button', { name: /Present \+ Future/i });
  const futureOverlayToggle = page.getByRole('button', {
    name: /Official planned, funded, and under-construction future rail and BRT alignments/i
  });

  await expect(layerPanel).toContainText('Present Only');
  await expect(presentOnlyMode).toHaveAttribute('aria-pressed', 'true');
  await expect(futureOverlayToggle).toHaveAttribute('aria-pressed', 'false');

  await presentPlusFutureMode.click();

  await expect(presentPlusFutureMode).toHaveAttribute('aria-pressed', 'true');
  await expect(futureOverlayToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(layerPanel).toContainText('Present + Future');
  await expect(page.getByRole('button', { name: /unofficial visionary rail concepts/i })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('button', {
    name: /hypothetical passenger-conversion planning over sourced freight corridors; not approved service/i
  })).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: /legend/i }).click();

  const legend = page.getByLabel('Visible layer legend');
  await expect(legend).toContainText('Comparison mode');
  await expect(legend).toContainText('Official future context');
  await expect(legend).toContainText(
    'Future service is official planned, funded, or under construction overlay context, not current Google Maps operational service.'
  );

  await presentOnlyMode.click();

  await expect(presentOnlyMode).toHaveAttribute('aria-pressed', 'true');
  await expect(futureOverlayToggle).toHaveAttribute('aria-pressed', 'false');
  await expect(layerPanel).toContainText('Present Only');
});

test('@MBR-87 @MBR-89 mobile layer controls collapse behind a trigger and open as a sheet', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ensureMapsAvailable(page);

  const layerTrigger = page.getByRole('button', { name: /layers, \d+ active/i });
  const layerPanel = page.getByLabel('Map layers and legend');

  await expect(layerTrigger).toBeVisible();
  await expect(layerTrigger).toHaveAttribute('aria-expanded', 'false');
  await expect(layerPanel).toBeHidden();

  await layerTrigger.click();
  await expect(layerTrigger).toHaveAttribute('aria-expanded', 'true');
  await expect(layerPanel).toBeVisible();
  await expect(layerPanel.locator('.map-layer-panel__title')).toBeFocused();

  const panelBox = await layerPanel.boundingBox();
  const viewport = page.viewportSize();
  expect(panelBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(panelBox!.x).toBeGreaterThanOrEqual(0);
  expect(panelBox!.y).toBeGreaterThanOrEqual(0);
  expect(panelBox!.x + panelBox!.width).toBeLessThanOrEqual(viewport!.width + 1);
  expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(viewport!.height + 1);

  await page.getByRole('button', { name: 'Close layers' }).click();
  await expect(layerPanel).toBeHidden();
  await expect(layerTrigger).toBeFocused();
});

test('@MBR-85 @MBR-88 @MBR-89 layer feature list opens metadata without a map click and returns focus on Escape', async ({ page }) => {
  await ensureMapsAvailable(page);

  const futureOverlayToggle = page.getByRole('button', {
    name: /Official planned, funded, and under-construction future rail and BRT alignments/i
  });
  await futureOverlayToggle.click();

  const featureList = page.getByLabel('Keyboard-accessible overlay metadata');
  await expect(featureList).toContainText('Google Maps renders these lines');
  const firstFeature = featureList.getByRole('button', { name: /D Line Westwood Extension/i });
  const firstFeatureText = await firstFeature.innerText();

  await firstFeature.click();

  const metadataPanel = page.locator('#map-overlay-metadata-panel');
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel.locator('.map-overlay-metadata__title')).toBeFocused();
  await expect(metadataPanel).toContainText('Google Maps renders the geometry');
  await expect(metadataPanel).toContainText('Uncertainty');

  await page.keyboard.press('Escape');
  await expect(metadataPanel).toBeHidden();
  await expect(firstFeature).toBeFocused();
  expect(firstFeatureText.length).toBeGreaterThan(0);
});

test('@MBR-101 future detail entries hover, focus, and click-highlight their rendered proposal line', async ({ page }) => {
  await ensureMapsAvailable(page);

  await page.evaluate(() => {
    (window as unknown as { __veloRailHighlightEvents: Array<Record<string, unknown>> }).__veloRailHighlightEvents = [];
    window.addEventListener('velorail:map-overlay-feature-highlighted', (event) => {
      const customEvent = event as CustomEvent<Record<string, unknown>>;
      (window as unknown as { __veloRailHighlightEvents: Array<Record<string, unknown>> }).__veloRailHighlightEvents.push(customEvent.detail);
    });
  });

  await page.getByRole('button', { name: /Present \+ Future/i }).click();

  const dLineDetail = page.getByRole('button', {
    name: /D Line Westwood Extension.*Hover or focus to highlight this line/i
  });

  await expect(dLineDetail).toBeVisible();
  await dLineDetail.hover();
  await expect(dLineDetail).toHaveClass(/map-layer-feature-list__item--hovered/);
  await expect.poll(async () => page.evaluate(() => {
    const events = (window as unknown as { __veloRailHighlightEvents: Array<Record<string, unknown>> }).__veloRailHighlightEvents;

    return events.some((event) => (
      event.featureId === 'metro-d-line-extension-westwood-line'
      && event.state === 'hovered'
      && event.strokeWeight === 6
    ));
  })).toBe(true);

  await dLineDetail.click();
  await expect(dLineDetail).toHaveClass(/map-layer-feature-list__item--selected/);
  const metadataPanel = page.getByRole('region', { name: /D Line Westwood Extension/i });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('D Line Westwood Extension');
  await expect.poll(async () => page.evaluate(() => {
    const events = (window as unknown as { __veloRailHighlightEvents: Array<Record<string, unknown>> }).__veloRailHighlightEvents;

    return events.some((event) => (
      event.featureId === 'metro-d-line-extension-westwood-line'
      && event.state === 'selected'
      && event.strokeWeight === 8
    ));
  })).toBe(true);

  await metadataPanel.getByRole('button', { name: 'Close metadata' }).click();
  await expect(dLineDetail).not.toHaveClass(/map-layer-feature-list__item--selected/);
});
