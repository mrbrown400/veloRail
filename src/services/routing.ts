// Core routing engine for VeloRail
// Multi-modal routing with transit, bike, walk support

import { geocode } from './geocoding';
import { TRANSIT_LINES } from '@/data/transitLines';
import { CONFIG, isGoogleRoutesEnabled } from './config';
import {
  calculateBikeRailRoute,
  calculateWalkRailRoute,
  calculateGoogleDrivingRoute
} from './multimodalRouter';
import type {
  Location,
  Station,
  Route,
  RouteLeg,
  TravelMode,
  SafetyPreference,
  ModeFilter,
  DepartureInfo,
  OSRMRoute
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

export function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const hr = Math.floor(min / 60);
  const m = min % 60;
  return `${hr} hr ${m} min`;
}


interface StationWithLine extends Station {
  line: string;
  color: string;
  lineStatus: string;
  distance?: number;
}

interface TransitRoute {
  line: string;
  color: string;
  gtfsRouteId: string | null;
  segment: Station[];
  lineStatus: string;
  expectedOpening: string | null;
}

interface TransferResult {
  transferStation: Station;
  transferStation2?: Station;
  leg1: TransitRoute;
  leg2: TransitRoute;
  walkDistance?: number;
  type: 'same-station' | 'walk-transfer';
}

interface TransitPlan {
  type: 'direct' | 'transfer';
  line?: TransitRoute;
  hub?: Station;
  leg1?: TransitRoute;
  leg2?: TransitRoute;
}

// ============================================
// Schedule Helpers (simplified)
// ============================================

function isLineOperating(lineName: string, _time: Date, _options?: { includeFuture?: boolean }): boolean {
  const line = TRANSIT_LINES[lineName];
  if (!line) return false;
  // Simplified: assume operating if status is 'operating' or not set
  return !line.status || line.status === 'operating';
}

function estimateWaitTime(lineName: string): number {
  const line = TRANSIT_LINES[lineName];
  if (!line?.schedule?.frequency) return 600; // Default 10 min
  return line.schedule.frequency * 60;
}

async function getNextDeparture(
  lineName: string,
  _arrivalTime: Date,
  _stationName: string
): Promise<DepartureInfo> {
  // Simplified: return estimated wait time
  const waitSeconds = estimateWaitTime(lineName);
  return {
    waitSeconds,
    departureTime: null,
    headsign: null,
    isEstimate: true
  };
}

// ============================================
// Station Finding Functions
// ============================================

function getAllStations(departureTime: Date | null = null, includeFuture = false): StationWithLine[] {
  const all: StationWithLine[] = [];
  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture })) {
      continue;
    }
    data.stations.filter(s => !s.waypoint).forEach(s => {
      all.push({
        ...s,
        line: lineName,
        color: data.color,
        lineStatus: data.status || 'operating',
        expectedOpening: s.expectedOpening || data.expectedOpening || null
      });
    });
  }
  return all;
}

function findNearestStation(
  lat: number,
  lon: number,
  departureTime: Date | null = null,
  includeFuture = false
): StationWithLine | null {
  let nearest: StationWithLine | null = null;
  let minDist = Infinity;
  const stations = getAllStations(departureTime, includeFuture);

  for (const station of stations) {
    const dist = getDistance(lat, lon, station.lat, station.lon);

    if (dist < minDist) {
      minDist = dist;
      nearest = { ...station, distance: dist };
    }
  }
  return nearest;
}

// ============================================
// Route Finding Functions
// ============================================

function getCommonLines(
  s1: Station,
  s2: Station,
  departureTime: Date | null = null,
  includeFuture = false
): TransitRoute[] {
  const routes: TransitRoute[] = [];

  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture })) {
      continue;
    }

    const idx1 = data.stations.findIndex(s => s.name === s1.name);
    const idx2 = data.stations.findIndex(s => s.name === s2.name);

    if (idx1 !== -1 && idx2 !== -1) {
      const start = Math.min(idx1, idx2);
      const end = Math.max(idx1, idx2);
      const segment = data.stations.slice(start, end + 1);
      if (idx1 > idx2) segment.reverse();

      routes.push({
        line: lineName,
        color: data.color,
        gtfsRouteId: data.gtfsRouteId || null,
        segment: segment,
        lineStatus: data.status || 'operating',
        expectedOpening: data.expectedOpening || null
      });
    }
  }
  return routes;
}

