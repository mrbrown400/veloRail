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

test('@VR-003 @VR-004 @VR-305 @VR-307 @VR-403 @VR-404 @VR-405 @veloRail-967a nationalized overlay exposes hypothetical conversion legend and metadata panel', async ({ page }) => {
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
  await expect(metadataPanel).toContainText('la-freight-alameda-corridor');
  await expect(metadataPanel).toContainText('Not approved Metro');
  await expect(metadataPanel.getByRole('link', { name: 'Alameda Corridor Transportation Authority' })).toHaveAttribute('href', 'https://www.acta.org/');

  await metadataPanel.getByRole('button', { name: 'Close metadata' }).click();
  await expect(metadataPanel).toBeHidden();
});

test('@VR-202 @VR-203 visionary overlay exposes speculative legend and metadata panel', async ({ page }) => {
  await ensureMapsAvailable(page);

  const visionaryToggle = page.getByRole('button', {
    name: /unofficial visionary rail concepts/i
  });

  await expect(visionaryToggle).toHaveAttribute('aria-pressed', 'false');
  await visionaryToggle.click();
  await expect(visionaryToggle).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /legend/i }).click();
  const legend = page.getByLabel('Visible layer legend');
  await expect(legend).toContainText('Visionary concept');
  await expect(legend).toContainText('Speculative river rail vision');

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

  await metadataPanel.getByRole('button', { name: 'Close metadata' }).click();
  await expect(metadataPanel).toBeHidden();
});

test('@VR-104 completed network comparison mode controls official future overlay state', async ({ page }) => {
  await ensureMapsAvailable(page);

  const layerPanel = page.getByLabel('Map layers and legend');
  const presentOnlyMode = page.getByRole('button', { name: /Present Only/i });
  const presentPlusFutureMode = page.getByRole('button', { name: /Present \+ Future/i });
  const futureOverlayToggle = page.getByRole('button', {
    name: /Official planned, funded, and under-construction future rail lines and stations/i
  });

  await expect(layerPanel).toContainText('Present Only');
  await expect(presentOnlyMode).toHaveAttribute('aria-pressed', 'true');
  await expect(futureOverlayToggle).toHaveAttribute('aria-pressed', 'false');

  await presentPlusFutureMode.click();

  await expect(presentPlusFutureMode).toHaveAttribute('aria-pressed', 'true');
  await expect(futureOverlayToggle).toHaveAttribute('aria-pressed', 'true');
  await expect(layerPanel).toContainText('Present + Future');

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
