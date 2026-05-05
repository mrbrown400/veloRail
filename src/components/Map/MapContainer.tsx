import { useCallback, useState, useEffect, useRef } from 'react';
import { GoogleMap } from '@react-google-maps/api';
import { RouteOverlay } from './RouteOverlay';
import { VehicleMarker } from './VehicleMarker';
import { BikeIcon, ToggleChip, TransitIcon } from '@/components/ui';
import { useRouteStore, useRealtimeStore } from '@/stores';
import { LA_CENTER } from '@/services/config';

interface LayerRefs {
  transit: google.maps.TransitLayer | null;
  bicycling: google.maps.BicyclingLayer | null;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: LA_CENTER.lat,
  lng: LA_CENTER.lng
};

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

  // Layer visibility state
  const [layers, setLayers] = useState({
    transit: true,
    bicycling: false
  });

  // Layer refs to persist layer instances
  const layerRefs = useRef<LayerRefs>({
    transit: null,
    bicycling: null
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);

    // Create layer instances
    layerRefs.current.transit = new google.maps.TransitLayer();
    layerRefs.current.bicycling = new google.maps.BicyclingLayer();

    // Enable transit layer by default
    layerRefs.current.transit.setMap(mapInstance);

    if (onMapLoad) {
      onMapLoad(mapInstance);
    }

    console.log('Google Maps initialized with layer controls');
  }, [onMapLoad]);

  // Toggle layer visibility
  const toggleLayer = (layerName: 'transit' | 'bicycling') => {
    if (!map || !layerRefs.current[layerName]) return;

    const newState = !layers[layerName];
    setLayers(prev => ({ ...prev, [layerName]: newState }));

    layerRefs.current[layerName]!.setMap(newState ? map : null);
  };

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
      <div className="map-layer-controls">
        <ToggleChip
          className={`layer-btn ${layers.transit ? 'active' : ''}`}
          onClick={() => toggleLayer('transit')}
          title="Transit"
          aria-label="Toggle transit layer"
          pressed={layers.transit}
          icon={<TransitIcon />}
        >
          <span>Transit</span>
        </ToggleChip>
        <ToggleChip
          className={`layer-btn ${layers.bicycling ? 'active' : ''}`}
          onClick={() => toggleLayer('bicycling')}
          title="Biking"
          aria-label="Toggle bicycling layer"
          pressed={layers.bicycling}
          icon={<BikeIcon />}
        >
          <span>Biking</span>
        </ToggleChip>
      </div>
    </div>
  );
}
