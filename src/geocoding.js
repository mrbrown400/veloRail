// Basic Geocoding using Nominatim (OpenStreetMap)

// Cache for geocoding results (persists during session)
const geocodeCache = new Map();

export async function geocode(query) {
    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    if (geocodeCache.has(cacheKey)) {
        console.log(`Geocode cache hit: ${query}`);
        return geocodeCache.get(cacheKey);
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Los Angeles County')}`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BikeTrainNavigator/1.0'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            const result = {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
            // Cache the result
            geocodeCache.set(cacheKey, result);
            return result;
        }
        throw new Error('Location not found');
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}
