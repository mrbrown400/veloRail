// Google Routes API Service for VeloRail
// Wraps Google Directions API for bike and transit routing

import { isGoogleMapsConfigured } from './config';
import type {
  Location,
  Station,
  RouteLeg,
  TravelMode,
  LineString,
  GoogleRouteResult
} from '@/types';

// Directions service instance (initialized lazily)
let directionsService: google.maps.DirectionsService | null = null;

// ============================================
// Initialization
// ============================================

export function initGoogleRoutesService(): boolean {
  if (typeof google !== 'undefined' && google.maps) {
    directionsService = new google.maps.DirectionsService();
    return true;
  }
  return false;
}

function ensureService(): google.maps.DirectionsService | null {
  if (!directionsService) {
    initGoogleRoutesService();
  }
  return directionsService;
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
 * Get bike route between two points using Google Directions BICYCLING mode
 */
export async function getBikeRoute(
  origin: Location,
  destination: Location
): Promise<GoogleRouteResult | null> {
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    console.warn('Google Directions not available for bike routing');
    return null;
  }

  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(origin.lat, origin.lon),
    destination: new google.maps.LatLng(destination.lat, destination.lon),
    travelMode: google.maps.TravelMode.BICYCLING,
    unitSystem: google.maps.UnitSystem.METRIC,
    avoidHighways: true
  };

  try {
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      service.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Bike directions failed: ${status}`));
        }
      });
    });

    return convertToGoogleRouteResult(result);
  } catch (error) {
    console.error('Google bike routing error:', error);
    return null;
  }
}

// ============================================
// Driving Routing
// ============================================

/**
 * Get driving route between two points using Google Directions DRIVING mode
 */
export async function getDrivingRoute(
  origin: Location,
  destination: Location
): Promise<GoogleRouteResult | null> {
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    console.warn('Google Directions not available for driving routing');
    return null;
  }

  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(origin.lat, origin.lon),
    destination: new google.maps.LatLng(destination.lat, destination.lon),
    travelMode: google.maps.TravelMode.DRIVING,
    unitSystem: google.maps.UnitSystem.METRIC,
    drivingOptions: {
      departureTime: new Date(),
      trafficModel: google.maps.TrafficModel.BEST_GUESS
    }
  };

  try {
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      service.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Driving directions failed: ${status}`));
        }
      });
    });

    // Use traffic-aware duration for driving
    return convertToGoogleRouteResult(result, false, true);
  } catch (error) {
    console.error('Google driving routing error:', error);
    return null;
  }
}

// ============================================
// Walking Routing
// ============================================

/**
 * Get walking route between two points using Google Directions WALKING mode
 */
export async function getWalkingRoute(
  origin: Location,
  destination: Location
): Promise<GoogleRouteResult | null> {
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    console.warn('Google Directions not available for walking routing');
    return null;
  }

  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(origin.lat, origin.lon),
    destination: new google.maps.LatLng(destination.lat, destination.lon),
    travelMode: google.maps.TravelMode.WALKING,
    unitSystem: google.maps.UnitSystem.METRIC
  };

  try {
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      service.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Walking directions failed: ${status}`));
        }
      });
    });

    return convertToGoogleRouteResult(result);
  } catch (error) {
    console.error('Google walking routing error:', error);
    return null;
  }
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
  departureTime: Date
): Promise<GoogleRouteResult | null> {
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    console.warn('Google Directions not available for transit routing');
    return null;
  }

  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(origin.lat, origin.lon),
    destination: new google.maps.LatLng(destination.lat, destination.lon),
    travelMode: google.maps.TravelMode.TRANSIT,
    transitOptions: {
      departureTime: departureTime,
      modes: [google.maps.TransitMode.RAIL, google.maps.TransitMode.SUBWAY, google.maps.TransitMode.TRAM],
      routingPreference: google.maps.TransitRoutePreference.LESS_WALKING
    },
    unitSystem: google.maps.UnitSystem.METRIC
  };

  try {
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      service.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Transit directions failed: ${status}`));
        }
      });
    });

    return convertToGoogleRouteResult(result, true);
  } catch (error) {
    console.error('Google transit routing error:', error);
    return null;
  }
}

// ============================================
// Result Conversion
// ============================================

