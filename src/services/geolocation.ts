// Geolocation service for VeloRail
import type { Location, LocationStatus } from '@/types';

// State
let currentLocation: Location | null = null;
let locationStatus: LocationStatus = 'pending';
let watchId: number | null = null;
const positionCallbacks = new Set<(location: Location) => void>();

// Geolocation options
const GEOLOCATION_OPTIONS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000
};

/**
 * Get the current location state
 */
export function getCurrentLocationState(): { location: Location | null; status: LocationStatus } {
  return {
    location: currentLocation,
    status: locationStatus
  };
}

/**
 * Request one-time geolocation from the browser
 */
export async function requestGeolocation(): Promise<Location> {
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

/**
 * Start watching position for continuous updates
 */
export function startWatchingPosition(callback?: (location: Location) => void): () => void {
  if (!navigator.geolocation) {
    console.warn('Geolocation not supported');
    return () => {};
  }

  if (callback) {
    positionCallbacks.add(callback);
  }

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
        maximumAge: 0
      }
    );
  }

  return () => {
    if (callback) {
      positionCallbacks.delete(callback);
    }
    if (positionCallbacks.size === 0) {
      stopWatchingPosition();
    }
  };
}

/**
 * Stop watching position updates
 */
export function stopWatchingPosition(): void {
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  positionCallbacks.clear();
}

/**
 * Register a callback for position updates
 */
export function onPositionUpdate(callback: (location: Location) => void): () => void {
  positionCallbacks.add(callback);
  return () => positionCallbacks.delete(callback);
}

/**
 * Check if currently watching position
 */
export function isWatchingPosition(): boolean {
  return watchId !== null;
}

// Internal helpers

function notifyPositionUpdate(location: Location): void {
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

function createLocationObject(position: GeolocationPosition): Location {
  return {
    lat: position.coords.latitude,
    lon: position.coords.longitude,
    display_name: 'Your Location',
    isGeolocation: true,
    accuracy: position.coords.accuracy,
    heading: position.coords.heading,
    speed: position.coords.speed,
    altitude: position.coords.altitude,
    timestamp: position.timestamp
  };
}
