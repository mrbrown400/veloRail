// Google Routes API Service for VeloRail
// Wraps the modern Google Maps JavaScript Routes Library for bike and transit routing.

import { isGoogleMapsConfigured } from './config';
import type {
  Location,
  Station,
  RouteLeg,
  TravelMode,
  LineString,
  GoogleRouteResult,
  GoogleTransitDetails,
  TimeMode
} from '@/types';

type GoogleRouteTravelMode = 'BICYCLING' | 'DRIVING' | 'WALKING' | 'TRANSIT';
type GoogleTransitMode = 'RAIL' | 'SUBWAY' | 'TRAIN' | 'LIGHT_RAIL';

type LatLngValue = {
  lat: number | (() => number);
  lng: number | (() => number);
};

type GoogleRoutesTransitStop = {
  name?: string;
  location?: LatLngValue;
};

type GoogleRoutesTransitLine = {
  name?: string;
  shortName?: string;
  color?: string;
  vehicle?: {
    name?: string;
    type?: string;
    vehicleType?: string;
  };
};

type GoogleRoutesTransitDetails = {
  arrivalStop?: GoogleRoutesTransitStop;
  arrivalTime?: Date | string;
  departureStop?: GoogleRoutesTransitStop;
  departureTime?: Date | string;
  headsign?: string;
  stopCount?: number;
  transitLine?: GoogleRoutesTransitLine;
};

type GoogleRoutesStep = {
  distanceMeters?: number;
  durationMillis?: number;
  staticDurationMillis?: number;
  endLocation?: LatLngValue;
  path?: LatLngValue[];
  startLocation?: LatLngValue;
  transitDetails?: GoogleRoutesTransitDetails;
  travelMode?: GoogleRouteTravelMode;
};

type GoogleRoutesLeg = {
  distanceMeters?: number;
  durationMillis?: number;
  staticDurationMillis?: number;
  path?: LatLngValue[];
  steps?: GoogleRoutesStep[];
};

type GoogleRoutesRoute = {
  distanceMeters?: number;
  durationMillis?: number;
  staticDurationMillis?: number;
  legs?: GoogleRoutesLeg[];
  path?: LatLngValue[];
};

type GoogleRoutesComputeRequest = {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
  travelMode: GoogleRouteTravelMode;
  computeAlternativeRoutes?: boolean;
  departureTime?: Date;
  arrivalTime?: Date;
  fields: string[];
  routingPreference?: 'TRAFFIC_AWARE' | 'TRAFFIC_AWARE_OPTIMAL' | 'TRAFFIC_UNAWARE';
  transitPreference?: {
    allowedTransitModes?: GoogleTransitMode[];
    routingPreference?: 'LESS_WALKING' | 'FEWER_TRANSFERS';
  };
};

type GoogleRoutesComputeResponse = {
  routes?: GoogleRoutesRoute[];
};

type GoogleRouteClass = {
  computeRoutes: (request: GoogleRoutesComputeRequest) => Promise<GoogleRoutesComputeResponse>;
};

type GoogleRoutesLibraryWithRoute = google.maps.RoutesLibrary & {
  Route?: GoogleRouteClass;
};

const ROUTE_FIELDS = ['path', 'distanceMeters', 'durationMillis', 'legs'];

// Routes class is loaded lazily so the app can still render when Maps is not configured.
let routeClassPromise: Promise<GoogleRouteClass | null> | null = null;

// ============================================
// Initialization
// ============================================

export function initGoogleRoutesService(): boolean {
  return isGoogleRoutesRuntimeAvailable();
}

function isGoogleRoutesRuntimeAvailable(): boolean {
  if (typeof google === 'undefined' || !google.maps) return false;

  const mapsWithRoutesNamespace = google.maps as unknown as {
    importLibrary?: typeof google.maps.importLibrary;
    routes?: { Route?: GoogleRouteClass };
  };

  return Boolean(mapsWithRoutesNamespace.importLibrary || mapsWithRoutesNamespace.routes?.Route);
}

async function ensureRouteClass(): Promise<GoogleRouteClass | null> {
  if (!isGoogleRoutesRuntimeAvailable()) return null;

  if (!routeClassPromise) {
    routeClassPromise = (async () => {
      const mapsWithRoutesNamespace = google.maps as unknown as {
        importLibrary?: typeof google.maps.importLibrary;
        routes?: { Route?: GoogleRouteClass };
      };

      if (mapsWithRoutesNamespace.routes?.Route) {
        return mapsWithRoutesNamespace.routes.Route;
      }

      if (!mapsWithRoutesNamespace.importLibrary) {
        return null;
      }

      const routesLibrary = await mapsWithRoutesNamespace.importLibrary('routes') as GoogleRoutesLibraryWithRoute;
      return routesLibrary.Route || mapsWithRoutesNamespace.routes?.Route || null;
    })();
  }

  return routeClassPromise;
}

