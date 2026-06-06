import { compareRoutes } from './routing';
import {
  getBikeRoute,
  getDrivingRoute,
  getFullTransitRoute
} from './googleRoutesService';
import type {
  LineString,
  Location,
  ModeFilter,
  Route,
  RouteLeg,
  SafetyPreference,
  Station,
  TimeMode,
  TravelMode
} from '@/types';

export type RoutingComparisonScenario = 'current' | 'future' | 'hypothetical';
export type RoutingComparisonSource = 'velorail' | 'google_maps';
export type GoogleBaselineMode = 'bike' | 'driving' | 'transit';
export type ScenarioAvailabilityStatus =
  | 'available'
  | 'scenario'
  | 'unsupported_by_google'
  | 'unavailable';

export interface RoutingComparisonQuery {
  origin: Location;
  destination: Location;
  departureTime: Date;
  timeMode: TimeMode;
  scenario: RoutingComparisonScenario;
  includeFuture: boolean;
  safetyPreference: SafetyPreference;
  modeFilter: ModeFilter;
  googleModes: GoogleBaselineMode[];
}

export interface RoutingComparisonRequest {
  origin: Location;
  destination: Location;
  departureTime?: Date;
  timeMode?: TimeMode;
  scenario?: RoutingComparisonScenario;
  includeFuture?: boolean;
  safetyPreference?: SafetyPreference;
  modeFilter?: ModeFilter;
  googleModes?: GoogleBaselineMode[];
  velorailRoutes?: Route[];
  googleBaselineRoutes?: Route[];
  velorailRouteProvider?: RoutingRouteProvider;
  googleBaselineProvider?: RoutingRouteProvider;
}

export type RoutingRouteProvider = (query: RoutingComparisonQuery) => Promise<Route[]>;

export interface ModeSplitMetric {
  mode: TravelMode;
  distanceKm: number;
  durationSeconds: number;
  legCount: number;
  distanceShare: number;
  durationShare: number;
}

export type ModeSplitMetrics = Partial<Record<TravelMode, ModeSplitMetric>>;

export interface ScenarioAvailability {
  status: ScenarioAvailabilityStatus;
  caveats: string[];
}

export interface RouteComparisonMetrics {
  totalDurationSeconds: number;
  totalDistanceKm: number;
  formattedDuration: string;
  modeSplit: ModeSplitMetrics;
  transferCount: number;
  transitLegCount: number;
  scenarioAvailability: ScenarioAvailability;
  caveats: string[];
}

export interface RouteComparisonEntry {
  id: string;
  source: RoutingComparisonSource;
  label: string;
  route: Route;
  metrics: RouteComparisonMetrics;
}

export interface RoutingComparisonDelta {
  durationSeconds: number;
  distanceKm: number;
  transferCount: number;
  modeSplit: Array<{
    mode: TravelMode;
    durationSeconds: number;
    distanceKm: number;
  }>;
}

export interface RoutingUnsupportedGap {
  source: RoutingComparisonSource;
  status: ScenarioAvailabilityStatus;
  reason: string;
}

export interface RoutingComparisonReport {
  query: RoutingComparisonQuery;
  generatedAt: string;
  velorail: RouteComparisonEntry[];
  googleBaseline: RouteComparisonEntry[];
  bestVelorail: RouteComparisonEntry | null;
  bestGoogleBaseline: RouteComparisonEntry | null;
  delta: RoutingComparisonDelta | null;
  caveats: string[];
  unsupportedGaps: RoutingUnsupportedGap[];
}

export const DEFAULT_GOOGLE_BASELINE_MODES: GoogleBaselineMode[] = [
  'transit',
  'driving',
  'bike'
];

const GOOGLE_SCENARIO_CAVEAT =
  'Google Maps baseline reflects currently supported Google Routes data and does not include VeloRail-only future or hypothetical scenario assumptions.';

const GOOGLE_UNAVAILABLE_CAVEAT =
  'Google Maps baseline was unavailable from the supplied provider or local Google Maps configuration.';

export async function compareVeloRailToGoogleMaps(
  request: RoutingComparisonRequest
): Promise<RoutingComparisonReport> {
  const query = normalizeQuery(request);

  const velorailProvider = request.velorailRouteProvider || defaultVeloRailRouteProvider;
  const googleProvider = request.googleBaselineProvider || getGoogleMapsBaselineRoutes;

  const [velorailRoutes, googleBaselineRoutes] = await Promise.all([
    request.velorailRoutes
      ? Promise.resolve(request.velorailRoutes)
      : velorailProvider(query),
    request.googleBaselineRoutes
      ? Promise.resolve(request.googleBaselineRoutes)
      : googleProvider(query)
  ]);

  return buildRoutingComparisonReport({
    query,
    velorailRoutes,
    googleBaselineRoutes
  });
}

