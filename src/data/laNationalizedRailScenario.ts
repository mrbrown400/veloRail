import {
  NATIONALIZED_RAIL_PASSENGER_CONVERSION_DATASET,
  SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET
} from './transitProposalSources';

export interface NationalizedRailScenario {
  id: string;
  name: string;
  description: string;
  status: 'review_scenario';
  disclaimer: string;
  includedProposalIds: string[];
  excludedProposalIds: string[];
  rationale: string[];
  limitations: string[];
  sourceDatasetUpdatedAt: string;
}

export const INITIAL_LA_NATIONALIZED_RAIL_SCENARIO: NationalizedRailScenario = {
  id: 'initial-la-nationalized-rail-scenario',
  name: 'Initial LA Nationalized Rail Passenger Conversion Scenario',
  description: 'A bounded first review scenario made from generated converted-passenger records over sourced LA freight corridors.',
  status: 'review_scenario',
  disclaimer: 'Hypothetical nationalized-rail planning scenario. Not approved Metro, Metrolink, railroad, port, or public agency service.',
  includedProposalIds: NATIONALIZED_RAIL_PASSENGER_CONVERSION_DATASET.proposals.map((proposal) => proposal.id),
  excludedProposalIds: SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET.proposals
    .filter((proposal) => !proposal.freight?.conversionScenarios?.length)
    .map((proposal) => proposal.id),
  rationale: [
    'Start with corridors that already have explicit conversion scenarios and station assumptions.',
    'Keep freight-only port terminal trackage as context unless a later sourced passenger concept targets it.',
    'Use suitability scores as triage signals, not feasibility findings.'
  ],
  limitations: [
    'No freight capacity, dispatching, grade-crossing, cost, demand, or governance analysis is included.',
    'Station anchors are placeholders for map review and are not sourced station plans.',
    'The scenario is reviewable planning data and must not be rendered or described as official service.'
  ],
  sourceDatasetUpdatedAt: SCORED_LA_FREIGHT_RAIL_CORRIDOR_DATASET.updatedAt
};
