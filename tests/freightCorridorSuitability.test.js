import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('freight suitability scoring is deterministic and documents missing data', async () => {
  const {
    scoreFreightCorridorSuitability,
    estimateProposalPathDistanceKm
  } = await loadAppModule('/src/services/freightCorridorSuitability.ts');
  const {
    LA_FREIGHT_RAIL_CORRIDOR_DATASET
  } = await loadAppModule('/src/data/laFreightRailCorridors.ts');

  const alameda = LA_FREIGHT_RAIL_CORRIDOR_DATASET.proposals.find(
    proposal => proposal.id === 'la-freight-alameda-corridor'
  );

  assert.ok(alameda);

  const firstScore = scoreFreightCorridorSuitability(alameda);
  const secondScore = scoreFreightCorridorSuitability(alameda);

  assert.deepEqual(firstScore, secondScore);
  assert.equal(firstScore.method, 'vr-406-transparent-heuristic-v1');
  assert.equal(firstScore.scoredAt, '2026-05-19');
  assert.ok(firstScore.score >= 0 && firstScore.score <= 100);
  assert.ok(['low', 'medium', 'high'].includes(firstScore.rating));
  assert.ok(firstScore.factors.length >= 6);
  assert.ok(firstScore.missingData.includes('passenger demand'));
  assert.ok(estimateProposalPathDistanceKm(alameda) > 15);
});