export function buildRoutingComparisonReport(input: {
  query: RoutingComparisonQuery;
  velorailRoutes: Route[];
  googleBaselineRoutes: Route[];
  generatedAt?: Date;
}): RoutingComparisonReport {
  const velorail = input.velorailRoutes.map((route, index) =>
    buildComparisonEntry(route, 'velorail', index, input.query)
  );
  const googleBaseline = input.googleBaselineRoutes.map((route, index) =>
    buildComparisonEntry(route, 'google_maps', index, input.query)
  );

  const bestVelorail = pickBestRoute(velorail);
  const bestGoogleBaseline = pickBestRoute(googleBaseline);
  const delta = bestVelorail && bestGoogleBaseline
    ? buildDelta(bestVelorail.metrics, bestGoogleBaseline.metrics)
    : null;
  const unsupportedGaps = deriveUnsupportedGaps(
    input.query,
    input.velorailRoutes,
    input.googleBaselineRoutes
  );

  return {
    query: input.query,
    generatedAt: (input.generatedAt || new Date()).toISOString(),
    velorail,
    googleBaseline,
    bestVelorail,
    bestGoogleBaseline,
    delta,
    caveats: collectReportCaveats([...velorail, ...googleBaseline], unsupportedGaps),
    unsupportedGaps
  };
}

export function deriveRouteComparisonMetrics(
  route: Route,
  source: RoutingComparisonSource,
  query: Pick<RoutingComparisonQuery, 'scenario' | 'includeFuture'>
): RouteComparisonMetrics {
  const scenarioAvailability = deriveScenarioAvailability(route, source, query);
  const caveats = [...scenarioAvailability.caveats];

  return {
    totalDurationSeconds: route.totalDuration,
    totalDistanceKm: route.totalDistance,
    formattedDuration: route.formattedDuration,
    modeSplit: deriveModeSplit(route),
    transferCount: deriveTransferCount(route),
    transitLegCount: route.legs.filter(leg => isTransitMode(leg.mode)).length,
    scenarioAvailability,
    caveats
  };
}

export async function getGoogleMapsBaselineRoutes(
  query: RoutingComparisonQuery
): Promise<Route[]> {
  const routePromises = query.googleModes.map(mode => {
    if (mode === 'bike') {
      return buildGoogleBikeBaseline(query.origin, query.destination);
    }
    if (mode === 'driving') {
      return buildGoogleDrivingBaseline(query.origin, query.destination);
    }
    return buildGoogleTransitBaseline(
      query.origin,
      query.destination,
      query.departureTime,
      query.timeMode
    );
  });

  const routes = await Promise.all(routePromises);
  return routes.filter((route): route is Route => route !== null);
}

function normalizeQuery(request: RoutingComparisonRequest): RoutingComparisonQuery {
  return {
    origin: request.origin,
    destination: request.destination,
    departureTime: request.departureTime || new Date(),
    timeMode: request.timeMode || 'departAt',
    scenario: request.scenario || 'current',
    includeFuture: request.includeFuture || false,
    safetyPreference: request.safetyPreference || 'balanced',
    modeFilter: request.modeFilter || 'all',
    googleModes: request.googleModes || DEFAULT_GOOGLE_BASELINE_MODES
  };
}

async function defaultVeloRailRouteProvider(
  query: RoutingComparisonQuery
): Promise<Route[]> {
  return compareRoutes(
    query.origin,
    query.destination,
    query.safetyPreference,
    query.modeFilter,
    query.departureTime,
    query.includeFuture,
    query.timeMode
  );
}

function buildComparisonEntry(
  route: Route,
  source: RoutingComparisonSource,
  index: number,
  query: RoutingComparisonQuery
): RouteComparisonEntry {
  return {
    id: `${source}-${index + 1}`,
    source,
    label: route.label,
    route,
    metrics: deriveRouteComparisonMetrics(route, source, query)
  };
}

