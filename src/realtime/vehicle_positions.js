/**
 * Vehicle Positions - Fetch and parse GTFS-RT vehicle position data
 *
 * Provides real-time vehicle locations for trains and buses.
 */

import GtfsRealtimeBindings from 'gtfs-rt-bindings';
import { CONFIG } from '../config.js';

const { FeedMessage } = GtfsRealtimeBindings;

/**
 * Fetch and parse vehicle positions from Swiftly (LA Metro Rail)
 * @returns {Promise<Array<VehiclePosition>>}
 */
export async function fetchSwiftlyVehiclePositions() {
    if (!CONFIG.SWIFTLY_API_KEY) {
        return [];
    }

    try {
        // Swiftly uses query param for API key, not Authorization header
        const url = `${CONFIG.SWIFTLY_VEHICLE_POSITIONS_URL}?apiKey=${CONFIG.SWIFTLY_API_KEY}`;
        const response = await fetch(url);

        if (!response.ok) {
            console.warn(`[Realtime] Swiftly vehicle positions fetch failed: ${response.status}`);
            return [];
        }

        const buffer = await response.arrayBuffer();
        return parseVehiclePositionsFeed(buffer, 'swiftly');
    } catch (error) {
        console.warn('[Realtime] Swiftly vehicle positions error:', error.message);
        return [];
    }
}

/**
 * Fetch and parse vehicle positions from Metrolink
 * @returns {Promise<Array<VehiclePosition>>}
 */
export async function fetchMetrolinkVehiclePositions() {
    if (!CONFIG.METROLINK_API_KEY) {
        return [];
    }

    try {
        const response = await fetch(CONFIG.METROLINK_VEHICLE_POSITIONS_URL, {
            headers: {
                'X-Api-Key': CONFIG.METROLINK_API_KEY
            }
        });

        if (!response.ok) {
            console.warn(`[Realtime] Metrolink vehicle positions fetch failed: ${response.status}`);
            return [];
        }

        const buffer = await response.arrayBuffer();
        return parseVehiclePositionsFeed(buffer, 'metrolink');
    } catch (error) {
        console.warn('[Realtime] Metrolink vehicle positions error:', error.message);
        return [];
    }
}

/**
 * Parse a GTFS-RT vehicle positions feed
 * @param {ArrayBuffer} buffer - Raw protobuf data
 * @param {string} source - Source identifier
 * @returns {Array<VehiclePosition>}
 */
function parseVehiclePositionsFeed(buffer, source) {
    try {
        const feed = FeedMessage.decode(new Uint8Array(buffer));
        const positions = [];

        for (const entity of feed.entity || []) {
            if (!entity.vehicle) continue;

            const position = parseVehiclePosition(entity.vehicle, source);
            if (position) {
                positions.push(position);
            }
        }

        return positions;
    } catch (error) {
        console.warn(`[Realtime] Vehicle position parse error for ${source}:`, error.message);
        return [];
    }
}

/**
 * Parse a single vehicle position entity
 * @param {Object} vehicleEntity - GTFS-RT VehiclePosition entity
 * @param {string} source - Source identifier
 * @returns {VehiclePosition|null}
 */
function parseVehiclePosition(vehicleEntity, source) {
    const position = vehicleEntity.position;
    if (!position || !position.latitude || !position.longitude) {
        return null;
    }

    const trip = vehicleEntity.trip || {};
    const vehicle = vehicleEntity.vehicle || {};

    // Support both snake_case and camelCase field names (gtfs-rt-bindings uses snake_case)
    return {
        source,
        vehicleId: vehicle.id || vehicle.label || null,
        label: vehicle.label || vehicle.id || null,
        latitude: position.latitude,
        longitude: position.longitude,
        bearing: position.bearing || null,
        speed: position.speed || null,
        tripId: trip.trip_id || trip.tripId || null,
        routeId: trip.route_id || trip.routeId || null,
        directionId: trip.direction_id ?? trip.directionId ?? null,
        startTime: trip.start_time || trip.startTime || null,
        startDate: trip.start_date || trip.startDate || null,
        currentStopSequence: vehicleEntity.current_stop_sequence || vehicleEntity.currentStopSequence || null,
        stopId: vehicleEntity.stop_id || vehicleEntity.stopId || null,
        currentStatus: parseVehicleStatus(vehicleEntity.current_status || vehicleEntity.currentStatus),
        timestamp: vehicleEntity.timestamp ? Number(vehicleEntity.timestamp) : Date.now() / 1000,
        congestionLevel: vehicleEntity.congestion_level || vehicleEntity.congestionLevel || null,
        occupancyStatus: vehicleEntity.occupancy_status || vehicleEntity.occupancyStatus || null
    };
}

/**
 * Parse vehicle status enum
 * @param {number} status
 * @returns {string}
 */
function parseVehicleStatus(status) {
    switch (status) {
        case 0: return 'INCOMING_AT';
        case 1: return 'STOPPED_AT';
        case 2: return 'IN_TRANSIT_TO';
        default: return 'UNKNOWN';
    }
}

/**
 * Fetch vehicle positions from all configured sources
 * @returns {Promise<Array<VehiclePosition>>}
 */
export async function fetchAllVehiclePositions() {
    const results = await Promise.allSettled([
        fetchSwiftlyVehiclePositions(),
        fetchMetrolinkVehiclePositions()
    ]);

    const allPositions = [];

    for (const result of results) {
        if (result.status === 'fulfilled') {
            allPositions.push(...result.value);
        }
    }

    console.log(`[Realtime] Fetched ${allPositions.length} vehicle positions`);
    return allPositions;
}

/**
 * Filter vehicle positions by trip ID
 * @param {Array<VehiclePosition>} positions - All vehicle positions
 * @param {string} tripId - Trip ID to filter by
 * @returns {VehiclePosition|null}
 */
export function findVehicleByTripId(positions, tripId) {
    return positions.find(p => p.tripId === tripId) || null;
}

/**
 * Filter vehicle positions by route ID
 * @param {Array<VehiclePosition>} positions - All vehicle positions
 * @param {string} routeId - Route ID to filter by
 * @returns {Array<VehiclePosition>}
 */
export function findVehiclesByRouteId(positions, routeId) {
    return positions.filter(p => p.routeId === routeId);
}

/**
 * Calculate distance between two points (Haversine formula)
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * @typedef {Object} VehiclePosition
 * @property {string} source - Source identifier ('swiftly' or 'metrolink')
 * @property {string|null} vehicleId - Vehicle identifier
 * @property {string|null} label - Vehicle label/number
 * @property {number} latitude - Current latitude
 * @property {number} longitude - Current longitude
 * @property {number|null} bearing - Direction of travel in degrees
 * @property {number|null} speed - Current speed in m/s
 * @property {string|null} tripId - GTFS trip_id
 * @property {string|null} routeId - GTFS route_id
 * @property {number|null} directionId - Direction (0 or 1)
 * @property {string|null} startTime - Trip start time
 * @property {string|null} startDate - Trip start date
 * @property {number|null} currentStopSequence - Current stop sequence
 * @property {string|null} stopId - Current/next stop ID
 * @property {string} currentStatus - 'INCOMING_AT', 'STOPPED_AT', 'IN_TRANSIT_TO'
 * @property {number} timestamp - Position timestamp (Unix seconds)
 * @property {number|null} congestionLevel - Congestion level
 * @property {number|null} occupancyStatus - Occupancy status
 */
