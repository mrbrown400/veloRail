import type {
  FreightCorridorSuitability,
  FreightSuitabilityFactor,
  ProposalCoordinate,
  TransitProposal,
  TransitProposalDataset
} from '@/types/proposals';

type SuitabilityFactorKey =
  | 'right-of-way continuity'
  | 'regional reach'
  | 'station potential'
  | 'passenger conversion evidence'
  | 'freight conflict risk'
  | 'electrification readiness';

interface SuitabilityFactorResult {
  key: SuitabilityFactorKey;
  earned: number;
  weight: number;
  effect: FreightSuitabilityFactor['effect'];
  note: string;
}

const SUITABILITY_FACTOR_WEIGHTS: Record<SuitabilityFactorKey, number> = {
  'right-of-way continuity': 25,
  'regional reach': 20,
  'station potential': 20,
  'passenger conversion evidence': 15,
  'freight conflict risk': 10,
  'electrification readiness': 10
};

export function applyFreightCorridorSuitabilityScores(
  dataset: TransitProposalDataset
): TransitProposalDataset {
  return {
    ...dataset,
    migrationNotes: [
      ...(dataset.migrationNotes ?? []),
      'VR-406 applies transparent heuristic freight-corridor suitability scores. Scores are planning triage only and do not imply passenger service feasibility.'
    ],
    proposals: dataset.proposals.map((proposal) => {
      if (!proposal.freight) return proposal;

      const suitability = scoreFreightCorridorSuitability(proposal);

      return {
        ...proposal,
        freight: {
          ...proposal.freight,
          suitability,
          suitabilityNotes: `VR-406 heuristic suitability score ${suitability.score}/100. ${suitability.notes}`
        }
      };
    })
  };
}

export function scoreFreightCorridorSuitability(
  proposal: TransitProposal
): FreightCorridorSuitability {
  const factorResults = [
    scoreRightOfWayContinuity(proposal),
    scoreRegionalReach(proposal),
    scoreStationPotential(proposal),
    scorePassengerConversionEvidence(proposal),
    scoreFreightConflictRisk(proposal),
    scoreElectrificationReadiness(proposal)
  ];
  const score = Math.round(factorResults.reduce((total, factor) => total + factor.earned, 0));

  return {
    rating: ratingForScore(score),
    score,
    method: 'vr-406-transparent-heuristic-v1',
    scoredAt: '2026-05-19',
    factors: factorResults.map(toFreightSuitabilityFactor),
    missingData: [
      'passenger demand',
      'employment density',
      'freight train volumes',
      'dispatching windows',
      'grade crossing inventory',
      'capital cost'
    ],
    notes: [
      'Transparent heuristic using only checked-in corridor metadata.',
      'Missing operational, ownership, ridership, grade-separation, and capital-cost data is penalized or marked unknown.',
      'Use this score for review prioritization, not as a feasibility finding.'
    ].join(' ')
  };
}

export function estimateProposalPathDistanceKm(proposal: TransitProposal): number {
  return estimateCoordinatePathDistanceKm(proposal.geometry.coordinates);
}

export function estimateCoordinatePathDistanceKm(coordinates: ProposalCoordinate[]): number {
  let totalKm = 0;

  for (let index = 1; index < coordinates.length; index += 1) {
    totalKm += haversineDistanceKm(coordinates[index - 1], coordinates[index]);
  }

  return Number(totalKm.toFixed(1));
}

function scoreRightOfWayContinuity(proposal: TransitProposal): SuitabilityFactorResult {
  const coordinateCount = proposal.geometry.coordinates.length;
  const hasApproximateOrBetterGeometry = proposal.geometry.geometrySource !== 'conceptual';
  const earned = coordinateCount >= 5 && hasApproximateOrBetterGeometry
    ? 22
    : coordinateCount >= 3
      ? 15
      : 8;

  return {
    key: 'right-of-way continuity',
    earned,
    weight: SUITABILITY_FACTOR_WEIGHTS['right-of-way continuity'],
    effect: earned >= 18 ? 'positive' : 'unknown',
    note: `${coordinateCount} checked-in geometry vertices; geometry is ${proposal.geometry.geometrySource ?? 'unspecified'}.`
  };
}

