import {
  PROPOSAL_CLASSIFICATIONS,
  PROPOSAL_STATUSES,
  PROPOSAL_UNCERTAINTY_LEVELS,
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from '@/types/proposals';
import type {
  ProposalClassificationCategory,
  ProposalCoordinate,
  ProposalSourceType,
  ProposalStatus,
  ProposalUncertaintyLevel,
  ProposalValidationIssue,
  ProposalValidationResult,
  TransitProposal,
  TransitProposalDataset
} from '@/types/proposals';

const VALID_STATUSES = new Set<string>(PROPOSAL_STATUSES);
const VALID_CLASSIFICATIONS = new Set<string>(PROPOSAL_CLASSIFICATIONS);
const VALID_UNCERTAINTY_LEVELS = new Set<string>(PROPOSAL_UNCERTAINTY_LEVELS);
const UNOFFICIAL_CLASSIFICATIONS = new Set<string>([
  'commentary_summary',
  'advocacy_derived',
  'speculative'
]);
const OFFICIAL_SOURCE_TYPES = new Set<string>([
  'official_project',
  'public_agency',
  'public_plan',
  'freight_owner'
]);
const OFFICIAL_FUTURE_STATUSES = new Set<string>([
  'operational',
  'planned',
  'under_construction',
  'funded'
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function addIssue(
  issues: ProposalValidationIssue[],
  path: string,
  code: ProposalValidationIssue['code'],
  message: string
) {
  issues.push({ path, code, message });
}

function hasText(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function hasFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidStatus(value: unknown): value is ProposalStatus {
  return typeof value === 'string' && VALID_STATUSES.has(value);
}

function isValidClassification(value: unknown): value is ProposalClassificationCategory {
  return typeof value === 'string' && VALID_CLASSIFICATIONS.has(value);
}

function isValidUncertaintyLevel(value: unknown): value is ProposalUncertaintyLevel {
  return typeof value === 'string' && VALID_UNCERTAINTY_LEVELS.has(value);
}

function getSourceTypes(record: Record<string, unknown>): Set<ProposalSourceType> {
  const sourceTypes = new Set<ProposalSourceType>();
  if (!Array.isArray(record.provenance)) return sourceTypes;

  record.provenance.forEach((source) => {
    if (isRecord(source) && hasText(source.sourceType)) {
      sourceTypes.add(source.sourceType as ProposalSourceType);
    }
  });

  return sourceTypes;
}

function hasSourceNote(record: Record<string, unknown>): boolean {
  if (!Array.isArray(record.provenance)) return false;

  return record.provenance.some(source => isRecord(source) && hasText(source.note));
}

function getLayerGroup(record: Record<string, unknown>): unknown {
  if (!isRecord(record.rendering)) return undefined;
  return record.rendering.layerGroup;
}

function validateLonLat(
  coordinate: unknown,
  path: string,
  issues: ProposalValidationIssue[]
): coordinate is ProposalCoordinate {
  if (!Array.isArray(coordinate) || coordinate.length !== 2) {
    addIssue(issues, path, 'invalid_coordinate', 'Coordinate must be a [lon, lat] tuple.');
    return false;
  }

  const [lon, lat] = coordinate;
  if (!hasFiniteNumber(lon) || lon < -180 || lon > 180) {
    addIssue(issues, `${path}[0]`, 'invalid_coordinate', 'Longitude must be a finite number between -180 and 180.');
    return false;
  }

  if (!hasFiniteNumber(lat) || lat < -90 || lat > 90) {
    addIssue(issues, `${path}[1]`, 'invalid_coordinate', 'Latitude must be a finite number between -90 and 90.');
    return false;
  }

  return true;
}

function validateGeometry(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const geometry = record.geometry;
  if (!isRecord(geometry)) {
    addIssue(issues, `${path}.geometry`, 'missing_geometry', 'Proposal geometry is required.');
    return;
  }

  if (geometry.type !== 'LineString') {
    addIssue(issues, `${path}.geometry.type`, 'invalid_geometry', 'Proposal geometry must be a LineString.');
  }

  if (!Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    addIssue(issues, `${path}.geometry.coordinates`, 'invalid_geometry', 'LineString geometry requires at least two coordinates.');
    return;
  }

  geometry.coordinates.forEach((coordinate, index) => {
    validateLonLat(coordinate, `${path}.geometry.coordinates[${index}]`, issues);
  });
}

function validateProvenance(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const provenance = record.provenance;
  if (!Array.isArray(provenance) || provenance.length === 0) {
    addIssue(issues, `${path}.provenance`, 'missing_provenance', 'At least one source attribution is required.');
    return;
  }

  provenance.forEach((source, index) => {
    const sourcePath = `${path}.provenance[${index}]`;
    if (!isRecord(source)) {
      addIssue(issues, sourcePath, 'invalid_provenance', 'Source attribution must be an object.');
      return;
    }

    if (!hasText(source.sourceId)) {
      addIssue(issues, `${sourcePath}.sourceId`, 'invalid_provenance', 'Source attribution requires a sourceId.');
    }

    if (!hasText(source.title)) {
      addIssue(issues, `${sourcePath}.title`, 'invalid_provenance', 'Source attribution requires a title.');
    }

    if (!hasText(source.sourceType)) {
      addIssue(issues, `${sourcePath}.sourceType`, 'invalid_provenance', 'Source attribution requires a sourceType.');
    }
  });
}

function validateUncertainty(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
): ProposalUncertaintyLevel | undefined {
  const uncertainty = record.uncertainty;

  if (!isRecord(uncertainty)) {
    addIssue(issues, `${path}.uncertainty`, 'missing_uncertainty', 'Proposal uncertainty metadata is required.');
    return undefined;
  }

  if (!isValidUncertaintyLevel(uncertainty.level)) {
    addIssue(
      issues,
      `${path}.uncertainty.level`,
      'invalid_uncertainty',
      `Uncertainty level must be one of: ${PROPOSAL_UNCERTAINTY_LEVELS.join(', ')}.`
    );
  }

  if (!hasText(uncertainty.sourceNotes)) {
    addIssue(
      issues,
      `${path}.uncertainty.sourceNotes`,
      'invalid_uncertainty',
      'Uncertainty metadata requires source notes.'
    );
  }

  return isValidUncertaintyLevel(uncertainty.level) ? uncertainty.level : undefined;
}

function validateClassification(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const classification = record.classification;
  const uncertaintyLevel = validateUncertainty(record, path, issues);
  const layerGroup = getLayerGroup(record);
  const sourceTypes = getSourceTypes(record);
  const status = record.status;

  if (classification === undefined) {
    addIssue(issues, `${path}.classification`, 'missing_classification', 'Proposal classification is required.');
    return;
  }

  if (!isValidClassification(classification)) {
    addIssue(
      issues,
      `${path}.classification`,
      'invalid_classification',
      `Proposal classification must be one of: ${PROPOSAL_CLASSIFICATIONS.join(', ')}.`
    );
    return;
  }

  if (classification === 'official') {
    const hasOfficialSource = Array.from(sourceTypes).some(sourceType => OFFICIAL_SOURCE_TYPES.has(sourceType));
    if (!hasOfficialSource) {
      addIssue(
        issues,
        `${path}.classification`,
        'invalid_classification',
        'Official proposals require an official, public agency, public plan, or freight owner source.'
      );
    }
  }

  if (classification === 'commentary_summary' && !sourceTypes.has('commentary')) {
    addIssue(
      issues,
      `${path}.classification`,
      'invalid_classification',
      'Commentary-summary proposals require at least one commentary source.'
    );
  }

  if (classification === 'advocacy_derived' && !sourceTypes.has('advocacy')) {
    addIssue(
      issues,
      `${path}.classification`,
      'invalid_classification',
      'Advocacy-derived proposals require at least one advocacy source.'
    );
  }

  if (layerGroup === 'future' && classification !== 'official') {
    addIssue(
      issues,
      `${path}.rendering.layerGroup`,
      'invalid_layer_classification',
      'The official future layer only accepts official proposal records.'
    );
  }

  if (classification === 'official' && (status === 'vision' || status === 'concept' || layerGroup === 'visionary')) {
    addIssue(
      issues,
      `${path}.classification`,
      'invalid_layer_classification',
      'Visionary or concept records cannot use the official classification.'
    );
  }

  if (UNOFFICIAL_CLASSIFICATIONS.has(classification)) {
    if (OFFICIAL_FUTURE_STATUSES.has(String(status))) {
      addIssue(
        issues,
        `${path}.status`,
        'invalid_layer_classification',
        'Unofficial proposal classifications must not use official future or operational statuses.'
      );
    }

    if (uncertaintyLevel === 'none') {
      addIssue(
        issues,
        `${path}.uncertainty.level`,
        'invalid_uncertainty',
        'Unofficial proposals must carry a non-none uncertainty level.'
      );
    }

    if (!hasSourceNote(record)) {
      addIssue(
        issues,
        `${path}.provenance`,
        'invalid_provenance',
        'Unofficial proposals require at least one provenance note explaining how the concept was derived.'
      );
    }
  }
}

function validateStations(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  if (record.stations === undefined) return;

  if (!Array.isArray(record.stations)) {
    addIssue(issues, `${path}.stations`, 'invalid_station', 'Stations must be an array when provided.');
    return;
  }

  record.stations.forEach((station, index) => {
    const stationPath = `${path}.stations[${index}]`;
    if (!isRecord(station)) {
      addIssue(issues, stationPath, 'invalid_station', 'Station must be an object.');
      return;
    }

    if (!hasText(station.id)) {
      addIssue(issues, `${stationPath}.id`, 'invalid_station', 'Station requires an id.');
    }

    if (!hasText(station.name)) {
      addIssue(issues, `${stationPath}.name`, 'invalid_station', 'Station requires a name.');
    }

    if (!hasFiniteNumber(station.lat) || station.lat < -90 || station.lat > 90) {
      addIssue(issues, `${stationPath}.lat`, 'invalid_station', 'Station latitude must be a finite number between -90 and 90.');
    }

    if (!hasFiniteNumber(station.lon) || station.lon < -180 || station.lon > 180) {
      addIssue(issues, `${stationPath}.lon`, 'invalid_station', 'Station longitude must be a finite number between -180 and 180.');
    }

    if (station.status !== undefined && !isValidStatus(station.status)) {
      addIssue(issues, `${stationPath}.status`, 'invalid_status', 'Station status is not supported.');
    }
  });
}

export function validateTransitProposalRecord(
  proposal: unknown,
  path = 'proposal'
): ProposalValidationResult {
  const issues: ProposalValidationIssue[] = [];

  if (!isRecord(proposal)) {
    addIssue(issues, path, 'invalid_dataset', 'Proposal must be an object.');
    return { valid: false, issues };
  }

  if (!hasText(proposal.id)) {
    addIssue(issues, `${path}.id`, 'missing_field', 'Proposal id is required.');
  }

  if (!hasText(proposal.name)) {
    addIssue(issues, `${path}.name`, 'missing_field', 'Proposal name is required.');
  }

  if (!hasText(proposal.kind)) {
    addIssue(issues, `${path}.kind`, 'missing_field', 'Proposal kind is required.');
  }

  if (proposal.status === undefined) {
    addIssue(issues, `${path}.status`, 'missing_status', 'Proposal status is required.');
  } else if (!isValidStatus(proposal.status)) {
    addIssue(issues, `${path}.status`, 'invalid_status', `Proposal status must be one of: ${PROPOSAL_STATUSES.join(', ')}.`);
  }

  if (!hasText(proposal.mode)) {
    addIssue(issues, `${path}.mode`, 'missing_field', 'Proposal mode is required.');
  }

  validateGeometry(proposal, path, issues);
  validateProvenance(proposal, path, issues);
  validateClassification(proposal, path, issues);
  validateStations(proposal, path, issues);

  return { valid: issues.length === 0, issues };
}

export function validateTransitProposalDataset(dataset: unknown): ProposalValidationResult {
  const issues: ProposalValidationIssue[] = [];

  if (!isRecord(dataset)) {
    addIssue(issues, 'dataset', 'invalid_dataset', 'Dataset must be an object.');
    return { valid: false, issues };
  }

  if (dataset.schemaVersion !== TRANSIT_PROPOSAL_SCHEMA_VERSION) {
    addIssue(issues, 'dataset.schemaVersion', 'invalid_dataset', `Dataset schemaVersion must be ${TRANSIT_PROPOSAL_SCHEMA_VERSION}.`);
  }

  if (!Array.isArray(dataset.proposals)) {
    addIssue(issues, 'dataset.proposals', 'invalid_dataset', 'Dataset proposals must be an array.');
    return { valid: false, issues };
  }

  dataset.proposals.forEach((proposal, index) => {
    const result = validateTransitProposalRecord(proposal, `dataset.proposals[${index}]`);
    issues.push(...result.issues);
  });

  return { valid: issues.length === 0, issues };
}

export function assertValidTransitProposalDataset(dataset: TransitProposalDataset): TransitProposalDataset {
  const result = validateTransitProposalDataset(dataset);
  if (!result.valid) {
    const details = result.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n');
    throw new Error(`Invalid transit proposal dataset:\n${details}`);
  }
  return dataset;
}

export function assertValidTransitProposal(proposal: TransitProposal): TransitProposal {
  const result = validateTransitProposalRecord(proposal);
  if (!result.valid) {
    const details = result.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n');
    throw new Error(`Invalid transit proposal:\n${details}`);
  }
  return proposal;
}