function getLinesForStation(
  stationName: string,
  departureTime: Date | null = null,
  includeFuture = false
): string[] {
  const lines: string[] = [];

  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture })) {
      continue;
    }

    const hasStation = data.stations.some(s => !s.waypoint && s.name === stationName);
    if (hasStation) {
      lines.push(lineName);
    }
  }

  return lines;
}

function findSharedStations(
  line1Name: string,
  line2Name: string,
  _departureTime: Date | null = null,
  _includeFuture = false
): Station[] {
  const line1 = TRANSIT_LINES[line1Name];
  const line2 = TRANSIT_LINES[line2Name];

  if (!line1 || !line2) return [];

  const line1Stations = line1.stations.filter(s => !s.waypoint);
  const line2Stations = line2.stations.filter(s => !s.waypoint);

  const sharedStations: Station[] = [];
  const line1StationNames = new Set(line1Stations.map(s => s.name));

  for (const station of line2Stations) {
    if (line1StationNames.has(station.name)) {
      sharedStations.push(station);
    }
  }

  return sharedStations;
}

function findNearbyStationPairs(
  line1Name: string,
  line2Name: string,
  maxDistanceKm: number,
  _departureTime: Date | null = null,
  _includeFuture = false
): { station1: Station; station2: Station; distance: number }[] {
  const line1 = TRANSIT_LINES[line1Name];
  const line2 = TRANSIT_LINES[line2Name];

  if (!line1 || !line2) return [];

  const line1Stations = line1.stations.filter(s => !s.waypoint);
  const line2Stations = line2.stations.filter(s => !s.waypoint);

  const nearbyPairs: { station1: Station; station2: Station; distance: number }[] = [];

  for (const s1 of line1Stations) {
    for (const s2 of line2Stations) {
      if (s1.name === s2.name) continue;

      const distance = getDistance(s1.lat, s1.lon, s2.lat, s2.lon);
      if (distance <= maxDistanceKm) {
        nearbyPairs.push({ station1: s1, station2: s2, distance });
      }
    }
  }

  nearbyPairs.sort((a, b) => a.distance - b.distance);
  return nearbyPairs;
}

