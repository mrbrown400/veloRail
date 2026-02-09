import { useEffect, useCallback } from 'react';
import { useRealtimeStore } from '@/stores';
import type { RouteLeg, VehiclePosition } from '@/types';

// Simulated vehicle position updates (in production, this would connect to GTFS-RT)
// For now, we'll just return null since we don't have real-time API access

interface UseVehicleTrackingReturn {
  position: VehiclePosition | null;
  isTracking: boolean;
  startTracking: (transitLeg: RouteLeg) => void;
  stopTracking: () => void;
}

export function useVehicleTracking(): UseVehicleTrackingReturn {
  const {
    vehiclePosition,
    isTrackingActive,
    trackVehicle,
    untrackVehicle
  } = useRealtimeStore();

  const startTracking = useCallback((transitLeg: RouteLeg) => {
    const tripId = transitLeg.tripId || null;
    const routeId = transitLeg.routeId || null;

    if (tripId || routeId) {
      trackVehicle(tripId, routeId);
    }
  }, [trackVehicle]);

  const stopTracking = useCallback(() => {
    untrackVehicle();
  }, [untrackVehicle]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    position: vehiclePosition,
    isTracking: isTrackingActive,
    startTracking,
    stopTracking
  };
}
