// Core routing engine for VeloRail
// Multi-modal routing with transit, bike, walk support

import { geocode } from './geocoding';
import { getLadotCommuterExpressShape } from '@/data/ladotCommuterExpressStops';
import { TRANSIT_LINES } from '@/data/transitLines';
import { CONFIG, isGoogleRoutesEnabled } from './config';
import {
  calculateBikeRailRoute,
  calculateWalkRailRoute,
  calculateGoogleDrivingRoute
} from './multimodalRouter';
import {
  calculateBikeDuration,
  loadBikeSettings
} from './bikeDurationService';
import type {
  Location,
  LineString,
  Station,
  Route,
  RouteLeg,
  TravelMode,
  SafetyPreference,
  TimeMode,
  ModeFilter,
  DepartureInfo,
  OSRMRoute,
  TransitLine,
  TransitDayOperatingHours,
  TransitDirection,
  TransitPeakWindowName,
  TransitScheduleType
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

export const ROUTING_SPEEDS_KMH = {
  bike: 20,
  walk: 5,
  transit_bus: 15
} as const;

async function estimateSurfaceDurationSeconds(
  travelMode: TravelMode,
  distanceKm: number,
  geometry?: RouteLeg['geometry']
): Promise<number> {
  if (travelMode === 'bike') {
    const bikeSettings = loadBikeSettings();
    if (geometry && typeof google !== 'undefined' && google.maps) {
      const estimate = await calculateBikeDuration(geometry, distanceKm, bikeSettings);
      return estimate.totalDuration;
    }

    return (distanceKm / bikeSettings.baseSpeedKmh) * 3600;
  }

  if (travelMode === 'walk') {
    return (distanceKm / ROUTING_SPEEDS_KMH.walk) * 3600;
  }

  if (travelMode === 'transit_bus') {
    return (distanceKm / ROUTING_SPEEDS_KMH.transit_bus) * 3600;
  }

  return 0;
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
  patternId?: string;
  headsign?: string;
  shapeId?: string;
  stationShapeDistances?: number[];
  segment: Station[];
  lineStatus: string;
  expectedOpening: string | null;
  serviceNotes?: string;
  sourceConfidence?: 'high' | 'medium' | 'low';
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
// Schedule Helpers
// ============================================

type DayType = 'weekday' | 'saturday' | 'sunday';
type ScheduleTypeFilter = ReadonlySet<TransitScheduleType> | null;

const LA_TIME_ZONE = 'America/Los_Angeles';
const DEFAULT_ACTIVE_SCHEDULE_TYPES = new Set<TransitScheduleType>([
  'rail',
  'heavy_rail',
  'light_rail',
  'brt',
  'commuter_rail',
  'intercity_rail',
  'people_mover',
  'airport_shuttle',
  'shuttle'
]);
const COMMUTER_EXPRESS_SCHEDULE_TYPES = new Set<TransitScheduleType>(['commuter_express']);

interface LocalTimeParts {
  weekday: string;
  minutes: number;
}

function getLocalTimeParts(time: Date): LocalTimeParts {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: LA_TIME_ZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(time);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour === '24' ? '0' : values.hour);
  const minute = Number(values.minute || '0');

  return {
    weekday: values.weekday || 'Mon',
    minutes: hour * 60 + minute
  };
}

export function getDayType(time: Date): DayType {
  const weekday = getLocalTimeParts(time).weekday;
  if (weekday === 'Sat') return 'saturday';
  if (weekday === 'Sun') return 'sunday';
  return 'weekday';
}

function parseTimeToMinutes(value: string): number {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isWithinTimeRange(time: Date, start: string, end: string): boolean {
  const currentMinutes = getLocalTimeParts(time).minutes;
  const startMinutes = parseTimeToMinutes(start);
  const endMinutes = parseTimeToMinutes(end);

  if (startMinutes <= endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

function scheduleTypeAllowed(line: TransitLine, scheduleTypeFilter: ScheduleTypeFilter): boolean {
  if (!scheduleTypeFilter || !line.schedule?.type) return true;
  return scheduleTypeFilter.has(line.schedule.type);
}

function hasFixedOperatingHours(hours: TransitDayOperatingHours): hours is { start: string; end: string } {
  return Boolean(hours && 'start' in hours && 'end' in hours);
}

function getActivePeakWindow(line: TransitLine, time: Date): TransitPeakWindowName | null {
  const hours = line.schedule?.operatingHours?.[getDayType(time)];
  if (!hours || hasFixedOperatingHours(hours)) return null;

  for (const windowName of ['am_peak', 'pm_peak'] as TransitPeakWindowName[]) {
    const range = hours[windowName];
    if (range && isWithinTimeRange(time, range.start, range.end)) {
      return windowName;
    }
  }

  return null;
}

function getLineDirection(idx1: number, idx2: number): Exclude<TransitDirection, 'both'> {
  return idx1 <= idx2 ? 'forward' : 'reverse';
}

function hasCommuterExpressOnlyFilter(scheduleTypeFilter: ScheduleTypeFilter): boolean {
  return Boolean(
    scheduleTypeFilter
    && scheduleTypeFilter.size === 1
    && scheduleTypeFilter.has('commuter_express')
  );
}

function getTransitSegmentDistance(stations: Station[]): number {
  let transitDistance = 0;
  for (let index = 0; index < stations.length - 1; index += 1) {
    transitDistance += getDistance(
      stations[index].lat,
      stations[index].lon,
      stations[index + 1].lat,
      stations[index + 1].lon
    );
  }
  return transitDistance;
}

function dedupeConsecutiveCoordinates(coordinates: [number, number][]): [number, number][] {
  return coordinates.filter((coordinate, index) => {
    const previous = coordinates[index - 1];
    return !previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1];
  });
}

function interpolateShapeCoordinate(
  coordinates: [number, number][],
  distances: number[],
  targetDistance: number
): [number, number] | null {
  if (!Number.isFinite(targetDistance) || coordinates.length === 0 || distances.length !== coordinates.length) {
    return null;
  }

  if (targetDistance <= distances[0]) return coordinates[0];
  if (targetDistance >= distances[distances.length - 1]) return coordinates[coordinates.length - 1];

  for (let index = 1; index < distances.length; index += 1) {
    const previousDistance = distances[index - 1];
    const nextDistance = distances[index];
    if (targetDistance > nextDistance) continue;

    const previousCoordinate = coordinates[index - 1];
    const nextCoordinate = coordinates[index];
    if (nextDistance === previousDistance) return nextCoordinate;

    const ratio = (targetDistance - previousDistance) / (nextDistance - previousDistance);
    return [
      previousCoordinate[0] + (nextCoordinate[0] - previousCoordinate[0]) * ratio,
      previousCoordinate[1] + (nextCoordinate[1] - previousCoordinate[1]) * ratio
    ];
  }

  return null;
}

function getShapeSegmentCoordinates(
  route: TransitRoute
): [number, number][] | null {
  const shape = getLadotCommuterExpressShape(route.shapeId);
  const stationShapeDistances = route.stationShapeDistances;
  if (!shape || !stationShapeDistances || stationShapeDistances.length < 2) return null;

  const startDistance = stationShapeDistances[0];
  const endDistance = stationShapeDistances[stationShapeDistances.length - 1];
  if (!Number.isFinite(startDistance) || !Number.isFinite(endDistance) || endDistance <= startDistance) {
    return null;
  }

  const coordinates = shape.geometry.coordinates;
  const shapeDistances = shape.shapeDistances;
  const startCoordinate = interpolateShapeCoordinate(coordinates, shapeDistances, startDistance);
  const endCoordinate = interpolateShapeCoordinate(coordinates, shapeDistances, endDistance);
  if (!startCoordinate || !endCoordinate) return null;

  return dedupeConsecutiveCoordinates([
    startCoordinate,
    ...coordinates.filter((_, index) =>
      shapeDistances[index] > startDistance && shapeDistances[index] < endDistance
    ),
    endCoordinate
  ]);
}

function getTransitRouteGeometry(route: TransitRoute): LineString {
  const shapeCoordinates = getShapeSegmentCoordinates(route);
  if (shapeCoordinates && shapeCoordinates.length >= 2) {
    return {
      type: "LineString",
      coordinates: shapeCoordinates
    };
  }

  return {
    type: "LineString",
    coordinates: route.segment.map((station) => [station.lon, station.lat] as [number, number])
  };
}

function isDirectionAllowed(
  line: TransitLine,
  time: Date,
  direction: Exclude<TransitDirection, 'both'>
): boolean {
  if (
    line.schedule?.type !== 'commuter_express'
    || !line.schedule.directionalService?.length
  ) {
    return true;
  }

  const activeWindow = getActivePeakWindow(line, time);
  if (!activeWindow) return true;

  return line.schedule.directionalService.some((service) =>
    service.window === activeWindow
    && (service.direction === 'both' || service.direction === direction)
  );
}

function getDirectionalServiceLabel(
  line: TransitLine,
  time: Date,
  direction: Exclude<TransitDirection, 'both'>
): string | null {
  const activeWindow = getActivePeakWindow(line, time);
  if (!activeWindow) return null;

  const service = line.schedule?.directionalService?.find((candidate) =>
    candidate.window === activeWindow
    && (candidate.direction === 'both' || candidate.direction === direction)
  );

  return service?.label || null;
}

export function isLineOperating(
  lineName: string,
  time: Date,
  options?: { includeFuture?: boolean; scheduleTypeFilter?: ScheduleTypeFilter }
): boolean {
  const line = TRANSIT_LINES[lineName];
  if (!line || !scheduleTypeAllowed(line, options?.scheduleTypeFilter || null)) return false;

  const isCurrent = !line.status || line.status === 'operating';
  if (!isCurrent) return Boolean(options?.includeFuture);

  const schedule = line.schedule;
  if (!schedule) return true;

  const dayType = getDayType(time);

  if (schedule.operatingWindows) {
    const windows = schedule.operatingWindows[dayType] || [];
    if (windows.length === 0) return false;
    return windows.some((window) => isWithinTimeRange(time, window.start, window.end));
  }

  if (schedule.operatingHours && dayType in schedule.operatingHours) {
    const hours = schedule.operatingHours[dayType];
    if (hours === null) return false;
    if (hours === undefined) return true;
    if (hasFixedOperatingHours(hours)) {
      return isWithinTimeRange(time, hours.start, hours.end);
    }
    return getActivePeakWindow(line, time) !== null;
  }

  if (dayType === 'weekday' && schedule.weekdayHours) {
    return isWithinTimeRange(time, String(schedule.weekdayHours.start).padStart(2, '0') + ':00', String(schedule.weekdayHours.end).padStart(2, '0') + ':00');
  }

  if ((dayType === 'saturday' || dayType === 'sunday') && schedule.weekendHours) {
    return isWithinTimeRange(time, String(schedule.weekendHours.start).padStart(2, '0') + ':00', String(schedule.weekendHours.end).padStart(2, '0') + ':00');
  }

  return true;
}

export function estimateWaitTime(lineName: string, time: Date = new Date()): number {
  const line = TRANSIT_LINES[lineName];
  const schedule = line?.schedule;
  if (!schedule) return 600;

  if (schedule.operatingWindows) {
    if (!isLineOperating(lineName, time, { scheduleTypeFilter: null })) return Infinity;
    return (schedule.frequencyPeak ?? schedule.frequency ?? 20) * 60;
  }

  if (schedule.operatingHours) {
    if (!isLineOperating(lineName, time, { scheduleTypeFilter: null })) return Infinity;
    return (schedule.frequencyPeak ?? schedule.frequency ?? 20) * 60;
  }

  return (schedule.frequency ?? schedule.frequencyPeak ?? 10) * 60;
}

async function getNextDeparture(
  lineName: string,
  arrivalTime: Date,
  stationName: string,
  patternStations?: Station[],
  patternHeadsign?: string
): Promise<DepartureInfo> {
  // Frequency-based static estimate. Commuter Express is not realtime-backed here.
  const waitSeconds = estimateWaitTime(lineName, arrivalTime);
  const line = TRANSIT_LINES[lineName];
  const stations = patternStations || line?.stations || [];
  const stationIndex = stations.findIndex((station) => station.name === stationName);
  const nextStation = stationIndex >= 0
    ? stations[stationIndex + 1] || stations[stationIndex - 1]
    : null;

  return {
    waitSeconds: Number.isFinite(waitSeconds) ? waitSeconds : 0,
    departureTime: Number.isFinite(waitSeconds)
      ? new Date(arrivalTime.getTime() + waitSeconds * 1000)
      : null,
    headsign: patternHeadsign || nextStation?.name || null,
    isEstimate: true
  };
}

// ============================================
// Station Finding Functions
// ============================================

function getAllStations(departureTime: Date | null = null, includeFuture = false, scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES): StationWithLine[] {
  const all: StationWithLine[] = [];
  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture, scheduleTypeFilter })) {
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
  includeFuture = false,
  scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES
): StationWithLine | null {
  let nearest: StationWithLine | null = null;
  let minDist = Infinity;
  const stations = getAllStations(departureTime, includeFuture, scheduleTypeFilter);

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
  includeFuture = false,
  scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES
): TransitRoute[] {
  const routes: TransitRoute[] = [];

  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture, scheduleTypeFilter })) {
      continue;
    }

    if (data.patterns?.length) {
      for (const pattern of data.patterns) {
        const idx1 = pattern.stations.findIndex(s => s.name === s1.name);
        const idx2 = pattern.stations.findIndex(s => s.name === s2.name);

        if (idx1 === -1 || idx2 === -1 || idx1 >= idx2) {
          continue;
        }

        const direction = pattern.direction;
        if (departureTime && !isDirectionAllowed(data, departureTime, direction)) {
          continue;
        }

        routes.push({
          line: lineName,
          color: data.color,
          gtfsRouteId: pattern.routeId || data.gtfsRouteId || null,
          patternId: pattern.id,
          headsign: pattern.headsign,
          shapeId: pattern.shapeId,
          stationShapeDistances: pattern.stationShapeDistances?.slice(idx1, idx2 + 1),
          segment: pattern.stations.slice(idx1, idx2 + 1),
          lineStatus: data.status || 'operating',
          expectedOpening: data.expectedOpening || null,
          serviceNotes: [
            data.schedule?.scheduleNotes,
            departureTime ? getDirectionalServiceLabel(data, departureTime, direction) : null
          ].filter(Boolean).join(' '),
          sourceConfidence: data.source?.confidence || data.schedule?.sourceConfidence
        });
      }
      continue;
    }

    const idx1 = data.stations.findIndex(s => s.name === s1.name);
    const idx2 = data.stations.findIndex(s => s.name === s2.name);

    if (idx1 !== -1 && idx2 !== -1) {
      const direction = getLineDirection(idx1, idx2);
      if (departureTime && !isDirectionAllowed(data, departureTime, direction)) {
        continue;
      }

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
        expectedOpening: data.expectedOpening || null,
        serviceNotes: [
          data.schedule?.scheduleNotes,
          departureTime ? getDirectionalServiceLabel(data, departureTime, direction) : null
        ].filter(Boolean).join(' '),
        sourceConfidence: data.source?.confidence || data.schedule?.sourceConfidence
      });
    }
  }
  return routes;
}

