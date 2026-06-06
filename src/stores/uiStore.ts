import { create } from 'zustand';
import type { SearchMode, LocationStatus, Location } from '@/types';

export type RouteSheetState = 'collapsed' | 'half' | 'full';
export type BottomSurface = 'none' | 'search' | 'route' | 'layers' | 'metadata' | 'bike-settings';

interface UIState {
  searchMode: SearchMode;
  sidebarOpen: boolean;
  routeSheetState: RouteSheetState;
  activeBottomSurface: BottomSurface;
  isLayerSurfaceOpen: boolean;
  bottomSurfaceReturn: BottomSurface;
  locationStatus: LocationStatus;
  currentLocation: Location | null;
  isUsingGeolocation: boolean;

  // Actions
  setSearchMode: (mode: SearchMode) => void;
  setSidebarOpen: (open: boolean) => void;
  setRouteSheetState: (state: RouteSheetState) => void;
  setActiveBottomSurface: (surface: BottomSurface) => void;
  openBottomSurface: (surface: Exclude<BottomSurface, 'none'>) => void;
  closeBottomSurface: (surface?: BottomSurface) => void;
  openRouteSheet: (state?: Exclude<RouteSheetState, 'collapsed'>) => void;
  closeRouteSheet: () => void;
  openLayerSurface: () => void;
  closeLayerSurface: () => void;
  openMetadataSurface: () => void;
  closeMetadataSurface: () => void;
  openBikeSettingsSurface: () => void;
  closeBikeSettingsSurface: () => void;
  setLocationStatus: (status: LocationStatus) => void;
  setCurrentLocation: (location: Location | null) => void;
  setUsingGeolocation: (using: boolean) => void;
  expandSearch: () => void;
  collapseSearch: () => void;
}

type SurfaceContext = Pick<UIState, 'isLayerSurfaceOpen' | 'searchMode' | 'sidebarOpen'>;

function getDefaultBottomSurface(
  state: SurfaceContext,
  options: { includeLayers?: boolean } = {}
): BottomSurface {
  const includeLayers = options.includeLayers ?? true;

  if (includeLayers && state.isLayerSurfaceOpen) {
    return 'layers';
  }

  if (state.sidebarOpen) {
    return 'route';
  }

  if (state.searchMode === 'expanded') {
    return 'search';
  }

  return 'none';
}

function getReturnSurface(state: UIState): BottomSurface {
  return state.activeBottomSurface === 'none'
    ? getDefaultBottomSurface(state)
    : state.activeBottomSurface;
}

function restoreBottomSurface(state: UIState, returnSurface: BottomSurface): BottomSurface {
  if (returnSurface === 'layers' && state.isLayerSurfaceOpen) {
    return 'layers';
  }

  if (returnSurface === 'route' && state.sidebarOpen) {
    return 'route';
  }

  if (returnSurface === 'search' && state.searchMode === 'expanded') {
    return 'search';
  }

  if (returnSurface === 'metadata' || returnSurface === 'bike-settings') {
    return getDefaultBottomSurface(state);
  }

  return getDefaultBottomSurface(state);
}

