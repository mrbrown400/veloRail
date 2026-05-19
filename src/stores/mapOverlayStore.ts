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
  MapOverlayId,
  MapOverlayVisibility
} from '@/types/mapOverlays';

interface MapOverlayState {
  visibility: MapOverlayVisibility;
  comparisonMode: MapOverlayComparisonMode;
  setComparisonMode: (mode: MapOverlayComparisonMode) => void;
  setOverlayVisible: (id: MapOverlayId, visible: boolean) => void;
  toggleOverlay: (id: MapOverlayId) => void;
  resetOverlayVisibility: () => void;
}

const defaultVisibility = getDefaultMapOverlayVisibility();
const defaultComparisonMode = getMapOverlayComparisonModeForVisibility(defaultVisibility);

export const useMapOverlayStore = create<MapOverlayState>((set) => ({
  visibility: defaultVisibility,
  comparisonMode: defaultComparisonMode,

  setComparisonMode: (mode) => set((state) => {
    const definition = getMapOverlayComparisonModeDefinition(mode);

    return {
      comparisonMode: definition.id,
      visibility: {
        ...state.visibility,
        [FUTURE_PROJECTS_OVERLAY_ID]: definition.futureOverlayVisible
      }
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
      comparisonMode: getMapOverlayComparisonModeForVisibility(visibility)
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
      comparisonMode: getMapOverlayComparisonModeForVisibility(visibility)
    };
  }),

  resetOverlayVisibility: () => set({
    visibility: defaultVisibility,
    comparisonMode: defaultComparisonMode
  })
}));
