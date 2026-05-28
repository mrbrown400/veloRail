// Geocoding and Place Search with Provider Abstraction
// Supports Google Places (primary) with Photon/Nominatim fallback

import { LA_CENTER, isGoogleMapsConfigured } from './config';
import type { Location, PlaceResult } from '@/types';

// Cache for geocoding results
const geocodeCache = new Map<string, Location>();

type PlacesAutocompleteDataLibrary = google.maps.PlacesLibrary & {
  AutocompleteSessionToken: typeof google.maps.places.AutocompleteSessionToken;
  AutocompleteSuggestion: typeof google.maps.places.AutocompleteSuggestion;
  Place: typeof google.maps.places.Place;
};

// Google Places Autocomplete Data API state.
let placesLibraryPromise: Promise<PlacesAutocompleteDataLibrary | null> | null = null;
let placesLibrary: PlacesAutocompleteDataLibrary | null = null;
let autocompleteSessionToken: google.maps.places.AutocompleteSessionToken | null = null;
const googlePlaceCache = new Map<string, google.maps.places.Place>();
let googleMapsLoaded = false;

/**
 * Initialize Google Places services
 */
export function initGooglePlaces(_map?: google.maps.Map): boolean {
  if (typeof google === 'undefined' || !google.maps) {
    console.warn('Google Places API not available');
    return false;
  }

  try {
    googleMapsLoaded = true;
    void loadPlacesLibrary();
    console.log('Google Places Autocomplete Data API initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Google Places:', error);
    return false;
  }
}

/**
 * Debounce utility - simplified for search use case
 */
export function debounce<T>(
  fn: (query: string, signal?: AbortSignal) => Promise<T>,
  delay: number
): (query: string, signal?: AbortSignal) => Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let pendingController: AbortController | null = null;

  return (query: string, signal?: AbortSignal) => {
    if (pendingController) {
      pendingController.abort();
      pendingController = null;
    }

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    pendingController = new AbortController();
    const controller = pendingController;

    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        try {
          const result = await fn(query, signal || controller.signal);
          resolve(result);
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            resolve([] as T);
          } else {
            reject(error);
          }
        }
      }, delay);
    });
  };
}

// ============================================
// Google Places Provider
// ============================================

async function loadPlacesLibrary(): Promise<PlacesAutocompleteDataLibrary | null> {
  if (placesLibrary) {
    return placesLibrary;
  }

  if (typeof google === 'undefined' || !google.maps) {
    return null;
  }

  if (!placesLibraryPromise) {
    placesLibraryPromise = (async () => {
      if (google.maps.importLibrary) {
        const loadedLibrary = await google.maps.importLibrary('places') as PlacesAutocompleteDataLibrary;
        placesLibrary = loadedLibrary;
        return loadedLibrary;
      }

      const placesNamespace = google.maps.places;
      if (
        placesNamespace?.AutocompleteSuggestion
        && placesNamespace.AutocompleteSessionToken
        && placesNamespace.Place
      ) {
        placesLibrary = placesNamespace as unknown as PlacesAutocompleteDataLibrary;
        return placesLibrary;
      }

      return null;
    })().catch((error) => {
      placesLibraryPromise = null;
      console.warn('Google Places library failed to load:', error);
      return null;
    });
  }

  return placesLibraryPromise;
}

function getAutocompleteSessionToken(
  library: PlacesAutocompleteDataLibrary
): google.maps.places.AutocompleteSessionToken {
  autocompleteSessionToken ||= new library.AutocompleteSessionToken();
  return autocompleteSessionToken;
}

function resetAutocompleteSession(): void {
  autocompleteSessionToken = null;
  googlePlaceCache.clear();
}

