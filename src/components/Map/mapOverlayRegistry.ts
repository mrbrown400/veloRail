import { IMPORTED_TRANSIT_PROPOSALS } from '@/data/transitProposalSources';
import type {
  MapOverlayComparisonMode,
  MapOverlayComparisonModeDefinition,
  MapOverlayDefinition,
  MapOverlayHandle,
  MapOverlayId,
  MapOverlayScenario,
  MapOverlayVisibility
} from '@/types/mapOverlays';
import type {
  ProposalMarkerInput,
  ProposalPolylineInput,
  ProposalRenderingMetadata,
  ProposalStatus,
  TransitProposal
} from '@/types';

type ProposalLayerGroup = NonNullable<ProposalRenderingMetadata['layerGroup']>;
type LegendLinePattern = 'solid' | 'dashed' | 'dotted';
type MapOverlayStyleKey =
  | 'current'
  | 'context'
  | 'future'
  | 'visionary'
  | 'freight_only'
  | 'converted_passenger';

type MapOverlayMetadataKind = 'line' | 'corridor' | 'station';

export type MapOverlayGroupId = 'current' | 'future' | 'visionary' | 'nationalized';

export interface MapOverlayGroupDefinition {
  id: MapOverlayGroupId;
  label: string;
  description: string;
  order: number;
  overlayIds: MapOverlayId[];
}

export interface MapOverlayLegendItem {
  id: string;
  overlayId: MapOverlayId;
  label: string;
  description: string;
  color: string;
  pattern: LegendLinePattern;
  scenario: MapOverlayScenario;
}

interface MapOverlayLineStyle {
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  strokePattern: LegendLinePattern;
  symbolScale: number;
  symbolStrokeWeight: number;
  repeat: string;
}

interface MapOverlayMarkerStyle {
  fillColor: string;
  strokeColor: string;
  scale: number;
}

interface MapOverlayLegendMetadata {
  label: string;
  description: string;
  color: string;
  pattern: LegendLinePattern;
  scenario: MapOverlayScenario;
}

interface MapOverlayBadgeMetadata {
  label: string;
  className: string;
}

interface MapOverlayStyleDefinition {
  line: MapOverlayLineStyle;
  marker: MapOverlayMarkerStyle;
  legend: MapOverlayLegendMetadata;
  badge: MapOverlayBadgeMetadata;
}

export interface ResolvedMapOverlayStyle extends MapOverlayStyleDefinition {
  key: MapOverlayStyleKey;
}

export interface MapOverlayMetadataSource {
  title: string;
  publisher?: string;
  url?: string;
  sourceType: string;
  accessedAt?: string;
  note?: string;
}

export interface MapOverlayMetadataDetail {
  label: string;
  value: string;
}

export interface MapOverlayMetadata {
  id: string;
  proposalId: string;
  kind: MapOverlayMetadataKind;
  title: string;
  subtitle: string;
  badgeLabel: string;
  badgeClassName: string;
  statusLabel: string;
  classificationLabel: string;
  confidenceLabel: string;
  uncertaintyLabel: string;
  disclaimer?: string;
  details: MapOverlayMetadataDetail[];
  sources: MapOverlayMetadataSource[];
}

interface SetMapOverlay {
  setMap: (map: google.maps.Map | null) => void;
}

interface ProposalOverlayItem {
  overlay: SetMapOverlay;
  minZoom?: number;
  maxZoom?: number;
}

const FUTURE_GROUPS: ProposalLayerGroup[] = ['future'];
const VISIONARY_GROUPS: ProposalLayerGroup[] = ['visionary'];
const NATIONALIZED_GROUPS: ProposalLayerGroup[] = ['freight', 'converted_passenger'];
const OFFICIAL_FUTURE_STATUSES: ReadonlySet<ProposalStatus> = new Set([
  'planned',
  'funded',
  'under_construction'
]);
export const CURRENT_TRANSIT_OVERLAY_ID = 'current-transit';
export const FUTURE_PROJECTS_OVERLAY_ID = 'future-projects';
export const FUTURE_STATION_MIN_ZOOM = 11;
export const MAP_OVERLAY_METADATA_EVENT = 'velorail:map-overlay-metadata-selected';
export const MAP_OVERLAY_FUTURE_SERVICE_NOTICE =
  'Future service is official planned, funded, or under construction overlay context, not current Google Maps operational service.';
