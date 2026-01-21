// Elevation Helper using Open-Meteo API

// Cache for elevation data (keyed by rounded coordinates)
const elevationCache = new Map();

/**
 * Fetches elevation for a single coordinate
 * @param {number} lat
 * @param {number} lon
 * @returns {Promise<number>} Elevation in meters
 */
export async function getElevation(lat, lon) {
    try {
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Elevation API failed');
        const data = await response.json();
        return data.elevation ? data.elevation[0] : null;
    } catch (e) {
        console.warn("Elevation fetch failed, returning 0:", e);
        return 0; // Fallback to sea level/flat
    }
}

/**
 * Fetches elevation profile for a list of coordinates.
 * Samples the route to avoid excessive URL length/API limits.
 * @param {Array<[lon, lat]>} coordinates - GeoJSON coordinate array
 * @returns {Promise<Array<number>>} Array of elevations in meters
 */
export async function getRouteElevation(coordinates) {
    if (!coordinates || coordinates.length === 0) return [];

    // Generate cache key from start/end coordinates (rounded to 3 decimal places)
    const startKey = `${coordinates[0][1].toFixed(3)},${coordinates[0][0].toFixed(3)}`;
    const endKey = `${coordinates[coordinates.length - 1][1].toFixed(3)},${coordinates[coordinates.length - 1][0].toFixed(3)}`;
    const cacheKey = `${startKey}-${endKey}-${coordinates.length}`;

    if (elevationCache.has(cacheKey)) {
        console.log('Elevation cache hit');
        return elevationCache.get(cacheKey);
    }

    // Sampling strategy: limit to ~20 points max to keep URL safe and fast
    const maxSamples = 20;
    const step = Math.ceil(coordinates.length / maxSamples);

    const sampledIndices = [];
    const lats = [];
    const lons = [];

    // Always include start
    sampledIndices.push(0);
    lats.push(coordinates[0][1]);
    lons.push(coordinates[0][0]);

    for (let i = step; i < coordinates.length - 1; i += step) {
        sampledIndices.push(i);
        lats.push(coordinates[i][1]);
        lons.push(coordinates[i][0]);
    }

    // Always include end
    if (coordinates.length > 1) {
        sampledIndices.push(coordinates.length - 1);
        lats.push(coordinates[coordinates.length - 1][1]);
        lons.push(coordinates[coordinates.length - 1][0]);
    }

    try {
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${lats.join(',')}&longitude=${lons.join(',')}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Elevation API failed');
        const data = await response.json();

        // Map back to structure
        const results = [];
        if (data.elevation) {
            data.elevation.forEach((elev, index) => {
                results.push({
                    elevation: elev,
                    location: { lat: lats[index], lon: lons[index] }
                });
            });
        }

        // Cache the result
        elevationCache.set(cacheKey, results);
        return results;
    } catch (e) {
        console.warn("Route elevation fetch failed:", e);
        // Return 0 elevation for samples on failure
        return sampledIndices.map(i => ({
            elevation: 0,
            location: { lat: coordinates[i][1], lon: coordinates[i][0] }
        }));
    }
}