function deriveModeSplit(route: Route): ModeSplitMetrics {
  const split: ModeSplitMetrics = {};

  for (const leg of route.legs) {
    const existing = split[leg.mode] || {
      mode: leg.mode,
      distanceKm: 0,
      durationSeconds: 0,
      legCount: 0,
      distanceShare: 0,
      durationShare: 0
    };

    existing.distanceKm += leg.distance;
    existing.durationSeconds += leg.duration;
    existing.legCount += 1;
    split[leg.mode] = existing;
  }

  for (const metric of Object.values(split)) {
    metric.distanceShare = route.totalDistance > 0
      ? metric.distanceKm / route.totalDistance
      : 0;
    metric.durationShare = route.totalDuration > 0
      ? metric.durationSeconds / route.totalDuration
      : 0;
  }

  return split;
}

function deriveTransferCount(route: Route): number {
  const flaggedTransfers = route.legs.filter(leg => leg.isTransfer).length;
  const transitLegs = route.legs.filter(leg => isTransitMode(leg.mode)).length;
  return Math.max(flaggedTransfers, Math.max(0, transitLegs - 1));
}

function deriveScenarioAvailability(
  route: Route,
  source: RoutingComparisonSource,
  query: Pick<RoutingComparisonQuery, 'scenario' | 'includeFuture'>
): ScenarioAvailability {
  const usesScenario = route.isFuture || query.includeFuture || query.scenario !== 'current';

  if (!usesScenario) {
    return {
      status: 'available',
      caveats: []
    };
  }

  if (source === 'google_maps') {
    return {
      status: 'unsupported_by_google',
      caveats: [GOOGLE_SCENARIO_CAVEAT]
    };
  }

  return {
    status: 'scenario',
    caveats: [
      'VeloRail scenario route uses app-owned future or hypothetical assumptions; compare against Google current-service baselines only.'
    ]
  };
}

function buildDelta(
  velorail: RouteComparisonMetrics,
  googleBaseline: RouteComparisonMetrics
): RoutingComparisonDelta {
  const modes = new Set<TravelMode>([
    ...Object.keys(velorail.modeSplit) as TravelMode[],
    ...Object.keys(googleBaseline.modeSplit) as TravelMode[]
  ]);

  return {
    durationSeconds: velorail.totalDurationSeconds - googleBaseline.totalDurationSeconds,
    distanceKm: velorail.totalDistanceKm - googleBaseline.totalDistanceKm,
    transferCount: velorail.transferCount - googleBaseline.transferCount,
    modeSplit: [...modes].map(mode => ({
      mode,
      durationSeconds:
        (velorail.modeSplit[mode]?.durationSeconds || 0) -
        (googleBaseline.modeSplit[mode]?.durationSeconds || 0),
      distanceKm:
        (velorail.modeSplit[mode]?.distanceKm || 0) -
        (googleBaseline.modeSplit[mode]?.distanceKm || 0)
    }))
  };
}

function deriveUnsupportedGaps(
  query: RoutingComparisonQuery,
  velorailRoutes: Route[],
  googleBaselineRoutes: Route[]
): RoutingUnsupportedGap[] {
  const gaps: RoutingUnsupportedGap[] = [];
  const scenarioRequested = query.includeFuture || query.scenario !== 'current';
  const hasScenarioRoute = velorailRoutes.some(route => route.isFuture);

  if (scenarioRequested || hasScenarioRoute) {
    gaps.push({
      source: 'google_maps',
      status: 'unsupported_by_google',
      reason: GOOGLE_SCENARIO_CAVEAT
    });
  }

  if (googleBaselineRoutes.length === 0) {
    gaps.push({
      source: 'google_maps',
      status: 'unavailable',
      reason: GOOGLE_UNAVAILABLE_CAVEAT
    });
  }

  if (velorailRoutes.length === 0) {
    gaps.push({
      source: 'velorail',
      status: 'unavailable',
      reason: 'VeloRail did not return a comparable route for this query.'
    });
  }

  return gaps;
}

function collectReportCaveats(
  entries: RouteComparisonEntry[],
  unsupportedGaps: RoutingUnsupportedGap[]
): string[] {
  const caveats = new Set<string>();

  for (const entry of entries) {
    for (const caveat of entry.metrics.caveats) {
      caveats.add(caveat);
    }
  }

  for (const gap of unsupportedGaps) {
    caveats.add(gap.reason);
  }

  return [...caveats];
}

function pickBestRoute(entries: RouteComparisonEntry[]): RouteComparisonEntry | null {
  if (entries.length === 0) return null;
  return entries.reduce((best, entry) =>
    entry.metrics.totalDurationSeconds < best.metrics.totalDurationSeconds
      ? entry
      : best
  );
}

