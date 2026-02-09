import { useState, useCallback, useRef, useEffect } from 'react';
import { searchPlaces, getPlaceDetails, debounce } from '@/services/geocoding';
import type { PlaceResult } from '@/types';

interface UseAutocompleteOptions {
  limit?: number;
  debounceMs?: number;
}

interface UseAutocompleteReturn {
  query: string;
  setQuery: (query: string) => void;
  results: PlaceResult[];
  isLoading: boolean;
  error: string | null;
  selectedPlace: PlaceResult | null;
  selectPlace: (place: PlaceResult) => Promise<void>;
  clearResults: () => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
}

export function useAutocomplete(options: UseAutocompleteOptions = {}): UseAutocompleteReturn {
  const { limit = 5, debounceMs = 300 } = options;

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const abortControllerRef = useRef<AbortController | null>(null);

  // Create debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string, signal?: AbortSignal) => {
      if (searchQuery.length < 2) {
        setResults([]);
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const searchResults = await searchPlaces(searchQuery, { limit }, signal);
        setResults(searchResults);
        setHighlightedIndex(-1);
        return searchResults;
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Ignore aborted requests
          return [];
        }
        setError('Search failed');
        return [];
      } finally {
        setIsLoading(false);
      }
    }, debounceMs),
    [limit, debounceMs]
  );

  // Trigger search when query changes
  useEffect(() => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    if (query.length >= 2) {
      abortControllerRef.current = new AbortController();
      debouncedSearch(query, abortControllerRef.current.signal);
    } else {
      setResults([]);
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [query, debouncedSearch]);

  const selectPlace = useCallback(async (place: PlaceResult) => {
    // Get coordinates if not available
    let placeWithCoords = place;
    if (place.lat === null || place.lon === null) {
      try {
        setIsLoading(true);
        placeWithCoords = await getPlaceDetails(place);
      } catch (err) {
        console.error('Failed to get place details:', err);
      } finally {
        setIsLoading(false);
      }
    }

    setSelectedPlace(placeWithCoords);
    setQuery(place.address ? `${place.name}, ${place.address}` : place.name);
    setResults([]);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setHighlightedIndex(-1);
  }, []);

  return {
    query,
    setQuery,
    results,
    isLoading,
    error,
    selectedPlace,
    selectPlace,
    clearResults,
    highlightedIndex,
    setHighlightedIndex
  };
}
