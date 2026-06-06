import {
  LADOT_COMMUTER_EXPRESS_PATTERNS,
  getLadotCommuterExpressShape
} from '@/data/ladotCommuterExpressStops';
import type { RouteLeg, Station } from '@/types';

type Coordinate = [number, number];

export function getRouteLegOverlayCoordinates(leg: RouteLeg): Coordinate[] {
  const commuterExpressCoordinates = getLadotCommuterExpressOverlayCoordinates(leg);
  if (commuterExpressCoordinates?.length) return commuterExpressCoordinates;

  return leg.geometry.coordinates as Coordinate[];
}

function getLadotCommuterExpressOverlayCoordinates(leg: RouteLeg): Coordinate[] | null {
  if (!leg.line?.startsWith('LADOT CE')) return null;

  const patterns = LADOT_COMMUTER_EXPRESS_PATTERNS[leg.line];
  if (!patterns?.length) return null;

  const stationNames = getLegStationNames(leg);
  if (stationNames.length < 2) return null;

  for (const pattern of patterns) {
    const indices = findContiguousStationSegment(pattern.stations, stationNames)
      ?? findEndpointStationSegment(pattern.stations, stationNames[0], stationNames[stationNames.length - 1]);
    if (!indices) continue;

    const shape = getLadotCommuterExpressShape(pattern.shapeId);
    const stationShapeDistances = pattern.stationShapeDistances;
    if (!shape || !stationShapeDistances?.length) continue;

    const startDistance = stationShapeDistances[indices.startIndex];
    const endDistance = stationShapeDistances[indices.endIndex];
    const segment = sliceShapeCoordinates(
      shape.geometry.coordinates as Coordinate[],
      shape.shapeDistances,
      startDistance,
      endDistance
    );
    if (segment?.length) return segment;
  }

  return null;
}

function getLegStationNames(leg: RouteLeg): string[] {
  const names = leg.stations
    ?.map((station) => station.name)
    .filter((name): name is string => Boolean(name)) ?? [];

  if (names.length >= 2) return names;

  return [
    getLocationName(leg.from),
    getLocationName(leg.to)
  ].filter((name): name is string => Boolean(name));
}

function getLocationName(location: RouteLeg['from']): string | null {
  if ('name' in location && location.name) return location.name;
  if ('display_name' in location && location.display_name) return location.display_name;
  return null;
}

function findContiguousStationSegment(
  patternStations: Station[],
  stationNames: string[]
): { startIndex: number; endIndex: number } | null {
  for (let startIndex = 0; startIndex <= patternStations.length - stationNames.length; startIndex += 1) {
    const matches = stationNames.every((name, offset) =>
      patternStations[startIndex + offset]?.name === name
    );
    if (matches) {
      return {
        startIndex,
        endIndex: startIndex + stationNames.length - 1
      };
    }
  }

  return null;
}

function findEndpointStationSegment(
  patternStations: Station[],
  fromName: string,
  toName: string
): { startIndex: number; endIndex: number } | null {
  const startIndex = patternStations.findIndex((station) => station.name === fromName);
  const endIndex = patternStations.findIndex((station) => station.name === toName);
  if (startIndex === -1 || endIndex === -1 || startIndex >= endIndex) return null;
  return { startIndex, endIndex };
}

function sliceShapeCoordinates(
  coordinates: Coordinate[],
  distances: number[],
  startDistance: number,
  endDistance: number
): Coordinate[] | null {
  if (
    !Number.isFinite(startDistance)
    || !Number.isFinite(endDistance)
    || endDistance <= startDistance
    || coordinates.length === 0
    || coordinates.length !== distances.length
  ) {
    return null;
  }

  const startCoordinate = interpolateShapeCoordinate(coordinates, distances, startDistance);
  const endCoordinate = interpolateShapeCoordinate(coordinates, distances, endDistance);
  if (!startCoordinate || !endCoordinate) return null;

  return dedupeConsecutiveCoordinates([
    startCoordinate,
    ...coordinates.filter((_, index) =>
      distances[index] > startDistance && distances[index] < endDistance
    ),
    endCoordinate
  ]);
}

function interpolateShapeCoordinate(
  coordinates: Coordinate[],
  distances: number[],
  targetDistance: number
): Coordinate | null {
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

function dedupeConsecutiveCoordinates(coordinates: Coordinate[]): Coordinate[] {
  return coordinates.filter((coordinate, index) => {
    const previous = coordinates[index - 1];
    return !previous || previous[0] !== coordinate[0] || previous[1] !== coordinate[1];
  });
}