function convertToGoogleRouteResult(
  result: google.maps.DirectionsResult,
  includeTransitDetails = false,
  useTrafficDuration = false
): GoogleRouteResult {
  const route = result.routes[0];
  const leg = route.legs[0];

  // Get coordinates from overview path
  const coordinates = route.overview_path.map(
    point => [point.lng(), point.lat()] as [number, number]
  );

  // Use traffic-aware duration for driving if available
  let duration = leg.duration!.value;
  if (useTrafficDuration && leg.duration_in_traffic) {
    duration = leg.duration_in_traffic.value;
    console.log(`Using traffic-aware duration: ${(duration / 60).toFixed(0)} min (vs ${(leg.duration!.value / 60).toFixed(0)} min without traffic)`);
  }

  const routeResult: GoogleRouteResult = {
    geometry: {
      type: 'LineString',
      coordinates
    },
    distance: leg.distance!.value / 1000, // meters to km
    duration: duration, // seconds
    source: 'google'
  };

  // Extract transit details if requested
  if (includeTransitDetails && leg.steps) {
    const transitStep = leg.steps.find(
      step => step.travel_mode === 'TRANSIT' && step.transit
    );

    if (transitStep?.transit) {
      const t = transitStep.transit;
      routeResult.transitDetails = {
        line: {
          name: t.line.name || '',
          shortName: t.line.short_name || '',
          color: t.line.color || '#666666',
          vehicle: {
            type: t.line.vehicle?.type || 'RAIL'
          }
        },
        departureStop: {
          name: t.departure_stop.name,
          location: {
            lat: t.departure_stop.location.lat(),
            lng: t.departure_stop.location.lng()
          }
        },
        arrivalStop: {
          name: t.arrival_stop.name,
          location: {
            lat: t.arrival_stop.location.lat(),
            lng: t.arrival_stop.location.lng()
          }
        },
        departureTime: t.departure_time.value,
        arrivalTime: t.arrival_time.value,
        numStops: t.num_stops,
        headsign: t.headsign || ''
      };
    }
  }

  return routeResult;
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
 * Extract all transit legs from a Google Directions result
 * Useful for multi-transfer routes
 */
export function extractTransitLegs(
  result: google.maps.DirectionsResult
): TransitLegInfo[] {
  const legs: TransitLegInfo[] = [];
  const route = result.routes[0];

  for (const leg of route.legs) {
    for (const step of leg.steps || []) {
      if (step.travel_mode === 'TRANSIT' && step.transit && step.polyline) {
        const t = step.transit;
        const coordinates = decodePolyline(step.polyline.points);

        legs.push({
          geometry: { type: 'LineString', coordinates },
          distance: step.distance!.value / 1000,
          duration: step.duration!.value,
          lineName: t.line.name || '',
          lineShortName: t.line.short_name || '',
          lineColor: t.line.color || '#666666',
          vehicleType: t.line.vehicle?.type || 'RAIL',
          departureStopName: t.departure_stop.name,
          departureStopLat: t.departure_stop.location.lat(),
          departureStopLng: t.departure_stop.location.lng(),
          arrivalStopName: t.arrival_stop.name,
          arrivalStopLat: t.arrival_stop.location.lat(),
          arrivalStopLng: t.arrival_stop.location.lng(),
          departureTime: t.departure_time.value,
          arrivalTime: t.arrival_time.value,
          numStops: t.num_stops,
          headsign: t.headsign || ''
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
  departureTime: Date
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
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    return null;
  }

  const request: google.maps.DirectionsRequest = {
    origin: new google.maps.LatLng(origin.lat, origin.lon),
    destination: new google.maps.LatLng(destination.lat, destination.lon),
    travelMode: google.maps.TravelMode.TRANSIT,
    transitOptions: {
      departureTime: departureTime,
      modes: [google.maps.TransitMode.RAIL, google.maps.TransitMode.SUBWAY, google.maps.TransitMode.TRAM],
      routingPreference: google.maps.TransitRoutePreference.LESS_WALKING
    },
    unitSystem: google.maps.UnitSystem.METRIC
  };

  try {
    const result = await new Promise<google.maps.DirectionsResult>((resolve, reject) => {
      service.route(request, (response, status) => {
        if (status === google.maps.DirectionsStatus.OK && response) {
          resolve(response);
        } else {
          reject(new Error(`Transit directions failed: ${status}`));
        }
      });
    });

    const route = result.routes[0];
    const dirLeg = route.legs[0];

    const legs: Array<{
      mode: 'WALKING' | 'TRANSIT';
      geometry: LineString;
      distance: number;
      duration: number;
      transitInfo?: TransitLegInfo;
    }> = [];

    for (const step of dirLeg.steps || []) {
      if (!step.polyline) continue;
      const coordinates = decodePolyline(step.polyline.points);

      if (step.travel_mode === 'WALKING') {
        legs.push({
          mode: 'WALKING',
          geometry: { type: 'LineString', coordinates },
          distance: step.distance!.value / 1000,
          duration: step.duration!.value
        });
      } else if (step.travel_mode === 'TRANSIT' && step.transit) {
        const t = step.transit;
        legs.push({
          mode: 'TRANSIT',
          geometry: { type: 'LineString', coordinates },
          distance: step.distance!.value / 1000,
          duration: step.duration!.value,
          transitInfo: {
            geometry: { type: 'LineString', coordinates },
            distance: step.distance!.value / 1000,
            duration: step.duration!.value,
            lineName: t.line.name || '',
            lineShortName: t.line.short_name || '',
            lineColor: t.line.color || '#666666',
            vehicleType: t.line.vehicle?.type || 'RAIL',
            departureStopName: t.departure_stop.name,
            departureStopLat: t.departure_stop.location.lat(),
            departureStopLng: t.departure_stop.location.lng(),
            arrivalStopName: t.arrival_stop.name,
            arrivalStopLat: t.arrival_stop.location.lat(),
            arrivalStopLng: t.arrival_stop.location.lng(),
            departureTime: t.departure_time.value,
            arrivalTime: t.arrival_time.value,
            numStops: t.num_stops,
            headsign: t.headsign || ''
          }
        });
      }
    }

    return {
      totalDuration: dirLeg.duration!.value,
      totalDistance: dirLeg.distance!.value / 1000,
      legs
    };
  } catch (error) {
    console.error('Google full transit routing error:', error);
    return null;
  }
}
