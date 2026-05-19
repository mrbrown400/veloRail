import { useCallback, useState, useEffect } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { MapOverlayRenderer } from './MapOverlayRenderer';
import { RouteOverlay } from './RouteOverlay';
import { VehicleMarker } from './VehicleMarker';
import {
  MAP_OVERLAY_METADATA_EVENT,
  getMapOverlayGroupDefinitions,
  getMapOverlayLegendItems,
  getOrderedMapOverlayDefinitions,
  type MapOverlayMetadata
} from './mapOverlayRegistry';
import {
  BikeIcon,
  Button,
  Chip,
  CloseIcon,
  FreightRailIcon,
  FutureRailIcon,
  LayersIcon,
  LegendIcon,
  Panel,
  ToggleChip,
  TransitIcon,
  VisionIcon
} from '@/components/ui';
import { useMapOverlayStore, useRouteStore, useRealtimeStore } from '@/stores';
import { LA_CENTER } from '@/services/config';
import type { MapOverlayId, MapOverlayScenario } from '@/types/mapOverlays';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: LA_CENTER.lat,
  lng: LA_CENTER.lng
};

const overlayControls = getOrderedMapOverlayDefinitions();
const overlayControlById = new Map(
  overlayControls.map((overlay) => [overlay.id, overlay])
);
const overlayGroups = getMapOverlayGroupDefinitions();
const overlayLegendItems = getMapOverlayLegendItems();

const getRouteViewportPadding = (): google.maps.Padding => {
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;

  if (viewportWidth <= 480) {
    return { top: 88, right: 28, bottom: 340, left: 28 };
  }

  if (viewportWidth <= 768) {
    return { top: 88, right: 40, bottom: 320, left: 40 };
  }

  return { top: 64, right: 72, bottom: 80, left: 440 };
};

const panelSafeId = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

// Options are created as a function to avoid using google.maps before it's loaded
const getMapOptions = (): google.maps.MapOptions => ({
  // Use Google's built-in dark mode instead of custom styles to preserve transit colors
  colorScheme: google.maps.ColorScheme?.DARK,
  disableDefaultUI: false,
  zoomControl: true,
  zoomControlOptions: {
    position: typeof google !== 'undefined' ? google.maps.ControlPosition.TOP_RIGHT : undefined
  },
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: false,
  gestureHandling: 'greedy'
});

interface MapContainerProps {
  onMapLoad?: (map: google.maps.Map) => void;
}

