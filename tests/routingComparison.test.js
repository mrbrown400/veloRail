import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

const origin = {
  lat: 34.0561,
  lon: -118.2375,
  display_name: 'Union Station'
};

const destination = {
  lat: 34.063,
  lon: -118.445,
  display_name: 'Westwood'
};

function line(coordinates = [[-118.2375, 34.0561], [-118.445, 34.063]]) {
  return {
    type: 'LineString',
    coordinates
  };
}

function route(overrides = {}) {
  const legs = overrides.legs || [
    {
      mode: 'bike',
      from: origin,
      to: { name: 'Union Station', lat: 34.0561, lon: -118.2375 },
      geometry: line(),
      distance: 1,
      duration: 300
    },
    {
      mode: 'transit',
      from: { name: 'Union Station', lat: 34.0561, lon: -118.2375 },
      to: { name: 'Wilshire/Vermont', lat: 34.0617, lon: -118.2916 },
      geometry: line(),
      distance: 8,
      duration: 1200,
      line: 'D'
    },
    {
      mode: 'transit',
      from: { name: 'Wilshire/Vermont', lat: 34.0617, lon: -118.2916 },
      to: { name: 'Westwood/UCLA', lat: 34.063, lon: -118.445 },
      geometry: line(),
      distance: 10,
      duration: 1500,
      line: 'D Extension',
      isTransfer: true
    },
    {
      mode: 'walk',
      from: { name: 'Westwood/UCLA', lat: 34.063, lon: -118.445 },
      to: destination,
      geometry: line(),
      distance: 0.5,
      duration: 360
    }
  ];

  return {
    type: 'Bike + Metro',
    label: 'Future Route',
    start: origin,
    end: destination,
    legs,
    totalDistance: legs.reduce((total, leg) => total + leg.distance, 0),
    totalDuration: legs.reduce((total, leg) => total + leg.duration, 0),
    formattedDuration: '56 min',
    summary: 'Bike to Union Station, Take D/D Extension',
    isFuture: true,
    expectedOpening: '2027',
    ...overrides
  };
}

test('route comparison metrics derive mode split and transfers', async () => {
  const {
    deriveRouteComparisonMetrics
  } = await loadAppModule('/src/services/routingComparison.ts');

  const metrics = deriveRouteComparisonMetrics(route(), 'velorail', {
    scenario: 'future',
    includeFuture: true
  });

  assert.equal(metrics.totalDurationSeconds, 3360);
  assert.equal(metrics.totalDistanceKm, 19.5);
  assert.equal(metrics.transferCount, 1);
  assert.equal(metrics.transitLegCount, 2);
  assert.equal(metrics.modeSplit.bike.distanceKm, 1);
  assert.equal(metrics.modeSplit.transit.durationSeconds, 2700);
  assert.equal(metrics.modeSplit.walk.legCount, 1);
  assert.equal(metrics.scenarioAvailability.status, 'scenario');
  assert.match(metrics.caveats.join(' '), /scenario route/i);
});

test('comparison report calculates best-route deltas and Google caveats', async () => {
  const {
    buildRoutingComparisonReport
  } = await loadAppModule('/src/services/routingComparison.ts');

  const velorailRoute = route();
  const googleRoute = route({
    label: 'Google Transit',
    isFuture: false,
    expectedOpening: null,
    legs: [
      {
        mode: 'walk',
        from: origin,
        to: { name: 'Union Station', lat: 34.0561, lon: -118.2375 },
        geometry: line(),
        distance: 0.5,
        duration: 360
      },
      {
        mode: 'transit',
        from: { name: 'Union Station', lat: 34.0561, lon: -118.2375 },
        to: { name: 'Westwood', lat: 34.063, lon: -118.445 },
        geometry: line(),
        distance: 20,
        duration: 3600,
        line: 'Google D'
      }
    ],
    totalDistance: 20.5,
    totalDuration: 3960,
    formattedDuration: '66 min',
    summary: 'Google transit via D'
  });

  const report = buildRoutingComparisonReport({
    query: {
      origin,
      destination,
      departureTime: new Date('2026-05-19T16:00:00.000Z'),
      scenario: 'future',
      includeFuture: true,
      safetyPreference: 'balanced',
      modeFilter: 'all',
      googleModes: ['transit']
    },
    velorailRoutes: [velorailRoute],
    googleBaselineRoutes: [googleRoute],
    generatedAt: new Date('2026-05-19T16:05:00.000Z')
  });

  assert.equal(report.generatedAt, '2026-05-19T16:05:00.000Z');
  assert.equal(report.bestVelorail.label, 'Future Route');
  assert.equal(report.bestGoogleBaseline.label, 'Google Transit');
  assert.equal(report.delta.durationSeconds, -600);
  assert.equal(report.delta.distanceKm, -1);
  assert.equal(report.delta.transferCount, 1);
  assert.equal(report.googleBaseline[0].metrics.scenarioAvailability.status, 'unsupported_by_google');
  assert.ok(report.unsupportedGaps.some(gap => gap.source === 'google_maps'));
  assert.match(report.caveats.join(' '), /does not include VeloRail-only future/i);
});

test('comparison workflow accepts injected providers without live Google calls', async () => {
  const {
    compareVeloRailToGoogleMaps
  } = await loadAppModule('/src/services/routingComparison.ts');

  const report = await compareVeloRailToGoogleMaps({
    origin,
    destination,
    departureTime: new Date('2026-05-19T16:00:00.000Z'),
    scenario: 'current',
    includeFuture: false,
    velorailRouteProvider: async () => [route({ label: 'Bike + Rail', isFuture: false })],
    googleBaselineProvider: async () => [route({ label: 'Google Transit', isFuture: false })]
  });

  assert.equal(report.velorail.length, 1);
  assert.equal(report.googleBaseline.length, 1);
  assert.equal(report.caveats.length, 0);
  assert.equal(report.unsupportedGaps.length, 0);
});
