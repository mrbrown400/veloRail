import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

const originalFetch = globalThis.fetch;

after(async () => {
  globalThis.fetch = originalFetch;
  await closeAppModuleLoader();
});

function mockOSRMRoute(distanceMeters, durationSeconds) {
  globalThis.fetch = async (url) => {
    const coordinateText = String(url).split('/route/v1/')[1].split('?')[0].split('/')[1];
    const coordinates = coordinateText.split(';').map((pair) => {
      const [lon, lat] = pair.split(',').map(Number);
      return [lon, lat];
    });

    return {
      json: async () => ({
        code: 'Ok',
        routes: [{
          distance: distanceMeters,
          duration: durationSeconds,
          geometry: {
            type: 'LineString',
            coordinates
          }
        }]
      })
    };
  };
}

test('fallback routing uses VeloRail walk and bike speeds instead of OSRM durations', async () => {
  const {
    calculateRoute,
    ROUTING_SPEEDS_KMH
  } = await loadAppModule('/src/services/routing.ts');

  mockOSRMRoute(1000, 60);

  const start = { lat: 34.05, lon: -118.25, display_name: 'Start' };
  const end = { lat: 34.059, lon: -118.25, display_name: 'End' };
  const departureTime = new Date('2026-05-19T12:00:00-07:00');

  const bike = await calculateRoute(start, end, 'bike', 'balanced', departureTime);
  const walk = await calculateRoute(start, end, 'walk', 'balanced', departureTime);

  const expectedBikeSeconds = (1 / ROUTING_SPEEDS_KMH.bike) * 3600;
  const expectedWalkSeconds = (1 / ROUTING_SPEEDS_KMH.walk) * 3600;

  assert.equal(bike.legs.length, 1);
  assert.equal(walk.legs.length, 1);
  assert.equal(bike.legs[0].duration, expectedBikeSeconds);
  assert.equal(walk.legs[0].duration, expectedWalkSeconds);
  assert.equal(bike.totalDuration, expectedBikeSeconds);
  assert.equal(walk.totalDuration, expectedWalkSeconds);
  assert.equal(bike.formattedDuration, '3 min');
  assert.equal(walk.formattedDuration, '12 min');
});