export const MAP_OVERLAY_VISIONARY_SERVICE_NOTICE =
  'Visionary overlays are unofficial concepts with explicit provenance and uncertainty; they are not Google Maps transit data or approved service.';
export const MAP_OVERLAY_NATIONALIZED_SERVICE_NOTICE =
  'Nationalized rail overlays are hypothetical passenger-conversion planning over sourced freight corridors; candidates require review and are not approved service.';

const MAP_OVERLAY_COMPARISON_MODE_DEFINITIONS: MapOverlayComparisonModeDefinition[] = [
  {
    id: 'present-only',
    label: 'Present Only',
    description: 'Current Google Maps transit with the Future Transit overlay off.',
    futureOverlayVisible: false
  },
  {
    id: 'present-plus-future',
    label: 'Present + Future',
    description: 'Current Google Maps transit with official future project overlay context on.',
    futureOverlayVisible: true
  }
];

export const MAP_OVERLAY_STYLE_CONFIG: Record<MapOverlayStyleKey, MapOverlayStyleDefinition> = {
  current: {
    line: {
      strokeColor: '#1a73e8',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      strokePattern: 'solid',
      symbolScale: 2,
      symbolStrokeWeight: 2,
      repeat: '18px'
    },
    marker: {
      fillColor: '#1a73e8',
      strokeColor: '#ffffff',
      scale: 5
    },
    legend: {
      label: 'Google transit',
      description: 'Current transit routes',
      color: '#1a73e8',
      pattern: 'solid',
      scenario: 'current'
    },
    badge: {
      label: 'Current',
      className: 'map-overlay-metadata__badge--current'
    }
  },
  context: {
    line: {
      strokeColor: '#188038',
      strokeOpacity: 0.86,
      strokeWeight: 3,
      strokePattern: 'solid',
      symbolScale: 2,
      symbolStrokeWeight: 2,
      repeat: '18px'
    },
    marker: {
      fillColor: '#188038',
      strokeColor: '#ffffff',
      scale: 5
    },
    legend: {
      label: 'Google bicycling',
      description: 'Bike lanes and trails',
      color: '#188038',
      pattern: 'solid',
      scenario: 'context'
    },
    badge: {
      label: 'Context',
      className: 'map-overlay-metadata__badge--context'
    }
  },
  future: {
    line: {
      strokeColor: '#7e22ce',
      strokeOpacity: 0.94,
      strokeWeight: 3,
      strokePattern: 'solid',
      symbolScale: 2,
      symbolStrokeWeight: 2,
      repeat: '18px'
    },
    marker: {
      fillColor: '#7e22ce',
      strokeColor: '#ffffff',
      scale: 5.25
    },
    legend: {
      label: 'Official future project',
      description: 'Official planned, funded, or under-construction service',
      color: '#7e22ce',
      pattern: 'solid',
      scenario: 'future'
    },
    badge: {
      label: 'Official future',
      className: 'map-overlay-metadata__badge--future'
    }
  },
  visionary: {
    line: {
      strokeColor: '#d93025',
      strokeOpacity: 0.94,
      strokeWeight: 3,
      strokePattern: 'solid',
      symbolScale: 2,
      symbolStrokeWeight: 2,
      repeat: '18px'
    },
    marker: {
      fillColor: '#be185d',
      strokeColor: '#831843',
      scale: 4.75
    },
    legend: {
      label: 'Visionary concept',
      description: 'Unofficial or speculative scenario',
      color: '#d93025',
      pattern: 'solid',
      scenario: 'visionary'
    },
    badge: {
      label: 'Visionary',
      className: 'map-overlay-metadata__badge--visionary'
    }
  },
  freight_only: {
    line: {
      strokeColor: '#5f6368',
      strokeOpacity: 0.9,
      strokeWeight: 3,
      strokePattern: 'solid',
      symbolScale: 2.25,
      symbolStrokeWeight: 2,
      repeat: '14px'
    },
    marker: {
      fillColor: '#475569',
      strokeColor: '#1e293b',
      scale: 4.75
    },
    legend: {
      label: 'Freight corridor',
      description: 'Freight-only rail corridor',
      color: '#5f6368',
      pattern: 'solid',
      scenario: 'nationalized'
    },
    badge: {
      label: 'Freight only',
      className: 'map-overlay-metadata__badge--freight'
    }
  },
  converted_passenger: {
    line: {
      strokeColor: '#1a73e8',
      strokeOpacity: 0.94,
      strokeWeight: 3,
      strokePattern: 'solid',
      symbolScale: 2,
      symbolStrokeWeight: 2,
      repeat: '18px'
    },
    marker: {
      fillColor: '#0f766e',
      strokeColor: '#134e4a',
      scale: 4.9
    },
    legend: {
      label: 'Passenger conversion',
      description: 'Passenger service concept on freight corridor',
      color: '#1a73e8',
      pattern: 'solid',
      scenario: 'nationalized'
    },
    badge: {
      label: 'Passenger conversion',
      className: 'map-overlay-metadata__badge--converted'
    }
  }
};

