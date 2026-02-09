import { create } from 'zustand';
import type { VehiclePosition, TrackedVehicle } from '@/types';

interface RealtimeState {
  // Vehicle tracking
  trackedVehicle: TrackedVehicle | null;
  vehiclePosition: VehiclePosition | null;
  isTrackingActive: boolean;

  // Data freshness
  lastUpdate: number | null;

  // Actions
  trackVehicle: (tripId: string | null, routeId: string | null) => void;
  untrackVehicle: () => void;
  setVehiclePosition: (position: VehiclePosition | null) => void;
  setLastUpdate: (timestamp: number) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  trackedVehicle: null,
  vehiclePosition: null,
  isTrackingActive: false,
  lastUpdate: null,

  trackVehicle: (tripId, routeId) => set({
    trackedVehicle: { tripId, routeId },
    isTrackingActive: true,
  }),

  untrackVehicle: () => set({
    trackedVehicle: null,
    vehiclePosition: null,
    isTrackingActive: false,
  }),

  setVehiclePosition: (vehiclePosition) => set({
    vehiclePosition,
    lastUpdate: Date.now(),
  }),

  setLastUpdate: (lastUpdate) => set({ lastUpdate }),
}));
