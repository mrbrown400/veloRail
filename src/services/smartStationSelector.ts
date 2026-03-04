// Smart Station Selector for VeloRail
// Finds optimal origin/destination stations for bike+rail routes
// Designed to minimize total travel time: bike + wait + transit + bike

import { getStationDataProvider, type StationWithLine } from './stationDataProvider';
import { estimateBikeDuration, loadBikeSettings } from './bikeDurationService';
import type { Location, Station } from '@/types';

// ============================================
// Types
// ============================================

export interface StationCandidate {
  station: Station;
  line: string;
  lineColor: string;

  // Distances (km)
  bikeDistanceFromOrigin: number;
  bikeDistanceToDestination?: number;

  // Time estimates (seconds)
  bikeDurationFromOrigin: number;
  bikeDurationToDestination?: number;
  transitDuration?: number;
  estimatedWaitTime: number;

  // Total score (lower is better)
  score: number;
}

export interface StationPair {
  origin: StationCandidate;
  destination: StationCandidate;
  totalScore: number;

  // Breakdown
  bikeToDuration: number;
  transitDuration: number;
  bikeFromDuration: number;
  estimatedTotalTime: number;
}

export interface SelectionResult {
  topPairs: StationPair[];
  allOriginCandidates: StationCandidate[];
  allDestinationCandidates: StationCandidate[];
}

// ============================================
// Configuration
// ============================================

const CONFIG = {
  // Default wait time estimate (seconds) - updated with real data if available
  defaultWaitTime: 420, // 7 minutes average

  // Scoring weights (can be tuned)
  weights: {
    bikeDuration: 1.0,      // Full weight for bike time
    waitTime: 1.2,          // Slightly penalize waiting
    transitDuration: 1.0,   // Full weight for transit
    transferPenalty: 300,   // 5 min penalty per transfer
  }
};

// ============================================
// Wait Time Estimation
// ============================================

/**
 * Estimate wait time for a line at a station
 * Uses time of day and line frequency data
 *
 * Future: Replace with GTFS-RT real-time data
 */
function estimateWaitTime(line: string, _stationName: string, arrivalTime: Date): number {
  const hour = arrivalTime.getHours();
  const dayOfWeek = arrivalTime.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  // Rough frequency estimates by line type and time
  // Peak hours: 6-9 AM, 4-7 PM weekdays
  const isPeak = !isWeekend && ((hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19));

  // Base frequencies (minutes between trains)
  const lineFrequencies: Record<string, { peak: number; offPeak: number; weekend: number }> = {
    // Metro Rail
    'A Line': { peak: 6, offPeak: 12, weekend: 15 },
    'B Line': { peak: 4, offPeak: 10, weekend: 12 },
    'C Line': { peak: 6, offPeak: 12, weekend: 15 },
    'D Line': { peak: 4, offPeak: 10, weekend: 12 },
    'E Line': { peak: 6, offPeak: 12, weekend: 15 },
    'K Line': { peak: 8, offPeak: 15, weekend: 20 },

    // Metrolink (less frequent)
    'Antelope Valley Line': { peak: 30, offPeak: 60, weekend: 90 },
    'San Bernardino Line': { peak: 20, offPeak: 45, weekend: 60 },
    'Ventura County Line': { peak: 30, offPeak: 60, weekend: 90 },
    'Riverside Line': { peak: 30, offPeak: 60, weekend: 90 },
    'Orange County Line': { peak: 25, offPeak: 50, weekend: 75 },
    '91/Perris Valley Line': { peak: 30, offPeak: 60, weekend: 90 },
    'Inland Empire-Orange County Line': { peak: 45, offPeak: 90, weekend: 120 },
  };

  const freq = lineFrequencies[line];
  if (!freq) {
    // Unknown line, use default
    return CONFIG.defaultWaitTime;
  }

  let frequency: number;
  if (isWeekend) {
    frequency = freq.weekend;
  } else if (isPeak) {
    frequency = freq.peak;
  } else {
    frequency = freq.offPeak;
  }

  // Average wait is half the headway
  return (frequency / 2) * 60; // Convert to seconds
}

// ============================================
// Station Scoring
// ============================================

/**
 * Score a station as an origin (bike TO this station)
 */
function scoreOriginStation(
  station: StationWithLine,
  bikeDistanceKm: number,
  bikeDurationSec: number,
  arrivalTime: Date
): StationCandidate {
  const waitTime = estimateWaitTime(station.line, station.station.name, arrivalTime);

  // Score = weighted sum of bike time + wait time
  const score =
    CONFIG.weights.bikeDuration * bikeDurationSec +
    CONFIG.weights.waitTime * waitTime;

  return {
    station: station.station,
    line: station.line,
    lineColor: station.lineColor,
    bikeDistanceFromOrigin: bikeDistanceKm,
    bikeDurationFromOrigin: bikeDurationSec,
    estimatedWaitTime: waitTime,
    score
  };
}

/**
 * Score a station as a destination (bike FROM this station)
 */
function scoreDestinationStation(
  station: StationWithLine,
  bikeDistanceKm: number,
  bikeDurationSec: number
): StationCandidate {
  // For destination, score is just bike time (no wait)
  const score = CONFIG.weights.bikeDuration * bikeDurationSec;

  return {
    station: station.station,
    line: station.line,
    lineColor: station.lineColor,
    bikeDistanceFromOrigin: 0,
    bikeDurationFromOrigin: 0,
    bikeDistanceToDestination: bikeDistanceKm,
    bikeDurationToDestination: bikeDurationSec,
    estimatedWaitTime: 0,
    score
  };
}

