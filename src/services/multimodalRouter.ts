// Multimodal Router for VeloRail
// Orchestrates bike+rail routing using Google Routes API
// 3-call pattern: bike to station -> transit -> bike from station

import {
  getBikeRoute,
  getFullTransitRoute,
  getDrivingRoute
} from './googleRoutesService';
import { isGoogleMapsConfigured } from './config';
import {
  calculateBikeDuration,
  loadBikeSettings
} from './bikeDurationService';
import {
  getStationDataProvider
} from './stationDataProvider';
import type {
  Location,
  Station,
  Route,
  RouteLeg
} from '@/types';

// ============================================
// Utility Functions
// ============================================

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  const m = min % 60;
  return `${hr} hr ${m} min`;
}

// ============================================
// Main Bike+Rail Routing
// ============================================

const MAX_BIKE_DISTANCE_KM = 8;

/**
 * Calculate a bike+rail route using closest station selection + Google Routes API
 *
 * Simple algorithm:
 * 1. Find the closest BRT/LRT/HRT station to origin
 * 2. Find the closest BRT/LRT/HRT station to destination
 * 3. Route: bike to origin station → transit → bike from destination station
 */
export async function calculateBikeRailRoute(
  origin: Location,
  destination: Location,
  departureTime: Date
): Promise<Route | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps not configured, cannot use bike+rail routing');
    return null;
  }

  const directDistance = getDistance(origin.lat, origin.lon, destination.lat, destination.lon);

  // For very short distances, don't use transit
  if (directDistance < 3) {
    console.log('Distance too short for bike+rail, use direct bike route');
    return null;
  }

  try {
    const provider = getStationDataProvider();

    // Step 1: Find closest station to origin
    const stationsNearOrigin = await provider.findStationsNear(origin);
    if (stationsNearOrigin.length === 0) {
      console.log('No rail stations found near origin');
      return null;
    }
    const closestToOrigin = stationsNearOrigin[0]; // Already sorted by distance
    console.log(`Closest station to origin: ${closestToOrigin.station.name} (${closestToOrigin.distance?.toFixed(1)}km)`);

    // Step 2: Find closest station to destination
    const stationsNearDest = await provider.findStationsNear(destination);
    if (stationsNearDest.length === 0) {
      console.log('No rail stations found near destination');
      return null;
    }

    // Check if destination IS a transit station (within 0.3km threshold)
    // This handles cases like searching for "Union Station" - route directly there
    const STATION_THRESHOLD_KM = 0.3;
    const destinationIsStation = stationsNearDest[0].distance !== undefined &&
                                  stationsNearDest[0].distance < STATION_THRESHOLD_KM;

    const exitStation = stationsNearDest[0].station;

    if (destinationIsStation) {
      console.log(`Destination IS a transit station: ${exitStation.name} (${stationsNearDest[0].distance?.toFixed(2)}km away)`);
    } else {
      console.log(`Closest station to destination: ${exitStation.name} (${stationsNearDest[0].distance?.toFixed(1)}km)`);
    }

    // Step 3: Build the route using these stations
    const entryStation = closestToOrigin.station;

    // If same station, transit doesn't make sense
    if (entryStation.name === exitStation.name) {
      console.log('Entry and exit stations are the same, skip bike+rail');
      return null;
    }

    const route = await buildRouteFromStations(
      entryStation,
      exitStation,
      origin,
      destination,
      departureTime,
      MAX_BIKE_DISTANCE_KM,
      destinationIsStation
    );

    return route;

  } catch (error) {
    console.error('Bike+rail routing error:', error);
    return null;
  }
}

/**
 * Build a route from entry and exit stations
 * This is where we make the Google API calls for precise routing
 *
 * @param destinationIsStation - If true, destination is itself a transit station,
 *        so we route transit directly to destination and skip the final bike leg
 */
