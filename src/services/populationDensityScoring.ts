import type { ProposalCoordinate } from '@/types/proposals';

export interface CandidateRouteScoringInput {
  id: string;
  name: string;
  geometry: ProposalCoordinate[];
  distanceKm: number;
  stationCount: number;
}

export interface CandidatePlanningScore {
  score: number;
  rating: 'high' | 'medium' | 'low';
  method: string;
  source: string;
  factors: string[];
  missingData: string[];
  notes: string;
}

interface DensityMarket {
  id: string;
  label: string;
  bounds: {
    minLon: number;
    maxLon: number;
    minLat: number;
    maxLat: number;
  };
  points: number;
}

export const POPULATION_DENSITY_SOURCE_OPTIONS = [
  {
    id: 'census-acs-tract-density',
    name: 'U.S. Census ACS tract population density',
    status: 'recommended_followup',
    license: 'Public U.S. Census data',
    note: 'Use tract or block-group population counts for a future scored refresh; not bundled in this repo pass.'
  },
  {
    id: 'scag-employment-centers',
    name: 'SCAG regional employment or activity center data',
    status: 'recommended_followup',
    license: 'Check SCAG dataset-specific terms before import',
    note: 'Useful for employment access scoring once a source and license are selected.'
  }
] as const;

const DENSITY_MARKETS: DensityMarket[] = [
  {
    id: 'central-la',
    label: 'Central LA',
    bounds: { minLon: -118.33, maxLon: -118.15, minLat: 33.95, maxLat: 34.10 },
    points: 24
  },
  {
    id: 'south-la-gateway',
    label: 'South LA gateway',
    bounds: { minLon: -118.32, maxLon: -118.16, minLat: 33.86, maxLat: 33.98 },
    points: 18
  },
  {
    id: 'san-gabriel-valley',
    label: 'San Gabriel Valley',
    bounds: { minLon: -118.15, maxLon: -117.65, minLat: 33.98, maxLat: 34.12 },
    points: 16
  },
  {
    id: 'inland-empire',
    label: 'Inland Empire gateway',
    bounds: { minLon: -117.65, maxLon: -117.20, minLat: 33.95, maxLat: 34.15 },
    points: 14
  },
  {
    id: 'san-pedro-bay',
    label: 'San Pedro Bay port cities',
    bounds: { minLon: -118.31, maxLon: -118.18, minLat: 33.70, maxLat: 33.82 },
    points: 10
  }
];

export function scorePopulationDensityForRoute(
  input: CandidateRouteScoringInput
): CandidatePlanningScore {
  const matchedMarkets = DENSITY_MARKETS.filter((market) => routeTouchesMarket(input.geometry, market));
  const marketScore = Math.min(58, matchedMarkets.reduce((total, market) => total + market.points, 0));
  const stationDensityScore = Math.min(22, Math.round((input.stationCount / Math.max(input.distanceKm, 1)) * 180));
  const corridorLengthScore = input.distanceKm >= 15 && input.distanceKm <= 75
    ? 14
    : input.distanceKm > 75
      ? 8
      : 6;
  const score = clampScore(marketScore + stationDensityScore + corridorLengthScore);

  return {
    score,
    rating: ratingForScore(score),
    method: 'vr-501-market-anchor-heuristic-v1',
    source: 'VeloRail approximate market-anchor heuristic; Census/SCAG density import documented as follow-up.',
    factors: [
      `Matched markets: ${matchedMarkets.map((market) => market.label).join(', ') || 'none'}.`,
      `Station density signal: ${input.stationCount} station anchors over ${input.distanceKm} km.`,
      `Corridor length signal: ${input.distanceKm} km.`
    ],
    missingData: [
      'Census tract population density',
      'employment density',
      'walkshed population',
      'equity priority areas',
      'observed ridership'
    ],
    notes: 'Approximate screen for whether a candidate route touches broad LA population or job markets. It is not a demand forecast.'
  };
}

function routeTouchesMarket(coordinates: ProposalCoordinate[], market: DensityMarket): boolean {
  return coordinates.some(([lon, lat]) => (
    lon >= market.bounds.minLon
    && lon <= market.bounds.maxLon
    && lat >= market.bounds.minLat
    && lat <= market.bounds.maxLat
  ));
}

function ratingForScore(score: number): CandidatePlanningScore['rating'] {
  if (score >= 70) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