// ============================================
// Polyline Decoding
// ============================================

/**
 * Decode Google's encoded polyline to [lon, lat][] coordinates
 * Uses Google's geometry library if available, otherwise manual decode
 */
export function decodePolyline(encoded: string): [number, number][] {
  // Use Google's library if available
  if (typeof google !== 'undefined' && google.maps?.geometry?.encoding) {
    const path = google.maps.geometry.encoding.decodePath(encoded);
    return path.map(point => [point.lng(), point.lat()]);
  }

  // Manual decode fallback (polyline algorithm)
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
    lng += dlng;

    // Google uses 5 decimal precision (1e5)
    points.push([lng / 1e5, lat / 1e5]);
  }

  return points;
}

// ============================================
// Bike Routing
// ============================================

/**
 * Get bike route between two points using Google Routes BICYCLING mode
 */
export async function getBikeRoute(
  origin: Location,
  destination: Location
): Promise<GoogleRouteResult | null> {
  const route = await computeGoogleRoute(origin, destination, 'BICYCLING', 'bike routing');
  return route ? convertToGoogleRouteResult(route) : null;
}

// ============================================
// Driving Routing
// ============================================

/**
 * Get driving route between two points using Google Routes DRIVING mode
 */
export async function getDrivingRoute(
  origin: Location,
  destination: Location
): Promise<GoogleRouteResult | null> {
  const route = await computeGoogleRoute(origin, destination, 'DRIVING', 'driving routing', {
    routingPreference: 'TRAFFIC_AWARE'
  });

  return route ? convertToGoogleRouteResult(route) : null;
}

// ============================================
// Walking Routing
// ============================================

/**
 * Get walking route between two points using Google Routes WALKING mode
 */
export async function getWalkingRoute(
  origin: Location,
  destination: Location
): Promise<GoogleRouteResult | null> {
  const route = await computeGoogleRoute(origin, destination, 'WALKING', 'walking routing');
  return route ? convertToGoogleRouteResult(route) : null;
}

// ============================================
// Transit Routing
// ============================================

/**
 * Get transit route with real departure time
 */
export async function getTransitRoute(
  origin: Location,
  destination: Location,
  queryTime: Date,
  timeMode: TimeMode = 'departAt'
): Promise<GoogleRouteResult | null> {
  const route = await computeGoogleRoute(origin, destination, 'TRANSIT', 'transit routing', {
    ...buildTransitTimeRequest(queryTime, timeMode),
    transitPreference: {
      allowedTransitModes: ['RAIL', 'SUBWAY', 'TRAIN', 'LIGHT_RAIL'],
      routingPreference: 'LESS_WALKING'
    }
  });

  return route ? convertToGoogleRouteResult(route, true) : null;
}

// ============================================
// Result Conversion
// ============================================


function buildTransitTimeRequest(queryTime: Date, timeMode: TimeMode): Pick<GoogleRoutesComputeRequest, 'departureTime' | 'arrivalTime'> {
  return timeMode === 'arriveBy'
    ? { arrivalTime: queryTime }
    : { departureTime: queryTime };
}

async function computeGoogleRoute(
  origin: Location,
  destination: Location,
  travelMode: GoogleRouteTravelMode,
  description: string,
  overrides: Partial<GoogleRoutesComputeRequest> = {}
): Promise<GoogleRoutesRoute | null> {
  const routeClass = await ensureRouteClass();
  if (!routeClass || !isGoogleMapsConfigured()) {
    console.warn(`Google Routes API not available for ${description}`);
    return null;
  }

  try {
    const response = await routeClass.computeRoutes({
      origin: toGoogleLatLng(origin),
      destination: toGoogleLatLng(destination),
      travelMode,
      computeAlternativeRoutes: false,
      fields: ROUTE_FIELDS,
      ...overrides
    });

    return response.routes?.[0] || null;
  } catch (error) {
    console.error(`Google ${description} error:`, error);
    return null;
  }
}

function convertToGoogleRouteResult(
  route: GoogleRoutesRoute,
  includeTransitDetails = false
): GoogleRouteResult {
  const coordinates = getRouteCoordinates(route);

  const routeResult: GoogleRouteResult = {
    geometry: {
      type: 'LineString',
      coordinates
    },
    distance: getRouteDistanceKm(route),
    duration: getRouteDurationSeconds(route),
    source: 'google'
  };

  // Extract transit details if requested
  if (includeTransitDetails) {
    const transitStep = getRouteSteps(route).find(
      step => step.travelMode === 'TRANSIT' && step.transitDetails
    );

    const transitDetails = transitStep ? getTransitDetails(transitStep) : null;
    if (transitDetails) {
      routeResult.transitDetails = transitDetails;
    }
  }

  return routeResult;
}