export const useUIStore = create<UIState>((set) => ({
  searchMode: 'collapsed',
  sidebarOpen: false,
  routeSheetState: 'collapsed',
  activeBottomSurface: 'none',
  isLayerSurfaceOpen: false,
  bottomSurfaceReturn: 'none',
  locationStatus: 'idle',
  currentLocation: null,
  isUsingGeolocation: false,

  setSearchMode: (searchMode) => set({ searchMode }),

  setSidebarOpen: (sidebarOpen) => set((state) => ({
    sidebarOpen,
    routeSheetState: sidebarOpen && state.routeSheetState === 'collapsed'
      ? 'half'
      : sidebarOpen
        ? state.routeSheetState
        : 'collapsed',
    activeBottomSurface: sidebarOpen
      ? 'route'
      : state.activeBottomSurface === 'route'
        ? getDefaultBottomSurface({ ...state, sidebarOpen: false }, { includeLayers: true })
        : state.activeBottomSurface
  })),

  setRouteSheetState: (routeSheetState) => set((state) => {
    const sidebarOpen = routeSheetState !== 'collapsed';

    return {
      routeSheetState,
      sidebarOpen,
      activeBottomSurface: sidebarOpen
        ? 'route'
        : state.activeBottomSurface === 'route'
          ? getDefaultBottomSurface({ ...state, sidebarOpen }, { includeLayers: true })
          : state.activeBottomSurface
    };
  }),

  setActiveBottomSurface: (activeBottomSurface) => set({ activeBottomSurface }),

  openBottomSurface: (surface) => set((state) => {
    if (surface === 'route') {
      return {
        sidebarOpen: true,
        routeSheetState: state.routeSheetState === 'collapsed' ? 'half' : state.routeSheetState,
        activeBottomSurface: 'route'
      };
    }

    if (surface === 'search') {
      return {
        searchMode: 'expanded',
        activeBottomSurface: 'search'
      };
    }

    if (surface === 'layers') {
      return {
        isLayerSurfaceOpen: true,
        activeBottomSurface: 'layers'
      };
    }

    return {
      activeBottomSurface: surface,
      bottomSurfaceReturn: state.activeBottomSurface === surface
        ? state.bottomSurfaceReturn
        : getReturnSurface(state)
    };
  }),

  closeBottomSurface: (surface) => set((state) => {
    const target = surface ?? state.activeBottomSurface;

    if (target === 'route') {
      return {
        sidebarOpen: false,
        routeSheetState: 'collapsed',
        activeBottomSurface: state.activeBottomSurface === 'route'
          ? getDefaultBottomSurface({ ...state, sidebarOpen: false }, { includeLayers: true })
          : state.activeBottomSurface
      };
    }

    if (target === 'search') {
      return {
        searchMode: 'collapsed',
        activeBottomSurface: state.activeBottomSurface === 'search'
          ? getDefaultBottomSurface({ ...state, searchMode: 'collapsed' }, { includeLayers: true })
          : state.activeBottomSurface
      };
    }

    if (target === 'layers') {
      return {
        isLayerSurfaceOpen: false,
        activeBottomSurface: state.activeBottomSurface === 'layers'
          ? getDefaultBottomSurface({ ...state, isLayerSurfaceOpen: false }, { includeLayers: false })
          : state.activeBottomSurface,
        bottomSurfaceReturn: state.bottomSurfaceReturn === 'layers'
          ? getDefaultBottomSurface({ ...state, isLayerSurfaceOpen: false }, { includeLayers: false })
          : state.bottomSurfaceReturn
      };
    }

    if (target === 'metadata' || target === 'bike-settings') {
      return {
        activeBottomSurface: state.activeBottomSurface === target
          ? restoreBottomSurface(state, state.bottomSurfaceReturn)
          : state.activeBottomSurface,
        bottomSurfaceReturn: state.activeBottomSurface === target ? 'none' : state.bottomSurfaceReturn
      };
    }

    return {
      activeBottomSurface: 'none',
      bottomSurfaceReturn: 'none'
    };
  }),

  openRouteSheet: (routeSheetState = 'half') => set({
    sidebarOpen: true,
    routeSheetState,
    activeBottomSurface: 'route'
  }),

  closeRouteSheet: () => set((state) => ({
    sidebarOpen: false,
    routeSheetState: 'collapsed',
    activeBottomSurface: state.activeBottomSurface === 'route'
      ? getDefaultBottomSurface({ ...state, sidebarOpen: false }, { includeLayers: true })
      : state.activeBottomSurface
  })),

  openLayerSurface: () => set({
    isLayerSurfaceOpen: true,
    activeBottomSurface: 'layers'
  }),

  closeLayerSurface: () => set((state) => ({
    isLayerSurfaceOpen: false,
    activeBottomSurface: state.activeBottomSurface === 'layers'
      ? getDefaultBottomSurface({ ...state, isLayerSurfaceOpen: false }, { includeLayers: false })
      : state.activeBottomSurface,
    bottomSurfaceReturn: state.bottomSurfaceReturn === 'layers'
      ? getDefaultBottomSurface({ ...state, isLayerSurfaceOpen: false }, { includeLayers: false })
      : state.bottomSurfaceReturn
  })),

  openMetadataSurface: () => set((state) => ({
    activeBottomSurface: 'metadata',
    bottomSurfaceReturn: state.activeBottomSurface === 'metadata'
      ? state.bottomSurfaceReturn
      : getReturnSurface(state)
  })),

  closeMetadataSurface: () => set((state) => ({
    activeBottomSurface: state.activeBottomSurface === 'metadata'
      ? restoreBottomSurface(state, state.bottomSurfaceReturn)
      : state.activeBottomSurface,
    bottomSurfaceReturn: state.activeBottomSurface === 'metadata' ? 'none' : state.bottomSurfaceReturn
  })),

  openBikeSettingsSurface: () => set((state) => ({
    activeBottomSurface: 'bike-settings',
    bottomSurfaceReturn: state.activeBottomSurface === 'bike-settings'
      ? state.bottomSurfaceReturn
      : getReturnSurface(state)
  })),

  closeBikeSettingsSurface: () => set((state) => ({
    activeBottomSurface: state.activeBottomSurface === 'bike-settings'
      ? restoreBottomSurface(state, state.bottomSurfaceReturn)
      : state.activeBottomSurface,
    bottomSurfaceReturn: state.activeBottomSurface === 'bike-settings' ? 'none' : state.bottomSurfaceReturn
  })),

  setLocationStatus: (locationStatus) => set({ locationStatus }),

  setCurrentLocation: (currentLocation) => set({
    currentLocation,
    locationStatus: currentLocation ? 'granted' : 'idle'
  }),

  setUsingGeolocation: (isUsingGeolocation) => set({ isUsingGeolocation }),

  expandSearch: () => set({ searchMode: 'expanded', activeBottomSurface: 'search' }),

  collapseSearch: () => set((state) => ({
    searchMode: 'collapsed',
    activeBottomSurface: state.activeBottomSurface === 'search'
      ? getDefaultBottomSurface({ ...state, searchMode: 'collapsed' }, { includeLayers: true })
      : state.activeBottomSurface
  })),
}));
