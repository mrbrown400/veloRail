import { after, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

process.env.VITE_GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || 'test-google-key';

after(closeAppModuleLoader);

const originalGoogle = globalThis.google;
let nextRoutesResponse;
let lastComputeRequest;

afterEach(() => {
  globalThis.google = originalGoogle;
  nextRoutesResponse = undefined;
  lastComputeRequest = undefined;
});

function installRoutesMock(response) {
  nextRoutesResponse = response;
  globalThis.google = {
    maps: {
      importLibrary: async (name) => {
        assert.equal(name, 'routes');
        return {
          Route: {
            computeRoutes: async (request) => {
              lastComputeRequest = request;
              return nextRoutesResponse;
            }
          }
        };
      }
    }
  };
}

test('bike routes use the Maps JavaScript Routes Library', async () => {
  installRoutesMock({
    routes: [{
      distanceMeters: 2400,
      durationMillis: 480000,
      path: [
        { lat: 34.05, lng: -118.25 },
        { lat: 34.06, lng: -118.24 }
      ]
    }]
  });

  const { getBikeRoute } = await loadAppModule('/src/services/googleRoutesService.ts');

  const result = await getBikeRoute(
    { lat: 34.05, lon: -118.25 },
    { lat: 34.06, lon: -118.24 }
  );

  assert.equal(lastComputeRequest.travelMode, 'BICYCLING');
  assert.deepEqual(lastComputeRequest.origin, { lat: 34.05, lng: -118.25 });
  assert.deepEqual(lastComputeRequest.destination, { lat: 34.06, lng: -118.24 });
  assert.deepEqual(lastComputeRequest.fields, ['path', 'distanceMeters', 'durationMillis', 'legs']);
  assert.equal(result.distance, 2.4);
  assert.equal(result.duration, 480);
  assert.deepEqual(result.geometry.coordinates, [
    [-118.25, 34.05],
    [-118.24, 34.06]
  ]);
});

test('driving routes request traffic aware Routes API durations', async () => {
  installRoutesMock({
    routes: [{
      distanceMeters: 8000,
      durationMillis: 900000,
      path: [
        { lat: 34.05, lng: -118.25 },
        { lat: 34.12, lng: -118.30 }
      ]
    }]
  });

  const { getDrivingRoute } = await loadAppModule('/src/services/googleRoutesService.ts');

  const result = await getDrivingRoute(
    { lat: 34.05, lon: -118.25 },
    { lat: 34.12, lon: -118.30 }
  );

  assert.equal(lastComputeRequest.travelMode, 'DRIVING');
  assert.equal(lastComputeRequest.routingPreference, 'TRAFFIC_AWARE');
  assert.equal(lastComputeRequest.departureTime, undefined);
  assert.equal(result.distance, 8);
  assert.equal(result.duration, 900);
});

test('full transit routes convert walking and rail steps from Routes API', async () => {
  const departureTime = new Date('2026-05-20T15:00:00.000Z');
  installRoutesMock({
    routes: [{
      distanceMeters: 10500,
      durationMillis: 1800000,
      path: [
        { lat: 34.05, lng: -118.25 },
        { lat: 34.10, lng: -118.32 }
      ],
      legs: [{
        steps: [
          {
            travelMode: 'WALKING',
            distanceMeters: 350,
            staticDurationMillis: 300000,
            path: [
              { lat: 34.05, lng: -118.25 },
              { lat: 34.055, lng: -118.252 }
            ]
          },
          {
            travelMode: 'TRANSIT',
            distanceMeters: 10150,
            staticDurationMillis: 1500000,
            path: [
              { lat: 34.055, lng: -118.252 },
              { lat: 34.10, lng: -118.32 }
            ],
            transitDetails: {
              transitLine: {
                name: 'Metro Rail',
                shortName: 'E',
                color: '#f6c343',
                vehicle: { name: 'Light rail' }
              },
              departureStop: {
                name: '7th St/Metro Center',
                location: { lat: 34.0487, lng: -118.2587 }
              },
              arrivalStop: {
                name: 'Expo/Sepulveda',
                location: { lat: 34.0354, lng: -118.4340 }
              },
              departureTime: '2026-05-20T15:05:00.000Z',
              arrivalTime: '2026-05-20T15:30:00.000Z',
              stopCount: 9,
              headsign: 'Santa Monica'
            }
          }
        ]
      }]
    }]
  });

  const { getFullTransitRoute } = await loadAppModule('/src/services/googleRoutesService.ts');

  const result = await getFullTransitRoute(
    { lat: 34.05, lon: -118.25 },
    { lat: 34.10, lon: -118.32 },
    departureTime
  );

  assert.equal(lastComputeRequest.travelMode, 'TRANSIT');
  assert.equal(lastComputeRequest.departureTime, departureTime);
  assert.deepEqual(lastComputeRequest.transitPreference.allowedTransitModes, ['RAIL', 'SUBWAY', 'TRAIN', 'LIGHT_RAIL']);
  assert.equal(lastComputeRequest.transitPreference.routingPreference, 'LESS_WALKING');
  assert.equal(result.totalDistance, 10.5);
  assert.equal(result.totalDuration, 1800);
  assert.equal(result.legs.length, 2);
  assert.equal(result.legs[0].mode, 'WALKING');
  assert.equal(result.legs[0].duration, 300);
  assert.equal(result.legs[1].mode, 'TRANSIT');
  assert.equal(result.legs[1].transitInfo.lineShortName, 'E');
  assert.equal(result.legs[1].transitInfo.vehicleType, 'Light rail');
  assert.equal(result.legs[1].transitInfo.departureStopName, '7th St/Metro Center');
  assert.equal(result.legs[1].transitInfo.arrivalStopLng, -118.4340);
  assert.equal(result.legs[1].transitInfo.departureTime.toISOString(), '2026-05-20T15:05:00.000Z');
});