async function buildRouteFromStations(
  entryStation: Station,
  exitStation: Station,
  origin: Location,
  destination: Location,
  departureTime: Date,
  maxBikeDistanceKm: number,
  destinationIsStation: boolean = false
): Promise<Route | null> {
  // Step 1: Get bike route to entry station
  const bikeToStation = await getBikeRoute(origin, {
    lat: entryStation.lat,
    lon: entryStation.lon
  });

  if (!bikeToStation) {
    console.log('Could not get bike route to station');
    return null;
  }

  // Check if bike distance is reasonable
  if (bikeToStation.distance > maxBikeDistanceKm) {
    console.log(`Bike distance to station too far: ${bikeToStation.distance.toFixed(1)}km`);
    return null;
  }

  // Step 2: Calculate custom bike duration with elevation
  const bikeSettings = loadBikeSettings();
  const bikeToStationDuration = await calculateBikeDuration(
    bikeToStation.geometry,
    bikeToStation.distance,
    bikeSettings
  );

  // Step 3: Calculate arrival time at station using custom bike duration
  const arrivalAtStation = new Date(
    departureTime.getTime() + bikeToStationDuration.totalDuration * 1000
  );

  // Step 4: Get transit route from entry station to exit point
  // If destination IS a transit station, route directly to destination coordinates
  // This ensures Google routes to the actual destination (e.g., Union Station)
  const transitDestination = destinationIsStation
    ? { lat: destination.lat, lon: destination.lon }
    : { lat: exitStation.lat, lon: exitStation.lon };

  const transitResult = await getFullTransitRoute(
    { lat: entryStation.lat, lon: entryStation.lon },
    transitDestination,
    arrivalAtStation
  );

  if (!transitResult || transitResult.legs.length === 0) {
    console.log('No transit route found between selected stations');
    return null;
  }

  // Check if transit route has actual transit legs
  const transitLegs = transitResult.legs.filter(l => l.mode === 'TRANSIT');
  if (transitLegs.length === 0) {
    console.log('Transit route has no rail legs');
    return null;
  }

  // Step 5: Get bike route from exit station to destination (skip if destination is a station)
  // Use actual arrival stop coords from Google's transit result to eliminate the visual gap
  // between where the transit line ends and where the bike route begins.
  let bikeFromStation: { geometry: any; distance: number; duration: number } | null = null;
  let bikeFromStationDuration = { totalDuration: 0 };
  const lastTransitLeg = [...transitResult.legs].reverse().find(l => l.mode === 'TRANSIT');
  const actualEgressOrigin: { lat: number; lon: number } = lastTransitLeg?.transitInfo
    ? { lat: lastTransitLeg.transitInfo.arrivalStopLat, lon: lastTransitLeg.transitInfo.arrivalStopLng }
    : { lat: exitStation.lat, lon: exitStation.lon };

  if (!destinationIsStation) {
    console.log(`Egress from actual stop: ${lastTransitLeg?.transitInfo?.arrivalStopName} (${actualEgressOrigin.lat.toFixed(5)}, ${actualEgressOrigin.lon.toFixed(5)})`);
    bikeFromStation = await getBikeRoute(actualEgressOrigin, destination);

    if (!bikeFromStation) {
      console.log('Could not get bike route from station');
      return null;
    }

    // Check if bike distance from station is reasonable
    if (bikeFromStation.distance > maxBikeDistanceKm) {
      console.log(`Bike distance from station too far: ${bikeFromStation.distance.toFixed(1)}km`);
      return null;
    }

    // Step 6: Calculate custom duration for bike from station
    bikeFromStationDuration = await calculateBikeDuration(
      bikeFromStation.geometry,
      bikeFromStation.distance,
      bikeSettings
    );
  } else {
    console.log('Destination is a transit station, skipping final bike leg');
  }

  // Step 7: Build the route legs
  const legs: RouteLeg[] = [];

  // Leg 1: Bike to station (using custom elevation-adjusted duration)
  legs.push({
    mode: 'bike',
    from: origin,
    to: entryStation,
    geometry: bikeToStation.geometry,
    distance: bikeToStation.distance,
    duration: bikeToStationDuration.totalDuration
  });

  // Transit legs
  for (let i = 0; i < transitResult.legs.length; i++) {
    const transitLeg = transitResult.legs[i];
    if (transitLeg.mode === 'TRANSIT' && transitLeg.transitInfo) {
      const ti = transitLeg.transitInfo;

      // Wait time based on custom bike arrival time
      const waitTime = legs.length === 1
        ? Math.max(0, (ti.departureTime.getTime() - arrivalAtStation.getTime()) / 1000)
        : 0;

      const fromStation: Station = {
        name: ti.departureStopName,
        lat: ti.departureStopLat,
        lon: ti.departureStopLng
      };

      const toStation: Station = {
        name: ti.arrivalStopName,
        lat: ti.arrivalStopLat,
        lon: ti.arrivalStopLng
      };

      legs.push({
        mode: 'transit',
        from: fromStation,
        to: toStation,
        geometry: transitLeg.geometry,
        distance: transitLeg.distance,
        duration: transitLeg.duration + waitTime,
        line: ti.lineShortName || ti.lineName,
        color: ti.lineColor,
        headsign: ti.headsign,
        departureTime: ti.departureTime,
        waitTime: waitTime,
        isRealtime: true,
        isTransfer: legs.filter(l => l.mode === 'transit').length > 0
      });
    } else if (transitLeg.mode === 'WALKING' && transitLeg.distance > 0.05) {
      // Only include walking legs that are followed by another transit leg (transfers).
      // Terminal walking legs from Google (after the last train stop) are dropped
      // because VeloRail's own bike-from-station leg handles the egress.
      const prevLeg = legs[legs.length - 1];
      const hasFollowingTransit = transitResult.legs.slice(i + 1).some(l => l.mode === 'TRANSIT');
      if (prevLeg && prevLeg.mode === 'transit' && hasFollowingTransit) {
        legs.push({
          mode: 'walk',
          from: prevLeg.to,
          to: prevLeg.to,
          geometry: transitLeg.geometry,
          distance: transitLeg.distance,
          duration: transitLeg.duration
        });
      }
    }
  }

  // Leg N: Bike from station to destination (skip if destination is a transit station)
  if (!destinationIsStation && bikeFromStation) {
    legs.push({
      mode: 'bike',
      from: actualEgressOrigin,
      to: destination,
      geometry: bikeFromStation.geometry,
      distance: bikeFromStation.distance,
      duration: bikeFromStationDuration.totalDuration
    });
  }

  // Step 8: Build the final route
  return stitchRoute(legs, origin, destination);
}

