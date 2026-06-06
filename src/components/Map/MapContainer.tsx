import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { MapOverlayRenderer } from './MapOverlayRenderer';
import { RouteOverlay } from './RouteOverlay';
import { VehicleMarker } from './VehicleMarker';
import {
  MAP_OVERLAY_METADATA_EVENT,
  MAP_OVERLAY_FUTURE_SERVICE_NOTICE,
  MAP_OVERLAY_NATIONALIZED_SERVICE_NOTICE,
  MAP_OVERLAY_VISIONARY_SERVICE_NOTICE,
  getMapOverlayComparisonModeDefinition,
  getMapOverlayComparisonModes,
  getMapOverlayFeatureListItems,
  getMapOverlayGroupDefinitions,
  getMapOverlayLegendItems,
  getOrderedMapOverlayDefinitions,
  getOverlayFeatureIdentityKey,
  type MapOverlayFeatureListItem,
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
import { useMapOverlayStore, useRouteStore, useRealtimeStore, useUIStore } from '@/stores';
import { LA_CENTER } from '@/services/config';
import type {
  MapOverlayComparisonMode,
  MapOverlayComparisonModeDefinition,
  MapOverlayId,
  MapOverlayScenario
} from '@/types/mapOverlays';

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
const comparisonModes = getMapOverlayComparisonModes();

interface RouteViewportPaddingInput {
  isLayerPanelOpen: boolean;
  isMetadataOpen: boolean;
  routeSheetState: 'collapsed' | 'half' | 'full';
  sidebarOpen: boolean;
}

const getRouteViewportPadding = ({
  isLayerPanelOpen,
  isMetadataOpen,
  routeSheetState,
  sidebarOpen
}: RouteViewportPaddingInput): google.maps.Padding => {
  const viewportWidth = typeof window === 'undefined' ? 1024 : window.innerWidth;
  const viewportHeight = typeof window === 'undefined' ? 768 : window.innerHeight;

  if (viewportWidth <= 768) {
    const routeSheetHeight = sidebarOpen
      ? routeSheetState === 'full'
        ? viewportHeight * 0.72
        : viewportHeight * 0.54
      : 0;
    const layerSheetHeight = isLayerPanelOpen ? viewportHeight * 0.72 : 0;
    const metadataSheetHeight = isMetadataOpen ? viewportHeight * 0.54 : 0;
    const bottom = Math.max(96, routeSheetHeight, layerSheetHeight, metadataSheetHeight) + 32;

    return {
      top: 104,
      right: viewportWidth <= 480 ? 28 : 40,
      bottom: Math.min(Math.round(bottom), viewportHeight - 96),
      left: viewportWidth <= 480 ? 28 : 40
    };
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
  const [isLayerPanelOpen, setIsLayerPanelOpen] = useState(false);
  const [viewportTick, setViewportTick] = useState(0);
  const [selectedOverlayMetadata, setSelectedOverlayMetadata] = useState<MapOverlayMetadata | null>(null);
  const metadataHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const metadataTriggerRef = useRef<HTMLElement | null>(null);
  const layerTriggerRef = useRef<HTMLButtonElement | null>(null);
  const layerHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const { selectedRoute } = useRouteStore();
  const { sidebarOpen, routeSheetState } = useUIStore();
  const { vehiclePosition, trackedVehicle } = useRealtimeStore();
  const overlayVisibility = useMapOverlayStore((state) => state.visibility);
  const comparisonMode = useMapOverlayStore((state) => state.comparisonMode);
  const setComparisonMode = useMapOverlayStore((state) => state.setComparisonMode);
  const toggleOverlay = useMapOverlayStore((state) => state.toggleOverlay);
  const hoveredFeature = useMapOverlayStore((state) => state.hoveredFeature);
  const selectedFeature = useMapOverlayStore((state) => state.selectedFeature);
  const setHoveredFeature = useMapOverlayStore((state) => state.setHoveredFeature);
  const setSelectedFeature = useMapOverlayStore((state) => state.setSelectedFeature);
  const clearOverlayFeatureSelection = useMapOverlayStore((state) => state.clearOverlayFeatureSelection);
  const comparisonModeDefinition = getMapOverlayComparisonModeDefinition(comparisonMode);
  const activeOverlayCount = overlayControls.filter(
    (overlay) => overlayVisibility[overlay.id] ?? false
  ).length;
  const visibleLegendItems = overlayLegendItems.filter(
    (item) => overlayVisibility[item.overlayId] ?? false
  );
  const visibleFeatureListItems = getMapOverlayFeatureListItems(overlayVisibility);
  const hoveredFeatureKey = hoveredFeature ? getOverlayFeatureIdentityKey(hoveredFeature) : null;
  const selectedFeatureKey = selectedFeature ? getOverlayFeatureIdentityKey(selectedFeature) : null;
  const isVisionaryOverlayVisible = overlayVisibility['visionary-concepts'] ?? false;
  const isNationalizedOverlayVisible = overlayVisibility['nationalized-rail'] ?? false;

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
      metadataTriggerRef.current = null;
      setSelectedOverlayMetadata(customEvent.detail);
      setSelectedFeature(customEvent.detail.featureIdentity ?? null);
    };

    window.addEventListener(MAP_OVERLAY_METADATA_EVENT, handleMetadataSelected);

    return () => {
      window.removeEventListener(MAP_OVERLAY_METADATA_EVENT, handleMetadataSelected);
    };
  }, [setSelectedFeature]);

  useEffect(() => {
    if (selectedOverlayMetadata) {
      metadataHeadingRef.current?.focus();
    }
  }, [selectedOverlayMetadata]);

  useEffect(() => {
    if (!isLayerPanelOpen) return undefined;

    const focusTimer = window.setTimeout(() => {
      layerHeadingRef.current?.focus();
    }, 260);

    return () => {
      window.clearTimeout(focusTimer);
    };
  }, [isLayerPanelOpen]);

  useEffect(() => {
    const handleResize = () => {
      setViewportTick((tick) => tick + 1);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const closeLayerPanel = useCallback(() => {
    setIsLayerPanelOpen(false);
    window.requestAnimationFrame(() => {
      layerTriggerRef.current?.focus();
    });
  }, []);

  const toggleLayerPanel = useCallback(() => {
    const nextOpen = !isLayerPanelOpen;
    setIsLayerPanelOpen(nextOpen);
    window.requestAnimationFrame(() => {
      if (nextOpen) {
        layerHeadingRef.current?.focus();
      } else {
        layerTriggerRef.current?.focus();
      }
    });
  }, [isLayerPanelOpen]);

  const closeMetadata = useCallback(() => {
    setSelectedOverlayMetadata(null);
    clearOverlayFeatureSelection();
    window.requestAnimationFrame(() => {
      const fallbackFocusTarget = metadataTriggerRef.current
        ?? (isLayerPanelOpen ? layerHeadingRef.current : layerTriggerRef.current);
      fallbackFocusTarget?.focus();
    });
  }, [clearOverlayFeatureSelection, isLayerPanelOpen]);

  const openFeatureMetadata = useCallback((item: MapOverlayFeatureListItem, trigger: HTMLElement) => {
    metadataTriggerRef.current = trigger;
    setSelectedFeature(item.highlightAvailable ? item.identity : null);
    setSelectedOverlayMetadata(item.metadata);
  }, [setSelectedFeature]);

  useEffect(() => {
    const selectedFeatureIdentity = selectedOverlayMetadata?.featureIdentity;

    if (selectedFeatureIdentity && !(overlayVisibility[selectedFeatureIdentity.overlayId] ?? false)) {
      setSelectedOverlayMetadata(null);
      clearOverlayFeatureSelection();
    }
  }, [clearOverlayFeatureSelection, overlayVisibility, selectedOverlayMetadata]);

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

      map.fitBounds(bounds, getRouteViewportPadding({
        isLayerPanelOpen,
        isMetadataOpen: Boolean(selectedOverlayMetadata),
        routeSheetState,
        sidebarOpen
      }));
    }
  }, [
    isLayerPanelOpen,
    map,
    routeSheetState,
    selectedOverlayMetadata,
    selectedRoute,
    sidebarOpen,
    viewportTick
  ]);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (selectedOverlayMetadata) {
        event.preventDefault();
        closeMetadata();
        return;
      }

      if (isLegendOpen) {
        event.preventDefault();
        setIsLegendOpen(false);
        window.requestAnimationFrame(() => {
          layerHeadingRef.current?.focus();
        });
        return;
      }

      if (isLayerPanelOpen) {
        event.preventDefault();
        closeLayerPanel();
      }
    };

    window.addEventListener('keydown', closeOnEscape);

    return () => {
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [closeLayerPanel, closeMetadata, isLayerPanelOpen, isLegendOpen, selectedOverlayMetadata]);

  // Get color for vehicle marker
  const getVehicleColor = () => {
    if (!selectedRoute) return '#3b82f6';
    const transitLeg = selectedRoute.legs.find(leg => leg.mode === 'transit' || leg.mode === 'transit_bus');
    return transitLeg?.color || '#3b82f6';
  };

  const getVehicleType = () => {
    if (!selectedRoute) return 'train';
    const transitLeg = selectedRoute.legs.find(leg => leg.mode === 'transit' || leg.mode === 'transit_bus');
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

      <Button
        ref={layerTriggerRef}
        className={`map-layer-trigger ${sidebarOpen ? `map-layer-trigger--route-${routeSheetState}` : ''} ${selectedOverlayMetadata ? 'map-layer-trigger--metadata-open' : ''}`}
        variant="map-toggle"
        size="sm"
        aria-controls="map-layer-panel"
        aria-expanded={isLayerPanelOpen}
        aria-label={`Layers, ${activeOverlayCount} active`}
        onClick={toggleLayerPanel}
        leftIcon={<LayersIcon />}
      >
        Layers
        <span className="map-layer-trigger__count">{activeOverlayCount}</span>
      </Button>

      <Panel
        as="aside"
        id="map-layer-panel"
        className={`map-layer-panel ${isLayerPanelOpen ? 'map-layer-panel--open' : ''} ${selectedOverlayMetadata ? 'map-layer-panel--metadata-open' : ''}`}
        ariaLabel="Map layers and legend"
        aria-describedby="map-layer-panel-status"
      >
        <div className="map-layer-panel__header">
          <div className="map-layer-panel__title-row">
            <LayersIcon className="map-layer-panel__title-icon" />
            <div>
              <h2 ref={layerHeadingRef} className="map-layer-panel__title" tabIndex={-1}>Layers</h2>
              <span id="map-layer-panel-status" className="map-layer-panel__status" aria-live="polite">
                {comparisonModeDefinition.label} · {activeOverlayCount} active
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
          <Button
            className="map-layer-panel__close"
            variant="ghost"
            size="icon"
            aria-label="Close layers"
            onClick={closeLayerPanel}
            leftIcon={<CloseIcon />}
          />
        </div>

        <div className="map-layer-panel__groups">
          <ComparisonModeControlGroup
            modes={comparisonModes}
            selectedMode={comparisonMode}
            onSelectMode={setComparisonMode}
          />
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

        <div className="map-layer-feature-list" aria-label="Keyboard-accessible overlay metadata">
          <div className="map-layer-feature-list__header">
            <span className="map-layer-feature-list__title">Layer details</span>
            <span className="map-layer-feature-list__count">
              {visibleFeatureListItems.length} visible
            </span>
          </div>
          <p className="map-layer-feature-list__notice">
            Google Maps renders these lines; VeloRail owns the planning facts, provenance, confidence, and uncertainty.
          </p>
          {visibleFeatureListItems.length > 0 ? (
            <div className="map-layer-feature-list__items">
              {visibleFeatureListItems.map((item) => {
                const featureKey = getOverlayFeatureIdentityKey(item.identity);
                const isHovered = hoveredFeatureKey === featureKey;
                const isSelected = selectedFeatureKey === featureKey;

                return (
                  <button
                    key={featureKey}
                    type="button"
                    className={`map-layer-feature-list__item map-layer-feature-list__item--${item.scenario} ${isHovered ? 'map-layer-feature-list__item--hovered' : ''} ${isSelected ? 'map-layer-feature-list__item--selected' : ''} ${item.highlightAvailable ? '' : 'map-layer-feature-list__item--metadata-only'}`}
                    aria-pressed={isSelected}
                    aria-label={`${item.label}. ${item.description}. ${item.highlightAvailable ? 'Hover or focus to highlight this line; activate to open metadata and keep it selected.' : item.highlightUnavailableReason}`}
                    title={item.highlightUnavailableReason ?? item.description}
                    onMouseEnter={() => item.highlightAvailable && setHoveredFeature(item.identity)}
                    onMouseLeave={() => setHoveredFeature(null)}
                    onFocus={() => item.highlightAvailable && setHoveredFeature(item.identity)}
                    onBlur={() => setHoveredFeature(null)}
                    onClick={(event) => openFeatureMetadata(item, event.currentTarget)}
                  >
                    {item.color && (
                      <span
                        className="map-layer-feature-list__swatch"
                        style={{ color: item.color }}
                        aria-hidden="true"
                      />
                    )}
                    <span className="map-layer-feature-list__text">
                      <span className="map-layer-feature-list__label">{item.label}</span>
                      <span className="map-layer-feature-list__description">{item.description}</span>
                    </span>
                    <span className="map-layer-feature-list__badge">{item.badgeLabel}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="map-layer-feature-list__empty">
              Turn on Future, Visionary, or Nationalized Rail Planning layers to review source metadata from the keyboard.
            </p>
          )}
        </div>

        {isLegendOpen && (
          <div id="map-layer-legend" className="map-layer-legend" role="region" aria-label="Visible layer legend">
            <div className="map-layer-legend__header">
              <span className="map-layer-legend__title">Visible legend</span>
              <Chip tone={comparisonMode === 'present-plus-future' ? 'future' : 'accent'}>
                {comparisonModeDefinition.label}
              </Chip>
            </div>
            <div className="map-layer-legend__list">
              <div className="map-layer-legend__item">
                <span
                  className={`map-layer-legend__swatch map-layer-legend__swatch--${comparisonMode === 'present-plus-future' ? 'solid' : 'dotted'}`}
                  style={{ color: comparisonMode === 'present-plus-future' ? '#7e22ce' : '#1a73e8' }}
                  aria-hidden="true"
                />
                <span className="map-layer-legend__text">
                  <span className="map-layer-legend__label">Comparison mode</span>
                  <span
                    className="map-layer-legend__description"
                    title={comparisonModeDefinition.description}
                  >
                    {comparisonModeDefinition.description}
                  </span>
                </span>
              </div>
              {comparisonMode === 'present-plus-future' && (
                <div className="map-layer-legend__item">
                  <span
                    className="map-layer-legend__swatch map-layer-legend__swatch--solid"
                    style={{ color: '#7e22ce' }}
                    aria-hidden="true"
                  />
                  <span className="map-layer-legend__text">
                    <span className="map-layer-legend__label">Official future context</span>
                    <span
                      className="map-layer-legend__description"
                      title={MAP_OVERLAY_FUTURE_SERVICE_NOTICE}
                    >
                      {MAP_OVERLAY_FUTURE_SERVICE_NOTICE}
                    </span>
                  </span>
                </div>
              )}
              {isVisionaryOverlayVisible && (
                <div className="map-layer-legend__item map-layer-legend__notice">
                  <span
                    className="map-layer-legend__swatch map-layer-legend__swatch--solid"
                    style={{ color: '#d93025' }}
                    aria-hidden="true"
                  />
                  <span className="map-layer-legend__text">
                    <span className="map-layer-legend__label">Visionary notice</span>
                    <span
                      className="map-layer-legend__description"
                      title={MAP_OVERLAY_VISIONARY_SERVICE_NOTICE}
                    >
                      {MAP_OVERLAY_VISIONARY_SERVICE_NOTICE}
                    </span>
                  </span>
                </div>
              )}
              {isNationalizedOverlayVisible && (
                <div className="map-layer-legend__item map-layer-legend__notice">
                  <span
                    className="map-layer-legend__swatch map-layer-legend__swatch--solid"
                    style={{ color: '#1a73e8' }}
                    aria-hidden="true"
                  />
                  <span className="map-layer-legend__text">
                    <span className="map-layer-legend__label">Nationalized planning notice</span>
                    <span
                      className="map-layer-legend__description"
                      title={MAP_OVERLAY_NATIONALIZED_SERVICE_NOTICE}
                    >
                      {MAP_OVERLAY_NATIONALIZED_SERVICE_NOTICE}
                    </span>
                  </span>
                </div>
              )}
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
              <h2
                id={metadataTitleId}
                ref={metadataHeadingRef}
                className="map-overlay-metadata__title"
                tabIndex={-1}
              >
                {selectedOverlayMetadata.title}
              </h2>
              <span className="map-overlay-metadata__subtitle">{selectedOverlayMetadata.subtitle}</span>
            </div>
            <Button
              className="map-overlay-metadata__close"
              variant="ghost"
              size="icon"
              aria-label="Close metadata"
              onClick={closeMetadata}
              leftIcon={<CloseIcon />}
            />
          </div>

          <p id={metadataDescriptionId} className="sr-only">
            Metadata details for the selected map overlay. Press Escape or Close metadata to dismiss this panel.
          </p>

          <p className="map-overlay-metadata__source-boundary">
            Google Maps renders the geometry. VeloRail owns this planning metadata, source boundary, confidence, and uncertainty.
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
                    <span className="map-overlay-metadata__source-main">
                      {source.url ? (
                        <a href={source.url} target="_blank" rel="noopener noreferrer">
                          {source.title}
                        </a>
                      ) : (
                        <span>{source.title}</span>
                      )}
                      {source.publisher && (
                        <span className="map-overlay-metadata__source-publisher">
                          {source.publisher}
                        </span>
                      )}
                    </span>
                    <span className="map-overlay-metadata__source-meta">
                      <span>{source.sourceType}</span>
                      {source.accessedAt && (
                        <span className="map-overlay-metadata__source-date">
                          {source.accessedAt}
                        </span>
                      )}
                    </span>
                    {source.note && (
                      <span className="map-overlay-metadata__source-note">
                        {source.note}
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

interface ComparisonModeControlGroupProps {
  modes: MapOverlayComparisonModeDefinition[];
  selectedMode: MapOverlayComparisonMode;
  onSelectMode: (mode: MapOverlayComparisonMode) => void;
}

function ComparisonModeControlGroup({
  modes,
  selectedMode,
  onSelectMode
}: ComparisonModeControlGroupProps) {
  return (
    <section
      className="map-layer-group map-layer-group-comparison"
      aria-labelledby="map-layer-group-comparison"
      aria-label="Completed network comparison mode"
    >
      <div className="map-layer-group__header">
        <span id="map-layer-group-comparison" className="map-layer-group__title">
          Comparison
        </span>
        <span className="map-layer-group__count">Mode</span>
      </div>
      <div className="map-layer-group__controls">
        {modes.map((mode) => {
          const isActive = mode.id === selectedMode;

          return (
            <ToggleChip
              key={mode.id}
              className={`layer-btn layer-btn-${mode.futureOverlayVisible ? 'future' : 'current'} ${isActive ? 'active layer-btn--active' : ''}`}
              onClick={() => onSelectMode(mode.id)}
              title={mode.description}
              aria-label={`${mode.label}. ${mode.description}. ${isActive ? 'Selected' : 'Not selected'}`}
              pressed={isActive}
              icon={mode.futureOverlayVisible ? <FutureRailIcon /> : <TransitIcon />}
            >
              <span className="layer-btn__content">
                <span className="layer-btn-copy">
                  <span className="layer-btn-label">{mode.label}</span>
                  <span className="layer-btn-description">{mode.description}</span>
                </span>
                <span className="layer-btn-state" aria-hidden="true" />
              </span>
            </ToggleChip>
          );
        })}
      </div>
    </section>
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
                <span className="layer-btn-copy">
                  <span className="layer-btn-label">{overlay.label}</span>
                  <span className="layer-btn-description">{overlay.description}</span>
                </span>
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
