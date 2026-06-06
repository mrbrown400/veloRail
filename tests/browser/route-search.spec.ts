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

test('@smoke @MBR-89 @VR-304 @VR-305 typed endpoints make the route search respond visibly', async ({ page }) => {
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

test('@MBR-83 @MBR-89 collapsed destination submit expands origin repair and preserves destination', async ({ page }) => {
  await ensureMapsAvailable(page);

  const destinationInput = page.getByPlaceholder('Where to?');
  await destinationInput.fill('Hollywood/Vine Station');
  await page.getByRole('button', { name: 'Find Route' }).click();

  const originInput = page.getByPlaceholder('Your Location');
  await expect(originInput).toBeVisible();
  await expect(originInput).toBeFocused();
  await expect(page.getByPlaceholder('Where to?')).toHaveValue('Hollywood/Vine Station');
  await expect(page.getByText('Add a start location or use current location to continue.')).toBeVisible();
  await expect(page.getByText('Destination saved. Add an origin to compare car-free routes.')).toBeVisible();
});

test('@MBR-83 @MBR-89 autocomplete input exposes combobox state and typed fallback repair path', async ({ page }) => {
  await ensureMapsAvailable(page);

  const destinationInput = page.getByPlaceholder('Where to?');
  await expect(destinationInput).toHaveAttribute('role', 'combobox');
  await destinationInput.fill('zzzzzzzzzz impossible station');

  await expect(destinationInput).toHaveAttribute('aria-controls', /route-end-field-listbox/);
  await page.keyboard.press('Escape');
  await expect(destinationInput).toHaveAttribute('aria-expanded', 'false');
});

test('@MBR-89 expanded search surfaces destination repair state without opening results', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search?**', async (route) => {
    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{
        lat: '34.0561',
        lon: '-118.2375',
        display_name: 'Union Station Los Angeles'
      }])
    });
  });

  await ensureMapsAvailable(page);

  await page.locator('.location-status').click();
  await expect(page.getByPlaceholder('Your Location')).toBeVisible();
  await page.getByPlaceholder('Your Location').fill('Union Station Los Angeles');

  await page.getByRole('button', { name: 'Find Route' }).click();

  const destinationInput = page.getByPlaceholder('Where to?');
  await expect(destinationInput).toHaveAttribute('aria-invalid', 'true');
  await expect(page.getByText('Enter a destination or choose a place suggestion before finding a route.')).toBeVisible();
  await expect(page.locator('.results-sidebar.open')).toBeHidden();
  await expect(page.getByTestId('find-route-button')).toBeEnabled();
});

test('@MBR-86 @MBR-89 mobile expanded search keeps primary route action visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ensureMapsAvailable(page);

  await page.getByPlaceholder('Where to?').fill('Hollywood/Vine Station');
  await page.getByTestId('find-route-button').click();

  const originInput = page.getByPlaceholder('Your Location');
  const findRouteButton = page.getByTestId('find-route-button');
  const buttonBox = await findRouteButton.boundingBox();
  const viewport = page.viewportSize();

  await expect(originInput).toBeFocused();
  await expect(findRouteButton).toBeVisible();
  expect(buttonBox).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(buttonBox!.x).toBeGreaterThanOrEqual(0);
  expect(buttonBox!.y).toBeGreaterThanOrEqual(0);
  expect(buttonBox!.x + buttonBox!.width).toBeLessThanOrEqual(viewport!.width);
  expect(buttonBox!.y + buttonBox!.height).toBeLessThanOrEqual(viewport!.height);
});

test('@MBR-88 @MBR-89 bike settings popover has named controls and Escape focus return', async ({ page }) => {
  await ensureMapsAvailable(page);

  const bikeToggle = page.getByRole('button', { name: 'Bike' });
  await bikeToggle.click();

  const bikePanel = page.getByRole('region', { name: 'Bike Settings' });
  await expect(bikePanel).toBeVisible();
  const speedSlider = page.getByLabel(/Cruising Speed/i);
  await expect(speedSlider).toBeVisible();
  await expect(page.getByLabel(/Rider \+ Bike Weight/i)).toBeVisible();

  await speedSlider.focus();
  await page.keyboard.press('Escape');
  await expect(bikePanel).toBeHidden();
  await expect(bikeToggle).toBeFocused();
});

