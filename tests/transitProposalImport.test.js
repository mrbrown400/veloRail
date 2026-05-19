import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

test('transit proposal import returns Google Maps-ready overlay inputs', async () => {
  const {
    importTransitProposalDataset
  } = await loadAppModule('/src/data/transitProposalImport.ts');
  const {
    TRANSIT_PROPOSAL_DATASET
  } = await loadAppModule('/src/data/transitProposals.ts');

  const result = importTransitProposalDataset(TRANSIT_PROPOSAL_DATASET, {
    sourceName: 'seed-transit-proposals.v1.ts'
  });
  const firstOverlay = result.overlays[0];
  const firstStation = firstOverlay.proposal.stations[0];

  assert.equal(result.sourceName, 'seed-transit-proposals.v1.ts');
  assert.equal(result.schemaVersion, '1.0.0');
  assert.equal(result.overlays.length, TRANSIT_PROPOSAL_DATASET.proposals.length);
  assert.equal(firstOverlay.polyline.proposalId, firstOverlay.proposal.id);
  assert.ok(firstOverlay.polyline.path.length >= 2);
  assert.deepEqual(firstOverlay.polyline.options.path, firstOverlay.polyline.path);
  assert.equal(firstOverlay.markers[0].position.lat, firstStation.lat);
  assert.equal(firstOverlay.markers[0].position.lng, firstStation.lon);
  assert.equal(firstOverlay.markers[0].openingYear, firstStation.openingYear);
  assert.equal(firstOverlay.markers[0].phase, firstStation.phase);
  assert.equal(firstOverlay.markers[0].confidence, firstStation.confidence);
  assert.equal(firstOverlay.markers[0].notes, firstStation.notes);
});

test('default transit proposal source manifest imports without map code changes', async () => {
  const {
    IMPORTED_TRANSIT_PROPOSALS,
    TRANSIT_PROPOSAL_SOURCE_FILES
  } = await loadAppModule('/src/data/transitProposalSources.ts');

  assert.equal(TRANSIT_PROPOSAL_SOURCE_FILES.length, 2);
  assert.equal(IMPORTED_TRANSIT_PROPOSALS.dataset.schemaVersion, '1.0.0');
  assert.equal(
    IMPORTED_TRANSIT_PROPOSALS.overlays.length,
    IMPORTED_TRANSIT_PROPOSALS.dataset.proposals.length
  );
});

test('official LA future transit batch validates and renders overlay-ready inputs', async () => {
  const {
    OFFICIAL_LA_FUTURE_TRANSIT_DATASET
  } = await loadAppModule('/src/data/officialFutureTransitProposals.ts');
  const {
    importTransitProposalDataset
  } = await loadAppModule('/src/data/transitProposalImport.ts');

  const result = importTransitProposalDataset(OFFICIAL_LA_FUTURE_TRANSIT_DATASET, {
    sourceName: 'official-la-future-transit.v1.ts'
  });
  const proposalIds = result.dataset.proposals.map(proposal => proposal.id);

  assert.deepEqual(proposalIds, [
    'metro-east-san-fernando-valley-lrt',
    'metro-southeast-gateway-line',
    'metro-k-line-extension-torrance',
    'metro-eastside-transit-corridor-phase-2',
    'metro-noho-pasadena-brt',
    'metro-vermont-brt'
  ]);
  assert.equal(result.dataset.updatedAt, '2026-05-19');
  assert.equal(result.overlays.length, proposalIds.length);

  for (const overlay of result.overlays) {
    assert.equal(overlay.proposal.classification, 'official');
    assert.equal(overlay.proposal.rendering.layerGroup, 'future');
    assert.ok(['planned', 'under_construction'].includes(overlay.proposal.status));
    assert.ok(overlay.proposal.provenance.length >= 1);
    assert.ok(overlay.proposal.provenance.every(source => source.accessedAt === '2026-05-19'));
    assert.equal(overlay.proposal.geometry.geometrySource, 'approximate');
    assert.match(overlay.proposal.geometry.geometryNotes, /Approximate|approximate/);
    assert.ok(overlay.polyline.path.length >= 2);
    assert.ok(overlay.markers.length >= 3);
  }
});

