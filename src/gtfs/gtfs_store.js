/**
 * GTFS Store - IndexedDB storage for GTFS data
 *
 * Stores parsed GTFS data in IndexedDB for fast querying.
 * Organizes stop_times by stop_id and service_id for efficient lookups.
 */

import { openDB } from 'idb';

const DB_NAME = 'velorail_gtfs';
const DB_VERSION = 1;

let dbPromise = null;

/**
 * Get or create the IndexedDB database
 */
async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
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
      parent_station: stop.parent_station || null
    });
  }
  await tx1.done;

  // Store routes
  const tx2 = db.transaction('routes', 'readwrite');
  for (const route of gtfsData.routes || []) {
    await tx2.store.put({
      feedId,
      route_id: route.route_id,
      route_short_name: route.route_short_name,
      route_long_name: route.route_long_name,
      route_color: route.route_color ? `#${route.route_color}` : null,
      route_type: route.route_type
    });
  }
  await tx2.done;

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
  }

  // Sort departures by time and store
  const tx = db.transaction('stop_times', 'readwrite');

  for (const [key, data] of grouped) {
    // Sort by departure time
    data.departures.sort((a, b) => {
      const timeA = timeToSeconds(a.departure_time);
      const timeB = timeToSeconds(b.departure_time);
      return timeA - timeB;
    });

    await tx.store.put(data);
  }

  await tx.done;
  console.log(`[GTFS] Stored ${grouped.size} stop/service combinations`);
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
  const stores = ['stops', 'stop_times', 'routes', 'calendar', 'calendar_dates'];

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
 * Get route by ID
 */
export async function getRoute(feedId, routeId) {
  const db = await getDB();
  return db.get('routes', [feedId, routeId]);
}