// ============================================
// Route Stitching
// ============================================

/**
 * Combine multiple legs into a single Route object
 */
function stitchRoute(
  legs: RouteLeg[],
  start: Location,
  end: Location
): Route {
  const totalDistance = legs.reduce((acc, leg) => acc + leg.distance, 0);
  const totalDuration = legs.reduce((acc, leg) => acc + leg.duration, 0);

  // Build summary
  const transitLegs = legs.filter(l => l.mode === 'transit');
  let summary = '';

  if (transitLegs.length === 0) {
    summary = `Direct Bike (${totalDistance.toFixed(1)} km)`;
  } else if (transitLegs.length === 1) {
    const entryStation = transitLegs[0].from as Station;
    summary = `Bike to ${entryStation.name}, Take ${transitLegs[0].line} Line`;
  } else {
    const entryStation = transitLegs[0].from as Station;
    const lines = transitLegs.map(l => l.line).join('/');
    const transferStation = transitLegs[1].from as Station;
    summary = `Bike to ${entryStation.name}, Take ${lines} (Transfer at ${transferStation.name})`;
  }

  return {
    type: 'Bike + Metro',
    label: 'Bike + Rail',
    start,
    end,
    legs,
    totalDistance,
    totalDuration,
    formattedDuration: formatDuration(totalDuration),
    summary
  };
}

// ============================================
// Direct Bike Route (for short distances)
// ============================================

/**
 * Get a direct bike route when transit isn't beneficial
 * Uses custom elevation-adjusted duration
 */
export async function calculateDirectBikeRoute(
  origin: Location,
  destination: Location
): Promise<Route | null> {
  const bikeRoute = await getBikeRoute(origin, destination);

  if (!bikeRoute) {
    return null;
  }

  // Calculate custom duration with elevation
  const bikeSettings = loadBikeSettings();
  const customDuration = await calculateBikeDuration(
    bikeRoute.geometry,
    bikeRoute.distance,
    bikeSettings
  );

  const leg: RouteLeg = {
    mode: 'bike',
    from: origin,
    to: destination,
    geometry: bikeRoute.geometry,
    distance: bikeRoute.distance,
    duration: customDuration.totalDuration
  };

  return {
    type: 'Bike',
    label: 'Direct Bike',
    start: origin,
    end: destination,
    legs: [leg],
    totalDistance: bikeRoute.distance,
    totalDuration: customDuration.totalDuration,
    formattedDuration: formatDuration(customDuration.totalDuration),
    summary: `Direct Bike (${bikeRoute.distance.toFixed(1)} km)`
  };
}

// ============================================
// Hybrid routing with fallback
// ============================================

/**
 * Calculate bike+rail route with fallback to direct bike
 * Returns the faster option if both are available
 */
export async function calculateBestBikeRoute(
  origin: Location,
  destination: Location,
  departureTime: Date
): Promise<Route | null> {
  // Try both in parallel
  const [bikeRailRoute, directBikeRoute] = await Promise.all([
    calculateBikeRailRoute(origin, destination, departureTime).catch(() => null),
    calculateDirectBikeRoute(origin, destination).catch(() => null)
  ]);

  // If both available, return the faster one
  if (bikeRailRoute && directBikeRoute) {
    if (bikeRailRoute.totalDuration < directBikeRoute.totalDuration) {
      return bikeRailRoute;
    }
    return directBikeRoute;
  }

  // Return whichever is available
  return bikeRailRoute || directBikeRoute;
}

