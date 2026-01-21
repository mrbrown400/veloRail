// OpenRouteService API for safer bike routing
// Requires free API key from https://openrouteservice.org/dev/#/signup

import { CONFIG, isORSConfigured } from './config.js';

const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions';

/**
 * Get bike route from OpenRouteService with safety preferences
 * @param {Array} waypoints - [{lat, lon}, {lat, lon}]
 * @param {string} safetyPreference - 'balanced', 'safe', or 'fast'
 * @returns {Promise<{geometry, distance, duration, source}|null>}
 */
export async function getORSBikeRoute(waypoints, safetyPreference = 'balanced') {
    if (!isORSConfigured()) {
        console.warn('ORS API key not configured, skipping ORS routing');
        return null;
    }

    // Map preference to ORS profile
    // cycling-regular: balanced route considering bike infrastructure
    // cycling-road: faster, prefers roads (less safe)
    const profile = safetyPreference === 'fast' ? 'cycling-road' : 'cycling-regular';

    const coordinates = waypoints.map(wp => [wp.lon, wp.lat]);

    const url = `${ORS_BASE_URL}/${profile}`;

    const body = {
        coordinates: coordinates,
        preference: safetyPreference === 'safe' ? 'recommended' : 'fastest',
        units: 'km',
        geometry: true,
        instructions: false
    };

    // For 'safe' preference, add options to avoid high-speed roads
    if (safetyPreference === 'safe') {
        body.options = {
            avoid_features: ['highways', 'ferries']
        };
    }

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': CONFIG.ORS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.warn('ORS API error:', response.status, errorData);
            return null;
        }

        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const decodedCoords = decodePolyline(route.geometry);

            return {
                geometry: {
                    type: 'LineString',
                    coordinates: decodedCoords
                },
                distance: route.summary.distance, // Already in km
                duration: route.summary.duration, // In seconds
                source: 'ors'
            };
        }

        console.warn('ORS returned no routes');
        return null;
    } catch (error) {
        console.error('ORS routing failed:', error);
        return null;
    }
}

/**
 * Decode ORS polyline to GeoJSON coordinates
 * ORS uses Google Polyline Algorithm with precision 5
 */
function decodePolyline(encoded) {
    const coordinates = [];
    let index = 0, lat = 0, lng = 0;

    while (index < encoded.length) {
        let b, shift = 0, result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lat += dlat;

        shift = 0;
        result = 0;

        do {
            b = encoded.charCodeAt(index++) - 63;
            result |= (b & 0x1f) << shift;
            shift += 5;
        } while (b >= 0x20);

        const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
        lng += dlng;

        coordinates.push([lng / 1e5, lat / 1e5]); // [lon, lat] for GeoJSON
    }

    return coordinates;
}
