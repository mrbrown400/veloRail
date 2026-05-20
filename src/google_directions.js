// Google Routes API Helper
// Replaces OSRM for routing (walk, drive, bike)

import { CONFIG, isGoogleMapsConfigured } from './config.js';

// Routes class is loaded lazily after Maps JavaScript is available.
let routeClassPromise = null;

/**
 * Initialize the Google Routes runtime.
 * Must be called after Google Maps is loaded
 */
export function initDirectionsService() {
    return typeof google !== 'undefined' && Boolean(google.maps?.importLibrary || google.maps?.routes?.Route);
}

async function ensureRouteClass() {
    if (!initDirectionsService()) return null;

    if (!routeClassPromise) {
        routeClassPromise = (async () => {
            if (google.maps.routes?.Route) {
                return google.maps.routes.Route;
            }

            const routesLibrary = await google.maps.importLibrary('routes');
            return routesLibrary.Route || google.maps.routes?.Route || null;
        })();
    }

    return routeClassPromise;
}

/**
 * Get Google Routes travel mode from profile string
 */
function getTravelMode(profile) {
    switch (profile) {
        case 'walking':
        case 'foot':
            return 'WALKING';
        case 'driving':
        case 'car':
            return 'DRIVING';
        case 'cycling':
        case 'bicycle':
            return 'BICYCLING';
        case 'transit':
            return 'TRANSIT';
        default:
            return 'DRIVING';
    }
}

/**
 * Convert Google Routes result to our standard format
 * @param {Object} route - Google Routes route
 * @returns {Object} Standardized route object
 */
function convertGoogleRoute(route) {
    const coordinates = (route.path || []).map(point => [
        typeof point.lng === 'function' ? point.lng() : point.lng,
        typeof point.lat === 'function' ? point.lat() : point.lat
    ]);

    return {
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        },
        distance: (route.distanceMeters || 0) / 1000,
        duration: Math.round((route.durationMillis || route.staticDurationMillis || 0) / 1000),
        source: 'google'
    };
}

/**
 * Get a route using Google Routes API
 * @param {Array} waypoints - Array of {lat, lon} waypoint objects
 * @param {string} profile - Travel mode: 'cycling', 'driving', 'walking'
 * @returns {Promise<Object|null>} Route object or null on failure
 */
export async function getGoogleRoute(waypoints, profile = 'cycling') {
    const Route = await ensureRouteClass();
    if (!Route) {
        console.warn('Google Routes API not available, falling back to straight line');
        return createFallbackRoute(waypoints);
    }

    if (!isGoogleMapsConfigured()) {
        console.warn('Google Maps API key not configured, using straight line fallback');
        return createFallbackRoute(waypoints);
    }

    const request = {
        origin: { lat: waypoints[0].lat, lng: waypoints[0].lon },
        destination: {
            lat: waypoints[waypoints.length - 1].lat,
            lng: waypoints[waypoints.length - 1].lon
        },
        travelMode: getTravelMode(profile),
        computeAlternativeRoutes: false,
        fields: ['path', 'distanceMeters', 'durationMillis']
    };

    if (profile === 'driving' || profile === 'car') {
        request.routingPreference = 'TRAFFIC_AWARE';
    }

    try {
        const result = await Route.computeRoutes(request);
        const route = result.routes?.[0];
        return route ? convertGoogleRoute(route) : createFallbackRoute(waypoints);
    } catch (error) {
        console.error('Google Routes error:', error);
        return createFallbackRoute(waypoints);
    }
}

/**
 * Create a fallback straight-line route when API fails
 */
function createFallbackRoute(waypoints) {
    const coordinates = waypoints.map(wp => [wp.lon, wp.lat]);

    // Calculate approximate distance using Haversine
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length - 1; i++) {
        totalDistance += getDistance(
            waypoints[i].lat, waypoints[i].lon,
            waypoints[i + 1].lat, waypoints[i + 1].lon
        );
    }

    return {
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        },
        distance: totalDistance,
        duration: null, // Signal to calculate based on speed
        source: 'fallback'
    };
}

/**
 * Haversine distance calculation
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// ============================================
// Compatibility layer for existing code
// ============================================

/**
 * Get route using OSRM-compatible interface
 * Maps to Google Routes API
 * @param {Array} waypoints - Array of {lat, lon} waypoint objects
 * @param {string} profile - OSRM profile: 'cycling', 'driving', 'walking'
 */
export async function getOSRMRoute(waypoints, profile = 'cycling') {
    // Map OSRM profiles to Google profiles
    const profileMap = {
        'bicycle': 'cycling',
        'cycling': 'cycling',
        'car': 'driving',
        'driving': 'driving',
        'foot': 'walking',
        'walking': 'walking'
    };

    const googleProfile = profileMap[profile] || profile;
    return getGoogleRoute(waypoints, googleProfile);
}

/**
 * Deprecated alias for backward compatibility
 * Used by simple bike routing: (lat1, lon1, lat2, lon2) signature
 */
export const getBikeRoute = (lat1, lon1, lat2, lon2) => {
    return getGoogleRoute([{ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }], 'cycling');
};
