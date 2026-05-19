/**
 * GTFS Store - IndexedDB storage for GTFS data
 *
 * Stores parsed GTFS data in IndexedDB for fast querying.
 * Organizes stop_times by stop_id and service_id for efficient lookups.
 */

import { openDB } from 'idb';

const DB_NAME = 'velorail_gtfs';
const DB_VERSION = 2;

let dbPromise = null;

/**
 * Get or create the IndexedDB database
 */
async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Metadata store - feed version info
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'feedId' });
        }

        // Stops store - indexed by stop_id
        if (!db.objectStoreNames.contains('stops')) {
          const stopStore = db.createObjectStore('stops', { keyPath: ['feedId', 'stop_id'] });
          stopStore.createIndex('by_name', 'stop_name');
          stopStore.createIndex('by_feed', 'feedId');
        }

        // Stop times store - grouped by stop_id + service_id
        if (!db.objectStoreNames.contains('stop_times')) {
          const stStore = db.createObjectStore('stop_times', { keyPath: ['feedId', 'stop_id', 'service_id'] });
          stStore.createIndex('by_stop', ['feedId', 'stop_id']);
          stStore.createIndex('by_feed', 'feedId');
        }

        // Routes store
        if (!db.objectStoreNames.contains('routes')) {
          const routeStore = db.createObjectStore('routes', { keyPath: ['feedId', 'route_id'] });
          routeStore.createIndex('by_feed', 'feedId');
        }

        // Trips store - indexed by trip_id
        if (!db.objectStoreNames.contains('trips')) {
          const tripStore = db.createObjectStore('trips', { keyPath: ['feedId', 'trip_id'] });
          tripStore.createIndex('by_route', ['feedId', 'route_id']);
          tripStore.createIndex('by_service', ['feedId', 'service_id']);
          tripStore.createIndex('by_feed', 'feedId');
        }

        // Raw stop sequence store - grouped by trip for export/schedule tooling
        if (!db.objectStoreNames.contains('trip_stop_times')) {
          const tripStopStore = db.createObjectStore('trip_stop_times', { keyPath: ['feedId', 'trip_id'] });
          tripStopStore.createIndex('by_feed', 'feedId');
        }

        // Calendar store - service patterns
        if (!db.objectStoreNames.contains('calendar')) {
          const calStore = db.createObjectStore('calendar', { keyPath: ['feedId', 'service_id'] });
          calStore.createIndex('by_feed', 'feedId');
        }

        // Calendar dates store - exceptions
        if (!db.objectStoreNames.contains('calendar_dates')) {
          const cdStore = db.createObjectStore('calendar_dates', { keyPath: ['feedId', 'service_id', 'date'] });
          cdStore.createIndex('by_date', ['feedId', 'date']);
          cdStore.createIndex('by_feed', 'feedId');
        }
      }
    });
  }
  return dbPromise;
}

/**
 * Store parsed GTFS data
 */
export async function storeGTFSData(feedId, agency, gtfsData) {
  const db = await getDB();

  // Clear existing data for this feed
  await clearFeedData(feedId);

  // Store stops
  const tx1 = db.transaction('stops', 'readwrite');
  for (const stop of gtfsData.stops || []) {
    await tx1.store.put({
      feedId,
      stop_id: stop.stop_id,
      stop_name: stop.stop_name,
      stop_lat: parseFloat(stop.stop_lat),
      stop_lon: parseFloat(stop.stop_lon),
      stop_code: stop.stop_code || null,
      location_type: stop.location_type || '0',
      parent_station: stop.parent_station || null,
      wheelchair_boarding: stop.wheelchair_boarding || null
    });
  }
  await tx1.done;

  // Store routes
  const tx2 = db.transaction('routes', 'readwrite');
  for (const route of gtfsData.routes || []) {
    await tx2.store.put({
      feedId,
      route_id: route.route_id,
      agency_id: route.agency_id || agency,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      route_desc: route.route_desc || null,
      route_type: parseInt(route.route_type, 10),
      route_url: route.route_url || null,
      route_color: normalizeRouteColor(route.route_color),
      route_text_color: normalizeRouteColor(route.route_text_color),
      route_sort_order: route.route_sort_order ? parseInt(route.route_sort_order, 10) : null
    });
  }
  await tx2.done;

  // Store trips
  const tripTx = db.transaction('trips', 'readwrite');
  for (const trip of gtfsData.trips || []) {
    await tripTx.store.put({
      feedId,
      route_id: trip.route_id,
      service_id: trip.service_id,
      trip_id: trip.trip_id,
      trip_headsign: trip.trip_headsign || '',
      trip_short_name: trip.trip_short_name || null,
      direction_id: trip.direction_id || null,
      block_id: trip.block_id || null,
      shape_id: trip.shape_id || null,
      wheelchair_accessible: trip.wheelchair_accessible || null,
      bikes_allowed: trip.bikes_allowed || null
    });
  }
  await tripTx.done;

  // Store calendar
  const tx3 = db.transaction('calendar', 'readwrite');
  for (const cal of gtfsData.calendar || []) {
    await tx3.store.put({
      feedId,
      service_id: cal.service_id,
      monday: cal.monday === '1',
      tuesday: cal.tuesday === '1',
      wednesday: cal.wednesday === '1',
      thursday: cal.thursday === '1',
      friday: cal.friday === '1',
      saturday: cal.saturday === '1',
      sunday: cal.sunday === '1',
      start_date: cal.start_date,
      end_date: cal.end_date
    });
  }
  await tx3.done;

  // Store calendar_dates (exceptions)
  const tx4 = db.transaction('calendar_dates', 'readwrite');
  for (const cd of gtfsData.calendarDates || []) {
    await tx4.store.put({
      feedId,
      service_id: cd.service_id,
      date: cd.date,
      exception_type: parseInt(cd.exception_type, 10) // 1=added, 2=removed
    });
  }
  await tx4.done;

  // Process and store stop_times grouped by stop_id + service_id
  await processStopTimes(feedId, gtfsData.trips || [], gtfsData.stopTimes || []);
}

