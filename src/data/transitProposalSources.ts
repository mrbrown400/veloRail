import { TRANSIT_PROPOSAL_DATASET } from './transitProposals';
import {
  OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY,
  OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS,
  OFFICIAL_LA_FUTURE_TRANSIT_DATASET
} from './officialFutureTransitProposals';
import {
  VISIONARY_TRANSIT_PROPOSAL_DATASET,
  VISIONARY_TRANSIT_PROPOSAL_REGISTRY_POLICY
} from './visionaryTransitProposals';
import { LA_FREIGHT_RAIL_CORRIDOR_DATASET } from './laFreightRailCorridors';
import {
  importTransitProposalSources
} from './transitProposalImport';
import {
  FREIGHT_PASSENGER_CONVERSION_SOURCE_NAME,
  createFreightPassengerConversionDataset
} from '@/services/freightPassengerConversion';
import type {
  TransitProposalImportResult,
  TransitProposalSourceFile
} from './transitProposalImport';

export const OFFICIAL_FUTURE_TRANSIT_SOURCE_MANIFEST = {
  name: OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY.sourceName,
  dataset: OFFICIAL_LA_FUTURE_TRANSIT_DATASET,
  reviewPolicy: OFFICIAL_FUTURE_TRANSIT_REVIEW_POLICY,
  sourceWatchTargets: OFFICIAL_FUTURE_TRANSIT_SOURCE_WATCH_TARGETS
} as const;

export const VISIONARY_TRANSIT_SOURCE_MANIFEST = {
  name: VISIONARY_TRANSIT_PROPOSAL_REGISTRY_POLICY.sourceName,
  dataset: VISIONARY_TRANSIT_PROPOSAL_DATASET,
  registryPolicy: VISIONARY_TRANSIT_PROPOSAL_REGISTRY_POLICY
} as const;

export const NATIONALIZED_RAIL_PASSENGER_CONVERSION_DATASET =
  createFreightPassengerConversionDataset(LA_FREIGHT_RAIL_CORRIDOR_DATASET);

export const TRANSIT_PROPOSAL_SOURCE_FILES = [
  {
    name: 'seed-transit-proposals.v1.ts',
    dataset: TRANSIT_PROPOSAL_DATASET
  },
  {
    name: OFFICIAL_FUTURE_TRANSIT_SOURCE_MANIFEST.name,
    dataset: OFFICIAL_FUTURE_TRANSIT_SOURCE_MANIFEST.dataset
  },
  {
    name: VISIONARY_TRANSIT_SOURCE_MANIFEST.name,
    dataset: VISIONARY_TRANSIT_SOURCE_MANIFEST.dataset
  },
  {
    name: 'la-freight-rail-corridors.v1.ts',
    dataset: LA_FREIGHT_RAIL_CORRIDOR_DATASET
  },
  {
    name: FREIGHT_PASSENGER_CONVERSION_SOURCE_NAME,
    dataset: NATIONALIZED_RAIL_PASSENGER_CONVERSION_DATASET
  }
] satisfies readonly TransitProposalSourceFile[];

export const IMPORTED_TRANSIT_PROPOSALS: TransitProposalImportResult = importTransitProposalSources(
  TRANSIT_PROPOSAL_SOURCE_FILES,
  { sourceName: 'default transit proposal source manifest' }
);
