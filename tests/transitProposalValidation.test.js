import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

function makeVisionaryProposal(overrides = {}) {
  return {
    id: 'test-visionary-line',
    name: 'Test Visionary Line',
    kind: 'line',
    status: 'vision',
    mode: 'heavy_rail',
    geometry: {
      type: 'LineString',
      coordinates: [
        [-118.25, 34.05],
        [-118.24, 34.06]
      ]
    },
    provenance: [
      {
        sourceId: 'test-source',
        title: 'Test source',
        sourceType: 'commentary',
        note: 'Derived from a test commentary source.'
      }
    ],
    confidence: {
      level: 'low'
    },
    uncertainty: {
      level: 'high',
      sourceNotes: 'Test source supports the concept only.'
    },
    rendering: {
      layerGroup: 'visionary'
    },
    ...overrides
  };
}

test('checked-in transit proposal dataset validates classification metadata', async () => {
  const {
    TRANSIT_PROPOSAL_DATASET,
    VALIDATED_TRANSIT_PROPOSALS
  } = await loadAppModule('/src/data/transitProposals.ts');

  assert.equal(VALIDATED_TRANSIT_PROPOSALS, TRANSIT_PROPOSAL_DATASET);
  assert.deepEqual(
    TRANSIT_PROPOSAL_DATASET.proposals.map(proposal => proposal.classification),
    ['official', 'speculative', 'official']
  );
});

test('visionary proposals require classification and uncertainty source notes', async () => {
  const {
    validateTransitProposalRecord
  } = await loadAppModule('/src/data/transitProposalValidation.ts');
  const proposal = makeVisionaryProposal({
    classification: undefined,
    uncertainty: undefined
  });

  const result = validateTransitProposalRecord(proposal);
  const codes = result.issues.map(issue => issue.code);

  assert.equal(result.valid, false);
  assert.ok(codes.includes('missing_classification'));
  assert.ok(codes.includes('missing_uncertainty'));
});

test('unofficial proposals cannot be classified into the official future layer', async () => {
  const {
    validateTransitProposalRecord
  } = await loadAppModule('/src/data/transitProposalValidation.ts');
  const proposal = makeVisionaryProposal({
    classification: 'commentary_summary',
    status: 'planned',
    rendering: {
      layerGroup: 'future'
    }
  });

  const result = validateTransitProposalRecord(proposal);
  const layerIssues = result.issues.filter(issue => issue.code === 'invalid_layer_classification');

  assert.equal(result.valid, false);
  assert.ok(layerIssues.some(issue => issue.path === 'proposal.rendering.layerGroup'));
  assert.ok(layerIssues.some(issue => issue.path === 'proposal.status'));
});

test('commentary-summary classification requires a commentary source', async () => {
  const {
    validateTransitProposalRecord
  } = await loadAppModule('/src/data/transitProposalValidation.ts');
  const proposal = makeVisionaryProposal({
    classification: 'commentary_summary',
    provenance: [
      {
        sourceId: 'test-advocacy-source',
        title: 'Test advocacy source',
        sourceType: 'advocacy',
        note: 'Derived from an advocacy map.'
      }
    ]
  });

  const result = validateTransitProposalRecord(proposal);

  assert.equal(result.valid, false);
  assert.ok(result.issues.some(issue => issue.code === 'invalid_classification'));
});
