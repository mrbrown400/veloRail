
// Basic Geocoding using Nominatim (OpenStreetMap)
export async function geocode(query) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Los Angeles County')}`;
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'BikeTrainNavigator/1.0'
            }
        });
        const data = await response.json();
        if (data && data.length > 0) {
            return {
                lat: parseFloat(data[0].lat),
                lon: parseFloat(data[0].lon),
                display_name: data[0].display_name
            };
        }
        throw new Error('Location not found');
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
}
