import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { getOrderedMapOverlayDefinitions } from './mapOverlayRegistry';
import { useMapOverlayStore } from '@/stores';
import type { MapOverlayHandle } from '@/types/mapOverlays';

interface ActiveOverlay {
  id: string;
  handle: MapOverlayHandle;
}

export function MapOverlayRenderer() {
  const map = useGoogleMap();
  const visibility = useMapOverlayStore((state) => state.visibility);
  const activeOverlaysRef = useRef<ActiveOverlay[]>([]);
  const visibilityRef = useRef(visibility);

  useEffect(() => {
    visibilityRef.current = visibility;
    activeOverlaysRef.current.forEach(({ id, handle }) => {
      handle.setVisible(visibility[id] ?? false);
    });
  }, [visibility]);

  useEffect(() => {
    if (!map) return undefined;

    const activeOverlays = getOrderedMapOverlayDefinitions().map((definition) => ({
      id: definition.id,
      handle: definition.create(map)
    }));

    activeOverlaysRef.current = activeOverlays;
    activeOverlays.forEach(({ id, handle }) => {
      handle.setVisible(visibilityRef.current[id] ?? false);
    });

    return () => {
      activeOverlays.forEach(({ handle }) => handle.dispose());
      activeOverlaysRef.current = [];
    };
  }, [map]);

  return null;
}