export function getProposalOverlayInputsByGroup(groups: ProposalLayerGroup | ProposalLayerGroup[]) {
  const layerGroups = new Set(Array.isArray(groups) ? groups : [groups]);

  return IMPORTED_TRANSIT_PROPOSALS.overlays.filter(({ proposal }) => {
    const layerGroup = proposal.rendering?.layerGroup;
    if (!layerGroup || !layerGroups.has(layerGroup)) return false;
    if (layerGroup === 'future') return isOfficialFutureProposal(proposal);
    return true;
  });
}

export function isOfficialFutureProposal(proposal: TransitProposal): boolean {
  return proposal.classification === 'official' && OFFICIAL_FUTURE_STATUSES.has(proposal.status);
}

export const MAP_OVERLAY_DEFINITIONS: MapOverlayDefinition[] = [
  {
    id: CURRENT_TRANSIT_OVERLAY_ID,
    label: 'Current',
    description: 'Google Maps current transit layer',
    scenario: 'current',
    order: 10,
    defaultVisible: true,
    create: createGoogleTransitLayer
  },
  {
    id: FUTURE_PROJECTS_OVERLAY_ID,
    label: 'Future Transit',
    description: 'Official planned, funded, and under-construction future rail and BRT alignments',
    scenario: 'future',
    order: 20,
    defaultVisible: false,
    create: createProposalGroupOverlay(FUTURE_GROUPS, 20)
  },
  {
    id: 'visionary-concepts',
    label: 'Vision',
    description: 'Unofficial visionary rail concepts',
    scenario: 'visionary',
    order: 30,
    defaultVisible: false,
    create: createProposalGroupOverlay(VISIONARY_GROUPS, 30)
  },
  {
    id: 'nationalized-rail',
    label: 'Passenger Conversion',
    description: 'Hypothetical passenger-conversion planning over sourced freight corridors; not approved service',
    scenario: 'nationalized',
    order: 40,
    defaultVisible: false,
    create: createProposalGroupOverlay(NATIONALIZED_GROUPS, 40)
  },
  {
    id: 'bicycling',
    label: 'Biking',
    description: 'Google Maps bicycling layer',
    scenario: 'context',
    order: 50,
    defaultVisible: false,
    create: createGoogleBicyclingLayer
  }
];

const MAP_OVERLAY_GROUP_DEFINITIONS: MapOverlayGroupDefinition[] = [
  {
    id: 'current',
    label: 'Current',
    description: 'Current Google Maps transit and bicycling context layers',
    order: 10,
    overlayIds: [CURRENT_TRANSIT_OVERLAY_ID, 'bicycling']
  },
  {
    id: 'future',
    label: 'Future',
    description: 'Official planned, funded, and under-construction transit projects',
    order: 20,
    overlayIds: [FUTURE_PROJECTS_OVERLAY_ID]
  },
  {
    id: 'visionary',
    label: 'Visionary',
    description: 'Unofficial concept and advocacy-derived scenario overlays',
    order: 30,
    overlayIds: ['visionary-concepts']
  },
  {
    id: 'nationalized',
    label: 'Nationalized Rail Planning',
    description: 'Hypothetical passenger-conversion planning over existing freight rights-of-way',
    order: 40,
    overlayIds: ['nationalized-rail']
  }
];