function findBestTransfer(
  entryStation: Station,
  exitStation: Station,
  departureTime: Date | null = null,
  includeFuture = false
): TransferResult | null {
  const MAX_WALK_TRANSFER_KM = 0.8;

  const entryLines = getLinesForStation(entryStation.name, departureTime, includeFuture);
  const exitLines = getLinesForStation(exitStation.name, departureTime, includeFuture);

  if (entryLines.length === 0 || exitLines.length === 0) {
    return null;
  }

  let bestTransfer: TransferResult | null = null;
  let bestScore = Infinity;

  for (const entryLine of entryLines) {
    for (const exitLine of exitLines) {
      if (entryLine === exitLine) continue;

      const sharedStations = findSharedStations(entryLine, exitLine, departureTime, includeFuture);

      for (const transferStation of sharedStations) {
        const leg1Routes = getCommonLines(entryStation, transferStation, departureTime, includeFuture);
        const leg2Routes = getCommonLines(transferStation, exitStation, departureTime, includeFuture);

        if (leg1Routes.length > 0 && leg2Routes.length > 0) {
          let leg1 = leg1Routes[0];
          let leg2 = leg2Routes[0];

          if (includeFuture) {
            const futureLeg1 = leg1Routes.find(r => r.lineStatus && r.lineStatus !== 'operating');
            const futureLeg2 = leg2Routes.find(r => r.lineStatus && r.lineStatus !== 'operating');
            if (futureLeg1) leg1 = futureLeg1;
            if (futureLeg2) leg2 = futureLeg2;
          }

          const score = leg1.segment.length + leg2.segment.length;

          if (score < bestScore) {
            bestScore = score;
            bestTransfer = {
              transferStation,
              leg1,
              leg2,
              type: 'same-station'
            };
          }
        }
      }

      const nearbyTransfers = findNearbyStationPairs(entryLine, exitLine, MAX_WALK_TRANSFER_KM, departureTime, includeFuture);

      for (const { station1, station2, distance } of nearbyTransfers) {
        const leg1Routes = getCommonLines(entryStation, station1, departureTime, includeFuture);
        const leg2Routes = getCommonLines(station2, exitStation, departureTime, includeFuture);

        if (leg1Routes.length > 0 && leg2Routes.length > 0) {
          let leg1 = leg1Routes[0];
          let leg2 = leg2Routes[0];

          if (includeFuture) {
            const futureLeg1 = leg1Routes.find(r => r.lineStatus && r.lineStatus !== 'operating');
            const futureLeg2 = leg2Routes.find(r => r.lineStatus && r.lineStatus !== 'operating');
            if (futureLeg1) leg1 = futureLeg1;
            if (futureLeg2) leg2 = futureLeg2;
          }

          const walkPenalty = distance * 5;
          const score = leg1.segment.length + leg2.segment.length + walkPenalty;

          if (score < bestScore) {
            bestScore = score;
            bestTransfer = {
              transferStation: station1,
              transferStation2: station2,
              leg1,
              leg2,
              walkDistance: distance,
              type: 'walk-transfer'
            };
          }
        }
      }
    }
  }

  return bestTransfer;
}

// ============================================
// OSRM Routing
// ============================================

