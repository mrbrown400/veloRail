// Schedule module for time-aware routing
// Handles operating hours checks and wait time estimation
// Now with GTFS integration for actual departure times
// And GTFS-RT integration for real-time delay data

import { TRANSIT_LINES } from './transit_data.js';
import { getWaitTimeForStation, isGTFSQueryable, getNextDepartures } from './gtfs/gtfs_query.js';
import { getGTFSStopId } from './gtfs/stop_mapping.js';
import { applyRealtimeToScheduled, formatDelay, getDelayStatus } from './realtime/trip_updates.js';
import { hasRealtimeData } from './realtime/realtime_store.js';

/**
 * Get the day type for a given date
 * @param {Date} date
 * @returns {'weekday' | 'saturday' | 'sunday'}
 */
export function getDayType(date) {
    const day = date.getDay();
    if (day === 0) return 'sunday';
    if (day === 6) return 'saturday';
    return 'weekday';
}

/**
 * Format time as HH:MM string
 * @param {Date} date
 * @returns {string}
 */
export function formatTime(date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Convert HH:MM string to minutes since midnight
 * @param {string} timeStr
 * @returns {number}
 */
function timeToMinutes(timeStr) {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
}

/**
 * Check if a time is within a range (handles overnight ranges like 04:30-00:30)
 * @param {string} timeStr - Time to check (HH:MM)
 * @param {string} startStr - Range start (HH:MM)
 * @param {string} endStr - Range end (HH:MM)
 * @returns {boolean}
 */
export function isTimeInRange(timeStr, startStr, endStr) {
    const time = timeToMinutes(timeStr);
    const start = timeToMinutes(startStr);
    const end = timeToMinutes(endStr);

    // Handle overnight range (e.g., 04:30 to 00:30)
    if (end < start) {
        // Time is valid if it's after start OR before end
        return time >= start || time <= end;
    }

    // Normal range
    return time >= start && time <= end;
}

/**
 * Check if a time is within peak hours
 * @param {string} timeStr - Time to check (HH:MM)
 * @param {object} hours - Operating hours with am_peak/pm_peak
 * @returns {boolean}
 */
function isInPeakWindow(timeStr, hours) {
    if (hours.am_peak) {
        if (isTimeInRange(timeStr, hours.am_peak.start, hours.am_peak.end)) {
            return true;
        }
    }
    if (hours.pm_peak) {
        if (isTimeInRange(timeStr, hours.pm_peak.start, hours.pm_peak.end)) {
            return true;
        }
    }
    return false;
}

/**
 * Check if a specific line is operating at the given time
 * @param {string} lineName - Name of the transit line
 * @param {Date} queryTime - Time to check
 * @param {Object} options - Options
 * @param {boolean} options.includeFuture - If true, include future lines (testing, under_construction, planned)
 * @returns {boolean}
 */
export function isLineOperating(lineName, queryTime, options = {}) {
    const { includeFuture = false } = options;
    const line = TRANSIT_LINES[lineName];
    if (!line || !line.schedule) {
        // Lines without schedule data are assumed to always operate
        return true;
    }

    // Check for lines that are not yet operational (testing, under construction, etc.)
    if (line.status === 'testing' || line.status === 'under_construction' || line.status === 'planned') {
        return includeFuture; // Show if future toggle is on
    }

    const dayType = getDayType(queryTime);
    const timeStr = formatTime(queryTime);
    const hours = line.schedule.operating_hours[dayType];

    // No service on this day
    if (hours === null || hours === undefined) {
        return false;
    }

    // Peak-only service (LADOT Commuter Express)
    if (hours.am_peak || hours.pm_peak) {
        return isInPeakWindow(timeStr, hours);
    }

    // Regular operating hours
    if (hours.start && hours.end) {
        return isTimeInRange(timeStr, hours.start, hours.end);
    }

    return false;
}

/**
 * Get the operational status of a line
 * @param {string} lineName - Name of the transit line
 * @returns {'operating' | 'testing' | 'under_construction' | 'planned' | 'unknown'}
 */
export function getLineStatus(lineName) {
    const line = TRANSIT_LINES[lineName];
    if (!line) return 'unknown';
    return line.status || 'operating';
}

/**
 * Get all lines that are operating at the given time
 * @param {Date} queryTime - Time to check
 * @returns {string[]} - Array of line names that are operating
 */
export function getOperatingLines(queryTime) {
    return Object.keys(TRANSIT_LINES).filter(lineName =>
        isLineOperating(lineName, queryTime)
    );
}

/**
 * Check if the given time is during peak hours (general definition)
 * Peak hours: 6:00-9:00 AM and 4:00-7:00 PM on weekdays
 * @param {Date} queryTime
 * @returns {boolean}
 */
export function isPeakHour(queryTime) {
    const dayType = getDayType(queryTime);
    if (dayType !== 'weekday') return false;

    const timeStr = formatTime(queryTime);
    const amPeak = isTimeInRange(timeStr, '06:00', '09:00');
    const pmPeak = isTimeInRange(timeStr, '16:00', '19:00');

    return amPeak || pmPeak;
}

/**
 * Estimate wait time for a transit line at the given time
 * @param {string} lineName - Name of the transit line
 * @param {Date} queryTime - Time to check
 * @returns {number} - Estimated wait time in seconds
 */
export function estimateWaitTime(lineName, queryTime) {
    const line = TRANSIT_LINES[lineName];
    if (!line || !line.schedule) {
        // Default 5 minute wait for lines without schedule data
        return 5 * 60;
    }

    const isPeak = isPeakHour(queryTime);
    const frequency = isPeak
        ? line.schedule.frequency_peak
        : line.schedule.frequency_offpeak;

    // If no off-peak frequency (peak-only service), use peak frequency
    const effectiveFrequency = frequency || line.schedule.frequency_peak || 15;

    // Average wait time = half the headway
    return (effectiveFrequency * 60) / 2;
}

/**
 * Get schedule information for a line
 * @param {string} lineName
 * @returns {object|null}
 */
export function getLineSchedule(lineName) {
    const line = TRANSIT_LINES[lineName];
    return line?.schedule || null;
}

/**
 * Get next departure information - uses GTFS when available, falls back to frequency
 * Now with GTFS-RT real-time delay integration
 * @param {string} lineName - Name of the transit line
 * @param {Date} arrivalTime - When user arrives at station
 * @param {string} stationName - Station name for GTFS lookup
 * @returns {Promise<{waitSeconds, departureTime?, headsign?, isEstimate, isRealtime?, delaySeconds?, delayText?, delayStatus?}>}
 */
export async function getNextDeparture(lineName, arrivalTime, stationName) {
    // Try GTFS first
    try {
        if (await isGTFSQueryable()) {
            const stopId = await getGTFSStopId(stationName);
            const departures = await getNextDepartures(stopId, arrivalTime, 1, 'metro_rail');

            if (departures && departures.length > 0) {
                const scheduled = departures[0];

                // Apply real-time data if available
                if (hasRealtimeData() && stopId) {
                    const withRealtime = applyRealtimeToScheduled({
                        tripId: scheduled.tripId,
                        departureTime: scheduled.departureTime,
                        headsign: scheduled.headsign,
                        routeId: scheduled.routeId
                    }, stopId);

                    if (withRealtime.isRealtime) {
                        const waitSeconds = Math.max(0, (withRealtime.departureTime - arrivalTime) / 1000);
                        return {
                            waitSeconds,
                            departureTime: withRealtime.departureTime,
                            scheduledDepartureTime: withRealtime.scheduledDepartureTime,
                            headsign: withRealtime.headsign,
                            routeId: withRealtime.routeId,
                            tripId: withRealtime.tripId,
                            isEstimate: false,
                            isRealtime: true,
                            delaySeconds: withRealtime.delaySeconds,
                            delayText: formatDelay(withRealtime.delaySeconds),
                            delayStatus: getDelayStatus(withRealtime.delaySeconds),
                            isCanceled: withRealtime.isCanceled
                        };
                    }
                }

                // No real-time data, return static GTFS
                const waitSeconds = Math.max(0, (scheduled.departureTime - arrivalTime) / 1000);
                return {
                    waitSeconds,
                    departureTime: scheduled.departureTime,
                    headsign: scheduled.headsign,
                    routeId: scheduled.routeId,
                    tripId: scheduled.tripId,
                    isEstimate: false,
                    isRealtime: false,
                    delaySeconds: null,
                    delayText: null,
                    delayStatus: null
                };
            }
        }
    } catch (error) {
        console.warn('[Schedule] GTFS query failed, using frequency estimate:', error);
    }

    // Fallback to frequency-based estimate
    return {
        waitSeconds: estimateWaitTime(lineName, arrivalTime),
        isEstimate: true,
        isRealtime: false,
        delaySeconds: null,
        delayText: null,
        delayStatus: null
    };
}

/**
 * Format wait time for display
 * @param {number} waitSeconds
 * @returns {string}
 */
export function formatWaitTime(waitSeconds) {
    const minutes = Math.round(waitSeconds / 60);
    if (minutes < 1) return 'arriving';
    if (minutes === 1) return '~1 min';
    return `~${minutes} min`;
}

/**
 * Get a human-readable description of a line's operating hours
 * @param {string} lineName
 * @returns {string}
 */
export function getOperatingHoursDescription(lineName) {
    const schedule = getLineSchedule(lineName);
    if (!schedule) return 'Schedule unknown';

    const weekday = schedule.operating_hours.weekday;
    if (!weekday) return 'No weekday service';

    if (weekday.am_peak || weekday.pm_peak) {
        const amStr = weekday.am_peak
            ? `${weekday.am_peak.start}-${weekday.am_peak.end}`
            : '';
        const pmStr = weekday.pm_peak
            ? `${weekday.pm_peak.start}-${weekday.pm_peak.end}`
            : '';
        return `Peak hours only: ${amStr}${amStr && pmStr ? ', ' : ''}${pmStr}`;
    }

    return `${weekday.start} - ${weekday.end}`;
}
