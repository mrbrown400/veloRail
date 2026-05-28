import { useEffect } from 'react';
import { useRouteStore, useUIStore } from '@/stores';
import type { Route } from '@/types';

const ROUTE_RESULTS_TEST_EVENT = 'velorail:test:set-route-results';

interface RouteResultsTestEventDetail {
  routes: Route[];
  selectedRouteIndex?: number;
  sheetState?: 'half' | 'full';
}

export function useRouteResultsBrowserTestSeam() {
  const setRoutes = useRouteStore((state) => state.setRoutes);
  const selectRoute = useRouteStore((state) => state.selectRoute);
  const setLoading = useRouteStore((state) => state.setLoading);
  const setError = useRouteStore((state) => state.setError);
  const expandSearch = useUIStore((state) => state.expandSearch);
  const openRouteSheet = useUIStore((state) => state.openRouteSheet);

  useEffect(() => {
    // Playwright preview builds opt into this seam to seed real route/UI stores.
    if (import.meta.env.VITE_BROWSER_TEST_SEAMS !== '1') return undefined;

    const handleRouteResults = (event: Event) => {
      const detail = (event as CustomEvent<RouteResultsTestEventDetail>).detail;
      if (!detail?.routes?.length) return;

      const selectedRoute = detail.routes[detail.selectedRouteIndex ?? 0] ?? detail.routes[0];

      setLoading(false);
      setError(null);
      setRoutes(detail.routes);
      selectRoute(selectedRoute);
      expandSearch();
      openRouteSheet(detail.sheetState === 'full' ? 'full' : 'half');
    };

    window.addEventListener(ROUTE_RESULTS_TEST_EVENT, handleRouteResults);

    return () => {
      window.removeEventListener(ROUTE_RESULTS_TEST_EVENT, handleRouteResults);
    };
  }, [
    expandSearch,
    openRouteSheet,
    selectRoute,
    setError,
    setLoading,
    setRoutes
  ]);
}
