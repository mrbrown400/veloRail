import { useState, useRef, useEffect, useCallback, type MutableRefObject } from 'react';
import { searchPlaces, getPlaceDetails, getPlaceIcon, debounce } from '@/services/geocoding';
import { CrosshairIcon, DestinationIcon, MapPinIcon, OriginIcon } from '@/components/ui';
import type { PlaceResult } from '@/types';

interface PlaceAutocompleteProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (place: PlaceResult) => void;
  placeholder?: string;
  icon?: 'start' | 'end';
  showLocationButton?: boolean;
  onLocationRequest?: () => void;
  inputRef?: MutableRefObject<HTMLInputElement | null>;
  error?: string | null;
  statusMessage?: string | null;
  describedBy?: string;
}

export function PlaceAutocomplete({
  id,
  label,
  value,
  onChange,
  onSelect,
  placeholder = 'Search for a place',
  icon,
  showLocationButton,
  onLocationRequest,
  inputRef,
  error,
  statusMessage,
  describedBy
}: PlaceAutocompleteProps) {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const localInputRef = useRef<HTMLInputElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const listboxId = `${id}-listbox`;
  const activeOptionId = highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined;
  const helperIds = [describedBy, error ? `${id}-error` : null, statusMessage ? `${id}-status` : null]
    .filter(Boolean)
    .join(' ') || undefined;

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string, signal?: AbortSignal) => {
      if (query.length < 2) {
        setResults([]);
        setIsOpen(false);
        setServiceError(null);
        return [];
      }

      setIsLoading(true);
      setIsOpen(true);
      setServiceError(null);
      try {
        const searchResults = await searchPlaces(query, { limit: 5 }, signal);
        setResults(searchResults);
        setIsOpen(true);
        setHighlightedIndex(-1);
        return searchResults;
      } catch (searchError) {
        if (searchError instanceof Error && searchError.name === 'AbortError') {
          setResults([]);
          return [];
        }
        setResults([]);
        setServiceError('Place search is unavailable. You can still type an address and submit it.');
        setIsOpen(true);
        return [];
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
      void debouncedSearch(value);
    } else {
      setResults([]);
      setIsOpen(false);
      setServiceError(null);
    }
  }, [value, isFocused, debouncedSearch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setServiceError(null);
    onChange(e.target.value);
  };

  const handleSelect = async (place: PlaceResult) => {
    // Close dropdown and clear results immediately
    setIsOpen(false);
    setResults([]);
    setIsFocused(false);
    setServiceError(null);

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
        if (results.length > 0) {
          setHighlightedIndex(prev =>
            Math.min(prev + 1, results.length - 1)
          );
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (results.length > 0) {
          setHighlightedIndex(prev => Math.max(prev - 1, -1));
        }
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
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show existing results if we have them
    if (value.length >= 2 && (results.length > 0 || serviceError)) {
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
    <div className={`search-input-wrapper ${error ? 'search-input-wrapper--error' : ''}`}>
      <label className="sr-only" htmlFor={id}>{label}</label>
      <span className={`search-input-icon ${icon || ''}`} aria-hidden="true">
        {searchIcon}
      </span>
      <input
        id={id}
        ref={(node) => {
          localInputRef.current = node;
          if (inputRef) {
            inputRef.current = node;
          }
        }}
        type="text"
        className="search-input"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeOptionId}
        aria-invalid={Boolean(error)}
        aria-describedby={helperIds}
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
        id={listboxId}
        ref={dropdownRef}
        className={`autocomplete-dropdown ${isOpen ? 'visible' : ''}`}
        role="listbox"
        aria-label={`${label} suggestions`}
      >
        {isLoading ? (
          <div className="autocomplete-loading" role="status">Searching...</div>
        ) : serviceError ? (
          <div className="autocomplete-error" role="alert">{serviceError}</div>
        ) : results.length === 0 && value.length >= 2 ? (
          <div className="autocomplete-no-results" role="status">No results found. Press Enter to try the typed address.</div>
        ) : (
          results.map((place, index) => (
            <div
              key={place.id}
              id={`${id}-option-${index}`}
              className={`autocomplete-item ${index === highlightedIndex ? 'highlighted' : ''}`}
              role="option"
              aria-selected={index === highlightedIndex}
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
      {statusMessage && (
        <p id={`${id}-status`} className="search-field-message" role="status">
          {statusMessage}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="search-field-message search-field-message--error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
