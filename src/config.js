// Configuration for VeloRail
// For production, use environment variables

// Use Vite proxy in development to avoid CORS issues
const isDev = import.meta.env.DEV;

// Base URLs - use proxy in dev, direct URLs in production
const SWIFTLY_BASE = isDev ? '/api/swiftly' : 'https://api.goswift.ly';
const METROLINK_BASE = isDev ? '/api/metrolink' : 'https://metrolink-gtfsrt.gbsdigital.us';

// LA center coordinates for map initialization and API biasing
export const LA_CENTER = { lat: 34.0522, lng: -118.2437 };
export const LA_BOUNDS = {
    north: 34.35,
    south: 33.70,
    east: -117.45,
    west: -118.70
};

export const CONFIG = {
    // Google Maps API Key (required)
    // Get key at: https://console.cloud.google.com/apis/credentials
    GOOGLE_MAPS_API_KEY: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',

    // OpenRouteService API key
    // Get free key at: https://openrouteservice.org/dev/#/signup
    ORS_API_KEY: import.meta.env.VITE_ORS_API_KEY || '',

    // Routing preferences
    DEFAULT_SAFETY_PREFERENCE: 'balanced',

    // API fallback behavior
    USE_OSRM_FALLBACK: true,

    // Safety scoring thresholds
    SAFETY_THRESHOLDS: {
        GOOD: 70,
        MODERATE: 40
    },

    // Real-time GTFS-RT settings
    // Swiftly API (LA Metro rail)
    SWIFTLY_API_KEY: import.meta.env.VITE_SWIFTLY_API_KEY || '',
    SWIFTLY_TRIP_UPDATES_URL: import.meta.env.VITE_SWIFTLY_TRIP_UPDATES_URL ||
        `${SWIFTLY_BASE}/real-time/lametro-rail/gtfs-rt-trip-updates`,

    // Metrolink GTFS-RT
    METROLINK_API_KEY: import.meta.env.VITE_METROLINK_API_KEY || '',
    METROLINK_TRIP_UPDATES_URL: `${METROLINK_BASE}/feed/gtfsrt-trips`,

    // Real-time refresh settings
    REALTIME_REFRESH_INTERVAL: 15000,  // 15 seconds
    REALTIME_CACHE_TTL: 30000,         // 30 seconds

    // Vehicle position endpoints
    SWIFTLY_VEHICLE_POSITIONS_URL: import.meta.env.VITE_SWIFTLY_VEHICLE_POSITIONS_URL ||
        `${SWIFTLY_BASE}/real-time/lametro-rail/gtfs-rt-vehicle-positions`,
    METROLINK_VEHICLE_POSITIONS_URL: import.meta.env.VITE_METROLINK_VEHICLE_POSITIONS_URL ||
        `${METROLINK_BASE}/feed/gtfsrt-vehicles`,

    // Vehicle tracking refresh (faster for smoother movement)
    VEHICLE_REFRESH_INTERVAL: 10000    // 10 seconds
};

export function isORSConfigured() {
    return CONFIG.ORS_API_KEY && CONFIG.ORS_API_KEY.length > 0;
}

export function isGoogleMapsConfigured() {
    return CONFIG.GOOGLE_MAPS_API_KEY && CONFIG.GOOGLE_MAPS_API_KEY.length > 0;
}
