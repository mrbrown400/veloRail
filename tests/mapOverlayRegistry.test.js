import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('map overlay registry has deterministic order and default visibility', async () => {
  const {
    getDefaultMapOverlayVisibility,
    getOrderedMapOverlayDefinitions
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const definitions = getOrderedMapOverlayDefinitions();

  assert.deepEqual(definitions.map((definition) => definition.id), [
    'current-transit',
    'future-projects',
    'visionary-concepts',
    'nationalized-rail',
    'bicycling'
  ]);
  assert.deepEqual(
    definitions.map((definition) => definition.order),
    [10, 20, 30, 40, 50]
  );

  const visibility = getDefaultMapOverlayVisibility();

  assert.equal(visibility['current-transit'], true);
  assert.equal(visibility['future-projects'], true);
  assert.equal(visibility['visionary-concepts'], false);
  assert.equal(visibility['nationalized-rail'], false);
  assert.equal(visibility.bicycling, false);
});

test('proposal overlay groups expose sample layers independently', async () => {
  const {
    getProposalOverlayInputsByGroup
  } = await loadAppModule('/src/components/Map/mapOverlayRegistry.ts');

  const future = getProposalOverlayInputsByGroup('future');
  const visionary = getProposalOverlayInputsByGroup('visionary');
  const nationalized = getProposalOverlayInputsByGroup(['freight', 'converted_passenger']);

  assert.deepEqual(future.map(({ proposal }) => proposal.id), [
    'metro-d-line-extension-westwood'
  ]);
  assert.deepEqual(visionary.map(({ proposal }) => proposal.id), [
    'vision-vermont-rapid-rail'
  ]);
  assert.deepEqual(nationalized.map(({ proposal }) => proposal.id), [
    'freight-alameda-corridor'
  ]);
  assert.ok(future[0].polyline.path.length > 1);
});

test('map overlay store toggles one overlay without mutating others', async () => {
  const {
    useMapOverlayStore
  } = await loadAppModule('/src/stores/mapOverlayStore.ts');

  useMapOverlayStore.getState().resetOverlayVisibility();
  const before = useMapOverlayStore.getState().visibility;

  useMapOverlayStore.getState().toggleOverlay('visionary-concepts');

  const after = useMapOverlayStore.getState().visibility;

  assert.equal(after['visionary-concepts'], !before['visionary-concepts']);
  assert.equal(after['current-transit'], before['current-transit']);
  assert.equal(after['future-projects'], before['future-projects']);
  assert.equal(after['nationalized-rail'], before['nationalized-rail']);
});
