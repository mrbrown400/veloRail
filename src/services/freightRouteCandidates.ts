import type {
  ProposalCoordinate,
  TransitProposal,
  TransitProposalDataset
} from '@/types/proposals';
import {
  estimateCoordinatePathDistanceKm,
  estimateProposalPathDistanceKm
} from './freightCorridorSuitability';
import {
  scorePopulationDensityForRoute,
  type CandidatePlanningScore
} from './populationDensityScoring';
import {
  scoreBikeRailAccessForRoute
} from './bikeRailScoring';

export interface FreightCorridorGraphNode {
  id: string;
  proposalId: string;
  role: 'start' | 'middle' | 'end';
  name: string;
  coordinate: ProposalCoordinate;
}

export interface FreightCorridorGraphEdge {
  id: string;
  proposalId: string;
  fromNodeId: string;
  toNodeId: string;
  distanceKm: number;
}

export interface FreightCorridorGraph {
  nodes: FreightCorridorGraphNode[];
  edges: FreightCorridorGraphEdge[];
}

export interface FreightPassengerRouteCandidate {
  id: string;
  sourceFreightCorridorId: string;
  name: string;
  startNodeId: string;
  endNodeId: string;
  distanceKm: number;
  stationCount: number;
  score: number;
  populationDensityScore: CandidatePlanningScore;
  bikeAccessScore: CandidatePlanningScore;
  reviewStatus: 'needs_review';
  canRender: boolean;
  geometry: ProposalCoordinate[];
  assumptions: string[];
  limitations: string[];
}

export interface FreightPassengerRouteCandidateSet {
  generatedAt: string;
  graph: FreightCorridorGraph;
  candidates: FreightPassengerRouteCandidate[];
  reviewWorkflow: string[];
}

const GENERATED_AT = '2026-05-19';

export function buildFreightCorridorGraph(
  dataset: TransitProposalDataset
): FreightCorridorGraph {
  const nodes: FreightCorridorGraphNode[] = [];
  const edges: FreightCorridorGraphEdge[] = [];

  for (const proposal of dataset.proposals) {
    if (!proposal.freight || proposal.geometry.coordinates.length < 2) continue;

    const proposalNodes = buildNodesForProposal(proposal);
    nodes.push(...proposalNodes);

    for (let index = 1; index < proposalNodes.length; index += 1) {
      const fromNode = proposalNodes[index - 1];
      const toNode = proposalNodes[index];
      edges.push({
        id: `${proposal.id}-edge-${index}`,
        proposalId: proposal.id,
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        distanceKm: estimateCoordinatePathDistanceKm([
          fromNode.coordinate,
          toNode.coordinate
        ])
      });
    }
  }

  return { nodes, edges };
}

export function generateFreightPassengerRouteCandidates(
  dataset: TransitProposalDataset
): FreightPassengerRouteCandidateSet {
  const graph = buildFreightCorridorGraph(dataset);
  const candidates = dataset.proposals
    .filter((proposal) => Boolean(proposal.freight))
    .flatMap((proposal) => buildCandidateForProposal(proposal));

  return {
    generatedAt: GENERATED_AT,
    graph,
    candidates,
    reviewWorkflow: [
      'Keep generated routes in needs_review status until a human accepts the corridor, station, and source assumptions.',
      'Review freight ownership, dispatching, passenger access, grade crossings, and capital constraints before promoting a candidate into an overlay scenario.',
      'Render only candidates that have explicit geometry and station assumptions; never mark generated candidates as official service.'
    ]
  };
}

function buildNodesForProposal(proposal: TransitProposal): FreightCorridorGraphNode[] {
  const coordinates = proposal.geometry.coordinates;
  const middleIndex = Math.floor((coordinates.length - 1) / 2);
  const nodeSpecs = [
    { role: 'start' as const, index: 0 },
    { role: 'middle' as const, index: middleIndex },
    { role: 'end' as const, index: coordinates.length - 1 }
  ];

  return nodeSpecs.map((nodeSpec) => ({
    id: `${proposal.id}-${nodeSpec.role}`,
    proposalId: proposal.id,
    role: nodeSpec.role,
    name: `${proposal.shortName ?? proposal.name} ${nodeSpec.role}`,
    coordinate: coordinates[nodeSpec.index]
  }));
}

function buildCandidateForProposal(
  proposal: TransitProposal
): FreightPassengerRouteCandidate[] {
  const conversionScenario = proposal.freight?.conversionScenarios?.[0];
  if (!conversionScenario || proposal.geometry.coordinates.length < 2) return [];

  const distanceKm = estimateProposalPathDistanceKm(proposal);
  const stationSignals = conversionScenario.stationAssumptions?.length ?? 0;
  const suitabilityScore = proposal.freight?.suitability?.score ?? 0;
  const scoringInput = {
    id: `${conversionScenario.id}-candidate-route`,
    name: `${conversionScenario.name} review candidate`,
    geometry: proposal.geometry.coordinates,
    distanceKm,
    stationCount: Math.max(2, stationSignals)
  };
  const populationDensityScore = scorePopulationDensityForRoute(scoringInput);
  const bikeAccessScore = scoreBikeRailAccessForRoute(scoringInput);
  const score = Math.min(100, Math.round(
    (suitabilityScore * 0.6)
    + (populationDensityScore.score * 0.2)
    + (bikeAccessScore.score * 0.2)
  ));

  return [{
    id: scoringInput.id,
    sourceFreightCorridorId: proposal.id,
    name: scoringInput.name,
    startNodeId: `${proposal.id}-start`,
    endNodeId: `${proposal.id}-end`,
    distanceKm,
    stationCount: scoringInput.stationCount,
    score,
    populationDensityScore,
    bikeAccessScore,
    reviewStatus: 'needs_review',
    canRender: true,
    geometry: proposal.geometry.coordinates.map(([lon, lat]) => [lon, lat]),
    assumptions: [
      ...conversionScenario.assumptions,
      ...(conversionScenario.stationAssumptions ?? [])
    ],
    limitations: [
      'Generated from checked-in freight corridor topology, not from live railroad operations.',
      'Station count is based on scenario assumptions and placeholder anchors.',
      'Candidate score combines heuristic suitability with station-assumption coverage; it is not demand modeling.'
    ]
  }];
}
