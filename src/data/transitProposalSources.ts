import { TRANSIT_PROPOSAL_DATASET } from './transitProposals';
import { OFFICIAL_LA_FUTURE_TRANSIT_DATASET } from './officialFutureTransitProposals';
import { LA_FREIGHT_RAIL_CORRIDOR_DATASET } from './laFreightRailCorridors';
import {
  importTransitProposalSources
} from './transitProposalImport';
import type {
  TransitProposalImportResult,
  TransitProposalSourceFile
} from './transitProposalImport';

export const TRANSIT_PROPOSAL_SOURCE_FILES = [
  {
    name: 'seed-transit-proposals.v1.ts',
    dataset: TRANSIT_PROPOSAL_DATASET
  },
  {
    name: 'official-la-future-transit.v1.ts',
    dataset: OFFICIAL_LA_FUTURE_TRANSIT_DATASET
  },
  {
    name: 'la-freight-rail-corridors.v1.ts',
    dataset: LA_FREIGHT_RAIL_CORRIDOR_DATASET
  }
] satisfies readonly TransitProposalSourceFile[];

export const IMPORTED_TRANSIT_PROPOSALS: TransitProposalImportResult = importTransitProposalSources(
  TRANSIT_PROPOSAL_SOURCE_FILES,
  { sourceName: 'default transit proposal source manifest' }
);
