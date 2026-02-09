// Multimodal Router for VeloRail
// Orchestrates bike+rail routing using Google Directions API
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
  selectOptimalStations,
  isBikeRailViable,
  type StationPair
} from './smartStationSelector';
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

export interface BikeRailOptions {
  maxBikeDistanceKm?: number;  // Max bike distance to/from station (default: 8km)
  preferRail?: boolean;         // Prefer rail over bus (default: true)
}

/**
 * Calculate a bike+rail route using Smart Station Selection + Google Directions API
 *
 * New algorithm:
 * 1. Use SmartStationSelector to find optimal station pairs based on user's bike speed
 * 2. For the top pair, get precise Google routes for each leg
 * 3. Fall back to Google-driven approach if smart selection fails
 *
 * This results in better station selection that accounts for:
 * - User's custom bike speed and weight
 * - Expected wait times based on line frequencies
 * - Transit connection time between stations
 */
export async function calculateBikeRailRoute(
  origin: Location,
  destination: Location,
  departureTime: Date,
  options: BikeRailOptions = {}
): Promise<Route | null> {
  const { maxBikeDistanceKm = 8 } = options;

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
    // Step 1: Use Smart Station Selection to find optimal station pairs
    console.log('Using Smart Station Selection for bike+rail routing');
    const isViable = await isBikeRailViable(origin, destination);

    if (!isViable) {
      console.log('Bike+rail not viable for this origin/destination pair');
      return null;
    }

    const selectionResult = await selectOptimalStations(origin, destination, departureTime);

    if (selectionResult.topPairs.length > 0) {
      // Use the best station pair from smart selection
      const bestPair = selectionResult.topPairs[0];
      console.log(`Smart selection chose: ${bestPair.origin.station.name} → ${bestPair.destination.station.name}`);

      const route = await buildRouteFromStationPair(
        bestPair,
        origin,
        destination,
        departureTime,
        maxBikeDistanceKm
      );

      if (route) {
        return route;
      }

      // If first pair fails, try second pair
      if (selectionResult.topPairs.length > 1) {
        console.log('First station pair failed, trying second option');
        const secondPair = selectionResult.topPairs[1];
        const secondRoute = await buildRouteFromStationPair(
          secondPair,
          origin,
          destination,
          departureTime,
          maxBikeDistanceKm
        );

        if (secondRoute) {
          return secondRoute;
        }
      }
    }

    // Fallback: Use Google's station selection
    console.log('Smart selection failed, falling back to Google station selection');
    return await calculateBikeRailRouteFallback(origin, destination, departureTime, maxBikeDistanceKm);

  } catch (error) {
    console.error('Bike+rail routing error:', error);
    return null;
  }
}

/**
 * Build a route from a selected station pair
 * This is where we make the Google API calls for precise routing
 */
