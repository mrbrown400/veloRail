// Google Directions API Helper
// Replaces OSRM for routing (walk, drive, bike)

import { CONFIG, isGoogleMapsConfigured } from './config.js';

// Directions service instance (initialized lazily)
let directionsService = null;

/**
 * Initialize the Directions Service
 * Must be called after Google Maps is loaded
 */
export function initDirectionsService() {
    if (typeof google !== 'undefined' && google.maps) {
        directionsService = new google.maps.DirectionsService();
        return true;
    }
    return false;
}

/**
 * Get Google Maps travel mode from profile string
 */
function getTravelMode(profile) {
    switch (profile) {
        case 'walking':
        case 'foot':
            return google.maps.TravelMode.WALKING;
        case 'driving':
        case 'car':
            return google.maps.TravelMode.DRIVING;
        case 'cycling':
        case 'bicycle':
            return google.maps.TravelMode.BICYCLING;
        case 'transit':
            return google.maps.TravelMode.TRANSIT;
        default:
            return google.maps.TravelMode.DRIVING;
    }
}

/**
 * Convert Google route to our standard format
 * @param {google.maps.DirectionsResult} result - Google Directions result
 * @returns {Object} Standardized route object
 */
function convertGoogleRoute(result) {
    const route = result.routes[0];
    const leg = route.legs[0];

    // Convert the overview path to GeoJSON LineString coordinates
    const coordinates = route.overview_path.map(point => [point.lng(), point.lat()]);

    return {
        geometry: {
            type: 'LineString',
            coordinates: coordinates
        },
        distance: leg.distance.value / 1000, // meters to km
        duration: leg.duration.value, // seconds
        source: 'google'
    };
}

/**
 * Get a route using Google Directions API
 * @param {Array} waypoints - Array of {lat, lon} waypoint objects
 * @param {string} profile - Travel mode: 'cycling', 'driving', 'walking'
 * @returns {Promise<Object|null>} Route object or null on failure
 */
export async function getGoogleRoute(waypoints, profile = 'cycling') {
    // Ensure service is initialized
    if (!directionsService) {
        if (!initDirectionsService()) {
            console.warn('Google Directions Service not available, falling back to straight line');
            return createFallbackRoute(waypoints);
        }
    }

    if (!isGoogleMapsConfigured()) {
        console.warn('Google Maps API key not configured, using straight line fallback');
        return createFallbackRoute(waypoints);
    }

    // Build request
    const origin = new google.maps.LatLng(waypoints[0].lat, waypoints[0].lon);
    const destination = new google.maps.LatLng(
        waypoints[waypoints.length - 1].lat,
        waypoints[waypoints.length - 1].lon
    );

    // Intermediate waypoints (if more than 2 points)
    const intermediateWaypoints = waypoints.length > 2
        ? waypoints.slice(1, -1).map(wp => ({
            location: new google.maps.LatLng(wp.lat, wp.lon),
            stopover: false
        }))
        : [];

    const request = {
        origin: origin,
        destination: destination,
        waypoints: intermediateWaypoints,
        travelMode: getTravelMode(profile),
        optimizeWaypoints: false,
        provideRouteAlternatives: false,
        unitSystem: google.maps.UnitSystem.METRIC
    };

    // Add bike-friendly options for cycling
    if (profile === 'cycling' || profile === 'bicycle') {
        request.avoidHighways = true;
    }

    try {
        const result = await new Promise((resolve, reject) => {
            directionsService.route(request, (response, status) => {
                if (status === 'OK') {
                    resolve(response);
                } else {
                    reject(new Error(`Directions request failed: ${status}`));
                }
            });
        });

        return convertGoogleRoute(result);
    } catch (error) {
        console.error('Google Directions error:', error);
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
 * Maps to Google Directions API
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
