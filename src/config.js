// Configuration for VeloRail
// For production, use environment variables

export const CONFIG = {
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
    }
};

export function isORSConfigured() {
    return CONFIG.ORS_API_KEY && CONFIG.ORS_API_KEY.length > 0;
}
