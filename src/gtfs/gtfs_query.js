/**
 * GTFS Query - Time-based departure lookups
 *
 * Queries GTFS data to find next departures from a stop,
 * handling service calendars and exceptions (holidays).
 */

import {
  getAllStopTimes,
  getAllCalendars,
  getCalendarDateExceptions,
  getRoute,
  timeToSeconds,
  secondsToTime
} from './gtfs_store.js';
import { getGTFSStopId } from './stop_mapping.js';

/**
 * Get the next N departures from a stop after a given time
 *
 * @param {string} stopId - GTFS stop_id
 * @param {Date} afterTime - Query time
 * @param {number} limit - Max results (default 5)
 * @param {string} feedId - Feed ID (default 'metro_rail')
 * @returns {Promise<Array<{tripId, departureTime, headsign, routeId}>>}
 */
export async function getNextDepartures(stopId, afterTime, limit = 5, feedId = 'metro_rail') {
  // Get active service IDs for this date
  const activeServiceIds = await getActiveServiceIds(feedId, afterTime);
  if (activeServiceIds.length === 0) {
    console.warn('[GTFS Query] No active services found for date');
    return [];
  }

  // Get all stop times for this stop
  const stopTimesData = await getAllStopTimes(feedId, stopId);
  if (!stopTimesData || stopTimesData.length === 0) {
    return [];
  }

  // Convert query time to seconds since midnight
  const queryTimeSeconds = getSecondsFromMidnight(afterTime);

  // Collect departures from active services
  const departures = [];

  for (const data of stopTimesData) {
    if (!activeServiceIds.includes(data.service_id)) {
      continue;
    }

    for (const dep of data.departures) {
      // Skip if pickup not allowed
      if (dep.pickup_type === '1') continue;

      const depSeconds = timeToSeconds(dep.departure_time);

      // Check if departure is after query time
      // Handle overnight services (times > 24:00:00)
      if (depSeconds >= queryTimeSeconds) {
        departures.push({
          tripId: dep.trip_id,
          departureTimeSeconds: depSeconds,
          departureTime: dep.departure_time,
          headsign: dep.headsign,
          routeId: dep.route_id
        });
      }
    }
  }

  // Sort by departure time and limit
  departures.sort((a, b) => a.departureTimeSeconds - b.departureTimeSeconds);

  // Convert to Date objects and return
  const results = departures.slice(0, limit).map(dep => ({
    tripId: dep.tripId,
    departureTime: secondsToDate(dep.departureTimeSeconds, afterTime),
    departureTimeStr: dep.departureTime,
    headsign: dep.headsign,
    routeId: dep.routeId
  }));

  return results;
}

/**
 * Get wait time until next departure
 *
 * @param {string} stationName - VeloRail station name
 * @param {Date} arrivalTime - When user arrives at stop
 * @param {string} feedId - Feed ID (default 'metro_rail')
 * @returns {Promise<{waitSeconds, departureTime, headsign, isEstimate} | null>}
 */
export async function getWaitTimeForStation(stationName, arrivalTime, feedId = 'metro_rail') {
  const stopId = await getGTFSStopId(stationName);
  if (!stopId) {
    return null;
  }

  const departures = await getNextDepartures(stopId, arrivalTime, 1, feedId);
  if (departures.length === 0) {
    return null;
  }

  const nextDep = departures[0];
  const waitSeconds = (nextDep.departureTime - arrivalTime) / 1000;

  return {
    waitSeconds: Math.max(0, waitSeconds),
    departureTime: nextDep.departureTime,
    headsign: nextDep.headsign,
    routeId: nextDep.routeId,
    isEstimate: false
  };
}

/**
 * Get active service IDs for a given date
 * Handles calendar and calendar_dates (exceptions)
 *
 * @param {string} feedId - Feed ID
 * @param {Date} date - Query date
 * @returns {Promise<string[]>} Array of active service_ids
 */
export async function getActiveServiceIds(feedId, date) {
  const dateStr = formatGTFSDate(date);
  const dayOfWeek = date.getDay(); // 0=Sun, 1=Mon, ...

  // Get all calendar entries
  const calendars = await getAllCalendars(feedId);
  if (!calendars || calendars.length === 0) {
    return [];
  }

  // Get exceptions for this date
  const exceptions = await getCalendarDateExceptions(feedId, dateStr);
  const addedServices = new Set();
  const removedServices = new Set();

  for (const exc of exceptions) {
    if (exc.exception_type === 1) {
      addedServices.add(exc.service_id);
    } else if (exc.exception_type === 2) {
      removedServices.add(exc.service_id);
    }
  }

  // Find services that run on this day
  const activeServices = [];

  for (const cal of calendars) {
    // Check date range
    if (dateStr < cal.start_date || dateStr > cal.end_date) {
      continue;
    }

    // Check if service was removed for this date
    if (removedServices.has(cal.service_id)) {
      continue;
    }

    // Check day of week
    const dayFlags = [
      cal.sunday,
      cal.monday,
      cal.tuesday,
      cal.wednesday,
      cal.thursday,
      cal.friday,
      cal.saturday
    ];

    if (dayFlags[dayOfWeek]) {
      activeServices.push(cal.service_id);
    }
  }

  // Add services that were explicitly added for this date
  for (const serviceId of addedServices) {
    if (!activeServices.includes(serviceId)) {
      activeServices.push(serviceId);
    }
  }

  return activeServices;
}

/**
 * Format date as GTFS date string (YYYYMMDD)
 */
export function formatGTFSDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

/**
 * Get seconds since midnight for a Date object
 */
function getSecondsFromMidnight(date) {
  return date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
}

/**
 * Convert seconds since midnight to a Date object
 * Handles times after midnight (>= 86400 seconds = next day)
 */
function secondsToDate(seconds, referenceDate) {
  const result = new Date(referenceDate);

  // Reset to midnight
  result.setHours(0, 0, 0, 0);

  // Handle next-day times
  if (seconds >= 86400) {
    result.setDate(result.getDate() + 1);
    seconds -= 86400;
  }

  // Add the time
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  result.setHours(hours, minutes, secs);

  return result;
}

/**
 * Check if a specific service is active on a date
 */
export async function isServiceActive(feedId, serviceId, date) {
  const activeServices = await getActiveServiceIds(feedId, date);
  return activeServices.includes(serviceId);
}

/**
 * Get route information by ID
 */
export async function getRouteInfo(feedId, routeId) {
  return getRoute(feedId, routeId);
}

/**
 * Check if GTFS data is loaded and queryable
 */
export async function isGTFSQueryable(feedId = 'metro_rail') {
  try {
    const calendars = await getAllCalendars(feedId);
    return calendars && calendars.length > 0;
  } catch {
    return false;
  }
}
