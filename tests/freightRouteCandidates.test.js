import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('freight route candidate generation exports reviewable deterministic routes', async () => {
  const {
    buildFreightCorridorGraph,
    generateFreightPassengerRouteCandidates
  } = await loadAppModule('/src/services/freightRouteCandidates.ts');
  const {
    SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET
  } = await loadAppModule('/src/data/transitProposalSources.ts');

  const graph = buildFreightCorridorGraph(SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET);
  const firstCandidateSet = generateFreightPassengerRouteCandidates(SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET);
  const secondCandidateSet = generateFreightPassengerRouteCandidates(SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET);

  assert.deepEqual(firstCandidateSet, secondCandidateSet);
  assert.equal(graph.nodes.length, 12);
  assert.equal(graph.edges.length, 8);
  assert.deepEqual(firstCandidateSet.candidates.map(candidate => candidate.sourceFreightCorridorId), [
    'la-freight-alameda-corridor',
    'la-freight-bnsf-los-angeles-san-bernardino',
    'la-freight-union-pacific-los-angeles-inland-empire'
  ]);
  assert.ok(firstCandidateSet.candidates.every(candidate => candidate.reviewStatus === 'needs_review'));
  assert.ok(firstCandidateSet.candidates.every(candidate => candidate.canRender));
  assert.ok(firstCandidateSet.candidates.every(candidate => candidate.limitations.join(' ').includes('not from live railroad operations')));
  assert.match(firstCandidateSet.reviewWorkflow.join(' '), /never mark generated candidates as official service/);
});