const NATIVE_MAP_LEGEND_ITEMS: MapOverlayLegendItem[] = [
  createNativeLegendItem(CURRENT_TRANSIT_OVERLAY_ID, 'current-transit-google-transit', 'current'),
  createNativeLegendItem('bicycling', 'bicycling-google-bicycling', 'context')
];

export function getOrderedMapOverlayDefinitions(): MapOverlayDefinition[] {
  return [...MAP_OVERLAY_DEFINITIONS].sort((a, b) => a.order - b.order);
}

export function getMapOverlayGroupDefinitions(): MapOverlayGroupDefinition[] {
  return [...MAP_OVERLAY_GROUP_DEFINITIONS].sort((a, b) => a.order - b.order);
}

export function getMapOverlayComparisonModes(): MapOverlayComparisonModeDefinition[] {
  return [...MAP_OVERLAY_COMPARISON_MODE_DEFINITIONS];
}

export function getMapOverlayComparisonModeDefinition(
  id: MapOverlayComparisonMode
): MapOverlayComparisonModeDefinition {
  return MAP_OVERLAY_COMPARISON_MODE_DEFINITIONS.find((definition) => definition.id === id)
    ?? MAP_OVERLAY_COMPARISON_MODE_DEFINITIONS[0];
}

export function getMapOverlayComparisonModeForVisibility(
  visibility: MapOverlayVisibility
): MapOverlayComparisonMode {
  return visibility[FUTURE_PROJECTS_OVERLAY_ID] ? 'present-plus-future' : 'present-only';
}

export function getMapOverlayDefinition(id: MapOverlayId): MapOverlayDefinition | undefined {
  return MAP_OVERLAY_DEFINITIONS.find((definition) => definition.id === id);
}

export function getMapOverlayLegendItems(): MapOverlayLegendItem[] {
  return [
    ...NATIVE_MAP_LEGEND_ITEMS,
    ...getProposalLegendItems(FUTURE_PROJECTS_OVERLAY_ID, 'future', FUTURE_GROUPS),
    ...getProposalLegendItems('visionary-concepts', 'visionary', VISIONARY_GROUPS),
    ...getProposalLegendItems('nationalized-rail', 'nationalized', NATIONALIZED_GROUPS)
  ];
}

export function getDefaultMapOverlayVisibility(): MapOverlayVisibility {
  return Object.fromEntries(
    MAP_OVERLAY_DEFINITIONS.map((definition) => [
      definition.id,
      definition.defaultVisible
    ])
  ) as MapOverlayVisibility;
}

function getProposalLegendItems(
  overlayId: MapOverlayId,
  scenario: MapOverlayScenario,
  groups: ProposalLayerGroup[]
): MapOverlayLegendItem[] {
  const seen = new Set<string>();

  return getProposalOverlayInputsByGroup(groups).flatMap(({ proposal }) => {
    const style = getProposalOverlayStyle(proposal);
    const label = proposal.style?.legendLabel ?? style.legend.label;
    const color = style.legend.color;
    const pattern = style.legend.pattern;
    const key = `${overlayId}:${label}:${color}:${pattern}`;

    if (seen.has(key)) {
      return [];
    }

    seen.add(key);

    return [{
      id: `${overlayId}-${slugifyLegendLabel(label)}-${seen.size}`,
      overlayId,
      label,
      description: `${style.legend.description} · ${formatToken(proposal.confidence.level)} confidence`,
      color,
      pattern,
      scenario
    }];
  });
}

function createNativeLegendItem(
  overlayId: MapOverlayId,
  id: string,
  styleKey: Extract<MapOverlayStyleKey, 'current' | 'context'>
): MapOverlayLegendItem {
  const { legend } = MAP_OVERLAY_STYLE_CONFIG[styleKey];

  return {
    id,
    overlayId,
    label: legend.label,
    description: legend.description,
    color: legend.color,
    pattern: legend.pattern,
    scenario: legend.scenario
  };
}

