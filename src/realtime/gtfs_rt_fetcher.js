/**
 * GTFS-RT Fetcher - Fetch and parse real-time transit data
 *
 * Fetches GTFS-RT Protocol Buffer feeds from Swiftly (LA Metro) and Metrolink APIs.
 * Returns parsed trip updates with delay information.
 */

import GtfsRealtimeBindings from 'gtfs-rt-bindings';
import { CONFIG } from '../config.js';

// gtfs-rt-bindings exports transit_realtime directly
const { FeedMessage } = GtfsRealtimeBindings;

/**
 * Fetch and parse GTFS-RT trip updates from Swiftly (LA Metro Rail)
 * @returns {Promise<Array<TripUpdate>>}
 */
export async function fetchSwiftlyTripUpdates() {
    if (!CONFIG.SWIFTLY_API_KEY) {
        console.debug('[Realtime] Swiftly API key not configured, skipping');
        return [];
    }

    try {
        // Swiftly uses query param for API key, not Authorization header
        const url = `${CONFIG.SWIFTLY_TRIP_UPDATES_URL}?apiKey=${CONFIG.SWIFTLY_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`[Realtime] Swiftly fetch failed: ${response.status}`);
            return [];
        }

        const buffer = await response.arrayBuffer();
        return parseGtfsRtFeed(buffer, 'swiftly');
    } catch (error) {
        console.warn('[Realtime] Swiftly fetch error:', error.message);
        return [];
    }
}

/**
 * Fetch and parse GTFS-RT trip updates from Metrolink
 * @returns {Promise<Array<TripUpdate>>}
 */
export async function fetchMetrolinkTripUpdates() {
    if (!CONFIG.METROLINK_API_KEY) {
        console.debug('[Realtime] Metrolink API key not configured, skipping');
        return [];
    }

    try {
        const response = await fetch(CONFIG.METROLINK_TRIP_UPDATES_URL, {
            headers: {
                'X-Api-Key': CONFIG.METROLINK_API_KEY
            }
        });

        if (!response.ok) {
            console.warn(`[Realtime] Metrolink fetch failed: ${response.status}`);
            return [];
        }

        const buffer = await response.arrayBuffer();
        return parseGtfsRtFeed(buffer, 'metrolink');
    } catch (error) {
        console.warn('[Realtime] Metrolink fetch error:', error.message);
        return [];
    }
}

/**
 * Parse a GTFS-RT Protocol Buffer feed
 * @param {ArrayBuffer} buffer - Raw protobuf data
 * @param {string} source - Source identifier ('swiftly' or 'metrolink')
 * @returns {Array<TripUpdate>}
 */
function parseGtfsRtFeed(buffer, source) {
    try {
        const feed = FeedMessage.decode(new Uint8Array(buffer));
        const tripUpdates = [];

        for (const entity of feed.entity || []) {
            // gtfs-rt-bindings uses snake_case field names
            const tripUpdateData = entity.trip_update || entity.tripUpdate;
            if (!tripUpdateData) continue;

            const tripUpdate = parseTripUpdate(tripUpdateData, source);
            if (tripUpdate) {
                tripUpdates.push(tripUpdate);
            }
        }

        return tripUpdates;
    } catch (error) {
        console.warn(`[Realtime] Parse error for ${source}:`, error.message);
        return [];
    }
}

/**
 * Parse a single trip update entity
 * @param {Object} tripUpdateEntity - GTFS-RT TripUpdate entity
 * @param {string} source - Source identifier
 * @returns {TripUpdate|null}
 */
function parseTripUpdate(tripUpdateEntity, source) {
    const trip = tripUpdateEntity.trip;
    if (!trip) return null;

    const stopTimeUpdates = [];

    // gtfs-rt-bindings uses snake_case: stop_time_update
    const stuArray = tripUpdateEntity.stop_time_update || tripUpdateEntity.stopTimeUpdate || [];
    for (const stu of stuArray) {
        const stopUpdate = {
            stopId: stu.stop_id || stu.stopId || null,
            stopSequence: stu.stop_sequence || stu.stopSequence || null,
            arrival: null,
            departure: null
        };

        // Parse arrival delay
        if (stu.arrival) {
            stopUpdate.arrival = {
                delay: stu.arrival.delay || 0,
                time: stu.arrival.time ? Number(stu.arrival.time) : null,
                uncertainty: stu.arrival.uncertainty || null
            };
        }

        // Parse departure delay
        if (stu.departure) {
            stopUpdate.departure = {
                delay: stu.departure.delay || 0,
                time: stu.departure.time ? Number(stu.departure.time) : null,
                uncertainty: stu.departure.uncertainty || null
            };
        }

        stopTimeUpdates.push(stopUpdate);
    }

    // Support both snake_case and camelCase field names
    return {
        source,
        tripId: trip.trip_id || trip.tripId || null,
        routeId: trip.route_id || trip.routeId || null,
        directionId: trip.direction_id ?? trip.directionId ?? null,
        startTime: trip.start_time || trip.startTime || null,
        startDate: trip.start_date || trip.startDate || null,
        scheduleRelationship: trip.schedule_relationship || trip.scheduleRelationship || 0,
        stopTimeUpdates,
        timestamp: tripUpdateEntity.timestamp ? Number(tripUpdateEntity.timestamp) : Date.now() / 1000,
        vehicleId: tripUpdateEntity.vehicle?.id || null
    };
}

/**
 * Fetch trip updates from all configured sources
 * @returns {Promise<Array<TripUpdate>>}
 */
export async function fetchAllTripUpdates() {
    const results = await Promise.allSettled([
        fetchSwiftlyTripUpdates(),
        fetchMetrolinkTripUpdates()
    ]);

    const allUpdates = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allUpdates.push(...result.value);
        }
    }

    console.log(`[Realtime] Fetched ${allUpdates.length} trip updates`);
    return allUpdates;
}

/**
 * Check if any real-time source is configured
 * @returns {boolean}
 */
export function isRealtimeConfigured() {
    return Boolean(CONFIG.SWIFTLY_API_KEY || CONFIG.METROLINK_API_KEY);
}

/**
 * @typedef {Object} TripUpdate
 * @property {string} source - Source identifier ('swiftly' or 'metrolink')
 * @property {string|null} tripId - GTFS trip_id
 * @property {string|null} routeId - GTFS route_id
 * @property {number|null} directionId - Direction (0 or 1)
 * @property {string|null} startTime - Trip start time (HH:MM:SS)
 * @property {string|null} startDate - Trip start date (YYYYMMDD)
 * @property {number} scheduleRelationship - 0=SCHEDULED, 1=ADDED, 2=UNSCHEDULED, 3=CANCELED
 * @property {Array<StopTimeUpdate>} stopTimeUpdates - Per-stop delay info
 * @property {number} timestamp - Update timestamp (Unix seconds)
 * @property {string|null} vehicleId - Vehicle identifier
 */

/**
 * @typedef {Object} StopTimeUpdate
 * @property {string|null} stopId - GTFS stop_id
 * @property {number|null} stopSequence - Stop sequence in trip
 * @property {StopTimeEvent|null} arrival - Arrival time info
 * @property {StopTimeEvent|null} departure - Departure time info
 */

/**
 * @typedef {Object} StopTimeEvent
 * @property {number} delay - Delay in seconds (positive = late, negative = early)
 * @property {number|null} time - Absolute Unix timestamp
 * @property {number|null} uncertainty - Uncertainty in seconds
 */
