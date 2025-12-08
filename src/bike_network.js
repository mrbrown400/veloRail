
import L from 'leaflet';

export function initBikeOverlay(map) {
    console.log('Initializing Bike Network Overlay...');

    // Define LA Basin Bounding Box (South, West, North, East)
    // Covering roughly Long Beach to North Hollywood, Santa Monica to EL Monte
    const bbox = '33.70,-118.67,34.34,-118.15';

    // Overpass QL Query
    // We use [out:json] and [timeout:25];
    // We ask for ways with specific bike tags.
    // "out geom" gives us the coordinates directly in the way object.
    const query = `
        [out:json][timeout:25];
        (
          way["highway"="cycleway"](${bbox});
          way["cycleway"="track"](${bbox});
          way["cycleway"="lane"](${bbox});
          way["bicycle"="designated"](${bbox});
        );
        out geom;
    `;

    const url = 'https://overpass-api.de/api/interpreter';

    fetch(url, {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
    })
        .then(response => response.json())
        .then(data => {
            console.log(`Fetched ${data.elements.length} bike path segments.`);

            if (!data.elements) return;

            data.elements.forEach(element => {
                if (element.type === 'way' && element.geometry) {
                    const latlngs = element.geometry.map(pt => [pt.lat, pt.lon]);

                    L.polyline(latlngs, {
                        color: '#4ade80', // Green-400 (Subtle)
                        weight: 1, // Thinner
                        opacity: 0.2, // Very transparent
                        className: 'bike-path-overlay' // For potential CSS interaction
                    }).addTo(map);
                }
            });
        })
        .catch(err => {
            console.error('Error fetching bike network:', err);
        });
}
