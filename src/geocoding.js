// Geocoding and Place Search with Provider Abstraction
// Supports Nominatim (geocoding) and Photon (autocomplete/place search)

// Cache for geocoding results (persists during session)
const geocodeCache = new Map();

// LA center coordinates for biasing results
const LA_CENTER = { lat: 34.0522, lon: -118.2437 };

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
// Photon Provider (default for autocomplete)
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

// Active provider (can be swapped for Google Places later)
let activeProvider = PhotonProvider;

// ============================================
// Public API
// ============================================

/**
 * Search for places using the active provider (Photon by default)
 * @param {string} query - Search query
 * @param {object} options - Search options (limit, etc.)
 * @param {AbortSignal} signal - Optional abort signal
 * @returns {Promise<PlaceResult[]>} - Array of normalized place results
 */
export async function searchPlaces(query, options = {}, signal) {
    if (!query || query.trim().length < 2) {
        return [];
    }

    return activeProvider.search(query.trim(), options, signal);
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
 * Original geocode function for backward compatibility
 * Uses Nominatim for explicit address lookup
 */
export async function geocode(query) {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (geocodeCache.has(cacheKey)) {
        console.log(`Geocode cache hit: ${query}`);
        return geocodeCache.get(cacheKey);
    }

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