async function googlePlacesSearch(
  query: string,
  options: { limit?: number } = {},
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const library = await loadPlacesLibrary();
  if (!googleMapsLoaded || !library) {
    console.warn('Google Places not ready, falling back to Photon');
    return photonSearch(query, options, signal);
  }

  const limit = options.limit || 5;

  try {
    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    const response = await library.AutocompleteSuggestion.fetchAutocompleteSuggestions({
      input: query,
      includedRegionCodes: ['us'],
      locationBias: {
        center: { lat: LA_CENTER.lat, lng: LA_CENTER.lng },
        radius: 50000
      },
      origin: { lat: LA_CENTER.lat, lng: LA_CENTER.lng },
      region: 'us',
      sessionToken: getAutocompleteSessionToken(library)
    });

    if (signal?.aborted) {
      throw new DOMException('Aborted', 'AbortError');
    }

    return response.suggestions
      .map((suggestion) => suggestion.placePrediction)
      .filter((prediction): prediction is google.maps.places.PlacePrediction => Boolean(prediction))
      .slice(0, limit)
      .map(normalizeGoogleResult);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Google Places search error:', error);
    return photonSearch(query, options, signal);
  }
}

function normalizeGoogleResult(prediction: google.maps.places.PlacePrediction): PlaceResult {
  const placeId = prediction.placeId;
  if (placeId) {
    googlePlaceCache.set(placeId, prediction.toPlace());
  }

  return {
    id: placeId,
    name: prediction.mainText?.text || prediction.text?.text.split(',')[0] || 'Unknown place',
    address: prediction.secondaryText?.text || prediction.text?.text || '',
    type: prediction.types?.[0] || 'place',
    lat: null,
    lon: null,
    placeId,
    provider: 'google'
  };
}

/**
 * Get place details including coordinates from Google Places
 */
export async function getGooglePlaceDetails(placeId: string): Promise<{
  lat: number;
  lon: number;
  name: string;
  address: string;
}> {
  const library = await loadPlacesLibrary();
  if (!library) {
    throw new Error('Places library not initialized');
  }

  const place = googlePlaceCache.get(placeId) || new library.Place({
    id: placeId,
    requestedRegion: 'us'
  });

  try {
    const response = await place.fetchFields({
      fields: ['displayName', 'formattedAddress', 'location']
    });
    const details = response.place;
    if (!details.location) {
      throw new Error('Place details missing location');
    }

    return {
      lat: details.location.lat(),
      lon: details.location.lng(),
      name: details.displayName || '',
      address: details.formattedAddress || ''
    };
  } finally {
    resetAutocompleteSession();
  }
}

// ============================================
// Photon Provider (fallback)
// ============================================

