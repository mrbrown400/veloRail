import { useEffect, useRef, useCallback } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { MAP_OVERLAY_Z_INDEX } from './mapOverlayRegistry';
import { getRouteLegOverlayCoordinates } from './routeOverlayGeometry';
import type { Route, RouteLeg } from '@/types';

interface RouteOverlayProps {
  route: Route;
}

export function RouteOverlay({ route }: RouteOverlayProps) {
  const map = useGoogleMap();
  const polylinesRef = useRef<google.maps.Polyline[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  // Cleanup function to remove all overlays from map
  const clearOverlays = useCallback(() => {
    polylinesRef.current.forEach(polyline => {
      polyline.setMap(null);
    });
    polylinesRef.current = [];

    markersRef.current.forEach(marker => {
      marker.setMap(null);
    });
    markersRef.current = [];
  }, []);

  // Draw route when map or route changes
  useEffect(() => {
    if (!map) return;

    // Clear any existing overlays first
    clearOverlays();

    // Add start marker
    const startMarker = new google.maps.Marker({
      position: { lat: route.start.lat, lng: route.start.lon },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#3b82f6',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      title: 'Start',
      zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_MARKER
    });
    markersRef.current.push(startMarker);

    // Add end marker
    const endMarker = new google.maps.Marker({
      position: { lat: route.end.lat, lng: route.end.lon },
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#ef4444',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 2
      },
      title: 'Destination',
      zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_MARKER
    });
    markersRef.current.push(endMarker);

    // Draw each leg
    route.legs.forEach((leg) => {
      const path = getRouteLegOverlayCoordinates(leg).map((coord) => {
        const [lon, lat] = coord;
        return { lat, lng: lon };
      });

      drawLeg(map, leg, path, polylinesRef.current, markersRef.current);
    });

    // Cleanup when component unmounts or route changes
    return () => {
      clearOverlays();
    };
  }, [map, route, clearOverlays]);

  // This component doesn't render anything - it just manages map overlays
  return null;
}

function drawLeg(
  map: google.maps.Map,
  leg: RouteLeg,
  path: google.maps.LatLngLiteral[],
  polylines: google.maps.Polyline[],
  markers: google.maps.Marker[]
) {
  const isTransit = leg.mode === 'transit';
  const isWalk = leg.mode === 'walk';
  const isBus = leg.mode === 'transit_bus';
  const isDriving = leg.mode === 'driving';
  const isCommuterExpressLeg = isBus && Boolean(leg.line?.startsWith('LADOT CE'));
  const isLineTransit = isTransit || isCommuterExpressLeg;

  // Get colors based on mode
  const getLineColor = () => {
    if (isLineTransit) return leg.color || '#3b82f6';
    if (isWalk) return '#9ca3af';
    if (isBus) return '#3b82f6';
    if (isDriving) return '#60A5FA';
    return '#39FF14'; // Bike - neon green
  };

  const isDashed = isWalk || (isBus && !isCommuterExpressLeg);
  const lineWeight = isLineTransit ? 6 : 4;
  const casingWeight = isLineTransit ? 12 : 10;

  // White outer casing
  const whiteCasing = new google.maps.Polyline({
    path,
    map,
    strokeColor: '#ffffff',
    strokeWeight: casingWeight,
    strokeOpacity: 0.9,
    zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_OUTER_CASING
  });
  polylines.push(whiteCasing);

  // Dark casing
  const darkCasing = new google.maps.Polyline({
    path,
    map,
    strokeColor: '#1a1a2e',
    strokeWeight: casingWeight - 3,
    strokeOpacity: 1,
    zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_INNER_CASING
  });
  polylines.push(darkCasing);

  // Main colored line
  if (isDashed) {
    const dashedLine = new google.maps.Polyline({
      path,
      map,
      strokeColor: getLineColor(),
      strokeWeight: lineWeight,
      strokeOpacity: 0,
      icons: [{
        icon: {
          path: 'M 0,-1 0,1',
          strokeOpacity: 1,
          scale: 2
        },
        offset: '0',
        repeat: isWalk ? '12px' : '14px'
      }],
      zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_MAIN
    });
    polylines.push(dashedLine);
  } else {
    const solidLine = new google.maps.Polyline({
      path,
      map,
      strokeColor: getLineColor(),
      strokeWeight: lineWeight,
      strokeOpacity: 1,
      zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_MAIN
    });
    polylines.push(solidLine);
  }

  // Station markers for transit legs
  if (isLineTransit && leg.stations) {
    leg.stations.forEach((station) => {
      const stationMarker = new google.maps.Marker({
        position: { lat: station.lat, lng: station.lon },
        map,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 5,
          fillColor: leg.color || '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2
        },
        title: station.name,
        zIndex: MAP_OVERLAY_Z_INDEX.SELECTED_ROUTE_MARKER
      });
      markers.push(stationMarker);
    });
  }
}
