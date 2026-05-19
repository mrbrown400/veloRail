import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('local station provider returns nearest operating rail stations first', async () => {
  const {
    LocalStationDataProvider
  } = await loadAppModule('/src/services/stationDataProvider.ts');
  const provider = new LocalStationDataProvider();

  const nearby = await provider.findStationsNear({
    lat: 34.0561,
    lon: -118.2375
  });

  assert.equal(nearby[0].station.name, 'Union Station');
  assert.ok(nearby[0].distance < 0.01);
});

test('local station provider finds direct rail connections and estimates duration', async () => {
  const {
    LocalStationDataProvider
  } = await loadAppModule('/src/services/stationDataProvider.ts');
  const provider = new LocalStationDataProvider();

  const redStations = await provider.getStationsOnLine('Red');
  const from = redStations.find(station => station.name === 'Union Station');
  const to = redStations.find(station => station.name === 'North Hollywood');

  assert.ok(from);
  assert.ok(to);

  const servingLines = await provider.getLinesServingStation('Union Station');
  assert.ok(servingLines.includes('Red'));
  assert.ok(servingLines.includes('Purple'));
  assert.ok(servingLines.includes('Gold'));

  const connections = await provider.findConnectingLines(from, to);
  assert.deepEqual(connections.direct, ['Red']);

  const estimate = await provider.estimateTransitTime(from, to);
  assert.deepEqual(estimate, {
    duration: 1950,
    transfers: 0,
    lines: ['Red'],
    isEstimate: true
  });
});

test('local station provider treats opened D Line Section 1 stations as current Purple service', async () => {
  const {
    LocalStationDataProvider
  } = await loadAppModule('/src/services/stationDataProvider.ts');
  const provider = new LocalStationDataProvider();

  const purpleStations = await provider.getStationsOnLine('Purple');
  const purpleStationNames = purpleStations.map(station => station.name);
  const laCienegaLines = await provider.getLinesServingStation('Wilshire/La Cienega');

  assert.ok(purpleStationNames.includes('Wilshire/La Brea'));
  assert.ok(purpleStationNames.includes('Wilshire/Fairfax'));
  assert.ok(purpleStationNames.includes('Wilshire/La Cienega'));
  assert.deepEqual(laCienegaLines, ['Purple']);
});
