import { TRANSIT_PROPOSAL_DATASET } from './transitProposals';
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
  }
] satisfies readonly TransitProposalSourceFile[];

export const IMPORTED_TRANSIT_PROPOSALS: TransitProposalImportResult = importTransitProposalSources(
  TRANSIT_PROPOSAL_SOURCE_FILES,
  { sourceName: 'default transit proposal source manifest' }
);
