import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('initial LA nationalized rail scenario curates converted passenger records only', async () => {
  const {
    INITIAL_LA_NATIONALIZED_RAIL_SCENARIO
  } = await loadAppModule('/src/data/laNationalizedRailScenario.ts');

  assert.equal(INITIAL_LA_NATIONALIZED_RAIL_SCENARIO.status, 'review_scenario');
  assert.deepEqual(INITIAL_LA_NATIONALIZED_RAIL_SCENARIO.includedProposalIds, [
    'alameda-corridor-south-alameda-passenger-conversion',
    'bnsf-la-san-bernardino-passenger-conversion',
    'up-la-inland-empire-passenger-conversion'
  ]);
  assert.deepEqual(INITIAL_LA_NATIONALIZED_RAIL_SCENARIO.excludedProposalIds, [
    'la-freight-pacific-harbor-line-port-complex'
  ]);
  assert.match(INITIAL_LA_NATIONALIZED_RAIL_SCENARIO.disclaimer, /Hypothetical nationalized-rail planning scenario/);
  assert.match(INITIAL_LA_NATIONALIZED_RAIL_SCENARIO.limitations.join(' '), /not .*official service/);
});
