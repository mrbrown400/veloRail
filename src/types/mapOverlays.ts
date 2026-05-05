export type MapOverlayId = string;

export type MapOverlayScenario =
  | 'current'
  | 'future'
  | 'visionary'
  | 'nationalized'
  | 'context';

export interface MapOverlayHandle {
  setVisible: (visible: boolean) => void;
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

export type MapOverlayVisibility = Record<MapOverlayId, boolean>;