/**
 * Process stop_times and group by stop_id + service_id for efficient querying
 */
async function processStopTimes(feedId, trips, stopTimes) {
  const db = await getDB();

  // Build trip_id -> service_id mapping
  const tripServiceMap = new Map();
  for (const trip of trips) {
    tripServiceMap.set(trip.trip_id, {
      service_id: trip.service_id,
      route_id: trip.route_id,
      headsign: trip.trip_headsign || '',
      direction_id: trip.direction_id
    });
  }

  // Group stop_times by stop_id + service_id
  const grouped = new Map();
  const tripStopTimes = new Map();

  for (const st of stopTimes) {
    const tripInfo = tripServiceMap.get(st.trip_id);
    if (!tripInfo) continue;

    const key = `${st.stop_id}|${tripInfo.service_id}`;

    if (!grouped.has(key)) {
      grouped.set(key, {
        feedId,
        stop_id: st.stop_id,
        service_id: tripInfo.service_id,
        departures: []
      });
    }

    grouped.get(key).departures.push({
      trip_id: st.trip_id,
      departure_time: st.departure_time,
      arrival_time: st.arrival_time,
      route_id: tripInfo.route_id,
      headsign: tripInfo.headsign,
      stop_sequence: parseInt(st.stop_sequence, 10),
      pickup_type: st.pickup_type || '0'
    });

    if (!tripStopTimes.has(st.trip_id)) {
      tripStopTimes.set(st.trip_id, {
        feedId,
        trip_id: st.trip_id,
        route_id: tripInfo.route_id,
        service_id: tripInfo.service_id,
        headsign: tripInfo.headsign,
        direction_id: tripInfo.direction_id,
        stops: []
      });
    }

    tripStopTimes.get(st.trip_id).stops.push({
      stop_id: st.stop_id,
      arrival_time: st.arrival_time,
      departure_time: st.departure_time,
      stop_sequence: parseInt(st.stop_sequence, 10),
      pickup_type: st.pickup_type || '0',
      drop_off_type: st.drop_off_type || '0',
      shape_dist_traveled: st.shape_dist_traveled || null,
      timepoint: st.timepoint || null
    });
  }

  // Sort departures by time and store
  const tx = db.transaction('stop_times', 'readwrite');

  for (const data of grouped.values()) {
    // Sort by departure time
    data.departures.sort((a, b) => {
      const timeA = timeToSeconds(a.departure_time);
      const timeB = timeToSeconds(b.departure_time);
      return timeA - timeB;
    });

    await tx.store.put(data);
  }

  await tx.done;

  const tripTx = db.transaction('trip_stop_times', 'readwrite');
  for (const data of tripStopTimes.values()) {
    data.stops.sort((a, b) => a.stop_sequence - b.stop_sequence);
    await tripTx.store.put(data);
  }
  await tripTx.done;

  console.log(`[GTFS] Stored ${grouped.size} stop/service combinations and ${tripStopTimes.size} trip stop sequences`);
}

/**
 * Convert GTFS time (HH:MM:SS) to seconds since midnight
 * Handles times after midnight (e.g., 25:30:00 = 1:30 AM next day)
 */
export function timeToSeconds(timeStr) {
  const [hours, minutes, seconds] = timeStr.split(':').map(Number);
  return hours * 3600 + minutes * 60 + (seconds || 0);
}

/**
 * Convert seconds since midnight to GTFS time string
 */
