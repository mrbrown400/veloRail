import { create } from 'zustand';
import type { Route, SearchParams, ModeFilter, SafetyPreference } from '@/types';

interface RouteState {
  routes: Route[];
  selectedRoute: Route | null;
  isLoading: boolean;
  error: string | null;
  searchParams: SearchParams;

  // Actions
  setRoutes: (routes: Route[]) => void;
  selectRoute: (route: Route | null) => void;
  setSearchParams: (params: Partial<SearchParams>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialSearchParams: SearchParams = {
  start: null,
  end: null,
  mode: 'all' as ModeFilter,
  safety: 'balanced' as SafetyPreference,
  departureTime: new Date(),
  timeMode: 'departAt',
};

export const useRouteStore = create<RouteState>((set) => ({
  routes: [],
  selectedRoute: null,
  isLoading: false,
  error: null,
  searchParams: initialSearchParams,

  setRoutes: (routes) => set({
    routes,
    selectedRoute: routes[0] || null,
    error: null
  }),

  selectRoute: (route) => set({ selectedRoute: route }),

  setSearchParams: (params) => set((state) => ({
    searchParams: { ...state.searchParams, ...params }
  })),

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error, isLoading: false }),

  reset: () => set({
    routes: [],
    selectedRoute: null,
    isLoading: false,
    error: null,
    searchParams: initialSearchParams,
  }),
}));
