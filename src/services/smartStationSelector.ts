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
  // Search radius for stations (km)
  originSearchRadius: 8,      // Willing to bike up to 8km to a station
  destinationSearchRadius: 5, // Willing to bike up to 5km from station

  // Maximum candidates to consider at each stage
  maxOriginCandidates: 6,
  maxDestinationCandidates: 6,
  maxPairsToReturn: 3,

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
 * Find optimal station pairs for a bike+rail journey
 *
 * Algorithm:
 * 1. Find all rail stations near origin (user bikes TO these)
 * 2. Find all rail stations near destination (user bikes FROM these)
 * 3. Score origin stations based on bike time + wait time
 * 4. Score destination stations based on bike time
 * 5. Score all valid pairs (connected by rail)
 * 6. Return top N pairs for Google API routing
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

  // Step 1: Find stations near origin
  const nearOrigin = await provider.findStationsNear(origin, CONFIG.originSearchRadius);
  console.log(`Found ${nearOrigin.length} stations within ${CONFIG.originSearchRadius}km of origin`);

  // Step 2: Find stations near destination
  const nearDestination = await provider.findStationsNear(destination, CONFIG.destinationSearchRadius);
  console.log(`Found ${nearDestination.length} stations within ${CONFIG.destinationSearchRadius}km of destination`);

  if (nearOrigin.length === 0 || nearDestination.length === 0) {
    console.log('Not enough stations found for bike+rail route');
    return {
      topPairs: [],
      allOriginCandidates: [],
      allDestinationCandidates: []
    };
  }

  // Step 3: Score origin stations
  const originCandidates: StationCandidate[] = [];
  for (const station of nearOrigin.slice(0, CONFIG.maxOriginCandidates * 2)) {
    const bikeDistance = station.distance || 0;

    // Estimate bike duration using our physics model
    // Note: This is a rough estimate without actual route geometry
    // Google API will give us the real route and we'll recalculate
    const bikeDuration = estimateBikeDuration(
      bikeDistance,
      0, // No elevation data at this stage
      bikeSettings
    );

    const arrivalTime = new Date(departureTime.getTime() + bikeDuration * 1000);
    const candidate = scoreOriginStation(station, bikeDistance, bikeDuration, arrivalTime);
    originCandidates.push(candidate);
  }

  // Sort by score and take top candidates
  originCandidates.sort((a, b) => a.score - b.score);
  const topOrigins = originCandidates.slice(0, CONFIG.maxOriginCandidates);

  // Step 4: Score destination stations
  const destinationCandidates: StationCandidate[] = [];
  for (const station of nearDestination.slice(0, CONFIG.maxDestinationCandidates * 2)) {
    const bikeDistance = station.distance || 0;
    const bikeDuration = estimateBikeDuration(
      bikeDistance,
      0,
      bikeSettings
    );

    const candidate = scoreDestinationStation(station, bikeDistance, bikeDuration);
    destinationCandidates.push(candidate);
  }

  // Sort by score and take top candidates
  destinationCandidates.sort((a, b) => a.score - b.score);
  const topDestinations = destinationCandidates.slice(0, CONFIG.maxDestinationCandidates);

  // Step 5: Score all pairs
  const pairs: StationPair[] = [];
  for (const originCandidate of topOrigins) {
    for (const destCandidate of topDestinations) {
      // Skip if same station
      if (originCandidate.station.name === destCandidate.station.name) {
        continue;
      }

      const pair = await scoreStationPair(originCandidate, destCandidate, departureTime);
      if (pair) {
        pairs.push(pair);
      }
    }
  }

  // Sort pairs by total score
  pairs.sort((a, b) => a.totalScore - b.totalScore);

  console.log(`Evaluated ${pairs.length} station pairs`);
  if (pairs.length > 0) {
    console.log('Top pair:', {
      origin: pairs[0].origin.station.name,
      destination: pairs[0].destination.station.name,
      estimatedTime: `${Math.round(pairs[0].estimatedTotalTime / 60)} min`
    });
  }

  return {
    topPairs: pairs.slice(0, CONFIG.maxPairsToReturn),
    allOriginCandidates: originCandidates,
    allDestinationCandidates: destinationCandidates
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

  // Check if there are stations near both endpoints
  const nearOrigin = await provider.findStationsNear(origin, CONFIG.originSearchRadius);
  const nearDestination = await provider.findStationsNear(destination, CONFIG.destinationSearchRadius);

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