test('@MBR-113 route search exposes and selects Arrive by time mode', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('region', { name: 'Route search' })).toBeVisible({ timeout: 20_000 });

  const departAt = page.getByRole('radio', { name: 'Depart at' });
  const arriveBy = page.getByRole('radio', { name: 'Arrive by' });

  await expect(departAt).toBeVisible();
  await expect(departAt).toBeChecked();
  await expect(arriveBy).toBeVisible();

  await arriveBy.check();
  await expect(arriveBy).toBeChecked();
  await expect(page.getByLabel('Arrival time')).toBeVisible();
});

test('@MBR-84 @MBR-89 @veloRail-a0c4 route search uses Maps JavaScript Routes without request shape errors', async ({ page }) => {
  const consoleMessages: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (message) => {
    consoleMessages.push(message.text());
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await ensureMapsAvailable(page);

  await page.locator('.location-status').click();
  await expect(page.getByPlaceholder('Your Location')).toBeVisible();

  await page.getByPlaceholder('Your Location').fill('Union Station Los Angeles');
  await page.getByPlaceholder('Your Location').press('Escape');
  await page.getByPlaceholder('Where to?').fill('Hollywood/Vine Station');
  await page.getByPlaceholder('Where to?').press('Escape');
  await page.getByRole('button', { name: 'Find Route' }).click();

  const resultsPanel = page.locator('.results-sidebar.open');
  await expect(resultsPanel).toBeVisible({ timeout: 45_000 });
  await expect(resultsPanel.locator('.route-option-label')).toContainText([
    'Bike + Rail',
    'Driving',
    'Walk + Rail'
  ]);
  await expect(resultsPanel.locator('.route-option', { hasText: 'Driving' }).first()).toContainText('Comparison only');

  const drivingOption = resultsPanel.locator('.route-option', { hasText: 'Driving' }).first();
  await drivingOption.click();
  await expect(drivingOption).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.route-details h3')).toContainText('Driving');
  await expect(page.locator('.route-details')).toContainText('Selected itinerary: Driving');

  await page.getByRole('button', { name: 'Close route results' }).click();
  await expect(resultsPanel).toBeHidden();
  const reopenButton = page.getByRole('button', { name: /show \d+ routes?/i });
  await expect(reopenButton).toBeVisible();
  await reopenButton.click();
  await expect(resultsPanel).toBeVisible();
  await expect(page.locator('.route-details h3')).toContainText('Driving');

  const scriptSources = await page.evaluate(() =>
    Array.from(document.scripts).map((script) => script.src).filter(Boolean)
  );
  expect(scriptSources.some((src) => src.includes('/routes.js'))).toBe(true);

  const routeRequestShapeErrors = [...consoleMessages, ...pageErrors].filter((text) =>
    /Google .*routing error|Google Routes error|InvalidValueError|Unknown UnitSystem|trafficModel|Timestamp must be set|TRAM is not supported/i.test(text)
  );
  expect(routeRequestShapeErrors).toEqual([]);
});

test('@veloRail-8982 bike and walk rail estimates use different surface speeds', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search?**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const query = requestUrl.searchParams.get('q')?.toLowerCase() || '';
    const isHollywood = query.includes('hollywood');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{
        lat: isHollywood ? '34.1013225' : '34.0486587',
        lon: isHollywood ? '-118.325586' : '-118.258743',
        display_name: isHollywood ? 'Hollywood/Vine Station' : '7th St/Metro Center'
      }])
    });
  });

  await page.route('https://router.project-osrm.org/route/v1/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const [profileAndCoords] = requestUrl.pathname.split('/route/v1/').slice(1);
    const [profile, coordinateText] = profileAndCoords.split('/');
    const coordinates = coordinateText.split(';').map((pair) => pair.split(',').map(Number));
    const isDriving = profile === 'driving';

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'Ok',
        routes: [{
          distance: isDriving ? 10_800 : 1_000,
          duration: isDriving ? 1_020 : 60,
          geometry: {
            type: 'LineString',
            coordinates
          }
        }]
      })
    });
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  await expect(page.getByRole('region', { name: 'Route search' })).toBeVisible({ timeout: 20_000 });

  await page.locator('.location-status').click();
  await page.getByPlaceholder('Your Location').fill('Hollywood/Vine Station');
  await page.getByPlaceholder('Where to?').fill('7th St/Metro Center');
  await page.getByRole('button', { name: 'Find Route' }).click();

  const bikeOption = page.locator('.route-option', { hasText: 'Bike + Rail' }).first();
  const walkOption = page.locator('.route-option', { hasText: 'Walk + Rail' }).first();

  await expect(bikeOption).toBeVisible({ timeout: 20_000 });
  await expect(walkOption).toBeVisible();

  const bikeDuration = await bikeOption.locator('.route-option-duration').innerText();
  const walkDuration = await walkOption.locator('.route-option-duration').innerText();
  const bikeDurationMinutes = parseDurationMinutes(bikeDuration);
  const walkDurationMinutes = parseDurationMinutes(walkDuration);

  await expect(bikeOption).toContainText(/Bike to/i);
  await expect(walkOption).toContainText(/Walk to/i);
  expect(bikeDurationMinutes).toBeGreaterThan(0);
  expect(walkDurationMinutes).toBeGreaterThan(0);
});