function createGoogleTransitLayer(map: google.maps.Map): MapOverlayHandle {
  return createSetMapHandle(new google.maps.TransitLayer(), map);
}

function createGoogleBicyclingLayer(map: google.maps.Map): MapOverlayHandle {
  return createSetMapHandle(new google.maps.BicyclingLayer(), map);
}

function createSetMapHandle(overlay: SetMapOverlay, map: google.maps.Map): MapOverlayHandle {
  let visible = false;

  return {
    setVisible(nextVisible) {
      visible = nextVisible;
      overlay.setMap(visible ? map : null);
    },
    dispose() {
      overlay.setMap(null);
    }
  };
}

function createProposalGroupOverlay(
  groups: ProposalLayerGroup[],
  layerOrder: number
): (map: google.maps.Map) => MapOverlayHandle {
  return (map) => {
    let visible = false;
    const overlays: ProposalOverlayItem[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const infoWindow = new google.maps.InfoWindow();

    getProposalOverlayInputsByGroup(groups).forEach((input, proposalIndex) => {
      const { proposal, polyline, markers } = input;
      const zIndex = layerOrder * 100 + proposalIndex;
      const proposalOverlays = createProposalOverlays(map, proposal, polyline, markers, zIndex, infoWindow);

      overlays.push(...proposalOverlays.overlays);
      listeners.push(...proposalOverlays.listeners);
    });

    const syncVisibility = () => {
      const zoom = map.getZoom();

      overlays.forEach(({ overlay, minZoom, maxZoom }) => {
        const shouldShow = visible && isWithinZoom(zoom, minZoom, maxZoom);
        overlay.setMap(shouldShow ? map : null);
      });
    };

    const zoomListener = map.addListener('zoom_changed', syncVisibility);

    return {
      setVisible(nextVisible) {
        visible = nextVisible;
        syncVisibility();
      },
      dispose() {
        infoWindow.close();
        zoomListener.remove();
        listeners.forEach((listener) => listener.remove());
        overlays.forEach(({ overlay }) => overlay.setMap(null));
      }
    };
  };
}

function createProposalOverlays(
  map: google.maps.Map,
  proposal: TransitProposal,
  polyline: ProposalPolylineInput,
  markers: ProposalMarkerInput[],
  zIndex: number,
  infoWindow: google.maps.InfoWindow
) {
  const overlays: ProposalOverlayItem[] = [];
  const listeners: google.maps.MapsEventListener[] = [];
  const rendering = proposal.rendering;

  const lineOverlays = createProposalLineOverlays(proposal, polyline, zIndex);
  lineOverlays.forEach((line) => {
    overlays.push({
      overlay: line,
      minZoom: rendering?.minZoom,
      maxZoom: rendering?.maxZoom
    });

    if (rendering?.clickable ?? true) {
      listeners.push(line.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng) return;

        publishMapOverlayMetadata(getProposalMetadata(proposal));
        infoWindow.setContent(getProposalInfoContent(proposal));
        infoWindow.setPosition(event.latLng);
        infoWindow.open(map);
      }));
    }
  });

  if (!shouldRenderProposalStationMarkers(proposal)) {
    return { overlays, listeners };
  }

  markers.forEach((markerInput) => {
    const marker = new google.maps.Marker(
      getProposalMarkerOptions(proposal, markerInput, zIndex)
    );
    const markerZoomRange = getProposalMarkerZoomRange(proposal);
    overlays.push({
      overlay: marker,
      minZoom: markerZoomRange.minZoom,
      maxZoom: markerZoomRange.maxZoom
    });

    if (rendering?.clickable ?? true) {
      listeners.push(marker.addListener('click', () => {
        publishMapOverlayMetadata(getProposalMetadata(proposal, markerInput));
        infoWindow.setContent(getProposalInfoContent(proposal, markerInput));
        infoWindow.open(map, marker);
      }));
    }
  });

  return { overlays, listeners };
}

function createProposalLineOverlays(
  proposal: TransitProposal,
  polyline: ProposalPolylineInput,
  zIndex: number
) {
  return [
    new google.maps.Polyline(getProposalPolylineOptions(proposal, polyline, zIndex))
  ];
}

