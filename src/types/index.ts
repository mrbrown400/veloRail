// ============================================
// GeoJSON Types (simplified)
// ============================================

export {
  PROPOSAL_CLASSIFICATIONS,
  PROPOSAL_STATUSES,
  PROPOSAL_UNCERTAINTY_LEVELS,
  TRANSIT_PROPOSAL_SCHEMA_VERSION
} from './proposals';

export type {
  MapOverlayDefinition,
  MapOverlayHandle,
  MapOverlayId,
  MapOverlayScenario,
  MapOverlayVisibility
} from './mapOverlays';

export type {
  FreightConversionScenario,
  FreightConversionTargetMode,
  FreightCorridorMode,
  FreightCorridorProposal,
  FreightCorridorStatus,
  FreightCorridorSuitability,
  FreightSuitabilityFactor,
  FreightSuitabilityRating,
  ProposalClassificationCategory,
  ProposalConfidence,
  ProposalConfidenceLevel,
  ProposalCoordinate,
  ProposalElectrificationStatus,
  ProposalFreightMetadata,
  ProposalFreightTrackUsage,
  ProposalKind,
  ProposalLineString,
  ProposalMarkerInput,
  ProposalMode,
  ProposalPolylineInput,
  ProposalRenderingMetadata,
  ProposalSource,
  ProposalSourceType,
  ProposalStation,
  ProposalStatus,
  ProposalStylingHints,
  ProposalTimeline,
  ProposalUncertainty,
  ProposalUncertaintyLevel,
  ProposalValidationIssue,
  ProposalValidationResult,
  TransitProposal,
  TransitProposalDataset,
  TransitProposalSchemaVersion
} from './proposals';

export interface LineString {
  type: 'LineString';
  coordinates: [number, number][];
}

// ============================================
// Core Location Types
// ============================================

export interface Location {
  lat: number;
  lon: number;
  display_name?: string;
  provider?: 'google' | 'nominatim' | 'photon' | 'geolocation';
  isFallback?: boolean;
  isGeolocation?: boolean;
  accuracy?: number;
  heading?: number | null;
  speed?: number | null;
  altitude?: number | null;
  timestamp?: number;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  type: string;
  lat: number | null;
  lon: number | null;
  placeId?: string;
  provider?: 'google' | 'photon';
  isFallback?: boolean;
}

// ============================================
// Transit Data Types
// ============================================

export interface Station {
  name: string;
  lat: number;
  lon: number;
  waypoint?: boolean;
  expectedOpening?: string | null;
}

export type TransitScheduleType = 'rail' | 'heavy_rail' | 'light_rail' | 'brt' | 'commuter_rail' |
  'intercity_rail' | 'people_mover' | 'airport_shuttle' | 'commuter_express' | 'shuttle';

export interface OperatingWindow {
  start: string;
  end: string;
}

export interface TransitSchedule {
  type: TransitScheduleType;
  weekdayHours?: { start: number; end: number };
  weekendHours?: { start: number; end: number };
  frequency?: number;
  frequencyPeak?: number;
  frequencyOffpeak?: number | null;
  operatingWindows?: {
    weekday?: OperatingWindow[];
    saturday?: OperatingWindow[];
    sunday?: OperatingWindow[];
  };
  scheduleNotes?: string;
  sourceConfidence?: 'high' | 'medium' | 'low';
}

export interface TransitLine {
  color: string;
  stations: Station[];
  gtfsRouteId?: string;
  status?: 'operating' | 'under_construction' | 'planned' | 'testing';
  expectedOpening?: string;
  schedule?: TransitSchedule;
}

export type TransitLines = Record<string, TransitLine>;

// ============================================
// Route Types
// ============================================

export type TravelMode = 'bike' | 'walk' | 'transit' | 'transit_bus' | 'driving';
export type SafetyPreference = 'balanced' | 'safe' | 'fast';
export type ModeFilter = 'all' | 'bike' | 'walk' | 'driving';

export interface RouteLeg {
  mode: TravelMode;
  from: Location | Station;
  to: Location | Station;
  geometry: LineString;
  distance: number;
  duration: number;
  safety?: SafetyInfo | null;
  // Transit-specific
  line?: string;
  routeId?: string | null;
  color?: string;
  stations?: Station[];
  waitTime?: number;
  departureTime?: Date | null;
  headsign?: string | null;
  isRealtimeSchedule?: boolean;
  isRealtime?: boolean;
  delayText?: string;
  delayStatus?: 'ontime' | 'late' | 'early';
  isTransfer?: boolean;
  tripId?: string;
  boardingStopSequence?: number;
}

