/**
 * Realtime Store - In-memory cache for GTFS-RT data
 *
 * Manages real-time trip updates with automatic refresh and TTL-based expiration.
 * Provides fast lookups by trip ID and stop ID.
 */

import { fetchAllTripUpdates, isRealtimeConfigured } from './gtfs_rt_fetcher.js';
import { fetchAllVehiclePositions } from './vehicle_positions.js';
import { CONFIG } from '../config.js';

// In-memory store state
const store = {
    tripUpdates: new Map(),      // tripId -> TripUpdate
    stopDelays: new Map(),       // stopId -> Map<tripId, StopTimeUpdate>
    lastUpdate: null,            // Timestamp of last successful fetch
    isRefreshing: false,
    refreshTimer: null,

    // Vehicle positions
    vehiclePositions: new Map(), // vehicleId -> VehiclePosition
    vehiclesByTrip: new Map(),   // tripId -> VehiclePosition
    vehiclesByRoute: new Map(),  // routeId -> Array<VehiclePosition>
    vehicleLastUpdate: null,
    vehicleRefreshTimer: null,
    isVehicleRefreshing: false,

    // Tracked vehicle for current route
    trackedVehicle: null,        // { tripId, routeId, onUpdate callback }
    vehicleUpdateListeners: []   // Array of callbacks for vehicle updates
};

/**
 * Initialize the realtime store and start auto-refresh
 */
export function initRealtimeStore() {
    if (!isRealtimeConfigured()) {
        console.log('[Realtime] No API keys configured, real-time disabled');
        return;
    }

    console.log('[Realtime] Initializing real-time store');

    // Initial fetch
    refreshStore();

    // Set up periodic refresh
    store.refreshTimer = setInterval(() => {
        refreshStore();
    }, CONFIG.REALTIME_REFRESH_INTERVAL);
}

/**
 * Stop the auto-refresh timer
 */
export function stopRealtimeStore() {
    if (store.refreshTimer) {
        clearInterval(store.refreshTimer);
        store.refreshTimer = null;
    }
}

/**
 * Refresh the store with fresh data from APIs
 */
async function refreshStore() {
    if (store.isRefreshing) {
        console.debug('[Realtime] Refresh already in progress, skipping');
        return;
    }

    store.isRefreshing = true;

    try {
        const tripUpdates = await fetchAllTripUpdates();

        // Clear and rebuild maps
        store.tripUpdates.clear();
        store.stopDelays.clear();

        for (const update of tripUpdates) {
            // Index by trip ID
            if (update.tripId) {
                store.tripUpdates.set(update.tripId, update);
            }

            // Index by stop ID for quick lookups
            for (const stopUpdate of update.stopTimeUpdates) {
                if (stopUpdate.stopId) {
                    if (!store.stopDelays.has(stopUpdate.stopId)) {
                        store.stopDelays.set(stopUpdate.stopId, new Map());
                    }
                    store.stopDelays.get(stopUpdate.stopId).set(update.tripId, {
                        ...stopUpdate,
                        tripId: update.tripId,
                        routeId: update.routeId,
                        timestamp: update.timestamp
                    });
                }
            }
        }

        store.lastUpdate = Date.now();

        const tripCount = store.tripUpdates.size;
        const stopCount = store.stopDelays.size;
        console.log(`[Realtime] Updated: ${tripCount} trips, ${stopCount} stops`);

    } catch (error) {
        console.warn('[Realtime] Refresh failed:', error.message);
    } finally {
        store.isRefreshing = false;
    }
}

/**
 * Get delay info for a specific trip
 * @param {string} tripId - GTFS trip_id
 * @returns {TripUpdate|null}
 */
export function getTripUpdate(tripId) {
    if (!isDataFresh()) return null;
    return store.tripUpdates.get(tripId) || null;
}

/**
 * Get delay info for a specific stop
 * @param {string} stopId - GTFS stop_id
 * @returns {Map<string, StopTimeUpdate>|null} Map of tripId -> StopTimeUpdate
 */
export function getStopDelays(stopId) {
    if (!isDataFresh()) return null;
    return store.stopDelays.get(stopId) || null;
}

/**
 * Get delay for a specific trip at a specific stop
 * @param {string} tripId - GTFS trip_id
 * @param {string} stopId - GTFS stop_id
 * @returns {StopTimeUpdate|null}
 */
export function getTripStopDelay(tripId, stopId) {
    if (!isDataFresh()) return null;

    const tripUpdate = store.tripUpdates.get(tripId);
    if (!tripUpdate) return null;

    for (const stopUpdate of tripUpdate.stopTimeUpdates) {
        if (stopUpdate.stopId === stopId) {
            return stopUpdate;
        }
    }

    return null;
}

