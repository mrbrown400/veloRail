import { useState, useEffect, useCallback, useRef, type FormEvent } from 'react';
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
const START_FIELD_ID = 'route-start-field';
const END_FIELD_ID = 'route-end-field';
const START_STATUS_ID = 'route-start-status';
const END_STATUS_ID = 'route-end-status';

type EndpointField = 'start' | 'destination';
type FieldErrors = Partial<Record<EndpointField, string>>;

const SERVICE_AREA_BOUNDS = {
  north: 34.35,
  south: 33.40,
  west: -119.20,
  east: -117.25
};

const SERVICE_AREA_LABEL = 'VeloRail service area: Oxnard, San Bernardino, San Fernando, and San Clemente anchors';

function isInServiceArea(location: Location): boolean {
  return location.lat >= SERVICE_AREA_BOUNDS.south
    && location.lat <= SERVICE_AREA_BOUNDS.north
    && location.lon >= SERVICE_AREA_BOUNDS.west
    && location.lon <= SERVICE_AREA_BOUNDS.east;
}

function formatPlaceValue(place: PlaceResult): string {
  return place.address ? `${place.name}, ${place.address}` : place.name;
}

function getDegradedMessage(location: Location | PlaceResult | null, label: EndpointField): string | null {
  if (!location?.isFallback) return null;
  const providerLabel = location.provider === 'photon' ? 'Photon' : 'Nominatim';
  const fieldLabel = label === 'start' ? 'origin' : 'destination';

  return `${fieldLabel} resolved through ${providerLabel} fallback. Route quality may be less precise than Google Places.`;
}