interface DirectTransitCandidate {
  entryStation: StationWithLine;
  exitStation: StationWithLine;
  route: TransitRoute;
}

function findBestNearbyDirectTransitCandidate(
  startLoc: Location,
  endLoc: Location,
  departureTime: Date | null = null,
  includeFuture = false,
  scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES
): DirectTransitCandidate | null {
  const maxAccessDistanceKm = hasCommuterExpressOnlyFilter(scheduleTypeFilter) ? 4 : 2;
  const maxEgressDistanceKm = hasCommuterExpressOnlyFilter(scheduleTypeFilter) ? 6 : 2;

  let bestCandidate: DirectTransitCandidate | null = null;
  let bestScore = Infinity;

  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (!scheduleTypeAllowed(data, scheduleTypeFilter)) continue;
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture, scheduleTypeFilter })) {
      continue;
    }

    const patterns = data.patterns?.length
      ? data.patterns
      : [{
        id: `${lineName}-default`,
        routeId: data.gtfsRouteId,
        direction: 'forward' as const,
        headsign: undefined,
        stations: data.stations
      }];

    for (const pattern of patterns) {
      if (departureTime && !isDirectionAllowed(data, departureTime, pattern.direction)) {
        continue;
      }

      for (let entryIndex = 0; entryIndex < pattern.stations.length - 1; entryIndex += 1) {
        const entryPatternStation = pattern.stations[entryIndex];
        const accessDistance = getDistance(startLoc.lat, startLoc.lon, entryPatternStation.lat, entryPatternStation.lon);
        if (accessDistance > maxAccessDistanceKm) continue;

        for (let exitIndex = entryIndex + 1; exitIndex < pattern.stations.length; exitIndex += 1) {
          const exitPatternStation = pattern.stations[exitIndex];
          const egressDistance = getDistance(endLoc.lat, endLoc.lon, exitPatternStation.lat, exitPatternStation.lon);
          if (egressDistance > maxEgressDistanceKm) continue;

          const segment = pattern.stations.slice(entryIndex, exitIndex + 1);
          const routeDistance = getTransitSegmentDistance(segment);
          const route: TransitRoute = {
            line: lineName,
            color: data.color,
            gtfsRouteId: pattern.routeId || data.gtfsRouteId || null,
            patternId: pattern.id,
            headsign: pattern.headsign,
            shapeId: pattern.shapeId,
            stationShapeDistances: pattern.stationShapeDistances?.slice(entryIndex, exitIndex + 1),
            segment,
            lineStatus: data.status || 'operating',
            expectedOpening: data.expectedOpening || null,
            serviceNotes: [
              data.schedule?.scheduleNotes,
              departureTime ? getDirectionalServiceLabel(data, departureTime, pattern.direction) : null
            ].filter(Boolean).join(' '),
            sourceConfidence: data.source?.confidence || data.schedule?.sourceConfidence
          };
          const entryStation: StationWithLine = {
            ...entryPatternStation,
            line: lineName,
            color: data.color,
            lineStatus: data.status || 'operating',
            expectedOpening: data.expectedOpening || null,
            distance: accessDistance
          };
          const exitStation: StationWithLine = {
            ...exitPatternStation,
            line: lineName,
            color: data.color,
            lineStatus: data.status || 'operating',
            expectedOpening: data.expectedOpening || null,
            distance: egressDistance
          };
          const score = accessDistance + egressDistance + routeDistance * 0.01;

          if (score < bestScore) {
            bestScore = score;
            bestCandidate = { entryStation, exitStation, route };
          }
        }
      }
    }
  }

  return bestCandidate;
}