/**
 * Get departure delay in seconds for a trip at a stop
 * Returns the delay to apply to scheduled time
 * @param {string} tripId - GTFS trip_id
 * @param {string} stopId - GTFS stop_id
 * @returns {number|null} Delay in seconds (positive = late, negative = early), null if no data
 */
export function getDepartureDelay(tripId, stopId) {
    const stopUpdate = getTripStopDelay(tripId, stopId);
    if (!stopUpdate) return null;

    // Prefer departure delay, fall back to arrival delay
    if (stopUpdate.departure && stopUpdate.departure.delay !== undefined) {
        return stopUpdate.departure.delay;
    }
    if (stopUpdate.arrival && stopUpdate.arrival.delay !== undefined) {
        return stopUpdate.arrival.delay;
    }

    return null;
}

/**
 * Get real-time departure time for a trip at a stop
 * @param {string} tripId - GTFS trip_id
 * @param {string} stopId - GTFS stop_id
 * @returns {Date|null} Predicted departure time, null if no data
 */
export function getRealtimeDepartureTime(tripId, stopId) {
    const stopUpdate = getTripStopDelay(tripId, stopId);
    if (!stopUpdate) return null;

    // Prefer departure time, fall back to arrival time
    const timeEvent = stopUpdate.departure || stopUpdate.arrival;
    if (timeEvent && timeEvent.time) {
        return new Date(timeEvent.time * 1000);
    }

    return null;
}

/**
 * Check if a trip is canceled
 * @param {string} tripId - GTFS trip_id
 * @returns {boolean}
 */
export function isTripCanceled(tripId) {
    const update = getTripUpdate(tripId);
    // scheduleRelationship 3 = CANCELED
    return update?.scheduleRelationship === 3;
}

/**
 * Check if cached data is still fresh
 * @returns {boolean}
 */
export function isDataFresh() {
    if (!store.lastUpdate) return false;
    return (Date.now() - store.lastUpdate) < CONFIG.REALTIME_CACHE_TTL;
}

/**
 * Check if real-time data is available
 * @returns {boolean}
 */
export function hasRealtimeData() {
    return isDataFresh() && store.tripUpdates.size > 0;
}

/**
 * Get store status for debugging
 * @returns {Object}
 */
export function getStoreStatus() {
    return {
        configured: isRealtimeConfigured(),
        fresh: isDataFresh(),
        lastUpdate: store.lastUpdate ? new Date(store.lastUpdate) : null,
        tripCount: store.tripUpdates.size,
        stopCount: store.stopDelays.size,
        refreshing: store.isRefreshing
    };
}

/**
 * Force a refresh of the store (for manual refresh)
 */
export async function forceRefresh() {
    await refreshStore();
}

// ==================== Vehicle Positions ====================

/**
 * Start vehicle position tracking
 */
export function startVehicleTracking() {
    if (!isRealtimeConfigured()) {
        console.log('[Realtime] No API keys configured, vehicle tracking disabled');
        return;
    }

    if (store.vehicleRefreshTimer) {
        return; // Already running
    }

    console.log('[Realtime] Starting vehicle position tracking');

    // Initial fetch
    refreshVehiclePositions();

    // Set up periodic refresh
    store.vehicleRefreshTimer = setInterval(() => {
        refreshVehiclePositions();
    }, CONFIG.VEHICLE_REFRESH_INTERVAL);
}

/**
 * Stop vehicle position tracking
 */
export function stopVehicleTracking() {
    if (store.vehicleRefreshTimer) {
        clearInterval(store.vehicleRefreshTimer);
        store.vehicleRefreshTimer = null;
    }
    store.trackedVehicle = null;
    store.vehicleUpdateListeners = [];
}

/**
 * Refresh vehicle positions from APIs
 */
async function refreshVehiclePositions() {
    if (store.isVehicleRefreshing) {
        return;
    }

    store.isVehicleRefreshing = true;

    try {
        const positions = await fetchAllVehiclePositions();

        // Clear and rebuild maps
        store.vehiclePositions.clear();
        store.vehiclesByTrip.clear();
        store.vehiclesByRoute.clear();

        for (const pos of positions) {
            // Index by vehicle ID
            if (pos.vehicleId) {
                store.vehiclePositions.set(pos.vehicleId, pos);
            }

            // Index by trip ID
            if (pos.tripId) {
                store.vehiclesByTrip.set(pos.tripId, pos);
            }

            // Index by route ID
            if (pos.routeId) {
                if (!store.vehiclesByRoute.has(pos.routeId)) {
                    store.vehiclesByRoute.set(pos.routeId, []);
                }
                store.vehiclesByRoute.get(pos.routeId).push(pos);
            }
        }

        store.vehicleLastUpdate = Date.now();

        // Notify listeners if we're tracking a vehicle
        if (store.trackedVehicle) {
            const trackedPos = getTrackedVehiclePosition();
            if (trackedPos) {
                notifyVehicleListeners(trackedPos);
            }
        }

        console.log(`[Realtime] Updated: ${positions.length} vehicle positions`);

    } catch (error) {
        console.warn('[Realtime] Vehicle position refresh failed:', error.message);
    } finally {
        store.isVehicleRefreshing = false;
    }
}

