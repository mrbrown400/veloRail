import {
  proposalDatasetToGoogleMapInputs
} from '@/data/transitProposals';
import type {
  MapOverlayDefinition,
  MapOverlayHandle,
  MapOverlayId,
  MapOverlayVisibility
} from '@/types/mapOverlays';
import type {
  ProposalMarkerInput,
  ProposalPolylineInput,
  ProposalRenderingMetadata,
  TransitProposal
} from '@/types';

type ProposalLayerGroup = NonNullable<ProposalRenderingMetadata['layerGroup']>;

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

export function getProposalOverlayInputsByGroup(groups: ProposalLayerGroup | ProposalLayerGroup[]) {
  const layerGroups = new Set(Array.isArray(groups) ? groups : [groups]);

  return proposalDatasetToGoogleMapInputs().filter(({ proposal }) => {
    const layerGroup = proposal.rendering?.layerGroup;
    return layerGroup ? layerGroups.has(layerGroup) : false;
  });
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
    label: 'Future',
    description: 'Funded or under construction rail proposals',
    scenario: 'future',
    order: 20,
    defaultVisible: true,
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

export function getOrderedMapOverlayDefinitions(): MapOverlayDefinition[] {
  return [...MAP_OVERLAY_DEFINITIONS].sort((a, b) => a.order - b.order);
}

export function getMapOverlayDefinition(id: MapOverlayId): MapOverlayDefinition | undefined {
  return MAP_OVERLAY_DEFINITIONS.find((definition) => definition.id === id);
}

export function getDefaultMapOverlayVisibility(): MapOverlayVisibility {
  return Object.fromEntries(
    MAP_OVERLAY_DEFINITIONS.map((definition) => [
      definition.id,
      definition.defaultVisible
    ])
  ) as MapOverlayVisibility;
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
    overlays.push({
      overlay: marker,
      minZoom: rendering?.minZoom,
      maxZoom: rendering?.maxZoom
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
  const fillColor = proposal.style?.stationFillColor ?? proposal.style?.strokeColor ?? '#2563eb';

  return {
    position: markerInput.position,
    title: `${proposal.shortName ?? proposal.name}: ${markerInput.title}`,
    clickable: proposal.rendering?.clickable ?? true,
    optimized: true,
    zIndex,
    icon: {
      path: google.maps.SymbolPath.CIRCLE,
      scale: proposal.style?.stationScale ?? 5,
      fillColor,
      fillOpacity: 1,
      strokeColor: proposal.style?.stationStrokeColor ?? '#ffffff',
      strokeWeight: 2
    }
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

function getProposalInfoContent(
  proposal: TransitProposal,
  markerInput?: ProposalMarkerInput
): string {
  const title = markerInput?.title ?? proposal.shortName ?? proposal.name;
  const status = formatToken(markerInput?.status ?? proposal.status);
  const confidence = formatToken(proposal.confidence.level);
  const source = proposal.provenance[0];

  return `
    <div style="color:#1f2937;font-family:Inter,Arial,sans-serif;max-width:260px;">
      <strong>${escapeHtml(title)}</strong>
      <div style="margin-top:6px;">${escapeHtml(status)} · ${escapeHtml(formatToken(proposal.mode))}</div>
      <div style="margin-top:4px;color:#4b5563;">Confidence: ${escapeHtml(confidence)}</div>
      ${source ? `<div style="margin-top:4px;color:#4b5563;">Source: ${escapeHtml(source.publisher ?? source.title)}</div>` : ''}
    </div>
  `;
}

function formatToken(value: string): string {
  return value.replace(/_/g, ' ');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