/**
 * Score a station pair (origin + destination)
 */
async function scoreStationPair(
  origin: StationCandidate,
  destination: StationCandidate,
  _departureTime: Date
): Promise<StationPair | null> {
  const provider = getStationDataProvider();

  // Estimate transit time between stations
  const transitEstimate = await provider.estimateTransitTime(
    origin.station,
    destination.station
  );

  // Check if these stations are actually connected
  const connections = await provider.findConnectingLines(
    origin.station,
    destination.station
  );

  if (connections.direct.length === 0 && connections.withTransfer.length === 0) {
    // No connection found - skip this pair
    return null;
  }

  const transferCount = connections.direct.length > 0 ? 0 : 1;
  const transferPenalty = transferCount * CONFIG.weights.transferPenalty;

  const bikeToDuration = origin.bikeDurationFromOrigin;
  const transitDuration = transitEstimate.duration;
  const bikeFromDuration = destination.bikeDurationToDestination || 0;

  const totalScore =
    bikeToDuration +
    origin.estimatedWaitTime * CONFIG.weights.waitTime +
    transitDuration +
    bikeFromDuration +
    transferPenalty;

  const estimatedTotalTime = bikeToDuration + origin.estimatedWaitTime + transitDuration + bikeFromDuration;

  return {
    origin,
    destination,
    totalScore,
    bikeToDuration,
    transitDuration,
    bikeFromDuration,
    estimatedTotalTime
  };
}

// ============================================
// Main Selection Logic
// ============================================

/**
 * Find optimal station pair for a bike+rail journey
 *
 * Always uses the closest station to origin and destination.
 */
export async function selectOptimalStations(
  origin: Location,
  destination: Location,
  departureTime: Date
): Promise<SelectionResult> {
  const provider = getStationDataProvider();
  const bikeSettings = loadBikeSettings();

  console.log('Smart Station Selection:', {
    origin: `${origin.lat.toFixed(4)}, ${origin.lon.toFixed(4)}`,
    destination: `${destination.lat.toFixed(4)}, ${destination.lon.toFixed(4)}`,
    departureTime: departureTime.toISOString(),
    bikeSpeed: bikeSettings.baseSpeedKmh
  });

  // Find all stations sorted by distance, then pick the closest
  const nearOrigin = await provider.findStationsNear(origin);
  const nearDestination = await provider.findStationsNear(destination);

  if (nearOrigin.length === 0 || nearDestination.length === 0) {
    console.log('No stations found for bike+rail route');
    return {
      topPairs: [],
      allOriginCandidates: [],
      allDestinationCandidates: []
    };
  }

  // Use only the closest station to origin
  const closestOrigin = nearOrigin[0];
  const originBikeDistance = closestOrigin.distance || 0;
  const originBikeDuration = estimateBikeDuration(originBikeDistance, 0, bikeSettings);
  const arrivalTime = new Date(departureTime.getTime() + originBikeDuration * 1000);
  const originCandidate = scoreOriginStation(closestOrigin, originBikeDistance, originBikeDuration, arrivalTime);

  console.log(`Closest station to origin: ${closestOrigin.station.name} (${originBikeDistance.toFixed(1)}km)`);

  // Use only the closest station to destination
  const closestDest = nearDestination[0];
  const destBikeDistance = closestDest.distance || 0;
  const destBikeDuration = estimateBikeDuration(destBikeDistance, 0, bikeSettings);
  const destCandidate = scoreDestinationStation(closestDest, destBikeDistance, destBikeDuration);

  console.log(`Closest station to destination: ${closestDest.station.name} (${destBikeDistance.toFixed(1)}km)`);

  // Score the single pair
  const pairs: StationPair[] = [];
  if (originCandidate.station.name !== destCandidate.station.name) {
    const pair = await scoreStationPair(originCandidate, destCandidate, departureTime);
    if (pair) {
      pairs.push(pair);
    }
  }

  if (pairs.length > 0) {
    console.log('Selected pair:', {
      origin: pairs[0].origin.station.name,
      destination: pairs[0].destination.station.name,
      estimatedTime: `${Math.round(pairs[0].estimatedTotalTime / 60)} min`
    });
  }

  return {
    topPairs: pairs,
    allOriginCandidates: [originCandidate],
    allDestinationCandidates: [destCandidate]
  };
}

/**
 * Quick check if bike+rail is viable for this origin/destination
 */
export async function isBikeRailViable(
  origin: Location,
  destination: Location
): Promise<boolean> {
  const provider = getStationDataProvider();

  const nearOrigin = await provider.findStationsNear(origin);
  const nearDestination = await provider.findStationsNear(destination);

  return nearOrigin.length > 0 && nearDestination.length > 0;
}

/**
 * Get the single best station pair for routing
 * Convenience function when you just need the top recommendation
 */
export async function getBestStationPair(
  origin: Location,
  destination: Location,
  departureTime: Date
): Promise<StationPair | null> {
  const result = await selectOptimalStations(origin, destination, departureTime);
  return result.topPairs[0] || null;
}
