// Versioned schema for VeloRail-owned transit proposal and corridor data.

export const TRANSIT_PROPOSAL_SCHEMA_VERSION = '1.0.0' as const;

export const PROPOSAL_STATUSES = [
  'operational',
  'planned',
  'under_construction',
  'funded',
  'vision',
  'concept',
  'freight_only',
  'converted_passenger'
] as const;

export const PROPOSAL_CLASSIFICATIONS = [
  'official',
  'commentary_summary',
  'advocacy_derived',
  'speculative'
] as const;

export const PROPOSAL_UNCERTAINTY_LEVELS = [
  'none',
  'low',
  'medium',
  'high',
  'unknown'
] as const;

export type TransitProposalSchemaVersion = typeof TRANSIT_PROPOSAL_SCHEMA_VERSION;
export type ProposalStatus = typeof PROPOSAL_STATUSES[number];
export type ProposalClassificationCategory = typeof PROPOSAL_CLASSIFICATIONS[number];
export type ProposalUncertaintyLevel = typeof PROPOSAL_UNCERTAINTY_LEVELS[number];

export type ProposalKind = 'line' | 'corridor';

export type ProposalMode =
  | 'heavy_rail'
  | 'light_rail'
  | 'brt'
  | 'commuter_rail'
  | 'intercity_rail'
  | 'people_mover'
  | 'freight_rail'
  | 'mixed_rail'
  | 'unknown';

export type ProposalCoordinate = [lon: number, lat: number];

export interface ProposalLineString {
  type: 'LineString';
  coordinates: ProposalCoordinate[];
  geometrySource?: 'official' | 'gtfs' | 'surveyed' | 'approximate' | 'conceptual';
  geometryNotes?: string;
}

export type ProposalSourceType =
  | 'official_project'
  | 'public_agency'
  | 'public_plan'
  | 'freight_owner'
  | 'advocacy'
  | 'commentary'
  | 'internal_example'
  | 'other';

export interface ProposalSource {
  sourceId: string;
  title: string;
  sourceType: ProposalSourceType;
  publisher?: string;
  url?: string;
  accessedAt?: string;
  note?: string;
}

export type ProposalConfidenceLevel = 'official' | 'high' | 'medium' | 'low' | 'unknown';

export interface ProposalConfidence {
  level: ProposalConfidenceLevel;
  geometry?: ProposalConfidenceLevel;
  stations?: ProposalConfidenceLevel;
  status?: ProposalConfidenceLevel;
  notes?: string;
}

export interface ProposalUncertainty {
  level: ProposalUncertaintyLevel;
  sourceNotes: string;
  assumptions?: string[];
  disclaimer?: string;
}

export interface ProposalTimeline {
  openingYear?: number;
  phase?: string;
  phaseOrder?: number;
  scheduleNotes?: string;
}

export interface ProposalStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  status?: ProposalStatus;
  role?: 'terminal' | 'transfer' | 'intermediate' | 'infill' | 'junction' | 'yard';
  openingYear?: number;
  phase?: string;
  confidence?: ProposalConfidenceLevel;
  existingLines?: string[];
  notes?: string;
}

export interface ProposalStylingHints {
  strokeColor?: string;
  strokeOpacity?: number;
  strokeWeight?: number;
  strokePattern?: 'solid' | 'dashed' | 'dotted';
  stationFillColor?: string;
  stationStrokeColor?: string;
  stationScale?: number;
  zIndex?: number;
  legendLabel?: string;
}

export interface ProposalFreightMetadata {
  owner?: string;
  operator?: string;
  trackUsage?: 'freight' | 'passenger' | 'mixed' | 'unknown';
  electrification?: 'yes' | 'no' | 'partial' | 'unknown';
  conversionScenarioId?: string;
  suitabilityNotes?: string;
}

export interface ProposalRenderingMetadata {
  layerGroup?: 'future' | 'visionary' | 'freight' | 'converted_passenger';
  minZoom?: number;
  maxZoom?: number;
  clickable?: boolean;
}

export interface TransitProposal {
  id: string;
  name: string;
  shortName?: string;
  kind: ProposalKind;
  status: ProposalStatus;
  mode: ProposalMode;
  classification: ProposalClassificationCategory;
  geometry: ProposalLineString;
  provenance: ProposalSource[];
  confidence: ProposalConfidence;
  uncertainty: ProposalUncertainty;
  stations?: ProposalStation[];
  timeline?: ProposalTimeline;
  style?: ProposalStylingHints;
  rendering?: ProposalRenderingMetadata;
  freight?: ProposalFreightMetadata;
  notes?: string;
  tags?: string[];
}

export interface TransitProposalDataset {
  schemaVersion: TransitProposalSchemaVersion;
  updatedAt: string;
  proposals: TransitProposal[];
  migrationNotes?: string[];
}

export interface ProposalValidationIssue {
  path: string;
  code:
    | 'missing_geometry'
    | 'missing_provenance'
    | 'missing_status'
    | 'invalid_coordinate'
    | 'invalid_geometry'
    | 'missing_classification'
    | 'invalid_classification'
    | 'invalid_provenance'
    | 'missing_uncertainty'
    | 'invalid_uncertainty'
    | 'invalid_layer_classification'
    | 'invalid_status'
    | 'invalid_station'
    | 'invalid_dataset'
    | 'missing_field';
  message: string;
}

export interface ProposalValidationResult {
  valid: boolean;
  issues: ProposalValidationIssue[];
}

export interface ProposalMarkerInput {
  id: string;
  title: string;
  position: google.maps.LatLngLiteral;
  status: ProposalStatus;
  proposalId: string;
  role?: ProposalStation['role'];
}

export interface ProposalPolylineInput {
  id: string;
  path: google.maps.LatLngLiteral[];
  options: google.maps.PolylineOptions;
  status: ProposalStatus;
  proposalId: string;
}