async function photonSearch(
  query: string,
  options: { limit?: number } = {},
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  const limit = options.limit || 5;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&lat=${LA_CENTER.lat}&lon=${LA_CENTER.lng}&limit=${limit}`;

  try {
    const response = await fetch(url, {
      signal,
      headers: {
        'User-Agent': 'VeloRail/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`Photon API error: ${response.status}`);
    }

    const data = await response.json();
    return (data.features || []).map(normalizePhotonResult);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw error;
    }
    console.error('Photon search error:', error);
    return [];
  }
}

function normalizePhotonResult(feature: {
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    county?: string;
    osm_id?: number;
    osm_value?: string;
    type?: string;
  };
  geometry?: { coordinates?: [number, number] };
}): PlaceResult {
  const props = feature.properties || {};
  const coords = feature.geometry?.coordinates || [0, 0];

  const addressParts: string[] = [];
  if (props.street) {
    if (props.housenumber) {
      addressParts.push(`${props.housenumber} ${props.street}`);
    } else {
      addressParts.push(props.street);
    }
  }
  if (props.city) addressParts.push(props.city);
  if (props.state) addressParts.push(props.state);

  return {
    id: `photon-${coords[0]}-${coords[1]}-${props.osm_id || Math.random()}`,
    name: props.name || addressParts[0] || 'Unknown',
    address: addressParts.join(', ') || props.county || '',
    type: props.osm_value || props.type || 'place',
    lat: coords[1],
    lon: coords[0],
    provider: 'photon',
    isFallback: true
  };
}

// ============================================
// Public API
// ============================================

/**
 * Search for places using the active provider
 */
export async function searchPlaces(
  query: string,
  options: { limit?: number } = {},
  signal?: AbortSignal
): Promise<PlaceResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  if (isGoogleMapsConfigured() && googleMapsLoaded) {
    return googlePlacesSearch(query.trim(), options, signal);
  }
  return photonSearch(query.trim(), options, signal);
}

/**
 * Get full place details including coordinates
 */
export async function getPlaceDetails(place: PlaceResult): Promise<PlaceResult> {
  if (place.lat !== null && place.lon !== null) {
    return place;
  }

  if (place.placeId && googleMapsLoaded) {
    try {
      const details = await getGooglePlaceDetails(place.placeId);
      return {
        ...place,
          lat: details.lat,
          lon: details.lon,
          provider: 'google'
        };
    } catch (error) {
      console.error('Failed to get place details:', error);
      const geocoded = await geocode(`${place.name}, ${place.address}`);
      if (geocoded) {
        return {
          ...place,
          lat: geocoded.lat,
          lon: geocoded.lon
        };
      }
    }
  }

  return place;
}

/**
 * Get icon for a place type
 */
export function getPlaceIcon(type: string): string {
  const typeMap: Record<string, string> = {
    station: '\u{1F689}',
    railway: '\u{1F689}',
    subway: '\u{1F687}',
    bus_stop: '\u{1F68C}',
    tram_stop: '\u{1F68A}',
    building: '\u{1F3E2}',
    office: '\u{1F3E2}',
    commercial: '\u{1F3E2}',
    industrial: '\u{1F3ED}',
    restaurant: '\u{1F37D}',
    cafe: '\u2615',
    fast_food: '\u{1F354}',
    bar: '\u{1F37A}',
    pub: '\u{1F37A}',
    shop: '\u{1F6D2}',
    supermarket: '\u{1F6D2}',
    mall: '\u{1F6CD}',
    convenience: '\u{1F3EA}',
    hospital: '\u{1F3E5}',
    clinic: '\u{1F3E5}',
    pharmacy: '\u{1F48A}',
    doctors: '\u{1F3E5}',
    theatre: '\u{1F3AD}',
    cinema: '\u{1F3AC}',
    museum: '\u{1F3DB}',
    library: '\u{1F4DA}',
    park: '\u{1F333}',
    stadium: '\u{1F3DF}',
    school: '\u{1F3EB}',
    university: '\u{1F393}',
    college: '\u{1F393}',
    hotel: '\u{1F3E8}',
    hostel: '\u{1F3E8}',
    place: '\u{1F4CD}',
    address: '\u{1F4CD}',
    house: '\u{1F3E0}',
    residential: '\u{1F3E0}'
  };

  return typeMap[type] || '\u{1F4CD}';
}

/**
 * Geocode an address to coordinates
 */
export async function geocode(query: string): Promise<Location | null> {
  const cacheKey = query.toLowerCase().trim();
  if (geocodeCache.has(cacheKey)) {
    console.log(`Geocode cache hit: ${query}`);
    return geocodeCache.get(cacheKey)!;
  }

  // Try Google Geocoding first
  if (isGoogleMapsConfigured() && googleMapsLoaded && typeof google !== 'undefined') {
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await new Promise<google.maps.GeocoderResult>((resolve, reject) => {
        geocoder.geocode({
          address: query,
          bounds: new google.maps.LatLngBounds(
            new google.maps.LatLng(33.70, -118.70),
            new google.maps.LatLng(34.35, -117.45)
          )
        }, (results, status) => {
          if (status === 'OK' && results && results.length > 0) {
            resolve(results[0]);
          } else {
            reject(new Error(`Geocode failed: ${status}`));
          }
        });
      });

      const result: Location = {
        lat: response.geometry.location.lat(),
        lon: response.geometry.location.lng(),
        display_name: response.formatted_address,
        provider: 'google'
      };
      geocodeCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.warn('Google Geocoding failed, trying Nominatim:', error);
    }
  }

  // Fall back to Nominatim
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Los Angeles County')}`;
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'VeloRail/1.0'
      }
    });
    const data = await response.json();
    if (data && data.length > 0) {
      const result: Location = {
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon),
        display_name: data[0].display_name,
        provider: 'nominatim',
        isFallback: true
      };
      geocodeCache.set(cacheKey, result);
      return result;
    }
    throw new Error('Location not found');
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
