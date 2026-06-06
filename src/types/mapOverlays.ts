export type MapOverlayId = string;

export type MapOverlayComparisonMode = 'present-only' | 'present-plus-future';

export type MapOverlayScenario =
  | 'current'
  | 'future'
  | 'visionary'
  | 'nationalized'
  | 'context';

export type MapOverlayFeatureHighlightState = 'idle' | 'hovered' | 'selected';

export interface MapOverlayFeatureIdentity {
  overlayId: MapOverlayId;
  featureId: string;
}

export interface MapOverlayFeatureHighlight {
  featureId: string;
  state: MapOverlayFeatureHighlightState;
}

export interface MapOverlayHandle {
  setVisible: (visible: boolean) => void;
  setFeatureHighlight?: (highlight: MapOverlayFeatureHighlight | null) => void;
  dispose: () => void;
}

export interface MapOverlayDefinition {
  id: MapOverlayId;
  label: string;
  description: string;
  scenario: MapOverlayScenario;
  order: number;
  defaultVisible: boolean;
  create: (map: google.maps.Map) => MapOverlayHandle;
}

export interface MapOverlayComparisonModeDefinition {
  id: MapOverlayComparisonMode;
  label: string;
  description: string;
  futureOverlayVisible: boolean;
}

export type MapOverlayVisibility = Record<MapOverlayId, boolean>;
