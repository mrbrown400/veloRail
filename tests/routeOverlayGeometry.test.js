import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

after(closeAppModuleLoader);

test('route overlay derives selected LADOT CE 439 segment from official GTFS shape', async () => {
  const {
    getRouteLegOverlayCoordinates
  } = await loadAppModule('/src/components/Map/routeOverlayGeometry.ts');
  const {
    LADOT_COMMUTER_EXPRESS_PATTERNS
  } = await loadAppModule('/src/data/ladotCommuterExpressStops.ts');

  const pattern = LADOT_COMMUTER_EXPRESS_PATTERNS['LADOT CE 439'].find((candidate) =>
    candidate.stations.some((station) => station.name === 'Hill St & 5th St (Southbound)')
    && candidate.stations.some((station) => station.name === 'Nash St & Imperial Highway (Southbound)')
  );
  assert.ok(pattern);

  const startIndex = pattern.stations.findIndex((station) => station.name === 'Hill St & 5th St (Southbound)');
  const endIndex = pattern.stations.findIndex((station) => station.name === 'Nash St & Imperial Highway (Southbound)');
  const stations = pattern.stations.slice(startIndex, endIndex + 1);
  const stopOnlyCoordinates = stations.map((station) => [station.lon, station.lat]);
  const overlayCoordinates = getRouteLegOverlayCoordinates({
    mode: 'transit_bus',
    line: 'LADOT CE 439',
    color: '#0047BB',
    from: stations[0],
    to: stations[stations.length - 1],
    geometry: {
      type: 'LineString',
      coordinates: stopOnlyCoordinates
    },
    distance: 18.6,
    duration: 52 * 60,
    stations
  });

  assert.equal(stopOnlyCoordinates.length, 10);
  assert.equal(overlayCoordinates.length, 189);
  assert.deepEqual(overlayCoordinates[0], [-118.252051, 34.048587]);
  assert.deepEqual(overlayCoordinates[overlayCoordinates.length - 1], [-118.38755600000002, 33.930556]);
});