async function buildGoogleBikeBaseline(
  origin: Location,
  destination: Location
): Promise<Route | null> {
  const result = await getBikeRoute(origin, destination);
  if (!result) return null;

  const leg: RouteLeg = {
    mode: 'bike',
    from: origin,
    to: destination,
    geometry: result.geometry,
    distance: result.distance,
    duration: result.duration
  };

  return buildSingleLegRoute('Google Bike', 'Google Bike', origin, destination, leg);
}

async function buildGoogleDrivingBaseline(
  origin: Location,
  destination: Location
): Promise<Route | null> {
  const result = await getDrivingRoute(origin, destination);
  if (!result) return null;

  const leg: RouteLeg = {
    mode: 'driving',
    from: origin,
    to: destination,
    geometry: result.geometry,
    distance: result.distance,
    duration: result.duration
  };

  return buildSingleLegRoute('Google Driving', 'Google Driving', origin, destination, leg);
}

async function buildGoogleTransitBaseline(
  origin: Location,
  destination: Location,
  departureTime: Date,
  timeMode: TimeMode = 'departAt'
): Promise<Route | null> {
  const result = await getFullTransitRoute(origin, destination, departureTime, timeMode);
  if (!result || result.legs.length === 0) return null;

  const legs = result.legs.map((leg, index): RouteLeg => {
    if (leg.mode === 'TRANSIT' && leg.transitInfo) {
      const transitInfo = leg.transitInfo;
      const fromStation: Station = {
        name: transitInfo.departureStopName,
        lat: transitInfo.departureStopLat,
        lon: transitInfo.departureStopLng
      };
      const toStation: Station = {
        name: transitInfo.arrivalStopName,
        lat: transitInfo.arrivalStopLat,
        lon: transitInfo.arrivalStopLng
      };

      return {
        mode: 'transit',
        from: fromStation,
        to: toStation,
        geometry: leg.geometry,
        distance: leg.distance,
        duration: leg.duration,
        line: transitInfo.lineShortName || transitInfo.lineName,
        color: transitInfo.lineColor,
        headsign: transitInfo.headsign,
        departureTime: transitInfo.departureTime,
        isRealtime: true,
        isTransfer: result.legs
          .slice(0, index)
          .some(previousLeg => previousLeg.mode === 'TRANSIT')
      };
    }

    return {
      mode: 'walk',
      from: getGeometryEndpoint(leg.geometry, 'first', origin),
      to: getGeometryEndpoint(leg.geometry, 'last', destination),
      geometry: leg.geometry,
      distance: leg.distance,
      duration: leg.duration
    };
  });

  return {
    type: 'Google Transit',
    label: 'Google Transit',
    start: origin,
    end: destination,
    legs,
    totalDistance: result.totalDistance,
    totalDuration: result.totalDuration,
    formattedDuration: formatDuration(result.totalDuration),
    summary: buildTransitSummary(legs)
  };
}

function buildSingleLegRoute(
  type: string,
  label: string,
  origin: Location,
  destination: Location,
  leg: RouteLeg
): Route {
  return {
    type,
    label,
    start: origin,
    end: destination,
    legs: [leg],
    totalDistance: leg.distance,
    totalDuration: leg.duration,
    formattedDuration: formatDuration(leg.duration),
    summary: `${label} (${leg.distance.toFixed(1)} km)`
  };
}

function buildTransitSummary(legs: RouteLeg[]): string {
  const transitLines = legs
    .filter(leg => isTransitMode(leg.mode))
    .map(leg => leg.line)
    .filter((line): line is string => Boolean(line));

  if (transitLines.length === 0) {
    const totalWalking = legs.reduce((total, leg) => total + leg.distance, 0);
    return `Google walk route (${totalWalking.toFixed(1)} km)`;
  }

  return `Google transit via ${transitLines.join('/')}`;
}

function getGeometryEndpoint(
  geometry: LineString,
  position: 'first' | 'last',
  fallback: Location
): Location {
  const coordinate = position === 'first'
    ? geometry.coordinates[0]
    : geometry.coordinates[geometry.coordinates.length - 1];

  if (!coordinate) return fallback;

  return {
    lon: coordinate[0],
    lat: coordinate[1]
  };
}

function formatDuration(seconds: number): string {
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours} hr ${remainingMinutes} min`;
}

function isTransitMode(mode: TravelMode): boolean {
  return mode === 'transit' || mode === 'transit_bus';
}