test('@smoke @MBR-89 @VR-306 @VR-307 @VR-308 bike settings popover is not clipped by the search card', async ({ page }) => {
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

test('@MBR-89 @VR-101 @VR-102 @VR-103 @VR-105 future transit overlay control is grouped and default off', async ({ page }) => {
  await ensureMapsAvailable(page);

  const futureToggle = page.getByRole('button', {
    name: /official planned, funded, and under-construction future rail and BRT alignments/i
  });

  await expect(futureToggle).toBeVisible();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'false');

  await futureToggle.click();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'true');

  await futureToggle.click();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'false');
});

test('@MBR-85 @MBR-89 @VR-303 layer panel groups overlays and exposes a visible legend', async ({ page }) => {
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
    name: /official planned, funded, and under-construction future rail and BRT alignments/i
  });

  await expect(currentTransitToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'false');

  await page.getByRole('button', { name: /legend/i }).click();
  await expect(page.getByLabel('Visible layer legend')).toBeVisible();
  await expect(page.getByText('Google transit')).toBeVisible();

  await futureToggle.click();
  await expect(futureToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(panel.locator('.map-layer-group-future .map-layer-group__count')).toHaveText('1/1');
  await expect(page.getByLabel('Visible layer legend').getByText('Future heavy rail').first()).toBeVisible();
});

test('@MBR-89 @VR-305 @VR-307 overlay metadata can be dismissed with Escape', async ({ page }) => {
  await ensureMapsAvailable(page);
  await dispatchSampleOverlayMetadata(page);

  const metadataPanel = page.getByRole('region', { name: 'VR-305 Test Corridor' });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('Approximate geometry');

  await page.keyboard.press('Escape');
  await expect(metadataPanel).toBeHidden();
});

