import { useCallback } from 'react';
import { compareRoutes } from '@/services/routing';
import { useRouteStore, useUIStore, useRealtimeStore } from '@/stores';
import type { Location, Route } from '@/types';

interface UseRoutingReturn {
  calculateRoutes: (start: Location, end: Location) => Promise<Route[]>;
  isLoading: boolean;
  error: string | null;
}

export function useRouting(): UseRoutingReturn {
  const {
    searchParams,
    isLoading,
    error,
    setLoading,
    setError,
    setRoutes,
    selectRoute
  } = useRouteStore();

  const { setSidebarOpen, expandSearch } = useUIStore();
  const { trackVehicle } = useRealtimeStore();

  const calculateRoutesHandler = useCallback(async (
    start: Location,
    end: Location
  ): Promise<Route[]> => {
    setLoading(true);
    setError(null);

    try {
      const routes = await compareRoutes(
        start,
        end,
        searchParams.safety,
        searchParams.mode,
        searchParams.departureTime,
        false // includeFuture
      );

      setRoutes(routes);

      // Select first route and open sidebar
      if (routes.length > 0) {
        selectRoute(routes[0]);
        expandSearch();
        setSidebarOpen(true);

        // Start tracking vehicle for transit leg
        const primaryRoute = routes[0];
        const transitLeg = primaryRoute.legs.find(leg => leg.mode === 'transit');
        if (transitLeg) {
          trackVehicle(transitLeg.tripId || null, transitLeg.routeId || null);
        }
      } else {
        setSidebarOpen(true);
        setError('No route options found for those locations. Try another mode, a more specific place, or a shorter trip.');
      }

      return routes;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to calculate routes';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [
    searchParams.safety,
    searchParams.mode,
    searchParams.departureTime,
    setLoading,
    setError,
    setRoutes,
    selectRoute,
    expandSearch,
    setSidebarOpen,
    trackVehicle
  ]);

  return {
    calculateRoutes: calculateRoutesHandler,
    isLoading,
    error
  };
}
