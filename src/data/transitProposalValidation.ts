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
const OFFICIAL_FUTURE_RENDERABLE_STATUSES = new Set<string>([
  'planned',
  'under_construction',
  'funded'
]);
const VISIONARY_RENDERABLE_STATUSES = new Set<string>([
  'vision',
  'concept'
]);
const VISIONARY_REGISTRY_SOURCE_TYPES = new Set<string>([
  'advocacy',
  'commentary',
  'internal_example',
  'other'
]);
const VISIONARY_GEOMETRY_SOURCES = new Set<string>([
  'approximate',
  'conceptual'
]);
const OFFICIAL_FUTURE_REQUIRED_DRIFT_CHECKS = new Set<string>([
  'project_status',
  'opening_year',
  'station_list',
  'source_url'
]);
const DEFAULT_OFFICIAL_FUTURE_MAX_AGE_DAYS = 120;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const VALID_KINDS = new Set<string>(['line', 'corridor']);
const VALID_MODES = new Set<string>([
  'heavy_rail',
  'light_rail',
  'brt',
  'commuter_rail',
  'intercity_rail',
  'people_mover',
  'freight_rail',
  'mixed_rail',
  'unknown'
]);
const VALID_SOURCE_TYPES = new Set<string>([
  'official_project',
  'public_agency',
  'public_plan',
  'freight_owner',
  'advocacy',
  'commentary',
  'internal_example',
  'other'
]);
const VALID_CONFIDENCE_LEVELS = new Set<string>([
  'official',
  'high',
  'medium',
  'low',
  'unknown'
]);
const MACHINE_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const FREIGHT_METADATA_STATUSES = new Set(['freight_only', 'converted_passenger']);
const FREIGHT_LAYER_GROUPS = new Set(['freight', 'converted_passenger']);
const FREIGHT_TRACK_USAGES = new Set(['freight', 'passenger', 'mixed', 'unknown']);
const FREIGHT_ELECTRIFICATION_STATUSES = new Set(['yes', 'no', 'partial', 'unknown']);
const FREIGHT_SUITABILITY_RATINGS = new Set(['high', 'medium', 'low', 'unknown']);
const FREIGHT_SUITABILITY_EFFECTS = new Set(['positive', 'negative', 'neutral', 'unknown']);
const FREIGHT_CONVERSION_TARGET_MODES = new Set([
  'heavy_rail',
  'light_rail',
  'brt',
  'commuter_rail',
  'intercity_rail',
  'people_mover',
  'mixed_rail'
]);

export type OfficialFutureTransitDriftCheck =
  | 'project_status'
  | 'opening_year'
  | 'phase'
  | 'station_list'
  | 'source_url'
  | 'geometry_notes';

export interface OfficialFutureTransitSourceWatchTarget {
  proposalId: string;
  sourceId: string;
  label: string;
  publisher: string;
  sourceType: ProposalSourceType;
  url: string;
  lastReviewedAt: string;
  nextReviewDue: string;
  reviewCadenceDays: number;
  driftChecks: readonly OfficialFutureTransitDriftCheck[];
  note?: string;
}

export interface OfficialFutureTransitValidationOptions {
  asOf?: string;
  maxSourceAgeDays?: number;
}

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

function isTextArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => hasText(item));
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

function isGoogleMapsSourceUrl(value: unknown): boolean {
  if (!hasText(value)) return false;

  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    return (
      hostname === 'maps.google.com'
      || hostname.endsWith('.maps.google.com')
      || (hostname.startsWith('www.google.') && pathname.startsWith('/maps'))
      || (hostname.startsWith('google.') && pathname.startsWith('/maps'))
    );
  } catch {
    return /(?:^|\/\/)(?:www\.)?google\.[^/]+\/maps|(?:^|\/\/)maps\.google\./i.test(value);
  }
}

function validateMachineId(
  value: unknown,
  path: string,
  issues: ProposalValidationIssue[],
  label: string,
  code: ProposalValidationIssue['code']
): value is string {
  if (!hasText(value)) {
    addIssue(issues, path, code, `${label} is required.`);
    return false;
  }

  if (!MACHINE_ID_PATTERN.test(value)) {
    addIssue(issues, path, code, `${label} must use lowercase kebab-case letters, numbers, and hyphens.`);
    return false;
  }

  return true;
}