test('merged default manifest keeps official future records separate from visionary and freight samples', async () => {
  const {
    IMPORTED_TRANSIT_PROPOSALS
  } = await loadAppModule('/src/data/transitProposalSources.ts');

  const futureRecords = IMPORTED_TRANSIT_PROPOSALS.dataset.proposals.filter(
    proposal => proposal.rendering?.layerGroup === 'future'
  );
  const unofficialRecords = IMPORTED_TRANSIT_PROPOSALS.dataset.proposals.filter(
    proposal => proposal.classification !== 'official'
  );
  const freightRecords = IMPORTED_TRANSIT_PROPOSALS.dataset.proposals.filter(
    proposal => proposal.rendering?.layerGroup === 'freight'
  );

  assert.equal(futureRecords.length, 7);
  assert.ok(futureRecords.every(proposal => proposal.classification === 'official'));
  assert.deepEqual(unofficialRecords.map(proposal => proposal.id), [
    'vision-vermont-rapid-rail'
  ]);
  assert.deepEqual(freightRecords.map(proposal => proposal.id), [
    'freight-alameda-corridor'
  ]);
});

test('transit proposal import fails fast on invalid ids, status, coordinates, and provenance', async () => {
  const {
    TransitProposalImportError,
    importTransitProposalDataset
  } = await loadAppModule('/src/data/transitProposalImport.ts');

  const invalidDataset = {
    schemaVersion: '1.0.0',
    updatedAt: '2026-05-05',
    proposals: [
      {
        id: 'Bad ID',
        name: 'Invalid Proposal',
        kind: 'line',
        status: 'imaginary',
        mode: 'light_rail',
        geometry: {
          type: 'LineString',
          coordinates: [
            [-118.25, 34.05],
            [-181, 34.06]
          ]
        },
        provenance: [],
        confidence: {
          level: 'high'
        }
      }
    ]
  };

  assert.throws(
    () => importTransitProposalDataset(invalidDataset, { sourceName: 'bad-source.v1.json' }),
    error => {
      assert.ok(error instanceof TransitProposalImportError);
      assert.equal(error.sourceName, 'bad-source.v1.json');
      assert.ok(error.issues.some(issue => issue.code === 'missing_field' && issue.path.endsWith('.id')));
      assert.ok(error.issues.some(issue => issue.code === 'invalid_status'));
      assert.ok(error.issues.some(issue => issue.code === 'invalid_coordinate'));
      assert.ok(error.issues.some(issue => issue.code === 'missing_provenance'));
      return true;
    }
  );
});

test('transit proposal import merges versioned sources before overlay conversion', async () => {
  const {
    importTransitProposalSources
  } = await loadAppModule('/src/data/transitProposalImport.ts');
  const {
    TRANSIT_PROPOSAL_DATASET
  } = await loadAppModule('/src/data/transitProposals.ts');

  const firstSource = {
    ...clone(TRANSIT_PROPOSAL_DATASET),
    updatedAt: '2026-05-01',
    proposals: [clone(TRANSIT_PROPOSAL_DATASET.proposals[0])]
  };
  const secondProposal = clone(TRANSIT_PROPOSAL_DATASET.proposals[1]);
  secondProposal.id = 'vision-vermont-rapid-rail-branch';
  const secondSource = {
    ...clone(TRANSIT_PROPOSAL_DATASET),
    updatedAt: '2026-05-03',
    migrationNotes: ['Second source note'],
    proposals: [secondProposal]
  };

  const result = importTransitProposalSources(
    [
      { name: 'first-source.v1.json', dataset: firstSource },
      { name: 'second-source.v1.json', dataset: secondSource }
    ],
    { sourceName: 'two-source-import' }
  );

  assert.equal(result.sourceName, 'two-source-import');
  assert.equal(result.dataset.updatedAt, '2026-05-03');
  assert.equal(result.dataset.proposals.length, 2);
  assert.equal(result.overlays.length, 2);
  assert.ok(result.dataset.migrationNotes.includes('Second source note'));
});