/**
 * Get vehicle position by trip ID
 * @param {string} tripId
 * @returns {VehiclePosition|null}
 */
export function getVehicleByTripId(tripId) {
    if (!isVehicleDataFresh()) return null;
    return store.vehiclesByTrip.get(tripId) || null;
}

/**
 * Get all vehicles on a route
 * @param {string} routeId
 * @returns {Array<VehiclePosition>}
 */
export function getVehiclesByRouteId(routeId) {
    if (!isVehicleDataFresh()) return [];
    return store.vehiclesByRoute.get(routeId) || [];
}

/**
 * Get all vehicle positions
 * @returns {Array<VehiclePosition>}
 */
export function getAllVehiclePositions() {
    if (!isVehicleDataFresh()) return [];
    return Array.from(store.vehiclePositions.values());
}

/**
 * Check if vehicle data is fresh
 * @returns {boolean}
 */
export function isVehicleDataFresh() {
    if (!store.vehicleLastUpdate) return false;
    return (Date.now() - store.vehicleLastUpdate) < CONFIG.REALTIME_CACHE_TTL;
}

/**
 * Check if vehicle positions are available
 * @returns {boolean}
 */
export function hasVehiclePositions() {
    return isVehicleDataFresh() && store.vehiclePositions.size > 0;
}

/**
 * Start tracking a specific vehicle for a route
 * @param {string} tripId - Trip ID to track (optional)
 * @param {string} routeId - Route ID to track (used if tripId not found)
 */
export function trackVehicle(tripId, routeId) {
    store.trackedVehicle = { tripId, routeId };

    // Start vehicle tracking if not already running
    startVehicleTracking();

    // Return current position if available
    return getTrackedVehiclePosition();
}

/**
 * Stop tracking the current vehicle
 */
export function untrackVehicle() {
    store.trackedVehicle = null;
    store.vehicleUpdateListeners = [];
}

/**
 * Get the currently tracked vehicle position
 * @returns {VehiclePosition|null}
 */
export function getTrackedVehiclePosition() {
    if (!store.trackedVehicle) return null;

    // Try by trip ID first
    if (store.trackedVehicle.tripId) {
        const byTrip = getVehicleByTripId(store.trackedVehicle.tripId);
        if (byTrip) return byTrip;
    }

    // Fall back to first vehicle on route
    if (store.trackedVehicle.routeId) {
        const vehicles = getVehiclesByRouteId(store.trackedVehicle.routeId);
        if (vehicles.length > 0) {
            // Return closest to the user's boarding stop if possible
            // For now, just return the first one
            return vehicles[0];
        }
    }

    return null;
}

/**
 * Add a listener for vehicle position updates
 * @param {Function} callback - Called with VehiclePosition when updated
 * @returns {Function} Unsubscribe function
 */
export function onVehicleUpdate(callback) {
    store.vehicleUpdateListeners.push(callback);
    return () => {
        const idx = store.vehicleUpdateListeners.indexOf(callback);
        if (idx >= 0) {
            store.vehicleUpdateListeners.splice(idx, 1);
        }
    };
}

/**
 * Notify all listeners of vehicle update
 * @param {VehiclePosition} position
 */
function notifyVehicleListeners(position) {
    for (const listener of store.vehicleUpdateListeners) {
        try {
            listener(position);
        } catch (error) {
            console.warn('[Realtime] Vehicle listener error:', error);
        }
    }
}

/**
 * Get vehicle store status for debugging
 * @returns {Object}
 */
export function getVehicleStoreStatus() {
    return {
        configured: isRealtimeConfigured(),
        fresh: isVehicleDataFresh(),
        lastUpdate: store.vehicleLastUpdate ? new Date(store.vehicleLastUpdate) : null,
        vehicleCount: store.vehiclePositions.size,
        trackedVehicle: store.trackedVehicle,
        refreshing: store.isVehicleRefreshing
    };
}
