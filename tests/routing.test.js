import { after, test } from "node:test";
import assert from "node:assert/strict";
import { closeAppModuleLoader, loadAppModule } from "./helpers/viteSsr.js";

const originalFetch = globalThis.fetch;

after(async () => {
  globalThis.fetch = originalFetch;
  await closeAppModuleLoader();
});

function mockOSRMRoute(distanceMeters, durationSeconds) {
  globalThis.fetch = async (url) => {
    const coordinateText = String(url)
      .split("/route/v1/")[1]
      .split("?")[0]
      .split("/")[1];
    const coordinates = coordinateText.split(";").map((pair) => {
      const [lon, lat] = pair.split(",").map(Number);
      return [lon, lat];
    });

    return {
      json: async () => ({
        code: "Ok",
        routes: [
          {
            distance: distanceMeters,
            duration: durationSeconds,
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        ],
      }),
    };
  };
}

test("fallback routing uses VeloRail walk and bike speeds instead of OSRM durations", async () => {
  const { calculateRoute, ROUTING_SPEEDS_KMH } = await loadAppModule(
    "/src/services/routing.ts",
  );

  mockOSRMRoute(1000, 60);

  const start = { lat: 34.05, lon: -118.25, display_name: "Start" };
  const end = { lat: 34.059, lon: -118.25, display_name: "End" };
  const departureTime = new Date("2026-05-19T12:00:00-07:00");

  const bike = await calculateRoute(
    start,
    end,
    "bike",
    "balanced",
    departureTime,
  );
  const walk = await calculateRoute(
    start,
    end,
    "walk",
    "balanced",
    departureTime,
  );

  const expectedBikeSeconds = (1 / ROUTING_SPEEDS_KMH.bike) * 3600;
  const expectedWalkSeconds = (1 / ROUTING_SPEEDS_KMH.walk) * 3600;

  assert.equal(bike.legs.length, 1);
  assert.equal(walk.legs.length, 1);
  assert.equal(bike.legs[0].duration, expectedBikeSeconds);
  assert.equal(walk.legs[0].duration, expectedWalkSeconds);
  assert.equal(bike.totalDuration, expectedBikeSeconds);
  assert.equal(walk.totalDuration, expectedWalkSeconds);
  assert.equal(bike.formattedDuration, "3 min");
  assert.equal(walk.formattedDuration, "12 min");
});

test("LADOT Commuter Express 439 is offered only in its peak direction", async () => {
  const { calculateRoute } = await loadAppModule("/src/services/routing.ts");
  const commuterExpressOnly = new Set(["commuter_express"]);

  mockOSRMRoute(1000, 60);

  const unionStation = {
    lat: 34.0561,
    lon: -118.2375,
    display_name: "Union Station",
  };
  const douglas = {
    lat: 33.9056,
    lon: -118.3862,
    display_name: "Douglas Station, El Segundo",
  };

  const amToElSegundo = await calculateRoute(
    unionStation,
    douglas,
    "transit_bus",
    "balanced",
    new Date("2026-06-03T07:30:00-07:00"),
    false,
    commuterExpressOnly,
  );
  assert.equal(
    amToElSegundo.legs.some((leg) => leg.line === "LADOT CE 439"),
    true,
  );
  assert.ok(
    amToElSegundo.legs.find((leg) => leg.line === "LADOT CE 439")?.geometry.coordinates.length > 20,
    "CE 439 should use official GTFS shape geometry instead of endpoint-only geometry",
  );
  assert.match(
    amToElSegundo.summary,
    /Peak-period LADOT CE 439 Commuter Express/,
  );

  const pmToDowntown = await calculateRoute(
    douglas,
    unionStation,
    "transit_bus",
    "balanced",
    new Date("2026-06-03T17:30:00-07:00"),
    false,
    commuterExpressOnly,
  );
  assert.equal(
    pmToDowntown.legs.some((leg) => leg.line === "LADOT CE 439"),
    true,
  );

  const pmWrongDirection = await calculateRoute(
    unionStation,
    douglas,
    "transit_bus",
    "balanced",
    new Date("2026-06-03T17:30:00-07:00"),
    false,
    commuterExpressOnly,
  );
  assert.equal(
    pmWrongDirection.legs.some((leg) => leg.line === "LADOT CE 439"),
    false,
  );

  const offPeak = await calculateRoute(
    unionStation,
    douglas,
    "transit_bus",
    "balanced",
    new Date("2026-06-03T12:00:00-07:00"),
    false,
    commuterExpressOnly,
  );
  assert.equal(
    offPeak.legs.some((leg) => leg.line === "LADOT CE 439"),
    false,
  );

  const dtlaToElSegundo = await calculateRoute(
    {
      lat: 34.0487,
      lon: -118.2587,
      display_name: "7th St/Metro Center",
    },
    {
      lat: 33.9192,
      lon: -118.4165,
      display_name: "El Segundo",
    },
    "transit_bus",
    "balanced",
    new Date("2026-06-01T07:30:00-07:00"),
    false,
    commuterExpressOnly,
  );
  assert.equal(
    dtlaToElSegundo.legs.some((leg) => leg.line === "LADOT CE 439"),
    true,
  );
  assert.equal(
    dtlaToElSegundo.legs.some((leg) =>
      leg.line === "LADOT CE 439"
      && leg.from.name === "Hill St & 8th St (Southbound)"
      && leg.to.name === "El Segundo Blvd & Nash St (Westbound)"
    ),
    true,
  );
});

test("active TypeScript data includes the full audited LADOT Commuter Express route set", async () => {
  const { TRANSIT_LINES } = await loadAppModule("/src/data/transitLines.ts");

  const expectedRoutes = [
    "LADOT CE 142",
    "LADOT CE 409",
    "LADOT CE 419",
    "LADOT CE 422",
    "LADOT CE 423",
    "LADOT CE 431",
    "LADOT CE 437",
    "LADOT CE 438",
    "LADOT CE 439",
    "LADOT CE 448",
    "LADOT CE 534",
    "LADOT CE 549",
    "LADOT CE 573",
    "LADOT CE 574",
  ];

  for (const routeName of expectedRoutes) {
    assert.equal(TRANSIT_LINES[routeName]?.schedule?.type, "commuter_express");
    assert.equal(TRANSIT_LINES[routeName]?.source?.confidence, "medium");
    assert.ok(
      TRANSIT_LINES[routeName]?.stations?.length >= 10,
      `${routeName} should have explicit GTFS stops`,
    );
    assert.ok(
      TRANSIT_LINES[routeName]?.patterns?.length >= 2,
      `${routeName} should have GTFS stop patterns for routing`,
    );
    assert.ok(
      TRANSIT_LINES[routeName]?.patterns?.every((pattern) =>
        pattern.shapeId && pattern.stationShapeDistances?.length === pattern.stations.length
      ),
      `${routeName} should carry GTFS shape metadata for each stop pattern`,
    );
  }
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
  assert.match(ceRoute.summary, /Peak-period LADOT CE 437 Commuter Express/);
  assert.ok(ceRoute.legs.some((leg) => leg.mode === 'transit_bus' && leg.line === 'LADOT CE 437'));
  assert.ok(peakRoutes.some((route) => route.label === 'Bike + Rail'));
  assert.ok(peakRoutes.some((route) => route.label === 'Walk + Rail'));

  const offPeakRoutes = await compareRoutes(start, end, 'balanced', 'all', offPeak);
  assert.equal(offPeakRoutes.some((route) => route.legs.some((leg) => leg.line === 'LADOT CE 437')), false);

  const bikeOnlyRoutes = await compareRoutes(start, end, 'balanced', 'bike', peak);
  assert.equal(bikeOnlyRoutes.some((route) => route.label === 'LADOT Commuter Express'), false);
});