export function secondsToTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Clear all data for a specific feed
 */
async function clearFeedData(feedId) {
  const db = await getDB();
  const stores = ['stops', 'stop_times', 'routes', 'trips', 'trip_stop_times', 'calendar', 'calendar_dates'];

  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const index = tx.store.index('by_feed');
    let cursor = await index.openCursor(IDBKeyRange.only(feedId));

    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }

    await tx.done;
  }
}

/**
 * Get metadata for a feed
 */
export async function getMetadata(feedId) {
  const db = await getDB();
  return db.get('metadata', feedId);
}

/**
 * Set metadata for a feed
 */
export async function setMetadata(feedId, metadata) {
  const db = await getDB();
  await db.put('metadata', { ...metadata, feedId });
}

/**
 * Get all stops for a feed
 */
export async function getStops(feedId) {
  const db = await getDB();
  const index = db.transaction('stops').store.index('by_feed');
  return index.getAll(feedId);
}

/**
 * Get all routes for a feed
 */
export async function getRoutes(feedId) {
  const db = await getDB();
  const index = db.transaction('routes').store.index('by_feed');
  return index.getAll(feedId);
}

/**
 * Get stop by ID
 */
export async function getStop(feedId, stopId) {
  const db = await getDB();
  return db.get('stops', [feedId, stopId]);
}

/**
 * Get stop times for a stop + service combination
 */
export async function getStopTimes(feedId, stopId, serviceId) {
  const db = await getDB();
  return db.get('stop_times', [feedId, stopId, serviceId]);
}

/**
 * Get all stop times for a stop (all service patterns)
 */
export async function getAllStopTimes(feedId, stopId) {
  const db = await getDB();
  const index = db.transaction('stop_times').store.index('by_stop');
  return index.getAll([feedId, stopId]);
}

/**
 * Get trip by ID
 */
export async function getTrip(feedId, tripId) {
  const db = await getDB();
  return db.get('trips', [feedId, tripId]);
}

/**
 * Get all trips for a feed
 */
export async function getTrips(feedId) {
  const db = await getDB();
  const index = db.transaction('trips').store.index('by_feed');
  return index.getAll(feedId);
}

/**
 * Get trips for a route
 */
export async function getTripsForRoute(feedId, routeId) {
  const db = await getDB();
  const index = db.transaction('trips').store.index('by_route');
  return index.getAll([feedId, routeId]);
}

/**
 * Get stop sequence for a trip
 */
export async function getTripStopTimes(feedId, tripId) {
  const db = await getDB();
  return db.get('trip_stop_times', [feedId, tripId]);
}

/**
 * Get all trip stop sequences for export or offline schedule tooling
 */
export async function getAllTripStopTimes(feedId) {
  const db = await getDB();
  const index = db.transaction('trip_stop_times').store.index('by_feed');
  return index.getAll(feedId);
}

/**
 * Get calendar entry for a service
 */
export async function getCalendar(feedId, serviceId) {
  const db = await getDB();
  return db.get('calendar', [feedId, serviceId]);
}

/**
 * Get all calendar entries for a feed
 */
export async function getAllCalendars(feedId) {
  const db = await getDB();
  const index = db.transaction('calendar').store.index('by_feed');
  return index.getAll(feedId);
}

/**
 * Get calendar date exceptions for a specific date
 */
export async function getCalendarDateExceptions(feedId, date) {
  const db = await getDB();
  const index = db.transaction('calendar_dates').store.index('by_date');
  return index.getAll([feedId, date]);
}

/**
 * Get all calendar date exceptions for a feed
 */
export async function getAllCalendarDates(feedId) {
  const db = await getDB();
  const index = db.transaction('calendar_dates').store.index('by_feed');
  return index.getAll(feedId);
}

/**
 * Get route by ID
 */
export async function getRoute(feedId, routeId) {
  const db = await getDB();
  return db.get('routes', [feedId, routeId]);
}

/**
 * Export a complete app-owned GTFS snapshot from IndexedDB
 */
export async function getGTFSFeedSnapshot(feedId) {
  const [
    metadata,
    stops,
    routes,
    trips,
    tripStopTimes,
    calendar,
    calendarDates
  ] = await Promise.all([
    getMetadata(feedId),
    getStops(feedId),
    getRoutes(feedId),
    getTrips(feedId),
    getAllTripStopTimes(feedId),
    getAllCalendars(feedId),
    getAllCalendarDates(feedId)
  ]);

  return {
    metadata: metadata || null,
    stops,
    routes,
    trips,
    tripStopTimes,
    calendar,
    calendarDates
  };
}

function normalizeRouteColor(routeColor) {
  const color = String(routeColor || '').replace(/^#/, '').trim();
  return color ? `#${color.toUpperCase()}` : null;
}
