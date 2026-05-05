import { create } from 'zustand';
import {
  getDefaultMapOverlayVisibility,
  getMapOverlayDefinition
} from '@/components/Map/mapOverlayRegistry';
import type { MapOverlayId, MapOverlayVisibility } from '@/types/mapOverlays';

interface MapOverlayState {
  visibility: MapOverlayVisibility;
  setOverlayVisible: (id: MapOverlayId, visible: boolean) => void;
  toggleOverlay: (id: MapOverlayId) => void;
  resetOverlayVisibility: () => void;
}

export const useMapOverlayStore = create<MapOverlayState>((set) => ({
  visibility: getDefaultMapOverlayVisibility(),

  setOverlayVisible: (id, visible) => set((state) => {
    if (!getMapOverlayDefinition(id)) return {};

    return {
      visibility: {
        ...state.visibility,
        [id]: visible
      }
    };
  }),

  toggleOverlay: (id) => set((state) => {
    if (!getMapOverlayDefinition(id)) return {};

    return {
      visibility: {
        ...state.visibility,
        [id]: !(state.visibility[id] ?? false)
      }
    };
  }),

  resetOverlayVisibility: () => set({
    visibility: getDefaultMapOverlayVisibility()
  })
}));
