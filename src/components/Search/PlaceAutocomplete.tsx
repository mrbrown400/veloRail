import { useState, useRef, useEffect, useCallback } from 'react';
import { searchPlaces, getPlaceDetails, getPlaceIcon, debounce } from '@/services/geocoding';
import { CrosshairIcon, DestinationIcon, MapPinIcon, OriginIcon } from '@/components/ui';
import type { PlaceResult } from '@/types';

interface PlaceAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  icon?: 'start' | 'end';
  showLocationButton?: boolean;
  onLocationRequest?: () => void;
}

export function PlaceAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a place',
  icon,
  showLocationButton,
  onLocationRequest
}: PlaceAutocompleteProps) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, signal?: AbortSignal) => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        return [];
      }

      setIsLoading(true);
      try {
        const searchResults = await searchPlaces(query, { limit: 5 }, signal);
        setResults(searchResults);
        setIsOpen(searchResults.length > 0);
        setHighlightedIndex(-1);
        return searchResults;
      } finally {
        setIsLoading(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    // Only search when input is focused
    if (!isFocused) {
      return;
    }

    if (value && value !== 'Your Location') {
      debouncedSearch(value);
    } else {
      setResults([]);
      setIsOpen(false);
    }
  }, [value, isFocused, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSelect = async (place: PlaceResult) => {
    // Close dropdown and clear results immediately
    setIsOpen(false);
    setResults([]);
    setIsFocused(false);

    // Get coordinates if not available
    let placeWithCoords = place;
    if (place.lat === null || place.lon === null) {
      try {
        placeWithCoords = await getPlaceDetails(place);
      } catch (error) {
        console.error('Failed to get place details:', error);
      }
    }

    onSelect(placeWithCoords);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev =>
          Math.min(prev + 1, results.length - 1)
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        if (highlightedIndex >= 0 && highlightedIndex < results.length) {
          e.preventDefault();
          handleSelect(results[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        inputRef.current?.blur();
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show existing results if we have them
    if (results.length > 0 && value.length >= 2) {
      setIsOpen(true);
    }
  };

  const handleBlur = () => {
    // Delay to allow click on dropdown item
    setTimeout(() => {
      setIsFocused(false);
      setIsOpen(false);
    }, 200);
  };

  const searchIcon =
    icon === 'start' ? <OriginIcon />
    : icon === 'end' ? <DestinationIcon />
    : <MapPinIcon />;

  return (
    <div className="search-input-wrapper">
      <span className={`search-input-icon ${icon || ''}`} aria-hidden="true">
        {searchIcon}
      </span>
      <input
        ref={inputRef}
        type="text"
        className="search-input"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
      />
      {showLocationButton && onLocationRequest && (
        <button
          type="button"
          className="location-btn"
          onClick={onLocationRequest}
          title="Use my location"
          aria-label="Use my location"
        >
          <CrosshairIcon />
        </button>
      )}

      {/* Dropdown */}
      <div
        ref={dropdownRef}
        className={`autocomplete-dropdown ${isOpen ? 'visible' : ''}`}
      >
        {isLoading ? (
          <div className="autocomplete-loading">Searching...</div>
        ) : results.length === 0 && value.length >= 2 ? (
          <div className="autocomplete-no-results">No results found</div>
        ) : (
          results.map((place, index) => (
            <div
              key={place.id}
              className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              onMouseDown={() => handleSelect(place)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <span className="autocomplete-item-icon">
                {getPlaceIcon(place.type)}
              </span>
              <div className="autocomplete-item-text">
                <span className="autocomplete-item-name">{place.name}</span>
                <span className="autocomplete-item-address">{place.address}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
