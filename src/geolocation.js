// Geolocation service for VeloRail
// Designed for current single-location use AND future live navigation support

// --- State ---
let currentLocation = null;
let locationStatus = 'pending'; // 'pending' | 'granted' | 'denied' | 'unavailable'
let watchId = null;
let positionCallbacks = new Set();

// Geolocation options
const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 10000,        // 10 second timeout
    maximumAge: 60000      // Accept cached position up to 1 minute old
};

// --- Core API (used now) ---

/**
 * Get the current location state
 * @returns {{ location: object|null, status: string }}
 */
export function getCurrentLocationState() {
    return {
        location: currentLocation,
        status: locationStatus
    };
}

/**
 * Request one-time geolocation from the browser
 * @returns {Promise<object>} Location object with lat, lon, display_name, etc.
 */
export async function requestGeolocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            locationStatus = 'unavailable';
            reject(new Error('Geolocation not supported by this browser'));
            return;
        }

        locationStatus = 'pending';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const location = createLocationObject(position);
                currentLocation = location;
                locationStatus = 'granted';
                resolve(location);
            },
            (error) => {
                locationStatus = error.code === 1 ? 'denied' : 'unavailable';
                reject(error);
            },
            GEOLOCATION_OPTIONS
        );
    });
}

// --- Live Tracking API (for future navigation feature) ---

/**
 * Start watching position for continuous updates
 * @param {function} callback - Called with location object on each update
 * @returns {function} Cleanup function to stop watching
 */
export function startWatchingPosition(callback) {
    if (!navigator.geolocation) {
        console.warn('Geolocation not supported');
        return () => {};
    }

    // Add callback to subscribers
    if (callback) {
        positionCallbacks.add(callback);
    }

    // Only start watching if not already watching
    if (watchId === null) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                const location = createLocationObject(position);
                notifyPositionUpdate(location);
            },
            (error) => {
                console.error('Watch position error:', error);
                locationStatus = error.code === 1 ? 'denied' : 'unavailable';
            },
            {
                ...GEOLOCATION_OPTIONS,
                maximumAge: 0 // Always get fresh position for live tracking
            }
        );
    }

    // Return cleanup function
    return () => {
        if (callback) {
            positionCallbacks.delete(callback);
        }
        // Stop watching if no more subscribers
        if (positionCallbacks.size === 0) {
            stopWatchingPosition();
        }
    };
}

/**
 * Stop watching position updates
 */
export function stopWatchingPosition() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
    }
    positionCallbacks.clear();
}

/**
 * Register a callback for position updates (alternative subscription method)
 * @param {function} callback - Called with location object on updates
 * @returns {function} Unsubscribe function
 */
export function onPositionUpdate(callback) {
    positionCallbacks.add(callback);
    return () => positionCallbacks.delete(callback);
}

/**
 * Check if currently watching position
 * @returns {boolean}
 */
export function isWatchingPosition() {
    return watchId !== null;
}

// --- Internal ---

/**
 * Notify all subscribers of a position update
 * @param {object} location - Location object
 */
function notifyPositionUpdate(location) {
    currentLocation = location;
    locationStatus = 'granted';
    positionCallbacks.forEach(cb => {
        try {
            cb(location);
        } catch (e) {
            console.error('Position callback error:', e);
        }
    });
}

/**
 * Create standardized location object from GeolocationPosition
 * @param {GeolocationPosition} position - Browser geolocation position
 * @returns {object} Standardized location object
 */
function createLocationObject(position) {
    return {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
        display_name: 'Your Location',
        isGeolocation: true,
        accuracy: position.coords.accuracy,
        heading: position.coords.heading,      // For future turn-by-turn (null if unavailable)
        speed: position.coords.speed,          // For future ETA updates (null if unavailable)
        altitude: position.coords.altitude,    // For elevation-aware routing
        timestamp: position.timestamp
    };
}
