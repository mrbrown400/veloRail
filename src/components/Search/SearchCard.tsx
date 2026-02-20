import { useState, useEffect, useCallback } from 'react';
import { PlaceAutocomplete } from './PlaceAutocomplete';
import { LocationStatus } from './LocationStatus';
import { TimeSelector } from './TimeSelector';
import { ModeSelect } from './ModeSelect';
import { BikeSettings } from './BikeSettings';
import { useRouteStore, useUIStore } from '@/stores';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useRouting } from '@/hooks/useRouting';
import type { PlaceResult, ModeFilter, SafetyPreference } from '@/types';

interface SearchCardProps {
  className?: string;
}

export function SearchCard({ className = '' }: SearchCardProps) {
  const { searchParams, setSearchParams, isLoading } = useRouteStore();
  const { searchMode, expandSearch, isUsingGeolocation, currentLocation } = useUIStore();
  const { location, status: locationStatus, refresh: refreshLocation } = useGeolocation();
  const { calculateRoutes } = useRouting();

  // Local state for input values
  const [startValue, setStartValue] = useState('');
  const [endValue, setEndValue] = useState('');

  // Sync geolocation
  useEffect(() => {
    if (location && isUsingGeolocation) {
      setStartValue('Your Location');
    }
  }, [location, isUsingGeolocation]);

  const handleStartSelect = useCallback((place: PlaceResult) => {
    setStartValue(place.address ? `${place.name}, ${place.address}` : place.name);
    if (place.lat && place.lon) {
      setSearchParams({ start: { lat: place.lat, lon: place.lon, display_name: place.name } });
    }
  }, [setSearchParams]);

  const handleEndSelect = useCallback((place: PlaceResult) => {
    setEndValue(place.address ? `${place.name}, ${place.address}` : place.name);
    if (place.lat && place.lon) {
      setSearchParams({ end: { lat: place.lat, lon: place.lon, display_name: place.name } });
    }
  }, [setSearchParams]);

  const handleSearch = async () => {
    // Get start location
    let start = searchParams.start;
    if (!start && isUsingGeolocation && currentLocation) {
      start = currentLocation;
    }

    if (!start) {
      if (searchMode === 'collapsed') {
        expandSearch();
      }
      return;
    }

    // Get end location
    const end = searchParams.end;
    if (!end) {
      return;
    }

    await calculateRoutes(start, end);
  };

  const handleModeChange = (mode: ModeFilter) => {
    setSearchParams({ mode });
  };

  const handleSafetyChange = (safety: SafetyPreference) => {
    setSearchParams({ safety });
  };

  const handleTimeChange = (time: Date) => {
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
    <div className={`search-card ${className}`}>
      {/* Header */}
      <div className="search-header">
        <span className="search-logo">{'\u{1F6B2}'} + {'\u{1F686}'}</span>
        <span className="search-brand">VeloRail</span>
      </div>

      {/* Search Inputs */}
      <div className="search-inputs">
        {searchMode === 'collapsed' ? (
          // Collapsed: Destination only
          <>
            <PlaceAutocomplete
              value={endValue}
              onChange={setEndValue}
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
              onChange={setStartValue}
              onSelect={handleStartSelect}
              placeholder="Your Location"
              icon="start"
              onLocationRequest={handleUseLocation}
              showLocationButton
            />
            <PlaceAutocomplete
              value={endValue}
              onChange={setEndValue}
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
          onChange={(e) => handleSafetyChange(e.target.value as SafetyPreference)}
        >
          <option value="balanced">Balanced</option>
          <option value="safe">Safer Route</option>
          <option value="fast">Fastest</option>
        </select>
      </div>

      {/* Find Route Button */}
      <div className="search-options">
        <button
          className="find-route-btn"
          onClick={handleSearch}
          disabled={isLoading}
        >
          {isLoading ? 'Calculating...' : 'Find Route'}
        </button>
      </div>
    </div>
  );
}