async function buildRouteFromStationPair(
  pair: StationPair,
  origin: Location,
  destination: Location,
  departureTime: Date,
  maxBikeDistanceKm: number
): Promise<Route | null> {
  const entryStation = pair.origin.station;
  const exitStation = pair.destination.station;

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

  // Step 4: Get transit route from entry to exit station, departing after bike arrival
  const transitResult = await getFullTransitRoute(
    { lat: entryStation.lat, lon: entryStation.lon },
    { lat: exitStation.lat, lon: exitStation.lon },
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

  // Step 5: Get bike route from exit station to destination
  const bikeFromStation = await getBikeRoute(
    { lat: exitStation.lat, lon: exitStation.lon },
    destination
  );

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
  const bikeFromStationDuration = await calculateBikeDuration(
    bikeFromStation.geometry,
    bikeFromStation.distance,
    bikeSettings
  );

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
  for (const transitLeg of transitResult.legs) {
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
      // Include walking legs between transit (transfers)
      const prevLeg = legs[legs.length - 1];
      if (prevLeg && prevLeg.mode === 'transit') {
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

  // Leg N: Bike from station to destination (using custom elevation-adjusted duration)
  legs.push({
    mode: 'bike',
    from: exitStation,
    to: destination,
    geometry: bikeFromStation.geometry,
    distance: bikeFromStation.distance,
    duration: bikeFromStationDuration.totalDuration
  });

  // Step 8: Build the final route
  return stitchRoute(legs, origin, destination);
}

/**
 * Fallback: Original Google-driven station selection
 * Used when smart selection doesn't find viable pairs
 */
async function calculateBikeRailRouteFallback(
  origin: Location,
  destination: Location,
  departureTime: Date,
  maxBikeDistanceKm: number
): Promise<Route | null> {
  // Get transit route from origin to destination
  // Google will find the best transit stations
  const transitResult = await getFullTransitRoute(origin, destination, departureTime);

  if (!transitResult || transitResult.legs.length === 0) {
    console.log('No transit route found');
    return null;
  }

  // Check if transit route has actual transit legs
  const transitLegs = transitResult.legs.filter(l => l.mode === 'TRANSIT');
  if (transitLegs.length === 0) {
    console.log('Transit route has no rail legs');
    return null;
  }

  // Find the first and last transit stops
  const firstTransitLeg = transitLegs[0];
  const lastTransitLeg = transitLegs[transitLegs.length - 1];

  if (!firstTransitLeg.transitInfo || !lastTransitLeg.transitInfo) {
    console.log('Missing transit info');
    return null;
  }

  const entryStation: Station = {
    name: firstTransitLeg.transitInfo.departureStopName,
    lat: firstTransitLeg.transitInfo.departureStopLat,
    lon: firstTransitLeg.transitInfo.departureStopLng
  };

  const exitStation: Station = {
    name: lastTransitLeg.transitInfo.arrivalStopName,
    lat: lastTransitLeg.transitInfo.arrivalStopLat,
    lon: lastTransitLeg.transitInfo.arrivalStopLng
  };

  // Get bike route to entry station
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

  // Calculate custom bike durations with elevation
  const bikeSettings = loadBikeSettings();
  const bikeToStationDuration = await calculateBikeDuration(
    bikeToStation.geometry,
    bikeToStation.distance,
    bikeSettings
  );

  // Calculate arrival time at station using custom bike duration
  const arrivalAtStation = new Date(
    departureTime.getTime() + bikeToStationDuration.totalDuration * 1000
  );

  // Re-query transit from entry station to exit station with bike arrival time
  const updatedTransitResult = await getFullTransitRoute(
    { lat: entryStation.lat, lon: entryStation.lon },
    { lat: exitStation.lat, lon: exitStation.lon },
    arrivalAtStation
  );

  // Use updated transit if available, otherwise fall back to original
  const finalTransitResult = updatedTransitResult || transitResult;

  // Get bike route from exit station to destination
  const bikeFromStation = await getBikeRoute(
    { lat: exitStation.lat, lon: exitStation.lon },
    destination
  );

  if (!bikeFromStation) {
    console.log('Could not get bike route from station');
    return null;
  }

  // Check if bike distance from station is reasonable
  if (bikeFromStation.distance > maxBikeDistanceKm) {
    console.log(`Bike distance from station too far: ${bikeFromStation.distance.toFixed(1)}km`);
    return null;
  }

  // Calculate custom duration for bike from station
  const bikeFromStationDuration = await calculateBikeDuration(
    bikeFromStation.geometry,
    bikeFromStation.distance,
    bikeSettings
  );

  // Build the route legs
  const legs: RouteLeg[] = [];

  // Leg 1: Bike to station
  legs.push({
    mode: 'bike',
    from: origin,
    to: entryStation,
    geometry: bikeToStation.geometry,
    distance: bikeToStation.distance,
    duration: bikeToStationDuration.totalDuration
  });

  // Transit legs from updated query
  for (const transitLeg of finalTransitResult.legs) {
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
      // Include walking legs between transit (transfers)
      const prevLeg = legs[legs.length - 1];
      if (prevLeg && prevLeg.mode === 'transit') {
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

  // Leg N: Bike from station to destination
  legs.push({
    mode: 'bike',
    from: exitStation,
    to: destination,
    geometry: bikeFromStation.geometry,
    distance: bikeFromStation.distance,
    duration: bikeFromStationDuration.totalDuration
  });

  // Build the final route
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
 * Calculate a driving route using Google Directions
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
