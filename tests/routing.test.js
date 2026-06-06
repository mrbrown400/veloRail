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

test('commuter express schedule helpers include weekday peak and exclude off-peak/weekend', async () => {
  const {
    isLineOperating,
    estimateWaitTime,
    getDayType,
    isWithinTimeRange
  } = await loadAppModule('/src/services/routing.ts');

  const weekdayPeak = new Date('2026-06-02T07:30:00-07:00');
  const weekdayMidday = new Date('2026-06-02T12:00:00-07:00');
  const weekendPeakHour = new Date('2026-06-06T07:30:00-07:00');

  assert.equal(getDayType(weekdayPeak), 'weekday');
  assert.equal(getDayType(weekendPeakHour), 'saturday');
  assert.equal(isWithinTimeRange(weekdayPeak, '06:00', '09:00'), true);
  assert.equal(isLineOperating('LADOT CE 437', weekdayPeak), true);
  assert.equal(estimateWaitTime('LADOT CE 437', weekdayPeak), 20 * 60);
  assert.equal(isLineOperating('LADOT CE 437', weekdayMidday), false);
  assert.equal(isLineOperating('LADOT CE 437', weekendPeakHour), false);
  assert.equal(isLineOperating('Expo', weekendPeakHour), true);
});

test('compareRoutes adds LADOT Commuter Express only in all mode during peak windows', async () => {
  const { compareRoutes } = await loadAppModule('/src/services/routing.ts');

  mockOSRMRoute(1000, 60);

  const start = { lat: 33.9860, lon: -118.4730, display_name: 'Venice near CE 437' };
  const end = { lat: 34.0487, lon: -118.2587, display_name: '7th St/Metro Center' };
  const peak = new Date('2026-06-02T07:30:00-07:00');
  const offPeak = new Date('2026-06-02T12:00:00-07:00');

  const peakRoutes = await compareRoutes(start, end, 'balanced', 'all', peak);
  const ceRoute = peakRoutes.find((route) => route.label === 'LADOT Commuter Express');

  assert.ok(ceRoute, 'expected a commuter express option during weekday peak service');
  assert.equal(ceRoute.type, 'Commuter Express Bus');
  assert.match(ceRoute.summary, /Commuter Express bus/);
  assert.ok(ceRoute.legs.some((leg) => leg.mode === 'transit_bus' && leg.line === 'LADOT CE 437'));
  assert.ok(peakRoutes.some((route) => route.label === 'Bike + Rail'));
  assert.ok(peakRoutes.some((route) => route.label === 'Walk + Rail'));

  const offPeakRoutes = await compareRoutes(start, end, 'balanced', 'all', offPeak);
  assert.equal(offPeakRoutes.some((route) => route.label === 'LADOT Commuter Express'), false);

  const bikeOnlyRoutes = await compareRoutes(start, end, 'balanced', 'bike', peak);
  assert.equal(bikeOnlyRoutes.some((route) => route.label === 'LADOT Commuter Express'), false);
});
