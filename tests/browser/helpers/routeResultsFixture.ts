import type { Page } from '@playwright/test';
import type { Location, Route, Station } from '../../../src/types';

interface RouteResultsFixture {
  routes: Route[];
  selectedRouteIndex?: number;
  sheetState?: 'half' | 'full';
}

const ROUTE_RESULTS_TEST_EVENT = 'velorail:test:set-route-results';

const line = (coordinates: [number, number][]) => ({
  type: 'LineString' as const,
  coordinates
});

const start: Location = {
  lat: 34.068927,
  lon: -118.229271,
  display_name: 'Los Angeles State Historic Park',
  provider: 'google'
};

const end: Location = {
  lat: 34.102034,
  lon: -118.326392,
  display_name: 'Hollywood Pantages Theatre',
  provider: 'google'
};

const bLineStations: Station[] = [
  { name: 'Union Station', lat: 34.056219, lon: -118.236502 },
  { name: 'Civic Center/Grand Park', lat: 34.055149, lon: -118.245738 },
  { name: '7th St/Metro Center', lat: 34.048659, lon: -118.258743 },
  { name: 'Westlake/MacArthur Park', lat: 34.061816, lon: -118.276670 },
  { name: 'Vermont/Sunset', lat: 34.098736, lon: -118.291758 },
  { name: 'Hollywood/Western', lat: 34.101822, lon: -118.308792 },
  { name: 'Hollywood/Vine', lat: 34.101631, lon: -118.325214 }
];

const bLineGeometry = line([
  [-118.236502, 34.056219],
  [-118.245738, 34.055149],
  [-118.258743, 34.048659],
  [-118.276670, 34.061816],
  [-118.291758, 34.098736],
  [-118.308792, 34.101822],
  [-118.325214, 34.101631]
]);

export const MBR96_ROUTE_RESULTS_FIXTURE = {
  selectedRouteIndex: 0,
  sheetState: 'half',
  routes: [
    {
      type: 'Bike + Metro',
      label: 'Bike + Rail',
      start,
      end,
      legs: [
        {
          mode: 'bike',
          from: start,
          to: bLineStations[0],
          geometry: line([
            [-118.229271, 34.068927],
            [-118.231131, 34.064532],
            [-118.233957, 34.060922],
            [-118.236502, 34.056219]
          ]),
          distance: 1.8,
          duration: 420,
          safety: { score: 78 }
        },
        {
          mode: 'transit',
          from: bLineStations[0],
          to: bLineStations[6],
          geometry: bLineGeometry,
          distance: 10.9,
          duration: 1500,
          line: 'B',
          routeId: '801',
          color: '#e3131b',
          stations: bLineStations,
          waitTime: 180,
          headsign: 'North Hollywood'
        },
        {
          mode: 'bike',
          from: bLineStations[6],
          to: end,
          geometry: line([
            [-118.325214, 34.101631],
            [-118.326162, 34.101737],
            [-118.326392, 34.102034]
          ]),
          distance: 0.4,
          duration: 120,
          safety: { score: 72 }
        }
      ],
      totalDistance: 13.1,
      totalDuration: 2040,
      formattedDuration: '34 min',
      summary: 'Bike to Union Station, Take B Line'
    },
    {
      type: 'Walk + Metro',
      label: 'Walk + Rail',
      start,
      end,
      legs: [
        {
          mode: 'walk',
          from: start,
          to: bLineStations[0],
          geometry: line([
            [-118.229271, 34.068927],
            [-118.231131, 34.064532],
            [-118.233957, 34.060922],
            [-118.236502, 34.056219]
          ]),
          distance: 2.0,
          duration: 1440
        },
        {
          mode: 'transit',
          from: bLineStations[0],
          to: bLineStations[6],
          geometry: bLineGeometry,
          distance: 10.9,
          duration: 1560,
          line: 'B',
          routeId: '801',
          color: '#e3131b',
          stations: bLineStations,
          waitTime: 300,
          headsign: 'North Hollywood'
        },
        {
          mode: 'walk',
          from: bLineStations[6],
          to: end,
          geometry: line([
            [-118.325214, 34.101631],
            [-118.326162, 34.101737],
            [-118.326392, 34.102034]
          ]),
          distance: 0.3,
          duration: 240
        }
      ],
      totalDistance: 13.2,
      totalDuration: 3240,
      formattedDuration: '54 min',
      summary: 'Walk to Union Station, Take B Line'
    }
  ]
} satisfies RouteResultsFixture;

export async function dispatchRouteResultsFixture(
  page: Page,
  fixture: RouteResultsFixture = MBR96_ROUTE_RESULTS_FIXTURE
) {
  await page.evaluate(({ eventName, detail }) => {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  }, {
    eventName: ROUTE_RESULTS_TEST_EVENT,
    detail: fixture
  });
}
