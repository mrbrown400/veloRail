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

test('@VR-003 @VR-004 @VR-403 nationalized overlay exposes freight legend and metadata panel', async ({ page }) => {
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

  const metadataPanel = page.getByLabel('Selected map overlay metadata');
  await expect(metadataPanel).toBeVisible();
  await expect(metadataPanel).toContainText('Alameda Corridor');
  await expect(metadataPanel).toContainText('Freight only');
  await expect(metadataPanel).toContainText('Alameda Corridor Transportation Authority');
  await expect(metadataPanel).toContainText('approximate VeloRail geometry');
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

  const metadataPanel = page.getByLabel('Selected map overlay metadata');
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