export function SearchCard({ className = '' }: SearchCardProps) {
  const { searchParams, setSearchParams, isLoading, error, setError } = useRouteStore();
  const { searchMode, expandSearch, isUsingGeolocation, currentLocation } = useUIStore();
  const { location, status: locationStatus, refresh: refreshLocation } = useGeolocation();
  const { calculateRoutes } = useRouting();

  const startInputRef = useRef<HTMLInputElement | null>(null);

  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');
  const [isResolvingPlaces, setIsResolvingPlaces] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [resolvingField, setResolvingField] = useState<EndpointField | null>(null);
  const [degradedMessage, setDegradedMessage] = useState<string | null>(null);
  const [shouldFocusOrigin, setShouldFocusOrigin] = useState(false);

  // Sync geolocation
  useEffect(() => {
    if (location && isUsingGeolocation) {
      setStartValue('Your Location');
    }
  }, [location, isUsingGeolocation]);

  useEffect(() => {
    if (searchMode === 'expanded' && shouldFocusOrigin) {
      startInputRef.current?.focus();
      setShouldFocusOrigin(false);
    }
  }, [searchMode, shouldFocusOrigin]);

  const clearFeedback = useCallback(() => {
    setSearchMessage(null);
    setError(null);
    setDegradedMessage(null);
  }, [setError]);

  const clearFieldError = useCallback((field: EndpointField) => {
    setFieldErrors((current) => {
      if (!current[field]) return current;
      const next = { ...current };
      delete next[field];
      return next;
    });
  }, []);

  const setFieldError = useCallback((field: EndpointField, message: string) => {
    setFieldErrors((current) => ({ ...current, [field]: message }));
  }, []);

  const handleStartSelect = useCallback((place: PlaceResult) => {
    clearFeedback();
    clearFieldError('start');
    setStartValue(formatPlaceValue(place));
    if (place.lat !== null && place.lon !== null) {
      const location: Location = {
        lat: place.lat,
        lon: place.lon,
        display_name: place.name,
        provider: place.provider,
        isFallback: place.isFallback
      };
      if (!isInServiceArea(location)) {
        setSearchParams({ start: null });
        setFieldError('start', `Start is outside the ${SERVICE_AREA_LABEL}.`);
        return;
      }
      setSearchParams({ start: location });
      setDegradedMessage(getDegradedMessage(place, 'start'));
    }
  }, [clearFeedback, clearFieldError, setFieldError, setSearchParams]);

  const handleEndSelect = useCallback((place: PlaceResult) => {
    clearFeedback();
    clearFieldError('destination');
    setEndValue(formatPlaceValue(place));
    if (place.lat !== null && place.lon !== null) {
      const location: Location = {
        lat: place.lat,
        lon: place.lon,
        display_name: place.name,
        provider: place.provider,
        isFallback: place.isFallback
      };
      if (!isInServiceArea(location)) {
        setSearchParams({ end: null });
        setFieldError('destination', `Destination is outside the ${SERVICE_AREA_LABEL}.`);
        return;
      }
      setSearchParams({ end: location });
      setDegradedMessage(getDegradedMessage(place, 'destination'));
    }
  }, [clearFeedback, clearFieldError, setFieldError, setSearchParams]);

  const resolveTypedLocation = async (
    selectedLocation: Location | null,
    typedValue: string,
    label: 'start' | 'destination'
  ): Promise<Location | null> => {
    if (selectedLocation) {
      if (!isInServiceArea(selectedLocation)) {
        setFieldError(label, `${label === 'start' ? 'Start' : 'Destination'} is outside the ${SERVICE_AREA_LABEL}.`);
        return null;
      }
      return selectedLocation;
    }

    const query = typedValue.trim();
    if (!query || query === 'Your Location') return null;

    clearFieldError(label);
    setResolvingField(label);
    setSearchMessage(`Looking up ${label === 'start' ? 'origin' : 'destination'} location...`);
    const resolved = await geocode(query);
    setResolvingField(null);

    if (!resolved) {
      setFieldError(label, `Could not find the ${label === 'start' ? 'origin' : 'destination'} "${query}". Choose a suggestion or try a more specific place.`);
      return null;
    }

    if (!isInServiceArea(resolved)) {
      setFieldError(label, `${label === 'start' ? 'Start' : 'Destination'} is outside the ${SERVICE_AREA_LABEL}.`);
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

    setDegradedMessage(getDegradedMessage(resolved, label));
    return resolved;
  };

  const handleSearch = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    setError(null);
    setSearchMessage(null);
    setFieldErrors({});
    setDegradedMessage(null);
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
          setShouldFocusOrigin(true);
        }
        setFieldError('start', 'Add a start location or use current location to continue.');
        setSearchMessage('Destination saved. Add an origin to compare car-free routes.');
        return;
      }

      // Get end location
      const end = await resolveTypedLocation(searchParams.end, endValue, 'destination');
      if (!end) {
        setFieldError('destination', 'Enter a destination or choose a place suggestion before finding a route.');
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
      setResolvingField(null);
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
    clearFeedback();
    clearFieldError('start');
    await refreshLocation();
  };

  return (
    <Card
      className={`search-card ${className}`}
      ariaLabel="Route search"
      aria-describedby={error || searchMessage || degradedMessage ? ROUTE_SEARCH_FEEDBACK_ID : undefined}
      data-search-mode={searchMode}
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
          <p id={START_STATUS_ID} className="sr-only">
            Origin can be typed manually or set from current location.
          </p>
          <p id={END_STATUS_ID} className="sr-only">
            Destination can be selected from suggestions or resolved from typed text.
          </p>
          {searchMode === 'collapsed' ? (
            // Collapsed: Destination only
            <>
              <PlaceAutocomplete
                id={END_FIELD_ID}
                label="Destination"
                value={endValue}
                onChange={(value) => {
                  clearFeedback();
                  clearFieldError('destination');
                  setEndValue(value);
                  setSearchParams({ end: null });
                }}
                onSelect={handleEndSelect}
                placeholder="Where to?"
                icon="end"
                error={fieldErrors.destination}
                statusMessage={resolvingField === 'destination' ? 'Resolving destination...' : null}
                describedBy={END_STATUS_ID}
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
                id={START_FIELD_ID}
                label="Start location"
                value={startValue}
                onChange={(value) => {
                  clearFeedback();
                  clearFieldError('start');
                  setStartValue(value);
                  setSearchParams({ start: null });
                }}
                onSelect={handleStartSelect}
                placeholder="Your Location"
                icon="start"
                onLocationRequest={handleUseLocation}
                showLocationButton
                inputRef={startInputRef}
                error={fieldErrors.start}
                statusMessage={resolvingField === 'start' ? 'Resolving origin...' : null}
                describedBy={START_STATUS_ID}
              />
              <LocationStatus
                status={locationStatus}
                onClick={handleUseLocation}
              />
              <PlaceAutocomplete
                id={END_FIELD_ID}
                label="Destination"
                value={endValue}
                onChange={(value) => {
                  clearFeedback();
                  clearFieldError('destination');
                  setEndValue(value);
                  setSearchParams({ end: null });
                }}
                onSelect={handleEndSelect}
                placeholder="Where to?"
                icon="end"
                error={fieldErrors.destination}
                statusMessage={resolvingField === 'destination' ? 'Resolving destination...' : null}
                describedBy={END_STATUS_ID}
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

        {(error || searchMessage || degradedMessage) && (
          <div
            id={ROUTE_SEARCH_FEEDBACK_ID}
            className={`search-feedback ${error ? 'search-feedback--error' : degradedMessage ? 'search-feedback--degraded' : ''}`}
            role={error ? 'alert' : 'status'}
            aria-live={error ? 'assertive' : 'polite'}
          >
            {error || searchMessage || degradedMessage}
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
            data-testid="find-route-button"
            aria-describedby={error || searchMessage || degradedMessage ? ROUTE_SEARCH_FEEDBACK_ID : undefined}
          >
            {isResolvingPlaces ? 'Looking up...' : isLoading ? 'Calculating...' : 'Find Route'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
