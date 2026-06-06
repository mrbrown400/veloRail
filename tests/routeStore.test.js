import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('route store defaults to Depart at and persists Arrive by search state', async () => {
  const { useRouteStore } = await loadAppModule('/src/stores/routeStore.ts');
  const store = useRouteStore;

  store.getState().reset();
  assert.equal(store.getState().searchParams.timeMode, 'departAt');

  const requestedArrival = new Date('2026-06-06T17:30:00.000Z');
  store.getState().setSearchParams({
    timeMode: 'arriveBy',
    departureTime: requestedArrival
  });

  assert.equal(store.getState().searchParams.timeMode, 'arriveBy');
  assert.equal(store.getState().searchParams.departureTime, requestedArrival);

  store.getState().setRoutes([{
    type: 'Walk + Metro',
    label: 'Walk + Rail',
    start: { lat: 34.05, lon: -118.25 },
    end: { lat: 34.10, lon: -118.32 },
    legs: [],
    totalDistance: 0,
    totalDuration: 0,
    formattedDuration: '0 min',
    summary: 'Test route',
    timeMode: 'arriveBy',
    requestedTime: requestedArrival
  }]);

  assert.equal(store.getState().searchParams.timeMode, 'arriveBy');
  assert.equal(store.getState().selectedRoute.timeMode, 'arriveBy');
});