function getLinesForStation(
  stationName: string,
  departureTime: Date | null = null,
  includeFuture = false,
  scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES
): string[] {
  const lines: string[] = [];

  for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
    if (departureTime && !isLineOperating(lineName, departureTime, { includeFuture, scheduleTypeFilter })) {
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
  includeFuture = false,
  scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES
): TransferResult | null {
  const MAX_WALK_TRANSFER_KM = 0.8;

  const entryLines = getLinesForStation(entryStation.name, departureTime, includeFuture, scheduleTypeFilter);
  const exitLines = getLinesForStation(exitStation.name, departureTime, includeFuture, scheduleTypeFilter);

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
        const leg1Routes = getCommonLines(entryStation, transferStation, departureTime, includeFuture, scheduleTypeFilter);
        const leg2Routes = getCommonLines(transferStation, exitStation, departureTime, includeFuture, scheduleTypeFilter);

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
        const leg1Routes = getCommonLines(entryStation, station1, departureTime, includeFuture, scheduleTypeFilter);
        const leg2Routes = getCommonLines(station2, exitStation, departureTime, includeFuture, scheduleTypeFilter);

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
  includeFuture = false,
  scheduleTypeFilter: ScheduleTypeFilter = DEFAULT_ACTIVE_SCHEDULE_TYPES
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

  const busPenaltySeconds = isBus ? 600 : 0;

  let entryStation = findNearestStation(startLoc.lat, startLoc.lon, queryTime, includeFuture, scheduleTypeFilter);
  let exitStation = findNearestStation(endLoc.lat, endLoc.lon, queryTime, includeFuture, scheduleTypeFilter);

  const legs: RouteLeg[] = [];

  let commonRoutes = entryStation && exitStation
    ? getCommonLines(entryStation, exitStation, queryTime, includeFuture, scheduleTypeFilter)
    : [];

  if (isBus && hasCommuterExpressOnlyFilter(scheduleTypeFilter)) {
    const directCandidate = findBestNearbyDirectTransitCandidate(
      startLoc,
      endLoc,
      queryTime,
      includeFuture,
      scheduleTypeFilter
    );

    if (directCandidate) {
      entryStation = directCandidate.entryStation;
      exitStation = directCandidate.exitStation;
      commonRoutes = [directCandidate.route];
    }
  }

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
    const transferResult = findBestTransfer(entryStation, exitStation, queryTime, includeFuture, scheduleTypeFilter);

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
    const geometry = route?.geometry || {
      type: "LineString" as const,
      coordinates: [[startLoc.lon, startLoc.lat], [endLoc.lon, endLoc.lat]] as [number, number][]
    };
    const duration = await estimateSurfaceDurationSeconds(travelMode, distKm, geometry);

    legs.push({
      mode: travelMode,
      from: startLoc,
      to: endLoc,
      geometry,
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
    const geometry1 = l1?.geometry || {
      type: "LineString" as const,
      coordinates: [[startLoc.lon, startLoc.lat], [entryStation.lon, entryStation.lat]] as [number, number][]
    };
    const dur1 = await estimateSurfaceDurationSeconds(travelMode, d1, geometry1);

    legs.push({
      mode: travelMode,
      from: startLoc,
      to: entryStation,
      geometry: geometry1,
      distance: d1,
      duration: dur1 + busPenaltySeconds
    });

    // Transit legs
    if (transitPlan!.type === 'direct' && transitPlan!.line) {
      const bestTransit = transitPlan!.line;
      const waypoints = bestTransit.segment;
      const transitGeometry = getTransitRouteGeometry(bestTransit);

      let transitDistance = 0;
      for (let i = 0; i < waypoints.length - 1; i++) {
        transitDistance += getDistance(waypoints[i].lat, waypoints[i].lon, waypoints[i + 1].lat, waypoints[i + 1].lon);
      }

      const avgSpeedKmh = 35;
      const accessTimeSeconds = legs[0].duration;
      const arrivalAtStation = new Date(queryTime.getTime() + accessTimeSeconds * 1000);

      const departureInfo = await getNextDeparture(
        bestTransit.line,
        arrivalAtStation,
        entryStation.name,
        bestTransit.segment,
        bestTransit.headsign
      );
      const waitTimeSeconds = departureInfo.waitSeconds;
      const transitDuration = (transitDistance / avgSpeedKmh) * 3600 + waitTimeSeconds;

      legs.push({
        mode: isBus ? 'transit_bus' : 'transit',
        line: bestTransit.line,
        routeId: bestTransit.gtfsRouteId || null,
        color: bestTransit.color,
        from: entryStation,
        to: exitStation,
        geometry: transitGeometry,
        distance: transitDistance,
        duration: transitDuration,
        waitTime: waitTimeSeconds,
        departureTime: departureInfo.departureTime,
        headsign: departureInfo.headsign,
        isRealtimeSchedule: !departureInfo.isEstimate,
        stations: bestTransit.segment,
        serviceNotes: bestTransit.serviceNotes,
        sourceConfidence: bestTransit.sourceConfidence
      });
    } else if (transitPlan!.type === 'transfer') {
      const hub = transitPlan!.hub!;
      const leg1 = transitPlan!.leg1!;
      const leg2 = transitPlan!.leg2!;
      const avgSpeedKmh = 35;

      const accessTimeSeconds = legs[0].duration;
      const arrivalAtEntry = new Date(queryTime.getTime() + accessTimeSeconds * 1000);

      const departureInfo1 = await getNextDeparture(
        leg1.line,
        arrivalAtEntry,
        entryStation.name,
        leg1.segment,
        leg1.headsign
      );

      let leg1Distance = 0;
      for (let i = 0; i < leg1.segment.length - 1; i++) {
        leg1Distance += getDistance(leg1.segment[i].lat, leg1.segment[i].lon, leg1.segment[i + 1].lat, leg1.segment[i + 1].lon);
      }
      const leg1TravelTime = (leg1Distance / avgSpeedKmh) * 3600;
      const leg1Geometry = getTransitRouteGeometry(leg1);

      legs.push({
        mode: isBus ? 'transit_bus' : 'transit',
        line: leg1.line,
        routeId: leg1.gtfsRouteId || null,
        color: leg1.color,
        from: entryStation,
        to: hub,
        geometry: leg1Geometry,
        distance: leg1Distance,
        duration: leg1TravelTime + departureInfo1.waitSeconds,
        waitTime: departureInfo1.waitSeconds,
        departureTime: departureInfo1.departureTime,
        headsign: departureInfo1.headsign,
        isRealtimeSchedule: !departureInfo1.isEstimate,
        stations: leg1.segment,
        serviceNotes: leg1.serviceNotes,
        sourceConfidence: leg1.sourceConfidence
      });

      const arrivalAtHub = new Date(arrivalAtEntry.getTime() + (departureInfo1.waitSeconds + leg1TravelTime) * 1000);
      const departureInfo2 = await getNextDeparture(
        leg2.line,
        arrivalAtHub,
        hub.name,
        leg2.segment,
        leg2.headsign
      );

      let leg2Distance = 0;
      for (let i = 0; i < leg2.segment.length - 1; i++) {
        leg2Distance += getDistance(leg2.segment[i].lat, leg2.segment[i].lon, leg2.segment[i + 1].lat, leg2.segment[i + 1].lon);
      }
      const leg2TravelTime = (leg2Distance / avgSpeedKmh) * 3600;
      const leg2Geometry = getTransitRouteGeometry(leg2);

      legs.push({
        mode: isBus ? 'transit_bus' : 'transit',
        line: leg2.line,
        routeId: leg2.gtfsRouteId || null,
        color: leg2.color,
        from: hub,
        to: exitStation,
        geometry: leg2Geometry,
        distance: leg2Distance,
        duration: leg2TravelTime + departureInfo2.waitSeconds,
        waitTime: departureInfo2.waitSeconds,
        departureTime: departureInfo2.departureTime,
        headsign: departureInfo2.headsign,
        isRealtimeSchedule: !departureInfo2.isEstimate,
        stations: leg2.segment,
        serviceNotes: leg2.serviceNotes,
        sourceConfidence: leg2.sourceConfidence,
        isTransfer: true
      });
    }

    // Leg 3: Egress -> Destination
    const l3 = await getOSRMRoute([
      { lat: exitStation.lat, lon: exitStation.lon },
      { lat: endLoc.lat, lon: endLoc.lon }
    ], profile);

    const d3 = l3 ? l3.distance : getDistance(exitStation.lat, exitStation.lon, endLoc.lat, endLoc.lon);
    const geometry3 = l3?.geometry || {
      type: "LineString" as const,
      coordinates: [[exitStation.lon, exitStation.lat], [endLoc.lon, endLoc.lat]] as [number, number][]
    };
    const dur3 = await estimateSurfaceDurationSeconds(travelMode, d3, geometry3);

    legs.push({
      mode: travelMode,
      from: exitStation,
      to: endLoc,
      geometry: geometry3,
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
      if (TRANSIT_LINES[transitPlan.line.line]?.schedule?.type === 'commuter_express') {
        return `Peak-period ${transitPlan.line.line} Commuter Express with estimated wait`;
      }
      return `${isBus ? 'Commuter Express bus' : (travelMode === 'bike' ? 'Bike' : 'Walk')} to ${entryStation?.name}, Take ${isBus ? transitPlan.line.line : `${transitPlan.line.line} Line`}`;
    }
    if (transitPlan?.type === 'transfer' && transitPlan.leg1 && transitPlan.leg2 && transitPlan.hub) {
      return `${isBus ? 'Commuter Express bus' : (travelMode === 'bike' ? 'Bike' : 'Walk')} to ${entryStation?.name}, Take ${transitPlan.leg1.line}/${transitPlan.leg2.line} (Transfer at ${transitPlan.hub.name})`;
    }
    return 'Route calculated';
  };

  return {
    type: travelMode === 'bike' ? 'Bike + Metro' : (travelMode === 'transit_bus' ? 'Commuter Express Bus' : 'Walk + Metro'),
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
  includeFuture = false,
  timeMode: TimeMode = 'departAt'
): Promise<Route[]> {
  const startLoc = (typeof startInput === 'string') ? await geocode(startInput) : startInput;
  const endLoc = (typeof endInput === 'string') ? await geocode(endInput) : endInput;

  if (!startLoc || !endLoc) {
    throw new Error("Could not find start or end location");
  }

  const queryTime = departureTime || new Date();

  const withTimeMetadata = (route: Route, notice: string | null = null): Route => ({
    ...route,
    timeMode,
    requestedTime: queryTime,
    timeModeNotice: notice
  });

  const fallbackNotice = timeMode === 'arriveBy'
    ? 'This fallback route provider does not support true Arrive by scheduling, so durations are estimated while preserving the requested arrival mode in metadata.'
    : null;

  const routePromises: Promise<Route | null>[] = [];

  // Bike + Rail - use Google Routes if enabled, fallback to OSRM
  if (modeFilter === 'all' || modeFilter === 'bike') {
    if (isGoogleRoutesEnabled()) {
      // Use Google Routes API for bike+rail
      routePromises.push(
        calculateBikeRailRoute(startLoc, endLoc, queryTime, timeMode)
          .then(route => {
            if (route) {
              return withTimeMetadata({ ...route, label: "Bike + Rail" });
            }
            // Fallback to OSRM-based routing if Google fails
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              console.log('Google Routes failed, falling back to OSRM');
              return calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
                .then(r => withTimeMetadata({ ...r, label: "Bike + Rail" }, fallbackNotice));
            }
            return null;
          })
          .catch(e => {
            console.error("Google bike+rail route failed", e);
            // Fallback to OSRM
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
                .then(r => withTimeMetadata({ ...r, label: "Bike + Rail" }, fallbackNotice))
                .catch(() => null);
            }
            return null;
          })
      );
    } else {
      // Use OSRM-based routing
      routePromises.push(
        calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
          .then(route => withTimeMetadata({ ...route, label: "Bike + Rail" }, fallbackNotice))
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
            if (route) return withTimeMetadata({ ...route, label: "Driving" }, fallbackNotice);
            // Fallback to OSRM
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return getOSRMRoute([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: endLoc.lat, lon: endLoc.lon }], 'driving')
                .then(drivingRoute => {
                  if (!drivingRoute) return null;
                  const route = {
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
                  return withTimeMetadata(route, fallbackNotice);
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
            const route = {
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
            return withTimeMetadata(route, fallbackNotice);
          })
          .catch(e => { console.error("Driving route failed", e); return null; })
      );
    }
  }


  // LADOT Commuter Express - VeloRail-owned static routing, only in all-mode during active windows.
  if (modeFilter === 'all') {
    routePromises.push(
      calculateRoute(startLoc, endLoc, 'transit_bus', 'balanced', queryTime, false, COMMUTER_EXPRESS_SCHEDULE_TYPES)
        .then(route => route.legs.some((leg) => leg.mode === 'transit_bus' && leg.line?.startsWith('LADOT CE'))
          ? withTimeMetadata({ ...route, label: 'LADOT Commuter Express' }, fallbackNotice)
          : null)
        .catch(e => { console.error('Commuter Express route failed', e); return null; })
    );
  }

  // Walk + Rail - use Google Transit if enabled (includes bus connections)
  if (modeFilter === 'all' || modeFilter === 'walk') {
    if (isGoogleRoutesEnabled()) {
      routePromises.push(
        calculateWalkRailRoute(startLoc, endLoc, queryTime, timeMode)
          .then(route => {
            if (route) return withTimeMetadata({ ...route, label: "Walk + Rail" });
            // Fallback to OSRM-based
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
                .then(r => withTimeMetadata({ ...r, label: "Walk + Rail" }, fallbackNotice));
            }
            return null;
          })
          .catch(e => {
            console.error("Google walk+rail route failed", e);
            if (CONFIG.GOOGLE_ROUTES_FALLBACK_TO_OSRM) {
              return calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
                .then(r => withTimeMetadata({ ...r, label: "Walk + Rail" }, fallbackNotice))
                .catch(() => null);
            }
            return null;
          })
      );
    } else {
      routePromises.push(
        calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
          .then(route => withTimeMetadata({ ...route, label: "Walk + Rail" }, fallbackNotice))
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

        filteredResults.push(withTimeMetadata({
          ...futureRoute,
          label: "Future Route",
          isFuture: true,
          expectedOpening: futureRoute.expectedOpening,
          timeSavings: timeSavings > 0 ? Math.round(timeSavings / 60) : null
        }, fallbackNotice));
      }
    } catch (e) {
      console.error("Future route calculation failed", e);
    }
  }

  return filteredResults;
}
