import { useState, useEffect, useCallback } from 'react';
import {
  requestGeolocation,
  startWatchingPosition
} from '@/services/geolocation';
import { useUIStore } from '@/stores';
import type { Location, LocationStatus } from '@/types';

interface UseGeolocationReturn {
  location: Location | null;
  status: LocationStatus;
  error: string | null;
  refresh: () => Promise<void>;
  startWatching: () => () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const {
    currentLocation,
    locationStatus,
    setCurrentLocation,
    setLocationStatus,
    setUsingGeolocation
  } = useUIStore();

  const [error, setError] = useState<string | null>(null);

  // Initial geolocation request on mount
  useEffect(() => {
    const initGeolocation = async () => {
      setLocationStatus('pending');

      try {
        const location = await requestGeolocation();
        setCurrentLocation(location);
        setLocationStatus('granted');
        setUsingGeolocation(true);
        setError(null);
      } catch (err) {
        if (err instanceof GeolocationPositionError) {
          if (err.code === 1) {
            setLocationStatus('denied');
            setError('Location access denied');
          } else {
            setLocationStatus('unavailable');
            setError('Location unavailable');
          }
        } else {
          setLocationStatus('unavailable');
          setError('Failed to get location');
        }
        setUsingGeolocation(false);
      }
    };

    initGeolocation();
  }, [setCurrentLocation, setLocationStatus, setUsingGeolocation]);

  const refresh = useCallback(async () => {
    setLocationStatus('pending');
    setError(null);

    try {
      const location = await requestGeolocation();
      setCurrentLocation(location);
      setLocationStatus('granted');
      setUsingGeolocation(true);
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        if (err.code === 1) {
          setLocationStatus('denied');
          setError('Location access denied');
        } else {
          setLocationStatus('unavailable');
          setError('Location unavailable');
        }
      } else {
        setLocationStatus('unavailable');
        setError('Failed to get location');
      }
      setUsingGeolocation(false);
    }
  }, [setCurrentLocation, setLocationStatus, setUsingGeolocation]);

  const startWatching = useCallback(() => {
    return startWatchingPosition((location) => {
      setCurrentLocation(location);
      setLocationStatus('granted');
    });
  }, [setCurrentLocation, setLocationStatus]);

  return {
    location: currentLocation,
    status: locationStatus,
    error,
    refresh,
    startWatching
  };
}