function toGoogleLatLng(location: Location): google.maps.LatLngLiteral {
  return {
    lat: location.lat,
    lng: location.lon
  };
}

function readCoordinateValue(value: number | (() => number)): number {
  return typeof value === 'function' ? value() : value;
}

function toCoordinate(point: LatLngValue): [number, number] {
  return [readCoordinateValue(point.lng), readCoordinateValue(point.lat)];
}

function getRouteCoordinates(route: GoogleRoutesRoute): [number, number][] {
  const path = route.path && route.path.length > 0
    ? route.path
    : route.legs?.flatMap(leg => leg.path || leg.steps?.flatMap(step => step.path || []) || []) || [];

  return path.map(toCoordinate);
}

function getRouteSteps(route: GoogleRoutesRoute): GoogleRoutesStep[] {
  return route.legs?.flatMap(leg => leg.steps || []) || [];
}

function getRouteDistanceKm(route: GoogleRoutesRoute): number {
  if (typeof route.distanceMeters === 'number') return route.distanceMeters / 1000;

  const legDistance = route.legs?.reduce((total, leg) => total + (leg.distanceMeters || 0), 0) || 0;
  if (legDistance > 0) return legDistance / 1000;

  return 0;
}

function getRouteDurationSeconds(route: GoogleRoutesRoute): number {
  const durationMillis = route.durationMillis || route.staticDurationMillis;
  if (typeof durationMillis === 'number') return Math.round(durationMillis / 1000);

  const legDurationMillis = route.legs?.reduce(
    (total, leg) => total + (leg.durationMillis || leg.staticDurationMillis || 0),
    0
  ) || 0;

  return Math.round(legDurationMillis / 1000);
}

function getStepDurationSeconds(step: GoogleRoutesStep): number {
  const durationMillis = step.durationMillis || step.staticDurationMillis || 0;
  return Math.round(durationMillis / 1000);
}

function getStepDistanceKm(step: GoogleRoutesStep): number {
  return (step.distanceMeters || 0) / 1000;
}

function getStepGeometry(step: GoogleRoutesStep): LineString {
  let coordinates = step.path?.map(toCoordinate) || [];

  if (coordinates.length === 0 && step.startLocation && step.endLocation) {
    coordinates = [toCoordinate(step.startLocation), toCoordinate(step.endLocation)];
  }

  return {
    type: 'LineString',
    coordinates
  };
}

