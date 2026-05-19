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

  await expect(page.getByLabel('Route search')).toBeVisible({ timeout: 20_000 });
}

test('@VR-003 @VR-004 @VR-403 @VR-404 @VR-405 @veloRail-967a nationalized overlay exposes hypothetical conversion legend and metadata panel', async ({ page }) => {
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

  const metadataPanel = page.getByLabel('Selected map overlay metadata');
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
