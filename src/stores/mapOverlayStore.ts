import { create } from 'zustand';
import {
  FUTURE_PROJECTS_OVERLAY_ID,
  getDefaultMapOverlayVisibility,
  getMapOverlayComparisonModeDefinition,
  getMapOverlayComparisonModeForVisibility,
  getMapOverlayDefinition
} from '@/components/Map/mapOverlayRegistry';
import type {
  MapOverlayComparisonMode,
  MapOverlayFeatureIdentity,
  MapOverlayId,
  MapOverlayVisibility
} from '@/types/mapOverlays';

interface MapOverlayState {
  visibility: MapOverlayVisibility;
  comparisonMode: MapOverlayComparisonMode;
  hoveredFeature: MapOverlayFeatureIdentity | null;
  selectedFeature: MapOverlayFeatureIdentity | null;
  setComparisonMode: (mode: MapOverlayComparisonMode) => void;
  setOverlayVisible: (id: MapOverlayId, visible: boolean) => void;
  toggleOverlay: (id: MapOverlayId) => void;
  setHoveredFeature: (identity: MapOverlayFeatureIdentity | null) => void;
  setSelectedFeature: (identity: MapOverlayFeatureIdentity | null) => void;
  clearOverlayFeatureSelection: () => void;
  resetOverlayVisibility: () => void;
}

const defaultVisibility = getDefaultMapOverlayVisibility();
const defaultComparisonMode = getMapOverlayComparisonModeForVisibility(defaultVisibility);

function isFeatureVisible(
  feature: MapOverlayFeatureIdentity | null,
  visibility: MapOverlayVisibility
): boolean {
  if (!feature) return true;
  return visibility[feature.overlayId] ?? false;
}

function retainVisibleFeature(
  feature: MapOverlayFeatureIdentity | null,
  visibility: MapOverlayVisibility
): MapOverlayFeatureIdentity | null {
  return isFeatureVisible(feature, visibility) ? feature : null;
}

export const useMapOverlayStore = create<MapOverlayState>((set) => ({
  visibility: defaultVisibility,
  comparisonMode: defaultComparisonMode,
  hoveredFeature: null,
  selectedFeature: null,

  setComparisonMode: (mode) => set((state) => {
    const definition = getMapOverlayComparisonModeDefinition(mode);
    const visibility = {
      ...state.visibility,
      [FUTURE_PROJECTS_OVERLAY_ID]: definition.futureOverlayVisible
    };

    return {
      comparisonMode: definition.id,
      visibility,
      hoveredFeature: retainVisibleFeature(state.hoveredFeature, visibility),
      selectedFeature: retainVisibleFeature(state.selectedFeature, visibility)
    };
  }),

  setOverlayVisible: (id, visible) => set((state) => {
    if (!getMapOverlayDefinition(id)) return {};

    const visibility = {
      ...state.visibility,
      [id]: visible
    };

    return {
      visibility,
      comparisonMode: getMapOverlayComparisonModeForVisibility(visibility),
      hoveredFeature: retainVisibleFeature(state.hoveredFeature, visibility),
      selectedFeature: retainVisibleFeature(state.selectedFeature, visibility)
    };
  }),

  toggleOverlay: (id) => set((state) => {
    if (!getMapOverlayDefinition(id)) return {};

    const visibility = {
      ...state.visibility,
      [id]: !(state.visibility[id] ?? false)
    };

    return {
      visibility,
      comparisonMode: getMapOverlayComparisonModeForVisibility(visibility),
      hoveredFeature: retainVisibleFeature(state.hoveredFeature, visibility),
      selectedFeature: retainVisibleFeature(state.selectedFeature, visibility)
    };
  }),

  setHoveredFeature: (identity) => set({ hoveredFeature: identity }),
  setSelectedFeature: (identity) => set({ selectedFeature: identity }),
  clearOverlayFeatureSelection: () => set({ hoveredFeature: null, selectedFeature: null }),

  resetOverlayVisibility: () => set({
    visibility: defaultVisibility,
    comparisonMode: defaultComparisonMode,
    hoveredFeature: null,
    selectedFeature: null
  })
}));