function validateIsoDate(
  value: unknown,
  path: string,
  issues: ProposalValidationIssue[],
  label: string,
  code: ProposalValidationIssue['code']
) {
  if (!hasText(value) || !ISO_DATE_PATTERN.test(value)) {
    addIssue(issues, path, code, `${label} must use YYYY-MM-DD format.`);
  }
}

function isoDateToUtcTime(value: string): number | undefined {
  if (!ISO_DATE_PATTERN.test(value)) return undefined;

  const time = Date.parse(`${value}T00:00:00.000Z`);
  return Number.isFinite(time) ? time : undefined;
}

function daysBetweenIsoDates(startDate: string, endDate: string): number | undefined {
  const startTime = isoDateToUtcTime(startDate);
  const endTime = isoDateToUtcTime(endDate);
  if (startTime === undefined || endTime === undefined) return undefined;

  return Math.floor((endTime - startTime) / MILLISECONDS_PER_DAY);
}

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
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

  const sourceIds = new Set<string>();
  provenance.forEach((source, index) => {
    const sourcePath = `${path}.provenance[${index}]`;
    if (!isRecord(source)) {
      addIssue(issues, sourcePath, 'invalid_provenance', 'Source attribution must be an object.');
      return;
    }

    if (validateMachineId(source.sourceId, `${sourcePath}.sourceId`, issues, 'Source attribution sourceId', 'invalid_provenance')) {
      if (sourceIds.has(source.sourceId)) {
        addIssue(issues, `${sourcePath}.sourceId`, 'invalid_provenance', `Duplicate sourceId "${source.sourceId}" in proposal provenance.`);
      }
      sourceIds.add(source.sourceId);
    }

    if (!hasText(source.title)) {
      addIssue(issues, `${sourcePath}.title`, 'invalid_provenance', 'Source attribution requires a title.');
    }

    if (!hasText(source.sourceType)) {
      addIssue(issues, `${sourcePath}.sourceType`, 'invalid_provenance', 'Source attribution requires a sourceType.');
    } else if (!VALID_SOURCE_TYPES.has(source.sourceType)) {
      addIssue(issues, `${sourcePath}.sourceType`, 'invalid_provenance', 'Source attribution sourceType is not supported.');
    }

    if (source.accessedAt !== undefined) {
      validateIsoDate(source.accessedAt, `${sourcePath}.accessedAt`, issues, 'Source accessedAt', 'invalid_provenance');
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

  const stationIds = new Set<string>();
  record.stations.forEach((station, index) => {
    const stationPath = `${path}.stations[${index}]`;
    if (!isRecord(station)) {
      addIssue(issues, stationPath, 'invalid_station', 'Station must be an object.');
      return;
    }

    if (validateMachineId(station.id, `${stationPath}.id`, issues, 'Station id', 'invalid_station')) {
      if (stationIds.has(station.id)) {
        addIssue(issues, `${stationPath}.id`, 'invalid_station', `Duplicate station id "${station.id}" in proposal.`);
      }
      stationIds.add(station.id);
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

function proposalRequiresFreightMetadata(record: Record<string, unknown>): boolean {
  if (typeof record.status === 'string' && FREIGHT_METADATA_STATUSES.has(record.status)) {
    return true;
  }

  if (record.mode === 'freight_rail') {
    return true;
  }

  if (record.freight !== undefined) {
    return true;
  }

  if (isRecord(record.rendering) && typeof record.rendering.layerGroup === 'string') {
    return FREIGHT_LAYER_GROUPS.has(record.rendering.layerGroup);
  }

  return false;
}

function collectProvenanceSourceIds(record: Record<string, unknown>): Set<string> {
  if (!Array.isArray(record.provenance)) {
    return new Set();
  }

  return new Set(record.provenance.flatMap((source) => {
    if (isRecord(source) && hasText(source.sourceId)) {
      return [source.sourceId];
    }
    return [];
  }));
}

function validateFreightSourceId(
  freight: Record<string, unknown>,
  field: string,
  sourceIds: Set<string>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const value = freight[field];
  if (value === undefined) return;

  if (!hasText(value)) {
    addIssue(issues, `${path}.${field}`, 'invalid_freight_metadata', `${field} must be a sourceId string when provided.`);
    return;
  }

  if (!sourceIds.has(value)) {
    addIssue(issues, `${path}.${field}`, 'invalid_freight_metadata', `${field} must reference a provenance sourceId.`);
  }
}

function validateFreightSuitability(
  value: unknown,
  path: string,
  issues: ProposalValidationIssue[]
) {
  if (value === undefined) return;

  if (!isRecord(value)) {
    addIssue(issues, path, 'invalid_freight_metadata', 'Freight suitability must be an object when provided.');
    return;
  }

  if (!hasText(value.rating) || !FREIGHT_SUITABILITY_RATINGS.has(value.rating)) {
    addIssue(issues, `${path}.rating`, 'invalid_freight_metadata', 'Freight suitability rating must be high, medium, low, or unknown.');
  }

  if (
    value.score !== undefined
    && (!hasFiniteNumber(value.score) || value.score < 0 || value.score > 100)
  ) {
    addIssue(issues, `${path}.score`, 'invalid_freight_metadata', 'Freight suitability score must be a finite number from 0 to 100.');
  }

  if (value.factors === undefined) return;

  if (!Array.isArray(value.factors)) {
    addIssue(issues, `${path}.factors`, 'invalid_freight_metadata', 'Freight suitability factors must be an array when provided.');
    return;
  }

  value.factors.forEach((factor, index) => {
    const factorPath = `${path}.factors[${index}]`;
    if (!isRecord(factor)) {
      addIssue(issues, factorPath, 'invalid_freight_metadata', 'Freight suitability factor must be an object.');
      return;
    }

    if (!hasText(factor.factor)) {
      addIssue(issues, `${factorPath}.factor`, 'invalid_freight_metadata', 'Freight suitability factor requires a name.');
    }

    if (!hasText(factor.effect) || !FREIGHT_SUITABILITY_EFFECTS.has(factor.effect)) {
      addIssue(issues, `${factorPath}.effect`, 'invalid_freight_metadata', 'Freight suitability factor effect must be positive, negative, neutral, or unknown.');
    }

    if (!hasText(factor.note)) {
      addIssue(issues, `${factorPath}.note`, 'invalid_freight_metadata', 'Freight suitability factor requires a note.');
    }
  });
}

function validateFreightConversionScenarios(
  value: unknown,
  path: string,
  issues: ProposalValidationIssue[]
): Set<string> {
  const scenarioIds = new Set<string>();
  if (value === undefined) return scenarioIds;

  if (!Array.isArray(value)) {
    addIssue(issues, path, 'invalid_freight_metadata', 'Freight conversionScenarios must be an array when provided.');
    return scenarioIds;
  }

  value.forEach((scenario, index) => {
    const scenarioPath = `${path}[${index}]`;
    if (!isRecord(scenario)) {
      addIssue(issues, scenarioPath, 'invalid_freight_metadata', 'Freight conversion scenario must be an object.');
      return;
    }

    if (hasText(scenario.id)) {
      scenarioIds.add(scenario.id);
    } else {
      addIssue(issues, `${scenarioPath}.id`, 'invalid_freight_metadata', 'Freight conversion scenario requires an id.');
    }

    if (!hasText(scenario.name)) {
      addIssue(issues, `${scenarioPath}.name`, 'invalid_freight_metadata', 'Freight conversion scenario requires a name.');
    }

    if (scenario.status !== 'converted_passenger') {
      addIssue(issues, `${scenarioPath}.status`, 'invalid_freight_metadata', 'Freight conversion scenario status must be converted_passenger.');
    }

    if (!hasText(scenario.targetMode) || !FREIGHT_CONVERSION_TARGET_MODES.has(scenario.targetMode)) {
      addIssue(issues, `${scenarioPath}.targetMode`, 'invalid_freight_metadata', 'Freight conversion scenario targetMode must be a passenger mode.');
    }

    if (scenario.sourceFreightCorridorId !== undefined && !hasText(scenario.sourceFreightCorridorId)) {
      addIssue(issues, `${scenarioPath}.sourceFreightCorridorId`, 'invalid_freight_metadata', 'Freight conversion scenario sourceFreightCorridorId must be a string.');
    }

    if (scenario.stationAssumptions !== undefined && !isTextArray(scenario.stationAssumptions)) {
      addIssue(issues, `${scenarioPath}.stationAssumptions`, 'invalid_freight_metadata', 'Freight conversion scenario stationAssumptions must be non-empty strings.');
    }

    if (!isTextArray(scenario.assumptions) || scenario.assumptions.length === 0) {
      addIssue(issues, `${scenarioPath}.assumptions`, 'invalid_freight_metadata', 'Freight conversion scenario requires at least one assumption.');
    }
  });

  return scenarioIds;
}

function validateFreightMetadata(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const requiresFreight = proposalRequiresFreightMetadata(record);
  const freight = record.freight;
  const freightPath = `${path}.freight`;

  if (freight === undefined) {
    if (requiresFreight) {
      addIssue(issues, freightPath, 'missing_freight_metadata', 'Freight corridor records require freight metadata.');
    }
    return;
  }

  if (!isRecord(freight)) {
    addIssue(issues, freightPath, 'invalid_freight_metadata', 'Freight metadata must be an object.');
    return;
  }

  if (record.status === 'freight_only' && record.kind !== 'corridor') {
    addIssue(issues, `${path}.kind`, 'invalid_freight_metadata', 'freight_only records must use kind corridor.');
  }

  if (!hasText(freight.owner)) {
    addIssue(issues, `${freightPath}.owner`, 'invalid_freight_metadata', 'Freight metadata requires an owner.');
  }

  if (!hasText(freight.operator)) {
    addIssue(issues, `${freightPath}.operator`, 'invalid_freight_metadata', 'Freight metadata requires an operator.');
  }

  if (!hasText(freight.trackUsage) || !FREIGHT_TRACK_USAGES.has(freight.trackUsage)) {
    addIssue(issues, `${freightPath}.trackUsage`, 'invalid_freight_metadata', 'Freight metadata trackUsage must be freight, passenger, mixed, or unknown.');
  }

  if (record.status === 'freight_only' && freight.trackUsage === 'passenger') {
    addIssue(issues, `${freightPath}.trackUsage`, 'invalid_freight_metadata', 'freight_only records cannot use passenger trackUsage.');
  }

  if (!hasText(freight.electrification) || !FREIGHT_ELECTRIFICATION_STATUSES.has(freight.electrification)) {
    addIssue(issues, `${freightPath}.electrification`, 'invalid_freight_metadata', 'Freight metadata electrification must be yes, no, partial, or unknown.');
  }

  const sourceIds = collectProvenanceSourceIds(record);
  validateFreightSourceId(freight, 'ownershipSourceId', sourceIds, freightPath, issues);
  validateFreightSourceId(freight, 'usageSourceId', sourceIds, freightPath, issues);
  validateFreightSourceId(freight, 'electrificationSourceId', sourceIds, freightPath, issues);

  if (freight.conversionScenarioId !== undefined && !hasText(freight.conversionScenarioId)) {
    addIssue(issues, `${freightPath}.conversionScenarioId`, 'invalid_freight_metadata', 'Freight metadata conversionScenarioId must be a string.');
  }

  const scenarioIds = validateFreightConversionScenarios(
    freight.conversionScenarios,
    `${freightPath}.conversionScenarios`,
    issues
  );

  if (
    hasText(freight.conversionScenarioId)
    && scenarioIds.size > 0
    && !scenarioIds.has(freight.conversionScenarioId)
  ) {
    addIssue(issues, `${freightPath}.conversionScenarioId`, 'invalid_freight_metadata', 'Freight metadata conversionScenarioId must reference a conversion scenario id.');
  }

  if (record.status === 'converted_passenger' && !hasText(freight.conversionScenarioId)) {
    addIssue(issues, `${freightPath}.conversionScenarioId`, 'invalid_freight_metadata', 'converted_passenger records must identify a conversion scenario.');
  }

  validateFreightSuitability(freight.suitability, `${freightPath}.suitability`, issues);
}

function validateConfidence(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const confidence = record.confidence;
  if (!isRecord(confidence)) {
    addIssue(issues, `${path}.confidence`, 'missing_field', 'Proposal confidence is required.');
    return;
  }

  if (!hasText(confidence.level)) {
    addIssue(issues, `${path}.confidence.level`, 'missing_field', 'Proposal confidence level is required.');
  } else if (!VALID_CONFIDENCE_LEVELS.has(confidence.level)) {
    addIssue(issues, `${path}.confidence.level`, 'missing_field', 'Proposal confidence level is not supported.');
  }

  for (const key of ['geometry', 'stations', 'status']) {
    const value = confidence[key];
    if (value !== undefined && !VALID_CONFIDENCE_LEVELS.has(String(value))) {
      addIssue(issues, `${path}.confidence.${key}`, 'missing_field', 'Proposal confidence detail level is not supported.');
    }
  }
}

function validateOfficialFutureSourceFreshness(
  source: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[],
  asOf: string,
  maxSourceAgeDays: number
) {
  if (!hasText(source.url)) {
    addIssue(
      issues,
      `${path}.url`,
      'invalid_provenance',
      'Official future sources require a URL so maintainers can check for source drift.'
    );
  }

  if (!hasText(source.note)) {
    addIssue(
      issues,
      `${path}.note`,
      'invalid_provenance',
      'Official future sources require notes describing which status, timeline, station, or geometry facts they support.'
    );
  }

  if (!hasText(source.accessedAt)) {
    addIssue(
      issues,
      `${path}.accessedAt`,
      'invalid_provenance',
      'Official future sources require accessedAt review dates.'
    );
    return;
  }

  validateIsoDate(source.accessedAt, `${path}.accessedAt`, issues, 'Official future source accessedAt', 'invalid_provenance');

  const ageDays = daysBetweenIsoDates(source.accessedAt, asOf);
  if (ageDays === undefined) return;

  if (ageDays < 0) {
    addIssue(
      issues,
      `${path}.accessedAt`,
      'invalid_provenance',
      'Official future source accessedAt cannot be later than the validation date.'
    );
  } else if (ageDays > maxSourceAgeDays) {
    addIssue(
      issues,
      `${path}.accessedAt`,
      'invalid_provenance',
      `Official future source review is ${ageDays} days old; refresh it within ${maxSourceAgeDays} days.`
    );
  }
}

function validateOfficialFutureRecord(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[],
  asOf: string,
  maxSourceAgeDays: number
) {
  if (record.classification !== 'official') {
    addIssue(
      issues,
      `${path}.classification`,
      'invalid_layer_classification',
      'Official future records must keep classification official.'
    );
  }

  if (getLayerGroup(record) !== 'future') {
    addIssue(
      issues,
      `${path}.rendering.layerGroup`,
      'invalid_layer_classification',
      'Official future records must render through the future layer.'
    );
  }

  if (!OFFICIAL_FUTURE_RENDERABLE_STATUSES.has(String(record.status))) {
    addIssue(
      issues,
      `${path}.status`,
      'invalid_status',
      'Official future records must be planned, funded, or under_construction; retire operational records from the Future Transit layer.'
    );
  }

  if (!isRecord(record.timeline)) {
    addIssue(
      issues,
      `${path}.timeline`,
      'missing_field',
      'Official future records require timeline metadata for opening-year drift checks.'
    );
  } else {
    if (!hasFiniteNumber(record.timeline.openingYear)) {
      addIssue(
        issues,
        `${path}.timeline.openingYear`,
        'missing_field',
        'Official future records require timeline.openingYear for update review.'
      );
    }

    if (!hasText(record.timeline.phase)) {
      addIssue(
        issues,
        `${path}.timeline.phase`,
        'missing_field',
        'Official future records require timeline.phase for status drift checks.'
      );
    }

    if (!hasText(record.timeline.scheduleNotes)) {
      addIssue(
        issues,
        `${path}.timeline.scheduleNotes`,
        'missing_field',
        'Official future records require timeline.scheduleNotes tying schedule facts to source review.'
      );
    }
  }

  if (!Array.isArray(record.stations) || record.stations.length === 0) {
    addIssue(
      issues,
      `${path}.stations`,
      'invalid_station',
      'Official future records require a station list or representative station anchors for station-list drift checks.'
    );
  }

  if (Array.isArray(record.provenance)) {
    record.provenance.forEach((source, index) => {
      if (isRecord(source)) {
        validateOfficialFutureSourceFreshness(
          source,
          `${path}.provenance[${index}]`,
          issues,
          asOf,
          maxSourceAgeDays
        );
      }
    });
  }
}

export function validateOfficialFutureTransitDatasetFreshness(
  dataset: unknown,
  options: OfficialFutureTransitValidationOptions = {}
): ProposalValidationResult {
  const issues: ProposalValidationIssue[] = [];
  const structuralResult = validateTransitProposalDataset(dataset);
  issues.push(...structuralResult.issues);

  if (!isRecord(dataset) || !Array.isArray(dataset.proposals)) {
    return { valid: issues.length === 0, issues };
  }

  const asOf = options.asOf ?? todayIsoDate();
  const maxSourceAgeDays = options.maxSourceAgeDays ?? DEFAULT_OFFICIAL_FUTURE_MAX_AGE_DAYS;

  validateIsoDate(asOf, 'officialFuture.asOf', issues, 'Official future validation date', 'invalid_dataset');

  dataset.proposals.forEach((proposal, index) => {
    if (isRecord(proposal)) {
      validateOfficialFutureRecord(
        proposal,
        `dataset.proposals[${index}]`,
        issues,
        asOf,
        maxSourceAgeDays
      );
    }
  });

  return { valid: issues.length === 0, issues };
}

export function validateOfficialFutureTransitSourceWatchTargets(
  dataset: unknown,
  watchTargets: unknown,
  options: OfficialFutureTransitValidationOptions = {}
): ProposalValidationResult {
  const issues: ProposalValidationIssue[] = [];
  const asOf = options.asOf ?? todayIsoDate();
  const maxSourceAgeDays = options.maxSourceAgeDays ?? DEFAULT_OFFICIAL_FUTURE_MAX_AGE_DAYS;

  validateIsoDate(asOf, 'officialFuture.asOf', issues, 'Official future validation date', 'invalid_dataset');

  if (!isRecord(dataset) || !Array.isArray(dataset.proposals)) {
    addIssue(issues, 'dataset.proposals', 'invalid_dataset', 'Official future dataset proposals must be available for source watch validation.');
    return { valid: false, issues };
  }

  if (!Array.isArray(watchTargets) || watchTargets.length === 0) {
    addIssue(issues, 'watchTargets', 'invalid_dataset', 'Official future source watch targets are required.');
    return { valid: false, issues };
  }

  const proposalById = new Map<string, Record<string, unknown>>();
  const provenanceByProposalId = new Map<string, Map<string, Record<string, unknown>>>();
  const driftChecksByProposalId = new Map<string, Set<string>>();

  dataset.proposals.forEach((proposal) => {
    if (!isRecord(proposal) || !hasText(proposal.id)) return;

    proposalById.set(proposal.id, proposal);
    provenanceByProposalId.set(proposal.id, new Map());
    driftChecksByProposalId.set(proposal.id, new Set());

    if (!Array.isArray(proposal.provenance)) return;

    const sources = provenanceByProposalId.get(proposal.id);
    proposal.provenance.forEach((source) => {
      if (sources && isRecord(source) && hasText(source.sourceId)) {
        sources.set(source.sourceId, source);
      }
    });
  });

  const seenTargets = new Set<string>();
  watchTargets.forEach((target, index) => {
    const path = `watchTargets[${index}]`;

    if (!isRecord(target)) {
      addIssue(issues, path, 'invalid_dataset', 'Source watch target must be an object.');
      return;
    }

    const targetKey = `${String(target.proposalId)}:${String(target.sourceId)}`;
    if (seenTargets.has(targetKey)) {
      addIssue(issues, path, 'invalid_dataset', 'Duplicate source watch target for proposalId and sourceId.');
    }
    seenTargets.add(targetKey);

    if (!hasText(target.proposalId)) {
      addIssue(issues, `${path}.proposalId`, 'missing_field', 'Source watch target requires proposalId.');
      return;
    }

    const proposal = proposalById.get(target.proposalId);
    if (!proposal) {
      addIssue(issues, `${path}.proposalId`, 'invalid_dataset', 'Source watch target proposalId must match an official future proposal.');
      return;
    }

    if (!hasText(target.sourceId)) {
      addIssue(issues, `${path}.sourceId`, 'missing_field', 'Source watch target requires sourceId.');
      return;
    }

    const source = provenanceByProposalId.get(target.proposalId)?.get(target.sourceId);
    if (!source) {
      addIssue(issues, `${path}.sourceId`, 'invalid_provenance', 'Source watch target sourceId must match proposal provenance.');
    }

    if (!hasText(target.url)) {
      addIssue(issues, `${path}.url`, 'invalid_provenance', 'Source watch target requires a URL.');
    } else if (source && hasText(source.url) && target.url !== source.url) {
      addIssue(issues, `${path}.url`, 'invalid_provenance', 'Source watch target URL must match proposal provenance URL.');
    }

    if (!hasText(target.sourceType)) {
      addIssue(issues, `${path}.sourceType`, 'invalid_provenance', 'Source watch target requires sourceType.');
    } else if (source && hasText(source.sourceType) && target.sourceType !== source.sourceType) {
      addIssue(issues, `${path}.sourceType`, 'invalid_provenance', 'Source watch target sourceType must match proposal provenance sourceType.');
    }

    if (!hasFiniteNumber(target.reviewCadenceDays) || target.reviewCadenceDays <= 0) {
      addIssue(issues, `${path}.reviewCadenceDays`, 'invalid_dataset', 'Source watch target reviewCadenceDays must be a positive number.');
    }

    if (!hasText(target.lastReviewedAt)) {
      addIssue(issues, `${path}.lastReviewedAt`, 'invalid_provenance', 'Source watch target requires lastReviewedAt.');
    } else {
      validateIsoDate(target.lastReviewedAt, `${path}.lastReviewedAt`, issues, 'Source watch target lastReviewedAt', 'invalid_provenance');

      const ageDays = daysBetweenIsoDates(target.lastReviewedAt, asOf);
      if (ageDays !== undefined && ageDays > maxSourceAgeDays) {
        addIssue(
          issues,
          `${path}.lastReviewedAt`,
          'invalid_provenance',
          `Source watch target review is ${ageDays} days old; refresh it within ${maxSourceAgeDays} days.`
        );
      }
    }

    if (!hasText(target.nextReviewDue)) {
      addIssue(issues, `${path}.nextReviewDue`, 'invalid_provenance', 'Source watch target requires nextReviewDue.');
    } else {
      validateIsoDate(target.nextReviewDue, `${path}.nextReviewDue`, issues, 'Source watch target nextReviewDue', 'invalid_provenance');
    }

    if (!Array.isArray(target.driftChecks) || target.driftChecks.length === 0) {
      addIssue(issues, `${path}.driftChecks`, 'invalid_dataset', 'Source watch target requires drift checks.');
    } else {
      const proposalDriftChecks = driftChecksByProposalId.get(target.proposalId);

      target.driftChecks.forEach((driftCheck, driftCheckIndex) => {
        if (!hasText(driftCheck)) {
          addIssue(issues, `${path}.driftChecks[${driftCheckIndex}]`, 'invalid_dataset', 'Drift check must be a non-empty string.');
          return;
        }

        proposalDriftChecks?.add(driftCheck);
      });
    }

    if (!hasText(target.note)) {
      addIssue(issues, `${path}.note`, 'invalid_dataset', 'Source watch target requires a review note.');
    }
  });

  dataset.proposals.forEach((proposal, index) => {
    if (!isRecord(proposal) || getLayerGroup(proposal) !== 'future') return;

    const proposalId = hasText(proposal.id) ? proposal.id : `dataset.proposals[${index}]`;
    const driftChecks = driftChecksByProposalId.get(proposalId) ?? new Set<string>();

    OFFICIAL_FUTURE_REQUIRED_DRIFT_CHECKS.forEach((requiredCheck) => {
      if (!driftChecks.has(requiredCheck)) {
        addIssue(
          issues,
          `watchTargets.${proposalId}.driftChecks`,
          'invalid_dataset',
          `Official future proposal watch targets must cover ${requiredCheck}.`
        );
      }
    });
  });

  return { valid: issues.length === 0, issues };
}

function validateVisionaryRegistryRecord(
  record: Record<string, unknown>,
  path: string,
  issues: ProposalValidationIssue[]
) {
  const layerGroup = getLayerGroup(record);

  if (layerGroup !== 'visionary') {
    addIssue(
      issues,
      `${path}.rendering.layerGroup`,
      'invalid_layer_classification',
      'Visionary registry records must render through the visionary layer.'
    );
  }

  if (!UNOFFICIAL_CLASSIFICATIONS.has(String(record.classification))) {
    addIssue(
      issues,
      `${path}.classification`,
      'invalid_classification',
      'Visionary registry records must use commentary_summary, advocacy_derived, or speculative classification.'
    );
  }

  if (!VISIONARY_RENDERABLE_STATUSES.has(String(record.status))) {
    addIssue(
      issues,
      `${path}.status`,
      'invalid_status',
      'Visionary registry records must use vision or concept status.'
    );
  }

  if (isRecord(record.geometry) && record.geometry.geometrySource !== undefined) {
    if (!VISIONARY_GEOMETRY_SOURCES.has(String(record.geometry.geometrySource))) {
      addIssue(
        issues,
        `${path}.geometry.geometrySource`,
        'invalid_geometry',
        'Visionary registry geometry must be approximate or conceptual.'
      );
    }
  }

  if (!hasText(record.notes)) {
    addIssue(
      issues,
      `${path}.notes`,
      'missing_field',
      'Visionary registry records require editorial notes for display and review.'
    );
  }

  if (!Array.isArray(record.provenance)) return;

  let hasRegistrySource = false;
  record.provenance.forEach((source, index) => {
    if (!isRecord(source)) return;

    const sourcePath = `${path}.provenance[${index}]`;
    if (hasText(source.sourceType) && VISIONARY_REGISTRY_SOURCE_TYPES.has(source.sourceType)) {
      hasRegistrySource = true;
    } else if (hasText(source.sourceType)) {
      addIssue(
        issues,
        `${sourcePath}.sourceType`,
        'invalid_provenance',
        'Visionary registry sourceType must be commentary, advocacy, internal_example, or other.'
      );
    }

    if (isGoogleMapsSourceUrl(source.url)) {
      addIssue(
        issues,
        `${sourcePath}.url`,
        'invalid_provenance',
        'Google Maps URLs must not be used as source evidence for visionary proposal geometry.'
      );
    }
  });

  if (!hasRegistrySource) {
    addIssue(
      issues,
      `${path}.provenance`,
      'invalid_provenance',
      'Visionary registry records require at least one commentary, advocacy, internal_example, or other source.'
    );
  }
}

export function validateVisionaryTransitProposalDataset(dataset: unknown): ProposalValidationResult {
  const issues: ProposalValidationIssue[] = [];
  const structuralResult = validateTransitProposalDataset(dataset);
  issues.push(...structuralResult.issues);

  if (!isRecord(dataset) || !Array.isArray(dataset.proposals)) {
    return { valid: issues.length === 0, issues };
  }

  if (dataset.proposals.length === 0) {
    addIssue(
      issues,
      'dataset.proposals',
      'invalid_dataset',
      'Visionary registry dataset must include at least one proposal.'
    );
  }

  dataset.proposals.forEach((proposal, index) => {
    if (isRecord(proposal)) {
      validateVisionaryRegistryRecord(proposal, `dataset.proposals[${index}]`, issues);
    }
  });

  return { valid: issues.length === 0, issues };
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

  validateMachineId(proposal.id, `${path}.id`, issues, 'Proposal id', 'missing_field');

  if (!hasText(proposal.name)) {
    addIssue(issues, `${path}.name`, 'missing_field', 'Proposal name is required.');
  }

  if (!hasText(proposal.kind)) {
    addIssue(issues, `${path}.kind`, 'missing_field', 'Proposal kind is required.');
  } else if (!VALID_KINDS.has(proposal.kind)) {
    addIssue(issues, `${path}.kind`, 'missing_field', 'Proposal kind must be line or corridor.');
  }

  if (proposal.status === undefined) {
    addIssue(issues, `${path}.status`, 'missing_status', 'Proposal status is required.');
  } else if (!isValidStatus(proposal.status)) {
    addIssue(issues, `${path}.status`, 'invalid_status', `Proposal status must be one of: ${PROPOSAL_STATUSES.join(', ')}.`);
  }

  if (!hasText(proposal.mode)) {
    addIssue(issues, `${path}.mode`, 'missing_field', 'Proposal mode is required.');
  } else if (!VALID_MODES.has(proposal.mode)) {
    addIssue(issues, `${path}.mode`, 'missing_field', 'Proposal mode is not supported.');
  }

  validateGeometry(proposal, path, issues);
  validateProvenance(proposal, path, issues);
  validateClassification(proposal, path, issues);
  validateStations(proposal, path, issues);
  validateConfidence(proposal, path, issues);
  validateFreightMetadata(proposal, path, issues);

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

  validateIsoDate(dataset.updatedAt, 'dataset.updatedAt', issues, 'Dataset updatedAt', 'invalid_dataset');

  if (!Array.isArray(dataset.proposals)) {
    addIssue(issues, 'dataset.proposals', 'invalid_dataset', 'Dataset proposals must be an array.');
    return { valid: false, issues };
  }

  const proposalIds = new Set<string>();
  dataset.proposals.forEach((proposal, index) => {
    if (isRecord(proposal) && hasText(proposal.id)) {
      if (proposalIds.has(proposal.id)) {
        addIssue(issues, `dataset.proposals[${index}].id`, 'invalid_dataset', `Duplicate proposal id "${proposal.id}" in dataset.`);
      }
      proposalIds.add(proposal.id);
    }

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

export function assertValidVisionaryTransitProposalDataset(dataset: TransitProposalDataset): TransitProposalDataset {
  const result = validateVisionaryTransitProposalDataset(dataset);
  if (!result.valid) {
    const details = result.issues.map(issue => `${issue.path}: ${issue.message}`).join('\n');
    throw new Error(`Invalid visionary transit proposal dataset:\n${details}`);
  }
  return dataset;
}