function scoreRegionalReach(proposal: TransitProposal): SuitabilityFactorResult {
  const distanceKm = estimateProposalPathDistanceKm(proposal);
  const earned = distanceKm >= 30
    ? 18
    : distanceKm >= 15
      ? 14
      : distanceKm >= 5
        ? 9
        : 4;

  return {
    key: 'regional reach',
    earned,
    weight: SUITABILITY_FACTOR_WEIGHTS['regional reach'],
    effect: earned >= 14 ? 'positive' : 'neutral',
    note: `Approximate overlay length is ${distanceKm} km.`
  };
}

function scoreStationPotential(proposal: TransitProposal): SuitabilityFactorResult {
  const scenarioStationAssumptions = (proposal.freight?.conversionScenarios ?? [])
    .reduce((total, scenario) => total + (scenario.stationAssumptions?.length ?? 0), 0);
  const explicitStations = proposal.stations?.length ?? 0;
  const stationSignals = explicitStations + scenarioStationAssumptions;
  const earned = stationSignals >= 3
    ? 16
    : stationSignals > 0
      ? 10
      : 3;

  return {
    key: 'station potential',
    earned,
    weight: SUITABILITY_FACTOR_WEIGHTS['station potential'],
    effect: stationSignals >= 3 ? 'positive' : 'unknown',
    note: `${stationSignals} station or station-assumption signals are available; detailed access and platform data is not.`
  };
}

function scorePassengerConversionEvidence(proposal: TransitProposal): SuitabilityFactorResult {
  const scenarioCount = proposal.freight?.conversionScenarios?.length ?? 0;
  const earned = scenarioCount > 0 ? 10 : 0;

  return {
    key: 'passenger conversion evidence',
    earned,
    weight: SUITABILITY_FACTOR_WEIGHTS['passenger conversion evidence'],
    effect: scenarioCount > 0 ? 'neutral' : 'unknown',
    note: scenarioCount > 0
      ? `${scenarioCount} VeloRail conversion scenario is recorded; no source establishes approved passenger service.`
      : 'No passenger conversion scenario is recorded in the checked-in dataset.'
  };
}

function scoreFreightConflictRisk(proposal: TransitProposal): SuitabilityFactorResult {
  const trackUsage = proposal.freight?.trackUsage ?? 'unknown';
  const earned = trackUsage === 'mixed'
    ? 6
    : trackUsage === 'freight'
      ? 3
      : trackUsage === 'passenger'
        ? 8
        : 2;

  return {
    key: 'freight conflict risk',
    earned,
    weight: SUITABILITY_FACTOR_WEIGHTS['freight conflict risk'],
    effect: trackUsage === 'freight' ? 'negative' : 'unknown',
    note: `Track usage is ${trackUsage}; dispatching windows, freight volumes, and ownership constraints are not modeled.`
  };
}

function scoreElectrificationReadiness(proposal: TransitProposal): SuitabilityFactorResult {
  const electrification = proposal.freight?.electrification ?? 'unknown';
  const earned = electrification === 'yes'
    ? 10
    : electrification === 'partial'
      ? 6
      : electrification === 'no'
        ? 2
        : 1;

  return {
    key: 'electrification readiness',
    earned,
    weight: SUITABILITY_FACTOR_WEIGHTS['electrification readiness'],
    effect: electrification === 'unknown' || electrification === 'no' ? 'unknown' : 'positive',
    note: `Electrification is ${electrification}; traction power and clearance needs are not assessed.`
  };
}

function toFreightSuitabilityFactor(factor: SuitabilityFactorResult): FreightSuitabilityFactor {
  return {
    factor: factor.key,
    effect: factor.effect,
    note: `Weight ${factor.earned}/${factor.weight}. ${factor.note}`
  };
}

function ratingForScore(score: number): FreightCorridorSuitability['rating'] {
  if (score >= 75) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

function haversineDistanceKm([startLon, startLat]: ProposalCoordinate, [endLon, endLat]: ProposalCoordinate): number {
  const radiusKm = 6371;
  const deltaLat = degreesToRadians(endLat - startLat);
  const deltaLon = degreesToRadians(endLon - startLon);
  const startLatRadians = degreesToRadians(startLat);
  const endLatRadians = degreesToRadians(endLat);
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(startLatRadians) * Math.cos(endLatRadians) * Math.sin(deltaLon / 2) ** 2;

  return 2 * radiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function degreesToRadians(value: number): number {
  return value * Math.PI / 180;
}
