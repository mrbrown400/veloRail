// OSRM Public API Helper
// Note: Public OSRM Demo server has rate limits. Better validation or alternative (e.g., Mapbox) for prod.

export async function getOSRMRoute(waypoints, profile = 'cycling') {
    // Profiles: 'bicycle', 'car' (driving), 'foot' (walking)
    const validProfiles = {
        'cycling': 'bicycle',
        'driving': 'driving',
        'walking': 'foot'
    };
    const osrmProfile = validProfiles[profile] || 'bicycle';

    // Construct coordinates string: lon1,lat1;lon2,lat2;...
    const coords = waypoints.map(wp => `${wp.lon},${wp.lat}`).join(';');

    // Using simple approach. For many waypoints, might need to handle URL length limits, 
    // but standard rail lines (~20 stops) should be fine on demo server.
    const url = `https://router.project-osrm.org/route/v1/${osrmProfile}/${coords}?overview=full&geometries=geojson`;


    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('OSRM request failed');
        const data = await response.json();

        if (data.routes && data.routes.length > 0) {
            return {
                geometry: data.routes[0].geometry,
                distance: data.routes[0].distance / 1000, // meters to km
                duration: data.routes[0].duration // seconds
            };
        }
    } catch (err) {
        console.error('OSRM Error:', err);
        // Fallback to straight line segments if OSRM fails
        const coordinates = waypoints.map(wp => [wp.lon, wp.lat]);
        return {
            geometry: {
                type: "LineString",
                coordinates: coordinates
            },
            distance: null, // Signal to calc straight line dist
            duration: null // Signal to calc based on speed
        };
    }
    return null;
}

// Deprecated alias for backward compatibility (used by simple bike routing)
// Wraps the old (lat1, lon1, lat2, lon2) signature to the new ([wp1, wp2]) signature
export const getBikeRoute = (lat1, lon1, lat2, lon2) => {
    return getOSRMRoute([{ lat: lat1, lon: lon1 }, { lat: lat2, lon: lon2 }], 'cycling');
};
