import { IMPORTED_TRANSIT_PROPOSALS } from '@/data/transitProposalSources';
import type {
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
export const FUTURE_STATION_MIN_ZOOM = 11;

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
    id: 'current-transit',
    label: 'Current',
    description: 'Google Maps current transit layer',
    scenario: 'current',
    order: 10,
    defaultVisible: true,
    create: createGoogleTransitLayer
  },
  {
    id: 'future-projects',
    label: 'Future Transit',
    description: 'Official planned, funded, and under-construction future rail lines and stations',
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
    label: 'Nationalized',
    description: 'Freight and conversion corridor overlays',
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
    overlayIds: ['current-transit', 'bicycling']
  },
  {
    id: 'future',
    label: 'Future',
    description: 'Official planned, funded, and under-construction transit projects',
    order: 20,
    overlayIds: ['future-projects']
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
    label: 'Nationalized',
    description: 'Freight and passenger-conversion corridor overlays',
    order: 40,
    overlayIds: ['nationalized-rail']
  }
];

const NATIVE_MAP_LEGEND_ITEMS: MapOverlayLegendItem[] = [
  {
    id: 'current-transit-google-transit',
    overlayId: 'current-transit',
    label: 'Google transit',
    description: 'Current transit routes',
    color: '#1a73e8',
    pattern: 'solid',
    scenario: 'current'
  },
  {
    id: 'bicycling-google-bicycling',
    overlayId: 'bicycling',
    label: 'Google bicycling',
    description: 'Bike lanes and trails',
    color: '#188038',
    pattern: 'solid',
    scenario: 'context'
  }
];

export function getOrderedMapOverlayDefinitions(): MapOverlayDefinition[] {
  return [...MAP_OVERLAY_DEFINITIONS].sort((a, b) => a.order - b.order);
}

export function getMapOverlayGroupDefinitions(): MapOverlayGroupDefinition[] {
  return [...MAP_OVERLAY_GROUP_DEFINITIONS].sort((a, b) => a.order - b.order);
}

export function getMapOverlayDefinition(id: MapOverlayId): MapOverlayDefinition | undefined {
  return MAP_OVERLAY_DEFINITIONS.find((definition) => definition.id === id);
}

export function getMapOverlayLegendItems(): MapOverlayLegendItem[] {
  return [
    ...NATIVE_MAP_LEGEND_ITEMS,
    ...getProposalLegendItems('future-projects', 'future', FUTURE_GROUPS),
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
    const label = proposal.style?.legendLabel ?? proposal.shortName ?? proposal.name;
    const color = proposal.style?.strokeColor ?? '#2563eb';
    const pattern = proposal.style?.strokePattern ?? 'solid';
    const key = `${overlayId}:${label}:${color}:${pattern}`;

    if (seen.has(key)) {
      return [];
    }

    seen.add(key);

    return [{
      id: `${overlayId}-${slugifyLegendLabel(label)}-${seen.size}`,
      overlayId,
      label,
      description: `${formatToken(proposal.status)} · ${formatToken(proposal.confidence.level)}`,
      color,
      pattern,
      scenario
    }];
  });
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

  const line = new google.maps.Polyline(
    getProposalPolylineOptions(proposal, polyline, zIndex)
  );
  overlays.push({
    overlay: line,
    minZoom: rendering?.minZoom,
    maxZoom: rendering?.maxZoom
  });

  if (rendering?.clickable ?? true) {
    listeners.push(line.addListener('click', (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;

      infoWindow.setContent(getProposalInfoContent(proposal));
      infoWindow.setPosition(event.latLng);
      infoWindow.open(map);
    }));
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
        infoWindow.setContent(getProposalInfoContent(proposal, markerInput));
        infoWindow.open(map, marker);
      }));
    }
  });

  return { overlays, listeners };
}

function getProposalPolylineOptions(
  proposal: TransitProposal,
  polyline: ProposalPolylineInput,
  zIndex: number
): google.maps.PolylineOptions {
  const strokeColor = polyline.options.strokeColor ?? proposal.style?.strokeColor ?? '#2563eb';
  const strokeOpacity = polyline.options.strokeOpacity ?? proposal.style?.strokeOpacity ?? 0.85;
  const strokePattern = proposal.style?.strokePattern ?? 'solid';
  const isPatterned = strokePattern === 'dashed' || strokePattern === 'dotted';

  return {
    ...polyline.options,
    path: polyline.path,
    clickable: proposal.rendering?.clickable ?? true,
    strokeColor,
    strokeOpacity: isPatterned ? 0 : strokeOpacity,
    zIndex,
    icons: isPatterned
      ? [{
        icon: getLineSymbol(strokePattern, strokeColor, strokeOpacity),
        offset: '0',
        repeat: strokePattern === 'dotted' ? '14px' : '18px'
      }]
      : undefined
  };
}