async function getOSRMRoute(
  waypoints: { lat: number; lon: number }[],
  profile: 'cycling' | 'walking' | 'driving' = 'cycling'
): Promise<OSRMRoute | null> {
  const coords = waypoints.map(wp => `${wp.lon},${wp.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/${profile}/${coords}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      return null;
    }

    const route = data.routes[0];
    return {
      distance: route.distance / 1000, // Convert to km
      duration: route.duration,
      geometry: route.geometry
    };
  } catch (error) {
    console.error('OSRM routing error:', error);
    return null;
  }
}

// ============================================
// Main Route Calculation
// ============================================

export async function calculateRoute(
  startAddr: string | Location,
  endAddr: string | Location,
  travelMode: TravelMode = 'bike',
  _safetyPreference: SafetyPreference = 'balanced',
  departureTime: Date | null = null,
  includeFuture = false
): Promise<Route> {
  // Note: _safetyPreference is available for future ORS integration
  const queryTime = departureTime || new Date();
  console.log(`Calculating route (${travelMode}${includeFuture ? ', future' : ''}) for departure at ${queryTime.toLocaleTimeString()}...`);

  const startLoc = (typeof startAddr === 'string') ? await geocode(startAddr) : startAddr;
  if (!startLoc) throw new Error(`Could not find location: ${startAddr}`);

  const endLoc = (typeof endAddr === 'string') ? await geocode(endAddr) : endAddr;
  if (!endLoc) throw new Error(`Could not find location: ${endAddr}`);

  const directDist = getDistance(startLoc.lat, startLoc.lon, endLoc.lat, endLoc.lon);

  const isWalking = travelMode === 'walk';
  const isBus = travelMode === 'transit_bus';

  let profile: 'cycling' | 'walking' | 'driving' = 'cycling';
  if (isWalking) profile = 'walking';
  if (isBus) profile = 'driving';

  let fallbackSpeed = 20;
  if (isWalking) fallbackSpeed = 5;
  if (isBus) fallbackSpeed = 15;

  const fallbackSpeedMs = fallbackSpeed / 3.6;
  const busPenaltySeconds = isBus ? 600 : 0;

  const entryStation = findNearestStation(startLoc.lat, startLoc.lon, queryTime, includeFuture);
  const exitStation = findNearestStation(endLoc.lat, endLoc.lon, queryTime, includeFuture);

  const legs: RouteLeg[] = [];

  const commonRoutes = entryStation && exitStation
    ? getCommonLines(entryStation, exitStation, queryTime, includeFuture)
    : [];

  let transitPlan: TransitPlan | null = null;
  let usedFutureLine = false;
  let futureLineOpening: string | null = null;

  if (commonRoutes.length > 0) {
    let selectedRoute = commonRoutes[0];
    if (includeFuture) {
      const futureRoute = commonRoutes.find(r => r.lineStatus && r.lineStatus !== 'operating');
      if (futureRoute) {
        selectedRoute = futureRoute;
        usedFutureLine = true;
        futureLineOpening = futureRoute.expectedOpening;
      }
    }
    transitPlan = { type: 'direct', line: selectedRoute };
  } else if (entryStation && exitStation) {
    const transferResult = findBestTransfer(entryStation, exitStation, queryTime, includeFuture);

    if (transferResult) {
      transitPlan = {
        type: 'transfer',
        hub: transferResult.transferStation,
        leg1: transferResult.leg1,
        leg2: transferResult.leg2
      };

      if (transferResult.leg1.lineStatus && transferResult.leg1.lineStatus !== 'operating') {
        usedFutureLine = true;
        futureLineOpening = transferResult.leg1.expectedOpening;
      }
      if (transferResult.leg2.lineStatus && transferResult.leg2.lineStatus !== 'operating') {
        usedFutureLine = true;
        if (!futureLineOpening || (transferResult.leg2.expectedOpening && transferResult.leg2.expectedOpening > futureLineOpening)) {
          futureLineOpening = transferResult.leg2.expectedOpening;
        }
      }
    }
  }

  const canTakeTransit = transitPlan !== null;

  // Direct route conditions
  if (directDist < (isWalking ? 1.5 : 5) || !canTakeTransit || !entryStation || !exitStation || entryStation.name === exitStation.name) {
    console.log(`Using direct ${travelMode} route`);
    const route = await getOSRMRoute([
      { lat: startLoc.lat, lon: startLoc.lon },
      { lat: endLoc.lat, lon: endLoc.lon }
    ], profile);

    const distKm = route ? route.distance : directDist;
    const duration = route ? route.duration : (distKm * 1000 / fallbackSpeedMs);

    legs.push({
      mode: travelMode,
      from: startLoc,
      to: endLoc,
      geometry: route?.geometry || {
        type: "LineString",
        coordinates: [[startLoc.lon, startLoc.lat], [endLoc.lon, endLoc.lat]]
      },
      distance: distKm,
      duration: duration + busPenaltySeconds
    });
  } else {
    console.log('Using Multimodal route');

    // Leg 1: Access -> Entry
    const l1 = await getOSRMRoute([
      { lat: startLoc.lat, lon: startLoc.lon },
      { lat: entryStation.lat, lon: entryStation.lon }
    ], profile);

    const d1 = l1 ? l1.distance : getDistance(startLoc.lat, startLoc.lon, entryStation.lat, entryStation.lon);
    const dur1 = l1 ? l1.duration : (d1 * 1000 / fallbackSpeedMs);

    legs.push({
      mode: travelMode,
      from: startLoc,
      to: entryStation,
      geometry: l1?.geometry || {
        type: "LineString",
        coordinates: [[startLoc.lon, startLoc.lat], [entryStation.lon, entryStation.lat]]
      },
      distance: d1,
      duration: dur1 + busPenaltySeconds
    });

    // Transit legs
    if (transitPlan!.type === 'direct' && transitPlan!.line) {
      const bestTransit = transitPlan!.line;
      const waypoints = bestTransit.segment;
      const transitCoordinates = waypoints.map(s => [s.lon, s.lat] as [number, number]);

      let transitDistance = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        transitDistance += getDistance(waypoints[i].lat, waypoints[i].lon, waypoints[i + 1].lat, waypoints[i + 1].lon);
      }

      const avgSpeedKmh = 35;
      const accessTimeSeconds = legs[0].duration;
      const arrivalAtStation = new Date(queryTime.getTime() + accessTimeSeconds * 1000);

      const departureInfo = await getNextDeparture(bestTransit.line, arrivalAtStation, entryStation.name);
      const waitTimeSeconds = departureInfo.waitSeconds;
      const transitDuration = (transitDistance / avgSpeedKmh) * 3600 + waitTimeSeconds;

      legs.push({
        mode: 'transit',
        line: bestTransit.line,
        routeId: bestTransit.gtfsRouteId || null,
        color: bestTransit.color,
        from: entryStation,
        to: exitStation,
        geometry: { type: "LineString", coordinates: transitCoordinates },
        distance: transitDistance,
        duration: transitDuration,
        waitTime: waitTimeSeconds,
        departureTime: departureInfo.departureTime,
        headsign: departureInfo.headsign,
        isRealtimeSchedule: !departureInfo.isEstimate,
        stations: bestTransit.segment
      });
    } else if (transitPlan!.type === 'transfer') {
      const hub = transitPlan!.hub!;
      const leg1 = transitPlan!.leg1!;
      const leg2 = transitPlan!.leg2!;
      const avgSpeedKmh = 35;

      const accessTimeSeconds = legs[0].duration;
      const arrivalAtEntry = new Date(queryTime.getTime() + accessTimeSeconds * 1000);

      const departureInfo1 = await getNextDeparture(leg1.line, arrivalAtEntry, entryStation.name);

      let leg1Distance = 0;
      for (let i = 0; i < leg1.segment.length - 1; i++) {
        leg1Distance += getDistance(leg1.segment[i].lat, leg1.segment[i].lon, leg1.segment[i + 1].lat, leg1.segment[i + 1].lon);
      }
      const leg1TravelTime = (leg1Distance / avgSpeedKmh) * 3600;
      const leg1Coordinates = leg1.segment.map(s => [s.lon, s.lat] as [number, number]);

      legs.push({
        mode: 'transit',
        line: leg1.line,
        routeId: leg1.gtfsRouteId || null,
        color: leg1.color,
        from: entryStation,
        to: hub,
        geometry: { type: "LineString", coordinates: leg1Coordinates },
        distance: leg1Distance,
        duration: leg1TravelTime + departureInfo1.waitSeconds,
        waitTime: departureInfo1.waitSeconds,
        departureTime: departureInfo1.departureTime,
        headsign: departureInfo1.headsign,
        isRealtimeSchedule: !departureInfo1.isEstimate,
        stations: leg1.segment
      });

      const arrivalAtHub = new Date(arrivalAtEntry.getTime() + (departureInfo1.waitSeconds + leg1TravelTime) * 1000);
      const departureInfo2 = await getNextDeparture(leg2.line, arrivalAtHub, hub.name);

      let leg2Distance = 0;
      for (let i = 0; i < leg2.segment.length - 1; i++) {
        leg2Distance += getDistance(leg2.segment[i].lat, leg2.segment[i].lon, leg2.segment[i + 1].lat, leg2.segment[i + 1].lon);
      }
      const leg2TravelTime = (leg2Distance / avgSpeedKmh) * 3600;
      const leg2Coordinates = leg2.segment.map(s => [s.lon, s.lat] as [number, number]);

      legs.push({
        mode: 'transit',
        line: leg2.line,
        routeId: leg2.gtfsRouteId || null,
        color: leg2.color,
        from: hub,
        to: exitStation,
        geometry: { type: "LineString", coordinates: leg2Coordinates },
        distance: leg2Distance,
        duration: leg2TravelTime + departureInfo2.waitSeconds,
        waitTime: departureInfo2.waitSeconds,
        departureTime: departureInfo2.departureTime,
        headsign: departureInfo2.headsign,
        isRealtimeSchedule: !departureInfo2.isEstimate,
        stations: leg2.segment,
        isTransfer: true
      });
    }

    // Leg 3: Egress -> Destination
    const l3 = await getOSRMRoute([
      { lat: exitStation.lat, lon: exitStation.lon },
      { lat: endLoc.lat, lon: endLoc.lon }
    ], profile);

    const d3 = l3 ? l3.distance : getDistance(exitStation.lat, exitStation.lon, endLoc.lat, endLoc.lon);
    const dur3 = l3 ? l3.duration : (d3 * 1000 / fallbackSpeedMs);

    legs.push({
      mode: travelMode,
      from: exitStation,
      to: endLoc,
      geometry: l3?.geometry || {
        type: "LineString",
        coordinates: [[exitStation.lon, exitStation.lat], [endLoc.lon, endLoc.lat]]
      },
      distance: d3,
      duration: dur3 + busPenaltySeconds
    });
  }

  const totalDistance = legs.reduce((acc, leg) => acc + leg.distance, 0);
  const totalDuration = legs.reduce((acc, leg) => acc + leg.duration, 0);

  const buildSummary = (): string => {
    if (legs.length === 1) {
      return `Direct ${travelMode === 'bike' ? 'Bike' : 'Walk'} (${legs[0].distance.toFixed(1)} km)`;
    }
    if (transitPlan?.type === 'direct' && transitPlan.line) {
      return `${isBus ? 'Bus' : (travelMode === 'bike' ? 'Bike' : 'Walk')} to ${entryStation?.name}, Take ${transitPlan.line.line} Line`;
    }
    if (transitPlan?.type === 'transfer' && transitPlan.leg1 && transitPlan.leg2 && transitPlan.hub) {
      return `${isBus ? 'Bus' : (travelMode === 'bike' ? 'Bike' : 'Walk')} to ${entryStation?.name}, Take ${transitPlan.leg1.line}/${transitPlan.leg2.line} (Transfer at ${transitPlan.hub.name})`;
    }
    return 'Route calculated';
  };

  return {
    type: travelMode === 'bike' ? 'Bike + Metro' : (travelMode === 'transit_bus' ? 'Transit + Bus' : 'Walk + Metro'),
    label: '',
    start: startLoc,
    end: endLoc,
    legs: legs,
    totalDistance: totalDistance,
    totalDuration: totalDuration,
    formattedDuration: formatDuration(totalDuration),
    summary: buildSummary(),
    isFuture: usedFutureLine,
    expectedOpening: futureLineOpening
  };
}

// ============================================
// Compare Multiple Routes
// ============================================

export async function compareRoutes(
  startInput: string | Location,
  endInput: string | Location,
  safetyPreference: SafetyPreference = 'balanced',
  modeFilter: ModeFilter = 'all',
  departureTime: Date | null = null,
  includeFuture = false
): Promise<Route[]> {
  const startLoc = (typeof startInput === 'string') ? await geocode(startInput) : startInput;
  const endLoc = (typeof endInput === 'string') ? await geocode(endInput) : endInput;

  if (!startLoc || !endLoc) {
    throw new Error("Could not find start or end location");
  }

  const queryTime = departureTime || new Date();

  const routePromises: Promise<Route | null>[] = [];

  // Bike + Rail - use Google Routes if enabled, fallback to OSRM
  if (modeFilter === 'all' || modeFilter === 'bike') {
    if (isGoogleRoutesEnabled()) {
      // Use Google Routes API for bike+rail
      routePromises.push(
        calculateBikeRailRoute(startLoc, endLoc, queryTime)
          .then(route => {
            if (route) {
              return { ...route, label: "Bike + Rail" };
            }
            // Fallback to OSRM-based routing if Google fails
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              console.log('Google Routes failed, falling back to OSRM');
              return calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
                .then(r => ({ ...r, label: "Bike + Rail" }));
            }
            return null;
          })
          .catch(e => {
            console.error("Google bike+rail route failed", e);
            // Fallback to OSRM
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
                .then(r => ({ ...r, label: "Bike + Rail" }))
                .catch(() => null);
            }
            return null;
          })
      );
    } else {
      // Use OSRM-based routing
      routePromises.push(
        calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
          .then(route => ({ ...route, label: "Bike + Rail" }))
          .catch(e => { console.error("Bike route failed", e); return null; })
      );
    }
  }

  // Driving - use Google if enabled
  if (modeFilter === 'all' || modeFilter === 'driving') {
    if (isGoogleRoutesEnabled()) {
      routePromises.push(
        calculateGoogleDrivingRoute(startLoc, endLoc)
          .then(route => {
            if (route) return { ...route, label: "Driving" };
            // Fallback to OSRM
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return getOSRMRoute([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: endLoc.lat, lon: endLoc.lon }], 'driving')
                .then(drivingRoute => {
                  if (!drivingRoute) return null;
                  return {
                    type: 'Driving',
                    label: "Driving",
                    start: startLoc,
                    end: endLoc,
                    legs: [{
                      mode: 'driving' as TravelMode,
                      from: startLoc,
                      to: endLoc,
                      geometry: drivingRoute.geometry,
                      distance: drivingRoute.distance,
                      duration: drivingRoute.duration * 1.5
                    }],
                    totalDistance: drivingRoute.distance,
                    totalDuration: drivingRoute.duration * 1.5,
                    formattedDuration: formatDuration(drivingRoute.duration * 1.5),
                    summary: `Direct Drive (${drivingRoute.distance.toFixed(1)} km)`
                  } as Route;
                });
            }
            return null;
          })
          .catch(e => { console.error("Google driving route failed", e); return null; })
      );
    } else {
      routePromises.push(
        getOSRMRoute([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: endLoc.lat, lon: endLoc.lon }], 'driving')
          .then(drivingRoute => {
            if (!drivingRoute) return null;
            return {
              type: 'Driving',
              label: "Driving",
              start: startLoc,
              end: endLoc,
              legs: [{
                mode: 'driving' as TravelMode,
                from: startLoc,
                to: endLoc,
                geometry: drivingRoute.geometry,
                distance: drivingRoute.distance,
                duration: drivingRoute.duration * 1.5
              }],
              totalDistance: drivingRoute.distance,
              totalDuration: drivingRoute.duration * 1.5,
              formattedDuration: formatDuration(drivingRoute.duration * 1.5),
              summary: `Direct Drive (${drivingRoute.distance.toFixed(1)} km)`
            } as Route;
          })
          .catch(e => { console.error("Driving route failed", e); return null; })
      );
    }
  }

  // Walk + Rail - use Google Transit if enabled (includes bus connections)
  if (modeFilter === 'all' || modeFilter === 'walk') {
    if (isGoogleRoutesEnabled()) {
      routePromises.push(
        calculateWalkRailRoute(startLoc, endLoc, queryTime)
          .then(route => {
            if (route) return { ...route, label: "Walk + Rail" };
            // Fallback to OSRM-based
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
                .then(r => ({ ...r, label: "Walk + Rail" }));
            }
            return null;
          })
          .catch(e => {
            console.error("Google walk+rail route failed", e);
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
                .then(r => ({ ...r, label: "Walk + Rail" }))
                .catch(() => null);
            }
            return null;
          })
      );
    } else {
      routePromises.push(
        calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
          .then(route => ({ ...route, label: "Walk + Rail" }))
          .catch(e => { console.error("Walk route failed", e); return null; })
      );
    }
  }

  const results = await Promise.all(routePromises);
  const filteredResults = results.filter((route): route is Route => route !== null);

  // Add Future Route option if enabled
  if (includeFuture) {
    try {
      const futureRoute = await calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime, true);

      if (futureRoute && futureRoute.isFuture) {
        const bestCurrentTime = filteredResults.length > 0
          ? Math.min(...filteredResults.map(r => r.totalDuration))
          : Infinity;

        const timeSavings = bestCurrentTime - futureRoute.totalDuration;

        filteredResults.push({
          ...futureRoute,
          label: "Future Route",
          isFuture: true,
          expectedOpening: futureRoute.expectedOpening,
          timeSavings: timeSavings > 0 ? Math.round(timeSavings / 60) : null
        });
      }
    } catch (e) {
      console.error("Future route calculation failed", e);
    }
  }

  return filteredResults;
}
