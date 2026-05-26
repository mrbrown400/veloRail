import { create } from 'zustand';
import type { SearchMode, LocationStatus, Location } from '@/types';

export type RouteSheetState = 'collapsed' | 'half' | 'full';
export type BottomSurface = 'none' | 'search' | 'route' | 'layers' | 'metadata' | 'bike-settings';

interface UIState {
  searchMode: SearchMode;
  sidebarOpen: boolean;
  routeSheetState: RouteSheetState;
  activeBottomSurface: BottomSurface;
  locationStatus: LocationStatus;
  currentLocation: Location | null;
  isUsingGeolocation: boolean;

  // Actions
  setSearchMode: (mode: SearchMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setRouteSheetState: (state: RouteSheetState) => void;
  setActiveBottomSurface: (surface: BottomSurface) => void;
  openRouteSheet: (state?: Exclude<RouteSheetState, 'collapsed'>) => void;
  closeRouteSheet: () => void;
  setLocationStatus: (status: LocationStatus) => void;
  setCurrentLocation: (location: Location | null) => void;
  setUsingGeolocation: (using: boolean) => void;
  expandSearch: () => void;
  collapseSearch: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  searchMode: 'collapsed',
  sidebarOpen: false,
  routeSheetState: 'collapsed',
  activeBottomSurface: 'none',
  locationStatus: 'idle',
  currentLocation: null,
  isUsingGeolocation: false,

  setSearchMode: (searchMode) => set({ searchMode }),

  setSidebarOpen: (sidebarOpen) => set((state) => ({
    sidebarOpen,
    routeSheetState: sidebarOpen && state.routeSheetState === 'collapsed' ? 'half' : state.routeSheetState,
    activeBottomSurface: sidebarOpen ? 'route' : state.activeBottomSurface === 'route' ? 'none' : state.activeBottomSurface
  })),

  setRouteSheetState: (routeSheetState) => set({
    routeSheetState,
    sidebarOpen: routeSheetState !== 'collapsed',
    activeBottomSurface: routeSheetState === 'collapsed' ? 'none' : 'route'
  }),

  setActiveBottomSurface: (activeBottomSurface) => set({ activeBottomSurface }),

  openRouteSheet: (routeSheetState = 'half') => set({
    sidebarOpen: true,
    routeSheetState,
    activeBottomSurface: 'route'
  }),

  closeRouteSheet: () => set({
    sidebarOpen: false,
    routeSheetState: 'collapsed',
    activeBottomSurface: 'none'
  }),

  setLocationStatus: (locationStatus) => set({ locationStatus }),

  setCurrentLocation: (currentLocation) => set({
    currentLocation,
    locationStatus: currentLocation ? 'granted' : 'idle'
  }),

  setUsingGeolocation: (isUsingGeolocation) => set({ isUsingGeolocation }),

  expandSearch: () => set({ searchMode: 'expanded', activeBottomSurface: 'search' }),

  collapseSearch: () => set((state) => ({
    searchMode: 'collapsed',
    activeBottomSurface: state.activeBottomSurface === 'search' ? 'none' : state.activeBottomSurface
  })),
}));