function coerceDate(value: Date | string | undefined): Date {
  if (value instanceof Date) return value;

  if (value) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

function getStopLocation(stop: GoogleRoutesTransitStop | undefined): { lat: number; lng: number } {
  if (!stop?.location) {
    return { lat: 0, lng: 0 };
  }

  return {
    lat: readCoordinateValue(stop.location.lat),
    lng: readCoordinateValue(stop.location.lng)
  };
}

function getTransitDetails(step: GoogleRoutesStep): GoogleTransitDetails | null {
  const details = step.transitDetails;
  if (!details) return null;

  const line = details.transitLine || {};
  const departureStop = details.departureStop || {};
  const arrivalStop = details.arrivalStop || {};

  return {
    line: {
      name: line.name || '',
      shortName: line.shortName || '',
      color: line.color || '#666666',
      vehicle: {
        type: line.vehicle?.type || line.vehicle?.vehicleType || line.vehicle?.name || 'RAIL'
      }
    },
    departureStop: {
      name: departureStop.name || '',
      location: getStopLocation(departureStop)
    },
    arrivalStop: {
      name: arrivalStop.name || '',
      location: getStopLocation(arrivalStop)
    },
    departureTime: coerceDate(details.departureTime),
    arrivalTime: coerceDate(details.arrivalTime),
    numStops: details.stopCount || 0,
    headsign: details.headsign || ''
  };
}

// ============================================
// Convert to RouteLeg
// ============================================

/**
 * Convert Google route result to our RouteLeg format
 */
export function toRouteLeg(
  result: GoogleRouteResult,
  mode: TravelMode,
  from: Location | Station,
  to: Location | Station
): RouteLeg {
  const leg: RouteLeg = {
    mode,
    from,
    to,
    geometry: result.geometry,
    distance: result.distance,
    duration: result.duration
  };

  // Add transit-specific fields if available
  if (result.transitDetails) {
    const td = result.transitDetails;
    leg.line = td.line.shortName || td.line.name;
    leg.color = td.line.color;
    leg.headsign = td.headsign;
    leg.departureTime = td.departureTime;
    leg.isRealtime = true; // Google provides real-time data
  }

  return leg;
}

// ============================================
// Transit Legs Extraction
// ============================================

export interface TransitLegInfo {
  geometry: LineString;
  distance: number;
  duration: number;
  lineName: string;
  lineShortName: string;
  lineColor: string;
  vehicleType: string;
  departureStopName: string;
  departureStopLat: number;
  departureStopLng: number;
  arrivalStopName: string;
  arrivalStopLat: number;
  arrivalStopLng: number;
  departureTime: Date;
  arrivalTime: Date;
  numStops: number;
  headsign: string;
}

/**
 * Extract all transit legs from a Google Routes result
 * Useful for multi-transfer routes
 */
export function extractTransitLegs(
  result: GoogleRoutesComputeResponse
): TransitLegInfo[] {
  const legs: TransitLegInfo[] = [];
  const route = result.routes?.[0];
  if (!route) return legs;

  for (const leg of route.legs || []) {
    for (const step of leg.steps || []) {
      if (step.travelMode === 'TRANSIT' && step.transitDetails) {
        const transitDetails = getTransitDetails(step);
        if (!transitDetails) continue;

        legs.push({
          geometry: getStepGeometry(step),
          distance: getStepDistanceKm(step),
          duration: getStepDurationSeconds(step),
          lineName: transitDetails.line.name,
          lineShortName: transitDetails.line.shortName,
          lineColor: transitDetails.line.color,
          vehicleType: transitDetails.line.vehicle.type,
          departureStopName: transitDetails.departureStop.name,
          departureStopLat: transitDetails.departureStop.location.lat,
          departureStopLng: transitDetails.departureStop.location.lng,
          arrivalStopName: transitDetails.arrivalStop.name,
          arrivalStopLat: transitDetails.arrivalStop.location.lat,
          arrivalStopLng: transitDetails.arrivalStop.location.lng,
          departureTime: transitDetails.departureTime,
          arrivalTime: transitDetails.arrivalTime,
          numStops: transitDetails.numStops,
          headsign: transitDetails.headsign
        });
      }
    }
  }

  return legs;
}

/**
 * Get the full transit route including walking legs
 * Returns structured data for each leg
 */
export async function getFullTransitRoute(
  origin: Location,
  destination: Location,
  queryTime: Date,
  timeMode: TimeMode = 'departAt'
): Promise<{
  totalDuration: number;
  totalDistance: number;
  legs: Array<{
    mode: 'WALKING' | 'TRANSIT';
    geometry: LineString;
    distance: number;
    duration: number;
    transitInfo?: TransitLegInfo;
  }>;
} | null> {
  const route = await computeGoogleRoute(origin, destination, 'TRANSIT', 'full transit routing', {
    ...buildTransitTimeRequest(queryTime, timeMode),
    transitPreference: {
      allowedTransitModes: ['RAIL', 'SUBWAY', 'TRAIN', 'LIGHT_RAIL'],
      routingPreference: 'LESS_WALKING'
    }
  });

  if (!route) return null;

  try {
    const legs: Array<{
      mode: 'WALKING' | 'TRANSIT';
      geometry: LineString;
      distance: number;
      duration: number;
      transitInfo?: TransitLegInfo;
    }> = [];

    for (const step of getRouteSteps(route)) {
      if (step.travelMode === 'WALKING') {
        legs.push({
          mode: 'WALKING',
          geometry: getStepGeometry(step),
          distance: getStepDistanceKm(step),
          duration: getStepDurationSeconds(step)
        });
      } else if (step.travelMode === 'TRANSIT' && step.transitDetails) {
        const transitDetails = getTransitDetails(step);
        if (!transitDetails) continue;

        legs.push({
          mode: 'TRANSIT',
          geometry: getStepGeometry(step),
          distance: getStepDistanceKm(step),
          duration: getStepDurationSeconds(step),
          transitInfo: {
            geometry: getStepGeometry(step),
            distance: getStepDistanceKm(step),
            duration: getStepDurationSeconds(step),
            lineName: transitDetails.line.name,
            lineShortName: transitDetails.line.shortName,
            lineColor: transitDetails.line.color,
            vehicleType: transitDetails.line.vehicle.type,
            departureStopName: transitDetails.departureStop.name,
            departureStopLat: transitDetails.departureStop.location.lat,
            departureStopLng: transitDetails.departureStop.location.lng,
            arrivalStopName: transitDetails.arrivalStop.name,
            arrivalStopLat: transitDetails.arrivalStop.location.lat,
            arrivalStopLng: transitDetails.arrivalStop.location.lng,
            departureTime: transitDetails.departureTime,
            arrivalTime: transitDetails.arrivalTime,
            numStops: transitDetails.numStops,
            headsign: transitDetails.headsign
          }
        });
      }
    }

    return {
      totalDuration: getRouteDurationSeconds(route),
      totalDistance: getRouteDistanceKm(route),
      legs
    };
  } catch (error) {
    console.error('Google full transit routing error:', error);
    return null;
  }
}
