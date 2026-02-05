/**
 * Trip Updates - Merge real-time delays with static GTFS schedules
 *
 * Provides functions to apply real-time delay data to scheduled departure times.
 */

import {
    getDepartureDelay,
    getRealtimeDepartureTime,
    isTripCanceled,
    hasRealtimeData,
    getStopDelays
} from './realtime_store.js';

/**
 * Apply real-time delay to a scheduled departure
 *
 * @param {Object} scheduledDeparture - GTFS scheduled departure info
 * @param {string} scheduledDeparture.tripId - GTFS trip_id
 * @param {Date} scheduledDeparture.departureTime - Scheduled departure time
 * @param {string} scheduledDeparture.headsign - Trip headsign
 * @param {string} scheduledDeparture.routeId - Route ID
 * @param {string} stopId - GTFS stop_id
 * @returns {Object} Departure with real-time info applied
 */
export function applyRealtimeToScheduled(scheduledDeparture, stopId) {
    const { tripId, departureTime, headsign, routeId } = scheduledDeparture;

    // Check if we have real-time data
    if (!hasRealtimeData()) {
        return {
            ...scheduledDeparture,
            isRealtime: false,
            delaySeconds: null,
            isCanceled: false
        };
    }

    // Check if trip is canceled
    if (isTripCanceled(tripId)) {
        return {
            ...scheduledDeparture,
            isRealtime: true,
            delaySeconds: null,
            isCanceled: true
        };
    }

    // Try to get absolute real-time departure time first
    const realtimeTime = getRealtimeDepartureTime(tripId, stopId);
    if (realtimeTime) {
        const delaySeconds = Math.round((realtimeTime - departureTime) / 1000);
        return {
            tripId,
            departureTime: realtimeTime,
            scheduledDepartureTime: departureTime,
            headsign,
            routeId,
            isRealtime: true,
            delaySeconds,
            isCanceled: false
        };
    }

    // Fall back to delay offset
    const delaySeconds = getDepartureDelay(tripId, stopId);
    if (delaySeconds !== null) {
        const adjustedTime = new Date(departureTime.getTime() + delaySeconds * 1000);
        return {
            tripId,
            departureTime: adjustedTime,
            scheduledDepartureTime: departureTime,
            headsign,
            routeId,
            isRealtime: true,
            delaySeconds,
            isCanceled: false
        };
    }

    // No real-time data for this specific trip/stop
    return {
        ...scheduledDeparture,
        isRealtime: false,
        delaySeconds: null,
        isCanceled: false
    };
}

/**
 * Get best available delay info for a stop
 * Useful when we don't have a specific trip ID
 *
 * @param {string} stopId - GTFS stop_id
 * @returns {Object|null} Average delay info or null
 */
export function getAverageDelayForStop(stopId) {
    if (!hasRealtimeData()) return null;

    const stopDelays = getStopDelays(stopId);
    if (!stopDelays || stopDelays.size === 0) return null;

    let totalDelay = 0;
    let count = 0;

    for (const [tripId, update] of stopDelays) {
        const delay = update.departure?.delay ?? update.arrival?.delay;
        if (delay !== undefined) {
            totalDelay += delay;
            count++;
        }
    }

    if (count === 0) return null;

    return {
        averageDelay: Math.round(totalDelay / count),
        tripCount: count,
        isRealtime: true
    };
}

/**
 * Format delay for display
 * @param {number} delaySeconds - Delay in seconds
 * @returns {string}
 */
export function formatDelay(delaySeconds) {
    if (delaySeconds === null || delaySeconds === undefined) {
        return '';
    }

    const absDelay = Math.abs(delaySeconds);
    const minutes = Math.round(absDelay / 60);

    if (absDelay < 60) {
        return 'On time';
    }

    if (delaySeconds > 0) {
        return minutes === 1 ? '1 min late' : `${minutes} min late`;
    }

    return minutes === 1 ? '1 min early' : `${minutes} min early`;
}

/**
 * Get delay status category
 * @param {number} delaySeconds - Delay in seconds
 * @returns {'ontime' | 'late' | 'early' | 'unknown'}
 */
export function getDelayStatus(delaySeconds) {
    if (delaySeconds === null || delaySeconds === undefined) {
        return 'unknown';
    }

    // Consider within 1 minute as "on time"
    if (Math.abs(delaySeconds) < 60) {
        return 'ontime';
    }

    return delaySeconds > 0 ? 'late' : 'early';
}

/**
 * Check if a departure should be considered "arriving soon"
 * @param {number} waitSeconds - Wait time in seconds
 * @returns {boolean}
 */
export function isArrivingSoon(waitSeconds) {
    return waitSeconds < 60;
}

/**
 * Combine wait time and delay into a single display value
 * @param {number} waitSeconds - Wait time until departure
 * @param {number|null} delaySeconds - Delay from schedule
 * @param {boolean} isRealtime - Whether this is real-time data
 * @returns {Object}
 */
export function combineWaitAndDelay(waitSeconds, delaySeconds, isRealtime) {
    const waitMinutes = Math.round(waitSeconds / 60);

    return {
        waitMinutes,
        waitSeconds,
        delaySeconds,
        delayText: formatDelay(delaySeconds),
        delayStatus: getDelayStatus(delaySeconds),
        isRealtime,
        isArrivingSoon: isArrivingSoon(waitSeconds)
    };
}
