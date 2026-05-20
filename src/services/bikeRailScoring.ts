import type { ProposalCoordinate } from '@/types/proposals';
import type {
  CandidatePlanningScore,
  CandidateRouteScoringInput
} from './populationDensityScoring';

export const BIKE_RAIL_SCORING_POLICY = {
  method: 'vr-502-bike-rail-access-heuristic-v1',
  googleApiUse: 'No live Google Bicycling or Routes calls are made in the deterministic test path. Google Maps Bicycling can inform a future reviewed refresh.',
  missingData: [
    'protected bike lane network',
    'low-stress bike network',
    'station bike parking',
    'intersection safety',
    'segment-level elevation',
    'Google Bicycling travel times'
  ]
} as const;

export function scoreBikeRailAccessForRoute(
  input: CandidateRouteScoringInput
): CandidatePlanningScore {
  const stationSpacingKm = input.distanceKm / Math.max(input.stationCount - 1, 1);
  const stationSpacingScore = stationSpacingKm <= 8
    ? 34
    : stationSpacingKm <= 16
      ? 24
      : 12;
  const endpointUrbanScore = countUrbanEndpoints(input.geometry) * 12;
  const shortAccessScore = input.stationCount >= 3 ? 18 : 10;
  const distancePenalty = input.distanceKm > 80 ? -8 : 0;
  const score = clampScore(stationSpacingScore + endpointUrbanScore + shortAccessScore + distancePenalty);

  return {
    score,
    rating: ratingForScore(score),
    method: BIKE_RAIL_SCORING_POLICY.method,
    source: 'VeloRail station-spacing and urban-anchor heuristic; live Google Bicycling and local low-stress network data are documented follow-ups.',
    factors: [
      `Station spacing is approximately ${stationSpacingKm.toFixed(1)} km.`,
      `${countUrbanEndpoints(input.geometry)} route endpoints or anchors fall in dense urban LA bounds.`,
      `${input.stationCount} station anchors are available for bike-transfer review.`
    ],
    missingData: [...BIKE_RAIL_SCORING_POLICY.missingData],
    notes: 'Approximate bike-rail score for prioritizing review. It does not replace low-stress network, elevation, safety, or Google Bicycling analysis.'
  };
}

function countUrbanEndpoints(coordinates: ProposalCoordinate[]): number {
  const anchors = [coordinates[0], coordinates[coordinates.length - 1]].filter(Boolean);

  return anchors.filter(([lon, lat]) => (
    lon >= -118.35
    && lon <= -118.15
    && lat >= 33.72
    && lat <= 34.12
  )).length;
}

function ratingForScore(score: number): CandidatePlanningScore['rating'] {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