export function MapContainer({ onMapLoad }: MapContainerProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(false);
  const [selectedOverlayMetadata, setSelectedOverlayMetadata] = useState<MapOverlayMetadata | null>(null);
  const { selectedRoute } = useRouteStore();
  const { vehiclePosition, trackedVehicle } = useRealtimeStore();
  const overlayVisibility = useMapOverlayStore((state) => state.visibility);
  const toggleOverlay = useMapOverlayStore((state) => state.toggleOverlay);
  const activeOverlayCount = overlayControls.filter(
    (overlay) => overlayVisibility[overlay.id] ?? false
  ).length;
  const visibleLegendItems = overlayLegendItems.filter(
    (item) => overlayVisibility[item.overlayId] ?? false
  );

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);

    if (onMapLoad) {
      onMapLoad(mapInstance);
    }

    console.log('Google Maps initialized with overlay controls');
  }, [onMapLoad]);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  useEffect(() => {
    const handleMetadataSelected = (event: Event) => {
      const customEvent = event as CustomEvent<MapOverlayMetadata>;
      setSelectedOverlayMetadata(customEvent.detail);
    };

    window.addEventListener(MAP_OVERLAY_METADATA_EVENT, handleMetadataSelected);

    return () => {
      window.removeEventListener(MAP_OVERLAY_METADATA_EVENT, handleMetadataSelected);
    };
  }, []);

  // Fit bounds when route changes
  useEffect(() => {
    if (map && selectedRoute) {
      const bounds = new google.maps.LatLngBounds();

      bounds.extend({
        lat: selectedRoute.start.lat,
        lng: selectedRoute.start.lon
      });
      bounds.extend({
        lat: selectedRoute.end.lat,
        lng: selectedRoute.end.lon
      });

      selectedRoute.legs.forEach(leg => {
        leg.geometry.coordinates.forEach((coord) => {
          const [lon, lat] = coord;
          bounds.extend({ lat, lng: lon });
        });
      });

      map.fitBounds(bounds, getRouteViewportPadding());
    }
  }, [map, selectedRoute]);

  useEffect(() => {
    if (!selectedOverlayMetadata) return undefined;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedOverlayMetadata(null);
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [selectedOverlayMetadata]);

  // Get color for vehicle marker
  const getVehicleColor = () => {
    if (!selectedRoute) return '#3b82f6';
    const transitLeg = selectedRoute.legs.find(leg => leg.mode === 'transit');
    return transitLeg?.color || '#3b82f6';
  };

  const getVehicleType = () => {
    if (!selectedRoute) return 'train';
    const transitLeg = selectedRoute.legs.find(leg => leg.mode === 'transit');
    return transitLeg?.mode === 'transit_bus' ? 'bus' : 'train';
  };

  return (
    <div className="map-container">
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={11}
        options={getMapOptions()}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        <MapOverlayRenderer />
        {selectedRoute && (
          <RouteOverlay
            key={`route-${selectedRoute.label}-${selectedRoute.totalDuration}`}
            route={selectedRoute}
          />
        )}
        {vehiclePosition && trackedVehicle && (
          <VehicleMarker
            position={vehiclePosition}
            color={getVehicleColor()}
            type={getVehicleType()}
          />
        )}
      </GoogleMap>

      <Panel
        as="aside"
        className={`map-layer-panel ${selectedOverlayMetadata ? 'map-layer-panel--metadata-open' : ''}`}
        ariaLabel="Map layers and legend"
        aria-describedby="map-layer-panel-status"
      >
        <div className="map-layer-panel__header">
          <div className="map-layer-panel__title-row">
            <LayersIcon className="map-layer-panel__title-icon" />
            <div>
              <h2 className="map-layer-panel__title">Layers</h2>
              <span id="map-layer-panel-status" className="map-layer-panel__status" aria-live="polite">
                {activeOverlayCount} active
              </span>
            </div>
          </div>
          <Button
            className="map-layer-panel__legend-toggle"
            variant="ghost"
            size="sm"
            aria-controls="map-layer-legend"
            aria-expanded={isLegendOpen}
            onClick={() => setIsLegendOpen((open) => !open)}
            leftIcon={<LegendIcon />}
          >
            Legend
          </Button>
        </div>

        <div className="map-layer-panel__groups">
          {overlayGroups.map((group) => (
            <LayerControlGroup
              key={group.id}
              groupId={group.id}
              label={group.label}
              description={group.description}
              overlayIds={group.overlayIds}
              overlayVisibility={overlayVisibility}
              onToggleOverlay={toggleOverlay}
            />
          ))}
        </div>

        {isLegendOpen && (
          <div id="map-layer-legend" className="map-layer-legend" role="region" aria-label="Visible layer legend">
            <div className="map-layer-legend__header">
              <span className="map-layer-legend__title">Visible legend</span>
              <Chip tone="accent">{visibleLegendItems.length}</Chip>
            </div>
            <div className="map-layer-legend__list">
              {visibleLegendItems.map((item) => (
                <div key={item.id} className="map-layer-legend__item">
                  <span
                    className={`map-layer-legend__swatch map-layer-legend__swatch--${item.pattern}`}
                    style={{ color: item.color }}
                    aria-hidden="true"
                  />
                  <span className="map-layer-legend__text">
                    <span className="map-layer-legend__label">{item.label}</span>
                    <span className="map-layer-legend__description">{item.description}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>

      {selectedOverlayMetadata && (() => {
        const metadataTitleId = `map-overlay-metadata-title-${panelSafeId(selectedOverlayMetadata.id)}`;
        const metadataDescriptionId = `map-overlay-metadata-description-${panelSafeId(selectedOverlayMetadata.id)}`;

        return (
        <Panel
          as="aside"
          id="map-overlay-metadata-panel"
          className="map-overlay-metadata-panel"
          ariaLabelledBy={metadataTitleId}
          aria-describedby={metadataDescriptionId}
          role="region"
        >
          <div className="map-overlay-metadata__header">
            <div className="map-overlay-metadata__title-block">
              <span className={`map-overlay-metadata__badge ${selectedOverlayMetadata.badgeClassName}`}>
                {selectedOverlayMetadata.badgeLabel}
              </span>
              <h2 id={metadataTitleId} className="map-overlay-metadata__title">{selectedOverlayMetadata.title}</h2>
              <span className="map-overlay-metadata__subtitle">{selectedOverlayMetadata.subtitle}</span>
            </div>
            <Button
              className="map-overlay-metadata__close"
              variant="ghost"
              size="icon"
              aria-label="Close metadata"
              onClick={() => setSelectedOverlayMetadata(null)}
              leftIcon={<CloseIcon />}
            />
          </div>

          <p id={metadataDescriptionId} className="sr-only">
            Metadata details for the selected map overlay. Press Escape or Close metadata to dismiss this panel.
          </p>

          <dl className="map-overlay-metadata__details">
            {selectedOverlayMetadata.details.map((detail) => (
              <div key={`${detail.label}-${detail.value}`} className="map-overlay-metadata__detail">
                <dt>{detail.label}</dt>
                <dd>{detail.value}</dd>
              </div>
            ))}
          </dl>

          {selectedOverlayMetadata.disclaimer && (
            <p className="map-overlay-metadata__disclaimer">
              {selectedOverlayMetadata.disclaimer}
            </p>
          )}

          {selectedOverlayMetadata.sources.length > 0 && (
            <div className="map-overlay-metadata__sources">
              <span className="map-overlay-metadata__sources-title">Sources</span>
              <ul>
                {selectedOverlayMetadata.sources.map((source) => (
                  <li key={`${source.title}-${source.url ?? source.accessedAt ?? source.sourceType}`}>
                    {source.url ? (
                      <a href={source.url} target="_blank" rel="noopener noreferrer">
                        {source.publisher ?? source.title}
                      </a>
                    ) : (
                      <span>{source.publisher ?? source.title}</span>
                    )}
                    {source.accessedAt && (
                      <span className="map-overlay-metadata__source-date">
                        {source.accessedAt}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
        );
      })()}
    </div>
  );
}

interface LayerControlGroupProps {
  groupId: string;
  label: string;
  description: string;
  overlayIds: MapOverlayId[];
  overlayVisibility: Record<MapOverlayId, boolean>;
  onToggleOverlay: (id: MapOverlayId) => void;
}

function LayerControlGroup({
  groupId,
  label,
  description,
  overlayIds,
  overlayVisibility,
  onToggleOverlay
}: LayerControlGroupProps) {
  const overlays = overlayIds
    .map((id) => overlayControlById.get(id))
    .filter(Boolean);
  const activeCount = overlayIds.filter((id) => overlayVisibility[id] ?? false).length;
  const headingId = `map-layer-group-${groupId}`;
  const descriptionId = `${headingId}-description`;

  return (
    <section
      className={`map-layer-group map-layer-group-${groupId}`}
      aria-labelledby={headingId}
      aria-describedby={descriptionId}
    >
      <p id={descriptionId} className="sr-only">{description}</p>
      <div className="map-layer-group__header">
        <span id={headingId} className="map-layer-group__title">{label}</span>
        <span className="map-layer-group__count">{activeCount}/{overlayIds.length}</span>
      </div>
      <div className="map-layer-group__controls">
        {overlays.map((overlay) => {
          if (!overlay) return null;

          const isActive = overlayVisibility[overlay.id] ?? false;

          return (
            <ToggleChip
              key={overlay.id}
              className={`layer-btn layer-btn-${overlay.scenario} ${isActive ? 'active layer-btn--active' : ''}`}
              onClick={() => onToggleOverlay(overlay.id)}
              title={overlay.description}
              aria-label={`${overlay.description}. ${isActive ? 'On' : 'Off'}`}
              pressed={isActive}
              icon={<LayerIcon id={overlay.id} scenario={overlay.scenario} />}
            >
              <span className="layer-btn__content">
                <span className="layer-btn-label">{overlay.label}</span>
                <span className="layer-btn-state" aria-hidden="true" />
              </span>
            </ToggleChip>
          );
        })}
      </div>
    </section>
  );
}

function LayerIcon({ id, scenario }: { id: MapOverlayId; scenario: MapOverlayScenario }) {
  if (id === 'bicycling') return <BikeIcon />;
  if (scenario === 'future') return <FutureRailIcon />;
  if (scenario === 'visionary') return <VisionIcon />;
  if (scenario === 'nationalized') return <FreightRailIcon />;
  return <TransitIcon />;
}