function getLineSymbol(
  strokePattern: 'dashed' | 'dotted',
  strokeColor: string,
  strokeOpacity: number
): google.maps.Symbol {
  if (strokePattern === 'dotted') {
    return {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 2,
      fillColor: strokeColor,
      fillOpacity: strokeOpacity,
      strokeColor,
      strokeOpacity
    };
  }

  return {
    path: 'M 0,-1 0,1',
    strokeColor,
    strokeOpacity,
    strokeWeight: 3,
    scale: 2
  };
}

function getProposalMarkerOptions(
  proposal: TransitProposal,
  markerInput: ProposalMarkerInput,
  zIndex: number
): google.maps.MarkerOptions {
  const statusStyle = getStationStatusStyle(markerInput.status);

  return {
    position: markerInput.position,
    title: `${proposal.shortName ?? proposal.name}: ${markerInput.title}`,
    clickable: proposal.rendering?.clickable ?? true,
    optimized: true,
    zIndex,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: proposal.style?.stationScale ?? statusStyle.scale,
      fillColor: statusStyle.fillColor ?? proposal.style?.stationFillColor ?? proposal.style?.strokeColor ?? '#2563eb',
      fillOpacity: 1,
      strokeColor: proposal.style?.stationStrokeColor ?? statusStyle.strokeColor,
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
  switch (status) {
    case 'under_construction':
      return { fillColor: '#f59e0b', strokeColor: '#78350f', scale: 5.5 };
    case 'funded':
      return { fillColor: '#059669', strokeColor: '#064e3b', scale: 5.25 };
    case 'planned':
      return { fillColor: '#2563eb', strokeColor: '#1e3a8a', scale: 5 };
    case 'operational':
      return { fillColor: '#7e22ce', strokeColor: '#4c1d95', scale: 5 };
    case 'vision':
    case 'concept':
      return { fillColor: '#db2777', strokeColor: '#831843', scale: 4.75 };
    case 'freight_only':
    case 'converted_passenger':
      return { fillColor: '#475569', strokeColor: '#1e293b', scale: 4.75 };
    default:
      return { fillColor: '#64748b', strokeColor: '#334155', scale: 5 };
  }
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
  const title = markerInput?.title ?? proposal.shortName ?? proposal.name;
  const status = formatToken(markerInput?.status ?? proposal.status);
  const confidence = formatToken(proposal.confidence.level);
  const source = proposal.provenance[0];
  const sourceLabel = source ? source.publisher ?? source.title : undefined;
  const sourceContent = source
    ? source.url
      ? `<a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(sourceLabel ?? source.title)}</a>`
      : escapeHtml(sourceLabel ?? source.title)
    : '';
  const stationRows = markerInput
    ? [
      metadataRow('Station role', markerInput.role ? formatToken(markerInput.role) : undefined),
      metadataRow('Station phase', markerInput.phase),
      metadataRow('Station opening', markerInput.openingYear?.toString()),
      metadataRow('Station confidence', markerInput.confidence ? formatToken(markerInput.confidence) : undefined),
      metadataRow('Station notes', markerInput.notes)
    ].join('')
    : '';
  const proposalRows = [
    metadataRow('Classification', formatToken(proposal.classification)),
    metadataRow('Opening', proposal.timeline?.openingYear?.toString()),
    metadataRow('Phase', proposal.timeline?.phase),
    metadataRow('Geometry', proposal.geometry.geometrySource ? formatToken(proposal.geometry.geometrySource) : undefined),
    metadataRow('Source', sourceContent, true),
    metadataRow('Uncertainty', proposal.uncertainty.disclaimer ?? proposal.uncertainty.sourceNotes)
  ].join('');

  return `
    <div style="color:#1f2937;font-family:Inter,Arial,sans-serif;max-width:260px;">
      <strong>${escapeHtml(title)}</strong>
      <div style="margin-top:6px;">${escapeHtml(status)} · ${escapeHtml(formatToken(proposal.mode))}</div>
      <div style="margin-top:4px;color:#4b5563;">Confidence: ${escapeHtml(confidence)}</div>
      ${stationRows}
      ${proposalRows}
    </div>
  `;
}

function metadataRow(label: string, value: string | undefined, alreadyEscaped = false): string {
  if (!value) return '';

  return `<div style="margin-top:4px;color:#4b5563;">${escapeHtml(label)}: ${alreadyEscaped ? value : escapeHtml(value)}</div>`;
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
