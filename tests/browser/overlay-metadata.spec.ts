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

test('@VR-003 @VR-004 @VR-305 @VR-307 @VR-403 nationalized overlay exposes freight legend and metadata panel', async ({ page }) => {
  await ensureMapsAvailable(page);

  const nationalizedToggle = page.getByRole('button', {
    name: /freight and conversion corridor overlays/i
  });

  await expect(nationalizedToggle).toHaveAttribute('aria-pressed', 'false');
  await nationalizedToggle.click();
  await expect(nationalizedToggle).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: /legend/i }).click();
  await expect(page.getByLabel('Visible layer legend')).toContainText('Freight corridor');

  await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('velorail:map-overlay-metadata-selected', {
      detail: {
        id: 'la-freight-alameda-corridor-corridor',
        proposalId: 'la-freight-alameda-corridor',
        kind: 'corridor',
        title: 'Alameda Corridor',
        subtitle: 'corridor · freight rail',
        badgeLabel: 'Freight only',
        badgeClassName: 'map-overlay-metadata__badge--freight',
        statusLabel: 'freight only',
        classificationLabel: 'official',
        confidenceLabel: 'high',
        uncertaintyLabel: 'medium',
        disclaimer: 'Official freight corridor record with approximate VeloRail geometry. Do not infer passenger service.',
        details: [
          { label: 'Status', value: 'freight only' },
          { label: 'Classification', value: 'official' },
          { label: 'Confidence', value: 'high' },
          { label: 'Owner', value: 'Alameda Corridor Transportation Authority' },
          { label: 'Operator', value: 'BNSF Railway / Union Pacific Railroad' },
          { label: 'Track usage', value: 'freight' }
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

  const metadataPanel = page.getByRole('region', { name: 'Alameda Corridor' });
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('Alameda Corridor');
  await expect(metadataPanel).toContainText('Freight only');
  await expect(metadataPanel).toContainText('Alameda Corridor Transportation Authority');
  await expect(metadataPanel).toContainText('approximate VeloRail geometry');
  await expect(metadataPanel.getByRole('link', { name: 'Alameda Corridor Transportation Authority' })).toHaveAttribute('href', 'https://www.acta.org/');

  await metadataPanel.getByRole('button', { name: 'Close metadata' }).click();
  await expect(metadataPanel).toBeHidden();
});
