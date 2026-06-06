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
    "walk",
    "balanced",
    new Date("2026-06-03T07:30:00-07:00"),
  );
  assert.equal(
    amToElSegundo.legs.some((leg) => leg.line === "LADOT CE 439"),
    true,
  );
  assert.match(
    amToElSegundo.summary,
    /Peak-period LADOT Commuter Express CE 439/,
  );

  const pmToDowntown = await calculateRoute(
    douglas,
    unionStation,
    "walk",
    "balanced",
    new Date("2026-06-03T17:30:00-07:00"),
  );
  assert.equal(
    pmToDowntown.legs.some((leg) => leg.line === "LADOT CE 439"),
    true,
  );

  const pmWrongDirection = await calculateRoute(
    unionStation,
    douglas,
    "walk",
    "balanced",
    new Date("2026-06-03T17:30:00-07:00"),
  );
  assert.equal(
    pmWrongDirection.legs.some((leg) => leg.line === "LADOT CE 439"),
    false,
  );

  const offPeak = await calculateRoute(
    unionStation,
    douglas,
    "walk",
    "balanced",
    new Date("2026-06-03T12:00:00-07:00"),
  );
  assert.equal(
    offPeak.legs.some((leg) => leg.line === "LADOT CE 439"),
    false,
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
      TRANSIT_LINES[routeName]?.stations?.length >= 2,
      `${routeName} should have coarse anchors`,
    );
  }
});
