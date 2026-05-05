import {
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  ProposalMarkerInput,
  ProposalPolylineInput,
  ProposalValidationIssue,
  TransitProposal,
  TransitProposalDataset,
  TransitProposalSchemaVersion
} from '@/types/proposals';
import { proposalDatasetToGoogleMapInputs } from './transitProposals';
import { validateTransitProposalDataset } from './transitProposalValidation';

export const TRANSIT_PROPOSAL_IMPORT_FORMAT_VERSION: TransitProposalSchemaVersion = TRANSIT_PROPOSAL_SCHEMA_VERSION;

export interface TransitProposalSourceFile {
  name: string;
  dataset: unknown;
}

export interface TransitProposalOverlayInput {
  proposal: TransitProposal;
  polyline: ProposalPolylineInput;
  markers: ProposalMarkerInput[];
}

export interface TransitProposalImportOptions {
  sourceName?: string;
}

export interface TransitProposalImportResult {
  sourceName: string;
  schemaVersion: TransitProposalSchemaVersion;
  dataset: TransitProposalDataset;
  overlays: TransitProposalOverlayInput[];
}

export class TransitProposalImportError extends Error {
  readonly sourceName: string;
  readonly issues: ProposalValidationIssue[];

  constructor(sourceName: string, issues: ProposalValidationIssue[]) {
    super(`Invalid transit proposal source "${sourceName}":\n${formatTransitProposalImportIssues(issues)}`);
    this.name = 'TransitProposalImportError';
    this.sourceName = sourceName;
    this.issues = issues;
    Object.setPrototypeOf(this, TransitProposalImportError.prototype);
  }
}

export function formatTransitProposalImportIssues(issues: ProposalValidationIssue[]) {
  if (issues.length === 0) {
    return 'No validation issues.';
  }

  return issues.map(issue => `- ${issue.path} (${issue.code}): ${issue.message}`).join('\n');
}

export function importTransitProposalDataset(
  source: unknown,
  options: TransitProposalImportOptions = {}
): TransitProposalImportResult {
  const sourceName = options.sourceName ?? 'transit proposal source';
  const validation = validateTransitProposalDataset(source);

  if (!validation.valid) {
    throw new TransitProposalImportError(sourceName, validation.issues);
  }

  const dataset = source as TransitProposalDataset;

  return {
    sourceName,
    schemaVersion: dataset.schemaVersion,
    dataset,
    overlays: proposalDatasetToGoogleMapInputs(dataset)
  };
}

export function importTransitProposalSources(
  sourceFiles: readonly TransitProposalSourceFile[],
  options: TransitProposalImportOptions = {}
): TransitProposalImportResult {
  if (sourceFiles.length === 0) {
    throw new TransitProposalImportError(options.sourceName ?? 'transit proposal sources', [
      {
        path: 'sources',
        code: 'invalid_dataset',
        message: 'At least one transit proposal source file is required.'
      }
    ]);
  }

  const datasets = sourceFiles.map(sourceFile => {
    try {
      return importTransitProposalDataset(sourceFile.dataset, { sourceName: sourceFile.name }).dataset;
    } catch (error) {
      if (error instanceof TransitProposalImportError) {
        throw error;
      }
      throw error;
    }
  });

  const mergedDataset: TransitProposalDataset = {
    schemaVersion: TRANSIT_PROPOSAL_IMPORT_FORMAT_VERSION,
    updatedAt: latestUpdatedAt(datasets),
    migrationNotes: mergeMigrationNotes(datasets),
    proposals: datasets.flatMap(dataset => dataset.proposals)
  };

  return importTransitProposalDataset(mergedDataset, {
    sourceName: options.sourceName ?? 'merged transit proposal sources'
  });
}

function latestUpdatedAt(datasets: TransitProposalDataset[]) {
  const sortedDates = datasets.map(dataset => dataset.updatedAt).sort();
  return sortedDates[sortedDates.length - 1] ?? datasets[0].updatedAt;
}

function mergeMigrationNotes(datasets: TransitProposalDataset[]) {
  const notes = new Set<string>();

  for (const dataset of datasets) {
    for (const note of dataset.migrationNotes ?? []) {
      notes.add(note);
    }
  }

  return Array.from(notes);
}