function getProposalPolylineOptions(
  proposal: TransitProposal,
  polyline: ProposalPolylineInput,
  zIndex: number
): google.maps.PolylineOptions {
  const style = getProposalOverlayStyle(proposal);
  const lineStyle = style.line;
  const isPatterned = lineStyle.strokePattern === 'dashed' || lineStyle.strokePattern === 'dotted';

  return {
    ...polyline.options,
    path: polyline.path,
    clickable: proposal.rendering?.clickable ?? true,
    strokeColor: lineStyle.strokeColor,
    strokeOpacity: isPatterned ? 0 : lineStyle.strokeOpacity,
    strokeWeight: lineStyle.strokeWeight,
    zIndex,
    icons: isPatterned
      ? [{
        icon: getLineSymbol(lineStyle),
        offset: '0',
        repeat: lineStyle.repeat
      }]
      : undefined
  };
}

export function shouldRenderProposalStationMarkers(proposal: TransitProposal): boolean {
  return proposal.rendering?.stationMarkersVisible === true;
}

function getLineSymbol(lineStyle: MapOverlayLineStyle): google.maps.Symbol {
  if (lineStyle.strokePattern === 'dotted') {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: lineStyle.symbolScale,
      fillColor: lineStyle.strokeColor,
      fillOpacity: lineStyle.strokeOpacity,
      strokeColor: lineStyle.strokeColor,
      strokeOpacity: lineStyle.strokeOpacity
    };
  }

  return {
    path: 'M 0,-1 0,1',
    strokeColor: lineStyle.strokeColor,
    strokeOpacity: lineStyle.strokeOpacity,
    strokeWeight: lineStyle.symbolStrokeWeight,
    scale: lineStyle.symbolScale
  };
}

function getProposalMarkerOptions(
  proposal: TransitProposal,
  markerInput: ProposalMarkerInput,
  zIndex: number
): google.maps.MarkerOptions {
  const statusStyle = getStationStatusStyle(markerInput.status);
  const proposalStyle = getProposalOverlayStyle(proposal);

  return {
    position: markerInput.position,
    title: `${proposal.shortName ?? proposal.name}: ${markerInput.title}`,
    clickable: proposal.rendering?.clickable ?? true,
    optimized: true,
    zIndex,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: proposal.style?.stationScale ?? statusStyle.scale ?? proposalStyle.marker.scale,
      fillColor: proposal.style?.stationFillColor ?? statusStyle.fillColor ?? proposalStyle.marker.fillColor,
      fillOpacity: 1,
      strokeColor: proposal.style?.stationStrokeColor ?? statusStyle.strokeColor ?? proposalStyle.marker.strokeColor,
      strokeWeight: 2
    }
  };
}

interface StationStatusStyle {
  fillColor: string;
  strokeColor: string;
  scale: number;
}

export function getStationStatusStyle(status: ProposalStatus): StationStatusStyle {
  const { marker } = MAP_OVERLAY_STYLE_CONFIG[getStatusStyleKey(status)];
  return { ...marker };
}

export function getProposalMarkerZoomRange(proposal: TransitProposal) {
  const minZoom = proposal.rendering?.minZoom;

  return {
    minZoom: isOfficialFutureProposal(proposal)
      ? Math.max(minZoom ?? FUTURE_STATION_MIN_ZOOM, FUTURE_STATION_MIN_ZOOM)
      : minZoom,
    maxZoom: proposal.rendering?.maxZoom
  };
}

function isWithinZoom(
  zoom: number | undefined,
  minZoom: number | undefined,
  maxZoom: number | undefined
): boolean {
  if (zoom === undefined) return true;
  if (minZoom !== undefined && zoom < minZoom) return false;
  if (maxZoom !== undefined && zoom > maxZoom) return false;
  return true;
}