// ============================================
// Walk + Rail Route (Google Transit)
// ============================================

/**
 * Calculate a walk+rail route using Google Transit
 * Google Transit mode uses walking for first/last mile by default
 */
export async function calculateWalkRailRoute(
  origin: Location,
  destination: Location,
  departureTime: Date
): Promise<Route | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps not configured, cannot use walk+rail routing');
    return null;
  }

  try {
    const transitResult = await getFullTransitRoute(origin, destination, departureTime);

    if (!transitResult || transitResult.legs.length === 0) {
      console.log('No transit route found for walk+rail');
      return null;
    }

    // Build route legs from Google result
    const legs: RouteLeg[] = [];

    for (const transitLeg of transitResult.legs) {
      if (transitLeg.mode === 'WALKING') {
        legs.push({
          mode: 'walk',
          from: origin, // Will be refined below
          to: destination,
          geometry: transitLeg.geometry,
          distance: transitLeg.distance,
          duration: transitLeg.duration
        });
      } else if (transitLeg.mode === 'TRANSIT' && transitLeg.transitInfo) {
        const ti = transitLeg.transitInfo;

        const fromStation: Station = {
          name: ti.departureStopName,
          lat: ti.departureStopLat,
          lon: ti.departureStopLng
        };

        const toStation: Station = {
          name: ti.arrivalStopName,
          lat: ti.arrivalStopLat,
          lon: ti.arrivalStopLng
        };

        legs.push({
          mode: 'transit',
          from: fromStation,
          to: toStation,
          geometry: transitLeg.geometry,
          distance: transitLeg.distance,
          duration: transitLeg.duration,
          line: ti.lineShortName || ti.lineName,
          color: ti.lineColor,
          headsign: ti.headsign,
          departureTime: ti.departureTime,
          isRealtime: true,
          isTransfer: legs.filter(l => l.mode === 'transit').length > 0
        });
      }
    }

    if (legs.length === 0) {
      return null;
    }

    // Fix from/to for walking legs
    for (let i = 0; i < legs.length; i++) {
      if (legs[i].mode === 'walk') {
        if (i === 0) {
          legs[i].from = origin;
          legs[i].to = legs[i + 1]?.from || destination;
        } else if (i === legs.length - 1) {
          legs[i].from = legs[i - 1]?.to || origin;
          legs[i].to = destination;
        } else {
          legs[i].from = legs[i - 1]?.to || origin;
          legs[i].to = legs[i + 1]?.from || destination;
        }
      }
    }

    const totalDistance = transitResult.totalDistance;
    const totalDuration = transitResult.totalDuration;

    // Build summary
    const transitLegs = legs.filter(l => l.mode === 'transit');
    let summary = '';
    if (transitLegs.length === 1) {
      const station = transitLegs[0].from as Station;
      summary = `Walk to ${station.name}, Take ${transitLegs[0].line}`;
    } else if (transitLegs.length > 1) {
      const station = transitLegs[0].from as Station;
      const lines = transitLegs.map(l => l.line).join('/');
      summary = `Walk to ${station.name}, Take ${lines}`;
    } else {
      summary = `Walk (${totalDistance.toFixed(1)} km)`;
    }

    return {
      type: 'Walk + Metro',
      label: 'Walk + Rail',
      start: origin,
      end: destination,
      legs,
      totalDistance,
      totalDuration,
      formattedDuration: formatDuration(totalDuration),
      summary
    };
  } catch (error) {
    console.error('Walk+rail routing error:', error);
    return null;
  }
}

// ============================================
// Driving Route (Google Driving)
// ============================================

/**
 * Calculate a driving route using Google Routes
 */
export async function calculateGoogleDrivingRoute(
  origin: Location,
  destination: Location
): Promise<Route | null> {
  if (!isGoogleMapsConfigured()) {
    console.warn('Google Maps not configured, cannot use driving routing');
    return null;
  }

  try {
    const drivingResult = await getDrivingRoute(origin, destination);

    if (!drivingResult) {
      console.log('No driving route found');
      return null;
    }

    const leg: RouteLeg = {
      mode: 'driving',
      from: origin,
      to: destination,
      geometry: drivingResult.geometry,
      distance: drivingResult.distance,
      duration: drivingResult.duration
    };

    return {
      type: 'Driving',
      label: 'Driving',
      start: origin,
      end: destination,
      legs: [leg],
      totalDistance: drivingResult.distance,
      totalDuration: drivingResult.duration,
      formattedDuration: formatDuration(drivingResult.duration),
      summary: `Drive (${drivingResult.distance.toFixed(1)} km)`
    };
  } catch (error) {
    console.error('Driving routing error:', error);
    return null;
  }
}
