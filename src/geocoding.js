// Geocoding and Place Search with Provider Abstraction
// Supports Google Places (primary) with Photon/Nominatim fallback

import { CONFIG, LA_CENTER as LA_CENTER_CONFIG, isGoogleMapsConfigured } from './config.js';

// Cache for geocoding results (persists during session)
const geocodeCache = new Map();

// LA center coordinates for biasing results
const LA_CENTER = { lat: LA_CENTER_CONFIG.lat, lon: LA_CENTER_CONFIG.lng };

// Google Places services (initialized after map loads)
let placesAutocomplete = null;
let placesService = null;
let googleMapsLoaded = false;

/**
 * Initialize Google Places services
 * Called after Google Maps API is loaded
 */
export function initGooglePlaces(map) {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
        console.warn('Google Places API not available');
        return false;
    }

    try {
        placesAutocomplete = new google.maps.places.AutocompleteService();
        placesService = new google.maps.places.PlacesService(map);
        googleMapsLoaded = true;
        console.log('Google Places initialized');
        return true;
    } catch (error) {
        console.error('Failed to initialize Google Places:', error);
        return false;
    }
}

// ============================================
// Debounce utility
// ============================================
export function debounce(fn, delay) {
    let timeoutId = null;
    let pendingController = null;

    const debounced = (...args) => {
        // Cancel pending request
        if (pendingController) {
            pendingController.abort();
            pendingController = null;
        }

        // Clear existing timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
        }

        // Create new abort controller for this request
        pendingController = new AbortController();
        const controller = pendingController;

        return new Promise((resolve, reject) => {
            timeoutId = setTimeout(async () => {
                try {
                    const result = await fn(...args, controller.signal);
                    resolve(result);
                } catch (error) {
                    if (error.name === 'AbortError') {
                        resolve([]); // Silently return empty for aborted requests
                    } else {
                        reject(error);
                    }
                }
            }, delay);
        });
    };

    debounced.cancel = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        if (pendingController) {
            pendingController.abort();
            pendingController = null;
        }
    };

    return debounced;
}

// ============================================
// Normalized PlaceResult format
// ============================================
// {
//   id: string,           // Unique identifier
//   name: string,         // "Union Station"
//   address: string,      // "800 N Alameda St, Los Angeles"
//   type: string,         // "station", "restaurant", etc.
//   lat: number,
//   lon: number
// }

// ============================================
// Google Places Provider (primary)
// ============================================
const GooglePlacesProvider = {
    async search(query, options = {}, signal) {
        if (!googleMapsLoaded || !placesAutocomplete) {
            console.warn('Google Places not ready, falling back to Photon');
            return PhotonProvider.search(query, options, signal);
        }

        const limit = options.limit || 5;

        try {
            // Create location bias for LA area
            const center = new google.maps.LatLng(LA_CENTER.lat, LA_CENTER.lon);

            const predictions = await new Promise((resolve, reject) => {
                // Check if aborted before making request
                if (signal && signal.aborted) {
                    reject(new DOMException('Aborted', 'AbortError'));
                    return;
                }

                placesAutocomplete.getPlacePredictions({
                    input: query,
                    locationBias: new google.maps.Circle({
                        center: center,
                        radius: 50000 // 50km radius around LA
                    }),
                    types: ['establishment', 'geocode']
                }, (results, status) => {
                    if (status === google.maps.places.PlacesServiceStatus.OK) {
                        resolve(results.slice(0, limit));
                    } else if (status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                        resolve([]);
                    } else {
                        reject(new Error(`Places API error: ${status}`));
                    }
                });

                // Handle abort signal
                if (signal) {
                    signal.addEventListener('abort', () => {
                        reject(new DOMException('Aborted', 'AbortError'));
                    });
                }
            });

            // Convert predictions to our normalized format
            // Note: Predictions don't have coordinates, we'll get them on selection
            return predictions.map(prediction => this.normalizeResult(prediction));
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }
            console.error('Google Places search error:', error);
            // Fall back to Photon on error
            return PhotonProvider.search(query, options, signal);
        }
    },

    normalizeResult(prediction) {
        return {
            id: prediction.place_id,
            name: prediction.structured_formatting?.main_text || prediction.description.split(',')[0],
            address: prediction.structured_formatting?.secondary_text || prediction.description,
            type: prediction.types?.[0] || 'place',
            // Coordinates will be fetched when place is selected
            lat: null,
            lon: null,
            placeId: prediction.place_id // Keep for fetching details
        };
    },

    /**
     * Get place details including coordinates
     * @param {string} placeId - Google Place ID
     * @returns {Promise<{lat: number, lon: number}>}
     */
    async getDetails(placeId) {
        if (!placesService) {
            throw new Error('Places service not initialized');
        }

        return new Promise((resolve, reject) => {
            placesService.getDetails({
                placeId: placeId,
                fields: ['geometry', 'name', 'formatted_address']
            }, (place, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && place.geometry) {
                    resolve({
                        lat: place.geometry.location.lat(),
                        lon: place.geometry.location.lng(),
                        name: place.name,
                        address: place.formatted_address
                    });
                } else {
                    reject(new Error(`Place details error: ${status}`));
                }
            });
        });
    }
};