export function getProposalInfoContent(
  proposal: TransitProposal,
  markerInput?: ProposalMarkerInput
): string {
  const metadata = getProposalMetadata(proposal, markerInput);
  const details = metadata.details.map((detail) => metadataRow(detail.label, detail.value)).join('');
  const sources = metadata.sources.slice(0, 3).map((source) => {
    const label = source.publisher ?? source.title;
    const sourceTitle = `${label}${source.accessedAt ? ` (${source.accessedAt})` : ''}`;

    return source.url
      ? `<li><a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceTitle)}</a></li>`
      : `<li>${escapeHtml(sourceTitle)}</li>`;
  }).join('');

  return `
    <div class="map-overlay-info-window">
      <div class="map-overlay-info-window__header">
        <strong>${escapeHtml(metadata.title)}</strong>
        <span class="map-overlay-info-window__badge ${escapeHtml(metadata.badgeClassName)}">${escapeHtml(metadata.badgeLabel)}</span>
      </div>
      <div class="map-overlay-info-window__subtitle">${escapeHtml(metadata.subtitle)}</div>
      ${details}
      ${sources ? `<div class="map-overlay-info-window__sources-title">Sources</div><ul class="map-overlay-info-window__sources">${sources}</ul>` : ''}
      ${metadata.disclaimer ? metadataRow('Uncertainty', metadata.disclaimer) : ''}
    </div>
  `;
}

export function getProposalOverlayStyle(proposal: TransitProposal): ResolvedMapOverlayStyle {
  const key = getProposalStyleKey(proposal);
  const base = MAP_OVERLAY_STYLE_CONFIG[key];
  const style = proposal.style;
  const usesGoogleTransitLineTreatment = isProposalOverlayLayer(proposal);
  const strokePattern = usesGoogleTransitLineTreatment
    ? 'solid'
    : style?.strokePattern ?? base.line.strokePattern;
  const strokeOpacity = usesGoogleTransitLineTreatment
    ? Math.max(style?.strokeOpacity ?? base.line.strokeOpacity, base.line.strokeOpacity)
    : style?.strokeOpacity ?? base.line.strokeOpacity;
  const strokeWeight = usesGoogleTransitLineTreatment
    ? base.line.strokeWeight
    : style?.strokeWeight ?? base.line.strokeWeight;

  return {
    key,
    line: {
      ...base.line,
      strokeColor: style?.strokeColor ?? base.line.strokeColor,
      strokeOpacity,
      strokeWeight,
      strokePattern
    },
    marker: {
      ...base.marker,
      fillColor: style?.stationFillColor ?? style?.strokeColor ?? base.marker.fillColor,
      strokeColor: style?.stationStrokeColor ?? base.marker.strokeColor,
      scale: style?.stationScale ?? base.marker.scale
    },
    legend: {
      ...base.legend,
      label: style?.legendLabel ?? base.legend.label,
      color: style?.strokeColor ?? base.legend.color,
      pattern: strokePattern
    },
    badge: base.badge
  };
}

function isProposalOverlayLayer(proposal: TransitProposal): boolean {
  const layerGroup = proposal.rendering?.layerGroup;
  return layerGroup === 'future'
    || layerGroup === 'visionary'
    || layerGroup === 'freight'
    || layerGroup === 'converted_passenger';
}

