// Station Data Provider - Abstraction layer for transit station data
// Designed to easily swap between local data and Google APIs in the future

import { TRANSIT_LINES } from '@/data/transitLines';
import type { Location, Station } from '@/types';

// ============================================
// Types
// ============================================

export interface StationWithLine {
  station: Station;
  line: string;
  lineColor: string;
  distance?: number; // km from reference point
}

export interface TransitTimeEstimate {
  duration: number;      // seconds
  transfers: number;
  lines: string[];
  isEstimate: boolean;   // true if calculated locally, false if from API
}

export interface StationDataProvider {
  // Find stations near a location, sorted by distance (closest first)
  findStationsNear(location: Location): Promise<StationWithLine[]>;

  // Get all lines that serve a station
  getLinesServingStation(stationName: string): Promise<string[]>;

  // Get all stations on a line
  getStationsOnLine(lineName: string): Promise<Station[]>;

  // Estimate transit time between two stations
  estimateTransitTime(from: Station, to: Station): Promise<TransitTimeEstimate>;

  // Find which lines connect two stations (directly or with transfers)
  findConnectingLines(from: Station, to: Station): Promise<{
    direct: string[];
    withTransfer: Array<{ line1: string; line2: string; transferStation: string }>;
  }>;
}

// ============================================
// Local Provider Implementation
// Uses transitLines.ts data
// ============================================

export class LocalStationDataProvider implements StationDataProvider {

  async findStationsNear(location: Location): Promise<StationWithLine[]> {
    const results: StationWithLine[] = [];

    for (const [lineName, lineData] of Object.entries(TRANSIT_LINES)) {
      // Skip non-operating lines for now
      if (lineData.status && lineData.status !== 'operating') {
        continue;
      }

      // Skip non-rail modes (buses, shuttles)
      const railTypes = ['rail', 'heavy_rail', 'light_rail', 'brt', 'subway', 'metro'];
      if (lineData.schedule?.type && !railTypes.includes(lineData.schedule.type)) {
        continue;
      }

      for (const station of lineData.stations) {
        if (station.waypoint) continue;

        const distance = this.haversineDistance(
          location.lat, location.lon,
          station.lat, station.lon
        );

        // Check if we already have this station from another line
        const existing = results.find(r => r.station.name === station.name);
        if (!existing || distance < (existing.distance || Infinity)) {
          if (existing) {
            // Update with closer distance
            existing.distance = distance;
          } else {
            results.push({
              station,
              line: lineName,
              lineColor: lineData.color,
              distance
            });
          }
        }
      }
    }

    // Sort by distance (closest first)
    return results.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  }

  async getLinesServingStation(stationName: string): Promise<string[]> {
    const lines: string[] = [];

    for (const [lineName, lineData] of Object.entries(TRANSIT_LINES)) {
      const hasStation = lineData.stations.some(
        s => !s.waypoint && s.name === stationName
      );
      if (hasStation) {
        lines.push(lineName);
      }
    }

    return lines;
  }

  async getStationsOnLine(lineName: string): Promise<Station[]> {
    const line = TRANSIT_LINES[lineName];
    if (!line) return [];

    return line.stations.filter(s => !s.waypoint);
  }

  async estimateTransitTime(from: Station, to: Station): Promise<TransitTimeEstimate> {
    // Find connecting lines
    const connections = await this.findConnectingLines(from, to);

    if (connections.direct.length > 0) {
      // Direct route - estimate based on station count
      const lineName = connections.direct[0];
      const line = TRANSIT_LINES[lineName];

      if (line) {
        const stations = line.stations.filter(s => !s.waypoint);
        const fromIdx = stations.findIndex(s => s.name === from.name);
        const toIdx = stations.findIndex(s => s.name === to.name);

        if (fromIdx !== -1 && toIdx !== -1) {
          const stationCount = Math.abs(toIdx - fromIdx);
          // Estimate 2-3 minutes per station for rail
          const duration = stationCount * 150; // 2.5 min average

          return {
            duration,
            transfers: 0,
            lines: [lineName],
            isEstimate: true
          };
        }
      }
    }

    if (connections.withTransfer.length > 0) {
      // Route with transfer
      const transfer = connections.withTransfer[0];

      // Rough estimate: calculate each leg + 5 min transfer time
      const transferStation: Station = {
        name: transfer.transferStation,
        lat: 0,
        lon: 0
      };

      // Find actual transfer station coords
      for (const lineData of Object.values(TRANSIT_LINES)) {
        const found = lineData.stations.find(s => s.name === transfer.transferStation);
        if (found) {
          transferStation.lat = found.lat;
          transferStation.lon = found.lon;
          break;
        }
      }

      const leg1 = await this.estimateTransitTime(from, transferStation);
      const leg2 = await this.estimateTransitTime(transferStation, to);

      return {
        duration: leg1.duration + 300 + leg2.duration, // 5 min transfer
        transfers: 1,
        lines: [transfer.line1, transfer.line2],
        isEstimate: true
      };
    }

    // Fallback: straight-line distance at 35 km/h
    const distance = this.haversineDistance(from.lat, from.lon, to.lat, to.lon);
    const duration = (distance / 35) * 3600;

    return {
      duration,
      transfers: 0,
      lines: [],
      isEstimate: true
    };
  }

  async findConnectingLines(from: Station, to: Station): Promise<{
    direct: string[];
    withTransfer: Array<{ line1: string; line2: string; transferStation: string }>;
  }> {
    const fromLines = await this.getLinesServingStation(from.name);
    const toLines = await this.getLinesServingStation(to.name);

    // Check for direct connections
    const direct = fromLines.filter(line => toLines.includes(line));

    // Check for single-transfer connections
    const withTransfer: Array<{ line1: string; line2: string; transferStation: string }> = [];

    if (direct.length === 0) {
      for (const line1 of fromLines) {
        const stations1 = await this.getStationsOnLine(line1);

        for (const line2 of toLines) {
          if (line1 === line2) continue;

          const stations2 = await this.getStationsOnLine(line2);

          // Find shared stations (transfer points)
          for (const s1 of stations1) {
            const shared = stations2.find(s2 => s2.name === s1.name);
            if (shared) {
              withTransfer.push({
                line1,
                line2,
                transferStation: shared.name
              });
              break; // One transfer point per line pair is enough
            }
          }
        }
      }
    }

    return { direct, withTransfer };
  }

  private haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }
}

// ============================================
// Future: Google Provider Implementation
// Placeholder for future Google Places/Transit API integration
// ============================================

// export class GoogleStationDataProvider implements StationDataProvider {
//   // TODO: Implement using Google Places API for stations
//   // and Google Directions API for transit times
// }

// ============================================
// Default Provider Instance
// Easy to swap implementation later
// ============================================

let currentProvider: StationDataProvider = new LocalStationDataProvider();

export function getStationDataProvider(): StationDataProvider {
  return currentProvider;
}

export function setStationDataProvider(provider: StationDataProvider): void {
  currentProvider = provider;
}
