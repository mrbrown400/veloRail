import { useEffect, useRef } from 'react';
import { useGoogleMap } from '@react-google-maps/api';
import { getOrderedMapOverlayDefinitions } from './mapOverlayRegistry';
import { useMapOverlayStore } from '@/stores';
import type { MapOverlayFeatureIdentity, MapOverlayHandle } from '@/types/mapOverlays';

interface ActiveOverlay {
  id: string;
  handle: MapOverlayHandle;
}

function getOverlayFeatureHighlight(
  overlayId: string,
  hoveredFeature: MapOverlayFeatureIdentity | null,
  selectedFeature: MapOverlayFeatureIdentity | null
) {
  if (selectedFeature?.overlayId === overlayId) {
    return {
      featureId: selectedFeature.featureId,
      state: 'selected' as const
    };
  }

  if (hoveredFeature?.overlayId === overlayId) {
    return {
      featureId: hoveredFeature.featureId,
      state: 'hovered' as const
    };
  }

  return null;
}

export function MapOverlayRenderer() {
  const map = useGoogleMap();
  const visibility = useMapOverlayStore((state) => state.visibility);
  const hoveredFeature = useMapOverlayStore((state) => state.hoveredFeature);
  const selectedFeature = useMapOverlayStore((state) => state.selectedFeature);
  const activeOverlaysRef = useRef<ActiveOverlay[]>([]);
  const visibilityRef = useRef(visibility);
  const hoveredFeatureRef = useRef(hoveredFeature);
  const selectedFeatureRef = useRef(selectedFeature);

  useEffect(() => {
    visibilityRef.current = visibility;
    activeOverlaysRef.current.forEach(({ id, handle }) => {
      handle.setVisible(visibility[id] ?? false);
    });
  }, [visibility]);

  useEffect(() => {
    hoveredFeatureRef.current = hoveredFeature;
    selectedFeatureRef.current = selectedFeature;

    activeOverlaysRef.current.forEach(({ id, handle }) => {
      handle.setFeatureHighlight?.(getOverlayFeatureHighlight(id, hoveredFeature, selectedFeature));
    });
  }, [hoveredFeature, selectedFeature]);

  useEffect(() => {
    if (!map) return undefined;

    const activeOverlays = getOrderedMapOverlayDefinitions().map((definition) => ({
      id: definition.id,
      handle: definition.create(map)
    }));

    activeOverlaysRef.current = activeOverlays;
    activeOverlays.forEach(({ id, handle }) => {
      handle.setVisible(visibilityRef.current[id] ?? false);
      handle.setFeatureHighlight?.(getOverlayFeatureHighlight(
        id,
        hoveredFeatureRef.current,
        selectedFeatureRef.current
      ));
    });

    return () => {
      activeOverlays.forEach(({ handle }) => handle.dispose());
      activeOverlaysRef.current = [];
    };
  }, [map]);

  return null;
}