export function getProposalMetadata(
  proposal: TransitProposal,
  markerInput?: ProposalMarkerInput
): MapOverlayMetadata {
  const style = getProposalOverlayStyle(proposal);
  const kind: MapOverlayMetadataKind = markerInput ? 'station' : proposal.kind;
  const title = markerInput?.title ?? proposal.shortName ?? proposal.name;
  const status = markerInput?.status ?? proposal.status;
  const conversionScenario = proposal.status === 'converted_passenger'
    ? getActiveConversionScenario(proposal)
    : undefined;
  const details = [
    metadataDetail('Status', formatToken(status)),
    metadataDetail('Classification', formatToken(proposal.classification)),
    metadataDetail('Confidence', formatToken(markerInput?.confidence ?? proposal.confidence.level)),
    metadataDetail('Geometry', proposal.geometry.geometrySource ? formatToken(proposal.geometry.geometrySource) : undefined),
    metadataDetail('Opening', markerInput?.openingYear?.toString() ?? proposal.timeline?.openingYear?.toString()),
    metadataDetail('Phase', markerInput?.phase ?? proposal.timeline?.phase),
    metadataDetail('Station role', markerInput?.role ? formatToken(markerInput.role) : undefined),
    metadataDetail('Station notes', markerInput?.notes),
    metadataDetail('Owner', proposal.freight?.owner),
    metadataDetail('Operator', proposal.freight?.operator),
    metadataDetail('Track usage', proposal.freight?.trackUsage ? formatToken(proposal.freight.trackUsage) : undefined),
    metadataDetail('Electrification', proposal.freight?.electrification ? formatToken(proposal.freight.electrification) : undefined),
    metadataDetail('Suitability', proposal.freight?.suitability?.rating ? formatToken(proposal.freight.suitability.rating) : undefined),
    metadataDetail('Suitability score', proposal.freight?.suitability?.score !== undefined ? `${proposal.freight.suitability.score}/100` : undefined),
    metadataDetail('Suitability method', proposal.freight?.suitability?.method),
    metadataDetail('Missing scoring data', proposal.freight?.suitability?.missingData?.join(', ')),
    metadataDetail('Source corridor', conversionScenario?.sourceFreightCorridorId),
    metadataDetail('Conversion scenario', conversionScenario?.name),
    metadataDetail('Station assumptions', conversionScenario?.stationAssumptions?.join(' '))
  ].filter((detail): detail is MapOverlayMetadataDetail => Boolean(detail));

  return {
    id: `${proposal.id}-${kind}${markerInput ? `-${markerInput.id}` : ''}`,
    proposalId: proposal.id,
    kind,
    title,
    subtitle: `${formatToken(kind)} · ${formatToken(proposal.mode)}`,
    badgeLabel: style.badge.label,
    badgeClassName: style.badge.className,
    statusLabel: formatToken(status),
    classificationLabel: formatToken(proposal.classification),
    confidenceLabel: formatToken(markerInput?.confidence ?? proposal.confidence.level),
    uncertaintyLabel: formatToken(proposal.uncertainty.level),
    disclaimer: proposal.uncertainty.disclaimer ?? proposal.uncertainty.sourceNotes,
    details,
    sources: proposal.provenance.map((source) => ({
      title: source.title,
      publisher: source.publisher,
      url: source.url,
      sourceType: source.sourceType,
      accessedAt: source.accessedAt,
      note: source.note
    }))
  };
}

function getActiveConversionScenario(proposal: TransitProposal) {
  const scenarioId = proposal.freight?.conversionScenarioId;
  const scenarios = proposal.freight?.conversionScenarios ?? [];

  if (!scenarioId) return scenarios[0];

  return scenarios.find((scenario) => scenario.id === scenarioId);
}

function getProposalStyleKey(proposal: TransitProposal): MapOverlayStyleKey {
  if (proposal.status === 'freight_only') return 'freight_only';
  if (proposal.status === 'converted_passenger') return 'converted_passenger';
  if (proposal.rendering?.layerGroup === 'visionary') return 'visionary';
  if (proposal.classification !== 'official') return 'visionary';
  if (proposal.rendering?.layerGroup === 'future') return 'future';
  if (proposal.status === 'operational') return 'current';
  return getStatusStyleKey(proposal.status);
}

function getStatusStyleKey(status: ProposalStatus): MapOverlayStyleKey {
  if (status === 'freight_only') return 'freight_only';
  if (status === 'converted_passenger') return 'converted_passenger';
  if (status === 'vision' || status === 'concept') return 'visionary';
  if (status === 'operational') return 'current';
  return 'future';
}

function metadataDetail(
  label: string,
  value: string | undefined
): MapOverlayMetadataDetail | undefined {
  return value ? { label, value } : undefined;
}

function publishMapOverlayMetadata(metadata: MapOverlayMetadata) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(MAP_OVERLAY_METADATA_EVENT, { detail: metadata }));
}

function metadataRow(label: string, value: string | undefined, alreadyEscaped = false): string {
  if (!value) return '';

  return `<div class="map-overlay-info-window__row"><span>${escapeHtml(label)}:</span> ${alreadyEscaped ? value : escapeHtml(value)}</div>`;
}

function formatToken(value: string): string {
  return value.replace(/_/g, ' ');
}

function slugifyLegendLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'layer';
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