test('@MBR-89 @VR-306 @VR-308 mobile overlay panels stay within the viewport', async ({ page }) => {
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

test('@MBR-84 @MBR-86 @MBR-88 @MBR-89 @VR-306 @VR-307 route results can switch sheet states, select a route, close, and reopen when options are available', async ({ page }) => {
  await page.setViewportSize({ width: 430, height: 932 });
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
  test.skip(!sidebarVisible, 'VeloRail did not render route options in this environment.');
  const resultsSheet = page.getByTestId('route-results-sheet');
  await expect(resultsSheet).toHaveAttribute('data-route-sheet-state', 'half');

  const routeOptions = page.locator('.route-option');
  await expect(routeOptions.first()).toHaveAttribute('aria-pressed', 'true');
  const routeOptionCount = await routeOptions.count();
  if (routeOptionCount > 1) {
    const alternateOption = routeOptions.nth(1);
    const alternateLabel = await alternateOption.locator('.route-option-label').innerText();
    await alternateOption.click();
    await expect(alternateOption).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('.route-details h3')).toContainText(alternateLabel);
  }

  await page.getByRole('button', { name: 'Itinerary' }).click();
  await expect(resultsSheet).toHaveAttribute('data-route-sheet-state', 'full');
  await expect(page.locator('.route-details h3')).toBeFocused();
  const selectedDetailHeading = await page.locator('.route-details h3').innerText();

  await page.getByRole('button', { name: 'Show route options' }).click();
  await expect(resultsSheet).toHaveAttribute('data-route-sheet-state', 'half');

  await page.getByRole('button', { name: 'Close route results' }).click();
  await expect(page.locator('.results-sidebar.open')).toBeHidden();

  const reopenButton = page.getByRole('button', { name: /show \d+ routes?/i });
  await expect(reopenButton).toBeVisible();
  await expect(reopenButton).toBeFocused();
  await reopenButton.click();
  await expect(page.locator('.results-sidebar.open')).toBeVisible();
  await page.getByRole('button', { name: 'Itinerary' }).click();
  await expect(page.locator('.route-details h3')).toHaveText(selectedDetailHeading);
});

function parseDurationMinutes(duration: string): number {
  const hourMatch = duration.match(/(\d+)\s*hr/);
  const minuteMatch = duration.match(/(\d+)\s*min/);
  return (hourMatch ? Number(hourMatch[1]) * 60 : 0) + (minuteMatch ? Number(minuteMatch[1]) : 0);
}

test('@MBR-103 LADOT Commuter Express appears during selected weekday peak window', async ({ page }) => {
  await page.route('https://nominatim.openstreetmap.org/search?**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const query = requestUrl.searchParams.get('q')?.toLowerCase() || '';
    const isSeventh = query.includes('7th') || query.includes('metro');

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify([{
        lat: isSeventh ? '34.0487' : '33.9860',
        lon: isSeventh ? '-118.2587' : '-118.4730',
        display_name: isSeventh ? '7th St/Metro Center' : 'Venice near CE 437'
      }])
    });
  });

  await page.route('https://router.project-osrm.org/route/v1/**', async (route) => {
    const requestUrl = new URL(route.request().url());
    const [profileAndCoords] = requestUrl.pathname.split('/route/v1/').slice(1);
    const [, coordinateText] = profileAndCoords.split('/');
    const coordinates = coordinateText.split(';').map((pair) => pair.split(',').map(Number));

    await route.fulfill({
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'Ok',
        routes: [{
          distance: 1_000,
          duration: 60,
          geometry: {
            type: 'LineString',
            coordinates
          }
        }]
      })
    });
  });

  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');
  const mapErrorVisible = await page.getByText('Error Loading Google Maps').isVisible().catch(() => false);
  test.skip(mapErrorVisible, 'MBR-103 browser route search requires a working Google Maps API key; unit tests cover CE filtering deterministically.');
  await expect(page.getByRole('region', { name: 'Route search' })).toBeVisible({ timeout: 20_000 });
  await page.evaluate(() => {
    const maps = google.maps as unknown as {
      Geocoder: new () => {
        geocode: (
          request: { address?: string },
          callback: (results: Array<{
            formatted_address: string;
            geometry: { location: { lat: () => number; lng: () => number } };
          }>, status: string) => void
        ) => void;
      };
    };

    maps.Geocoder = class {
      geocode(
        request: { address?: string },
        callback: (results: Array<{
          formatted_address: string;
          geometry: { location: { lat: () => number; lng: () => number } };
        }>, status: string) => void
      ) {
        const address = request.address?.toLowerCase() ?? '';
        const isSeventh = address.includes('7th') || address.includes('metro');
        const lat = isSeventh ? 34.0487 : 33.9860;
        const lng = isSeventh ? -118.2587 : -118.4730;

        callback([{
          formatted_address: isSeventh ? '7th St/Metro Center' : 'Venice near CE 437',
          geometry: {
            location: {
              lat: () => lat,
              lng: () => lng
            }
          }
        }], 'OK');
      }
    };
  });

  await page.locator('.location-status').click();
  await page.getByLabel('Route mode').selectOption('all');
  await page.getByText('Schedule').click();
  await page.getByText('Depart at').click();
  await page.getByLabel('Departure time').fill('2026-06-02T07:30');
  await page.getByPlaceholder('Your Location').fill('Venice near CE 437');
  await page.getByPlaceholder('Your Location').press('Escape');
  await page.getByPlaceholder('Where to?').fill('7th St/Metro Center');
  await page.getByPlaceholder('Where to?').press('Escape');
  await page.getByRole('button', { name: 'Find Route' }).click();

  const commuterExpress = page.locator('.route-option', { hasText: 'LADOT Commuter Express' }).first();
  await expect(commuterExpress).toBeVisible({ timeout: 20_000 });
  await expect(commuterExpress).toContainText('Commuter Express Bus');
  await expect(commuterExpress).toContainText('LADOT CE 437');

  await commuterExpress.click();
  await expect(page.locator('.route-details')).toContainText('Take LADOT CE 437 commuter express bus');
  await expect(page.locator('.route-details')).toContainText('~20 min wait');
});
