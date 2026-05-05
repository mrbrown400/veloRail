import { useCallback, useState, useEffect } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { MapOverlayRenderer } from './MapOverlayRenderer';
import { RouteOverlay } from './RouteOverlay';
import { VehicleMarker } from './VehicleMarker';
import { getOrderedMapOverlayDefinitions } from './mapOverlayRegistry';
import { ToggleChip } from '@/components/ui';
import { useMapOverlayStore, useRouteStore, useRealtimeStore } from '@/stores';
import { LA_CENTER } from '@/services/config';
import type { MapOverlayScenario } from '@/types/mapOverlays';

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: LA_CENTER.lat,
  lng: LA_CENTER.lng
};

const overlayControls = getOrderedMapOverlayDefinitions();

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
  const { selectedRoute } = useRouteStore();
  const { vehiclePosition, trackedVehicle } = useRealtimeStore();
  const overlayVisibility = useMapOverlayStore((state) => state.visibility);
  const toggleOverlay = useMapOverlayStore((state) => state.toggleOverlay);

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

      map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 420 });
    }
  }, [map, selectedRoute]);

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

      {/* Layer Controls */}
      <div className="map-layer-controls" aria-label="Map layers">
        {overlayControls.map((overlay) => {
          const isActive = overlayVisibility[overlay.id] ?? false;

          return (
            <ToggleChip
              key={overlay.id}
              className={`layer-btn layer-btn-${overlay.scenario} ${isActive ? 'active' : ''}`}
              onClick={() => toggleOverlay(overlay.id)}
              title={overlay.description}
              aria-label={overlay.description}
              pressed={isActive}
              icon={<LayerIcon scenario={overlay.scenario} />}
            >
              {overlay.label}
            </ToggleChip>
          );
        })}
      </div>
    </div>
  );
}

function LayerIcon({ scenario }: { scenario: MapOverlayScenario }) {
  if (scenario === 'context') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z" />
      </svg>
    );
  }

  if (scenario === 'future') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 17c4-7 8-10 16-10" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M16 5h4v4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="15" r="2" fill="currentColor" />
        <circle cx="12" cy="10" r="2" fill="currentColor" />
      </svg>
    );
  }

  if (scenario === 'visionary') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z" fill="currentColor" />
        <path d="M5 16l.8 2.2L8 19l-2.2.8L5 22l-.8-2.2L2 19l2.2-.8L5 16z" fill="currentColor" />
      </svg>
    );
  }

  if (scenario === 'nationalized') {
    return (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M4 18h16M6 14h12M8 10h8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M7 18l5-12 5 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-6H6V6h5v5zm2 0V6h5v5h-5zm3.5 6c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
    </svg>
  );
}