export interface Route {
  type: string;
  label: string;
  start: Location;
  end: Location;
  legs: RouteLeg[];
  totalDistance: number;
  totalDuration: number;
  formattedDuration: string;
  summary: string;
  isFuture?: boolean;
  expectedOpening?: string | null;
  timeSavings?: number | null;
}

export interface SafetyInfo {
  score: number;
  details?: {
    bikeInfrastructure: number;
    roadType: number;
    lighting: number;
  };
}

// ============================================
// Search Parameters
// ============================================

export interface SearchParams {
  start: Location | null;
  end: Location | null;
  mode: ModeFilter;
  safety: SafetyPreference;
  departureTime: Date;
}

// ============================================
// Vehicle Tracking Types
// ============================================

export interface VehiclePosition {
  vehicleId: string;
  tripId?: string;
  routeId?: string;
  latitude: number;
  longitude: number;
  bearing?: number;
  label?: string;
  currentStatus?: 'STOPPED_AT' | 'INCOMING_AT' | 'IN_TRANSIT_TO';
  currentStopSequence?: number;
  timestamp?: number;
}

export interface TrackedVehicle {
  tripId: string | null;
  routeId: string | null;
}

// ============================================
// UI State Types
// ============================================

export type SearchMode = 'collapsed' | 'expanded';
export type LocationStatus = 'idle' | 'pending' | 'granted' | 'denied' | 'timeout' | 'unavailable';

export interface AutocompleteState {
  activeInput: HTMLInputElement | null;
  activeDropdown: HTMLElement | null;
  highlightedIndex: number;
  results: PlaceResult[];
  selectedPlace: PlaceResult | null;
  selectedStartPlace: PlaceResult | null;
}

// ============================================
// API Response Types
// ============================================

export interface OSRMRoute {
  distance: number;
  duration: number;
  geometry: LineString;
}

export interface DepartureInfo {
  waitSeconds: number;
  departureTime: Date | null;
  headsign: string | null;
  isEstimate: boolean;
  tripId?: string;
  isRealtime?: boolean;
  delay?: number;
}

// ============================================
// Store Action Types
// ============================================

export interface RouteStoreActions {
  setRoutes: (routes: Route[]) => void;
  selectRoute: (route: Route | null) => void;
  setSearchParams: (params: Partial<SearchParams>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export interface UIStoreActions {
  setSearchMode: (mode: SearchMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setLocationStatus: (status: LocationStatus) => void;
  setCurrentLocation: (location: Location | null) => void;
  setUsingGeolocation: (using: boolean) => void;
}

export interface RealtimeStoreActions {
  trackVehicle: (tripId: string | null, routeId: string | null) => void;
  untrackVehicle: () => void;
  setVehiclePosition: (position: VehiclePosition | null) => void;
}

// ============================================
// Google Routes API Types
// ============================================

export interface GoogleRouteResult {
  geometry: LineString;
  distance: number;  // km
  duration: number;  // seconds
  source: 'google' | 'fallback';
  // Transit-specific fields
  transitDetails?: GoogleTransitDetails;
}

export interface GoogleTransitDetails {
  line: {
    name: string;
    shortName: string;
    color: string;
    vehicle: {
      type: string;  // 'SUBWAY', 'TRAM', 'BUS', etc.
    };
  };
  departureStop: {
    name: string;
    location: { lat: number; lng: number };
  };
  arrivalStop: {
    name: string;
    location: { lat: number; lng: number };
  };
  departureTime: Date;
  arrivalTime: Date;
  numStops: number;
  headsign: string;
}

export interface GoogleDirectionsLeg {
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  start_location: { lat: () => number; lng: () => number };
  end_location: { lat: () => number; lng: () => number };
  steps: GoogleDirectionsStep[];
}

export interface GoogleDirectionsStep {
  travel_mode: string;
  distance: { value: number; text: string };
  duration: { value: number; text: string };
  start_location: { lat: () => number; lng: () => number };
  end_location: { lat: () => number; lng: () => number };
  polyline: { points: string };
  transit?: {
    line: {
      name: string;
      short_name: string;
      color: string;
      vehicle: { type: string };
    };
    departure_stop: { name: string; location: { lat: () => number; lng: () => number } };
    arrival_stop: { name: string; location: { lat: () => number; lng: () => number } };
    departure_time: { value: Date };
    arrival_time: { value: Date };
    num_stops: number;
    headsign: string;
  };
}
