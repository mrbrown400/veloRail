import { create } from 'zustand';
import type { SearchMode, LocationStatus, Location } from '@/types';

interface UIState {
  searchMode: SearchMode;
  sidebarOpen: boolean;
  locationStatus: LocationStatus;
  currentLocation: Location | null;
  isUsingGeolocation: boolean;

  // Actions
  setSearchMode: (mode: SearchMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setLocationStatus: (status: LocationStatus) => void;
  setCurrentLocation: (location: Location | null) => void;
  setUsingGeolocation: (using: boolean) => void;
  expandSearch: () => void;
  collapseSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchMode: 'collapsed',
  sidebarOpen: false,
  locationStatus: 'pending',
  currentLocation: null,
  isUsingGeolocation: false,

  setSearchMode: (searchMode) => set({ searchMode }),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),

  setLocationStatus: (locationStatus) => set({ locationStatus }),

  setCurrentLocation: (currentLocation) => set({
    currentLocation,
    locationStatus: currentLocation ? 'granted' : 'pending'
  }),

  setUsingGeolocation: (isUsingGeolocation) => set({ isUsingGeolocation }),

  expandSearch: () => set({ searchMode: 'expanded' }),

  collapseSearch: () => set({ searchMode: 'collapsed' }),
}));