// ============================================
// Photon Provider (fallback for autocomplete)
// ============================================
const PhotonProvider = {
    async search(query, options = {}, signal) {
        const limit = options.limit || 5;
        const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${LA_CENTER.lat}&lon=${LA_CENTER.lon}&limit=${limit}`;

        try {
            const response = await fetch(url, {
                signal,
                headers: {
                    'User-Agent': 'VeloRail/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`Photon API error: ${response.status}`);
            }

            const data = await response.json();
            return (data.features || []).map(feature => this.normalizeResult(feature));
        } catch (error) {
            if (error.name === 'AbortError') {
                throw error;
            }
            console.error('Photon search error:', error);
            return [];
        }
    },

    normalizeResult(feature) {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [0, 0];

        // Build address from components
        const addressParts = [];
        if (props.street) {
            if (props.housenumber) {
                addressParts.push(`${props.housenumber} ${props.street}`);
            } else {
                addressParts.push(props.street);
            }
        }
        if (props.city) addressParts.push(props.city);
        if (props.state) addressParts.push(props.state);

        return {
            id: `photon-${coords[0]}-${coords[1]}-${props.osm_id || Math.random()}`,
            name: props.name || addressParts[0] || 'Unknown',
            address: addressParts.join(', ') || props.county || '',
            type: props.osm_value || props.type || 'place',
            lat: coords[1],
            lon: coords[0]
        };
    }
};

// Active provider - use Google if configured, otherwise Photon
function getActiveProvider() {
    if (isGoogleMapsConfigured() && googleMapsLoaded) {
        return GooglePlacesProvider;
    }
    return PhotonProvider;
}

// ============================================
// Public API
// ============================================

/**
 * Search for places using the active provider (Google Places or Photon fallback)
 * @param {string} query - Search query
 * @param {object} options - Search options (limit, etc.)
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<PlaceResult[]>} - Array of normalized place results
 */
export async function searchPlaces(query, options = {}, signal) {
    if (!query || query.trim().length < 2) {
        return [];
    }

    const provider = getActiveProvider();
    return provider.search(query.trim(), options, signal);
}

/**
 * Get full place details including coordinates
 * Required for Google Places results which don't include coordinates in autocomplete
 * @param {Object} place - Place result from searchPlaces
 * @returns {Promise<Object>} - Place with coordinates
 */
export async function getPlaceDetails(place) {
    // If place already has coordinates, return as-is
    if (place.lat !== null && place.lon !== null) {
        return place;
    }

    // If we have a placeId (Google Places), fetch details
    if (place.placeId && googleMapsLoaded) {
        try {
            const details = await GooglePlacesProvider.getDetails(place.placeId);
            return {
                ...place,
                lat: details.lat,
                lon: details.lon
            };
        } catch (error) {
            console.error('Failed to get place details:', error);
            // Fall back to geocoding the address
            const geocoded = await geocode(`${place.name}, ${place.address}`);
            if (geocoded) {
                return {
                    ...place,
                    lat: geocoded.lat,
                    lon: geocoded.lon
                };
            }
        }
    }

    return place;
}

/**
 * Get icon for a place type
 * @param {string} type - Place type from Photon
 * @returns {string} - Emoji icon
 */
export function getPlaceIcon(type) {
    const typeMap = {
        // Transit
        'station': '🚉',
        'railway': '🚉',
        'subway': '🚇',
        'bus_stop': '🚌',
        'tram_stop': '🚊',

        // Buildings
        'building': '🏢',
        'office': '🏢',
        'commercial': '🏢',
        'industrial': '🏭',

        // Food & Drink
        'restaurant': '🍽️',
        'cafe': '☕',
        'fast_food': '🍔',
        'bar': '🍺',
        'pub': '🍺',

        // Shopping
        'shop': '🛒',
        'supermarket': '🛒',
        'mall': '🛍️',
        'convenience': '🏪',

        // Health
        'hospital': '🏥',
        'clinic': '🏥',
        'pharmacy': '💊',
        'doctors': '🏥',

        // Entertainment
        'theatre': '🎭',
        'cinema': '🎬',
        'museum': '🏛️',
        'library': '📚',
        'park': '🌳',
        'stadium': '🏟️',

        // Education
        'school': '🏫',
        'university': '🎓',
        'college': '🎓',

        // Accommodation
        'hotel': '🏨',
        'hostel': '🏨',

        // Default
        'place': '📍',
        'address': '📍',
        'house': '🏠',
        'residential': '🏠'
    };

    return typeMap[type] || '📍';
}

/**
 * Geocode an address to coordinates
 * Uses Google Geocoding API if available, falls back to Nominatim
 */
export async function geocode(query) {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (geocodeCache.has(cacheKey)) {
        console.log(`Geocode cache hit: ${query}`);
        return geocodeCache.get(cacheKey);
    }

    // Try Google Geocoding first
    if (isGoogleMapsConfigured() && googleMapsLoaded && typeof google !== 'undefined') {
        try {
            const geocoder = new google.maps.Geocoder();
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode({
                    address: query,
                    bounds: new google.maps.LatLngBounds(
                        new google.maps.LatLng(33.70, -118.70), // SW
                        new google.maps.LatLng(34.35, -117.45)  // NE
                    )
                }, (results, status) => {
                    if (status === 'OK' && results.length > 0) {
                        resolve(results[0]);
                    } else {
                        reject(new Error(`Geocode failed: ${status}`));
                    }
                });
            });

            const result = {
                lat: response.geometry.location.lat(),
                lon: response.geometry.location.lng(),
                display_name: response.formatted_address
            };
            geocodeCache.set(cacheKey, result);
            return result;
        } catch (error) {
            console.warn('Google Geocoding failed, trying Nominatim:', error);
        }
    }

    // Fall back to Nominatim
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Los Angeles County')}`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'VeloRail/1.0'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
            // Cache the result
            geocodeCache.set(cacheKey, result);
            return result;
        }
        throw new Error('Location not found');
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}
