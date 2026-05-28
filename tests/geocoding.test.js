import { after, afterEach, test } from 'node:test';
import assert from 'node:assert/strict';
import { closeAppModuleLoader, loadAppModule } from './helpers/viteSsr.js';

process.env.VITE_GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY || 'test-google-key';

after(closeAppModuleLoader);

const originalGoogle = globalThis.google;

afterEach(() => {
  globalThis.google = originalGoogle;
});

test('place search uses Places Autocomplete Data API session flow', async () => {
  let autocompleteRequest;
  let fetchFieldsRequest;
  let fetchFieldsSessionToken;

  class MockAutocompleteSessionToken {}

  globalThis.google = {
    maps: {
      importLibrary: async (name) => {
        assert.equal(name, 'places');
        return {
          AutocompleteSessionToken: MockAutocompleteSessionToken,
          AutocompleteSuggestion: class {
            static async fetchAutocompleteSuggestions(request) {
              autocompleteRequest = request;
              const placePrediction = {
                placeId: 'google-union-station',
                mainText: { text: 'Union Station' },
                secondaryText: { text: 'Los Angeles' },
                text: { text: 'Union Station, Los Angeles' },
                types: ['transit_station'],
                toPlace() {
                  return {
                    async fetchFields(requestedFields) {
                      fetchFieldsRequest = requestedFields;
                      fetchFieldsSessionToken = request.sessionToken;
                      return {
                        place: {
                          displayName: 'Union Station',
                          formattedAddress: '800 N Alameda St, Los Angeles, CA',
                          location: {
                            lat: () => 34.0562,
                            lng: () => -118.2365
                          }
                        }
                      };
                    }
                  };
                }
              };
              return { suggestions: [{ placePrediction }] };
            }
          },
          Place: class {
            constructor(options) {
              this.id = options.id;
            }
          }
        };
      }
    }
  };

  const { initGooglePlaces, searchPlaces, getPlaceDetails } = await loadAppModule('/src/services/geocoding.ts');

  assert.equal(initGooglePlaces(), true);

  const results = await searchPlaces('Union Station', { limit: 5 });
  assert.equal(results.length, 1);
  assert.equal(results[0].name, 'Union Station');
  assert.equal(results[0].address, 'Los Angeles');
  assert.equal(results[0].placeId, 'google-union-station');
  assert.ok(autocompleteRequest.sessionToken instanceof MockAutocompleteSessionToken);
  assert.deepEqual(autocompleteRequest.locationBias, {
    center: { lat: 34.0522, lng: -118.2437 },
    radius: 50000
  });

  const details = await getPlaceDetails(results[0]);
  assert.equal(details.lat, 34.0562);
  assert.equal(details.lon, -118.2365);
  assert.deepEqual(fetchFieldsRequest, {
    fields: ['displayName', 'formattedAddress', 'location']
  });
  assert.equal(fetchFieldsSessionToken, autocompleteRequest.sessionToken);
});
