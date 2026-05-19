import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { LocationStatus } from './LocationStatus';
import { TimeSelector } from './TimeSelector';
import { ModeSelect } from './ModeSelect';
import { BikeSettings } from './BikeSettings';
import { Button, Card, VeloRailMark } from '@/components/ui';
import { useRouteStore, useUIStore } from '@/stores';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouting } from '@/hooks/useRouting';
import { geocode } from '@/services/geocoding';
import type { Location, PlaceResult, ModeFilter, SafetyPreference } from '@/types';

interface SearchCardProps {
  className?: string;
}

const ROUTE_SEARCH_FEEDBACK_ID = 'route-search-feedback';

export function SearchCard({ className = '' }: SearchCardProps) {
  const { searchParams, setSearchParams, isLoading, error, setError } = useRouteStore();
  const { searchMode, expandSearch, isUsingGeolocation, currentLocation } = useUIStore();
  const { location, status: locationStatus, refresh: refreshLocation } = useGeolocation();
  const { calculateRoutes } = useRouting();

  // Local state for input values
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [isResolvingPlaces, setIsResolvingPlaces] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  // Sync geolocation
  useEffect(() => {
    if (location && isUsingGeolocation) {
      setStartValue('Your Location');
    }
  }, [location, isUsingGeolocation]);

  const clearFeedback = useCallback(() => {
    setSearchMessage(null);
    setError(null);
  }, [setError]);

  const handleStartSelect = useCallback((place: PlaceResult) => {
    clearFeedback();
    setStartValue(place.address ? `${place.name}, ${place.address}` : place.name);
    if (place.lat !== null && place.lon !== null) {
      setSearchParams({ start: { lat: place.lat, lon: place.lon, display_name: place.name } });
    }
  }, [clearFeedback, setSearchParams]);

  const handleEndSelect = useCallback((place: PlaceResult) => {
    clearFeedback();
    setEndValue(place.address ? `${place.name}, ${place.address}` : place.name);
    if (place.lat !== null && place.lon !== null) {
      setSearchParams({ end: { lat: place.lat, lon: place.lon, display_name: place.name } });
    }
  }, [clearFeedback, setSearchParams]);

  const resolveTypedLocation = async (
    selectedLocation: Location | null,
    typedValue: string,
    label: 'start' | 'destination'
  ): Promise<Location | null> => {
    if (selectedLocation) return selectedLocation;

    const query = typedValue.trim();
    if (!query || query === 'Your Location') return null;

    setSearchMessage(`Looking up ${label} location...`);
    const resolved = await geocode(query);

    if (!resolved) {
      setError(`Could not find the ${label} location "${query}". Choose a suggestion or try a more specific place.`);
      return null;
    }

    const displayName = resolved.display_name || query;
    if (label === 'start') {
      setStartValue(displayName);
      setSearchParams({ start: resolved });
    } else {
      setEndValue(displayName);
      setSearchParams({ end: resolved });
    }

    return resolved;
  };

  const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);
    setSearchMessage(null);
    setIsResolvingPlaces(true);

    try {
      // Get start location
      let start = searchParams.start;
      if (!start && isUsingGeolocation && currentLocation) {
        start = currentLocation;
      }

      start = await resolveTypedLocation(start, startValue, 'start');

      if (!start) {
        if (searchMode === 'collapsed') {
          expandSearch();
        }
        setError('Enter a start location or choose a place suggestion before finding a route.');
        return;
      }

      // Get end location
      const end = await resolveTypedLocation(searchParams.end, endValue, 'destination');
      if (!end) {
        setError('Enter a destination or choose a place suggestion before finding a route.');
        return;
      }

      setSearchMessage('Calculating routes...');
      const routes = await calculateRoutes(start, end);

      if (routes.length > 0) {
        setSearchMessage(null);
      }
    } catch (routeError) {
      const message = routeError instanceof Error ? routeError.message : 'Could not calculate a route for those locations.';
      setError(message);
    } finally {
      setIsResolvingPlaces(false);
    }
  };

  const handleModeChange = (mode: ModeFilter) => {
    clearFeedback();
    setSearchParams({ mode });
  };

  const handleSafetyChange = (safety: SafetyPreference) => {
    clearFeedback();
    setSearchParams({ safety });
  };

  const handleTimeChange = (time: Date) => {
    clearFeedback();
    setSearchParams({ departureTime: time });
  };

  const handleLocationClick = () => {
    if (searchMode === 'collapsed') {
      expandSearch();
    }
  };

  const handleUseLocation = async () => {
    await refreshLocation();
  };

  return (
    <Card
      className={`search-card ${className}`}
      ariaLabel="Route search"
      aria-describedby={error || searchMessage ? ROUTE_SEARCH_FEEDBACK_ID : undefined}
    >
      <form
        className="search-form"
        onSubmit={handleSearch}
        aria-label="Route search form"
        aria-busy={isLoading || isResolvingPlaces}
      >
        {/* Header */}
        <div className="search-header">
          <span className="search-logo">
            <VeloRailMark />
          </span>
          <span className="search-brand">VeloRail</span>
        </div>

        {/* Search Inputs */}
        <div className="search-inputs">
          {searchMode === 'collapsed' ? (
            // Collapsed: Destination only
            <>
              <PlaceAutocomplete
                value={endValue}
                onChange={(value) => {
                  clearFeedback();
                  setEndValue(value);
                  setSearchParams({ end: null });
                }}
                onSelect={handleEndSelect}
                placeholder="Where to?"
                icon="end"
              />
              <LocationStatus
                status={locationStatus}
                onClick={handleLocationClick}
              />
            </>
          ) : (
            // Expanded: Start + Destination
            <>
              <PlaceAutocomplete
                value={startValue}
                onChange={(value) => {
                  clearFeedback();
                  setStartValue(value);
                  setSearchParams({ start: null });
                }}
                onSelect={handleStartSelect}
                placeholder="Your Location"
                icon="start"
                onLocationRequest={handleUseLocation}
                showLocationButton
              />
              <PlaceAutocomplete
                value={endValue}
                onChange={(value) => {
                  clearFeedback();
                  setEndValue(value);
                  setSearchParams({ end: null });
                }}
                onSelect={handleEndSelect}
                placeholder="Where to?"
                icon="end"
              />
            </>
          )}
        </div>

        {/* Time Selector */}
        <TimeSelector
          value={searchParams.departureTime}
          onChange={handleTimeChange}
        />

        {/* Options Row */}
        <div className="search-options">
          <ModeSelect
            value={searchParams.mode}
            onChange={handleModeChange}
          />
          <BikeSettings />
          <select
            className="search-option-select"
            value={searchParams.safety}
            aria-label="Bike route safety preference"
            onChange={(e) => handleSafetyChange(e.target.value as SafetyPreference)}
          >
            <option value="balanced">Balanced</option>
            <option value="safe">Safer Route</option>
            <option value="fast">Fastest</option>
          </select>
        </div>

        {(error || searchMessage) && (
          <div
            id={ROUTE_SEARCH_FEEDBACK_ID}
            className={`search-feedback ${error ? 'search-feedback--error' : ''}`}
            role={error ? 'alert' : 'status'}
            aria-live="polite"
          >
            {error || searchMessage}
          </div>
        )}

        {/* Find Route Button */}
        <div className="search-options">
          <Button
            className="find-route-btn"
            disabled={isLoading || isResolvingPlaces}
            variant="primary"
            fullWidth
            type="submit"
            aria-describedby={error || searchMessage ? ROUTE_SEARCH_FEEDBACK_ID : undefined}
          >
            {isResolvingPlaces ? 'Looking up...' : isLoading ? 'Calculating...' : 'Find Route'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
