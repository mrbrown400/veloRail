
import L from 'leaflet';

// Prevent multiple initializations (HMR protection)
let bikeOverlayInitialized = false;

export function initBikeOverlay(map) {
    if (bikeOverlayInitialized) {
        console.log('Bike overlay already initialized, skipping...');
        return;
    }
    bikeOverlayInitialized = true;
    console.log('Initializing Bike Network Overlay...');

    // Split into multiple smaller bounding boxes to avoid API timeout
    // Format: [South, West, North, East]
    const regions = [
        // LA Basin core
        { name: 'LA Core', bbox: '33.70,-118.67,34.34,-118.15' },
        // Orange County
        { name: 'Orange County', bbox: '33.40,-118.15,33.95,-117.45' },
        // Inland Empire (San Bernardino/Riverside)
        { name: 'Inland Empire', bbox: '33.85,-117.75,34.20,-117.20' },
        // Ventura County
        { name: 'Ventura County', bbox: '34.10,-119.35,34.50,-118.65' },
        // Santa Barbara area
        { name: 'Santa Barbara', bbox: '34.35,-119.90,34.50,-119.30' },
        // San Fernando Valley / Antelope Valley connection
        { name: 'North LA', bbox: '34.30,-118.70,34.75,-118.00' },
        // South OC / North San Diego
        { name: 'South OC', bbox: '33.15,-117.70,33.45,-117.20' }
    ];

    const url = 'https://overpass-api.de/api/interpreter';

    // Fetch each region with longer delays to avoid rate limiting
    regions.forEach((region, index) => {
        setTimeout(() => {
            const query = `
                [out:json][timeout:45];
                (
                  way["highway"="cycleway"](${region.bbox});
                  way["cycleway"="track"](${region.bbox});
                  way["cycleway"="lane"](${region.bbox});
                  way["bicycle"="designated"](${region.bbox});
                );
                out geom;
            `;

            fetch(url, {
                method: 'POST',
                body: 'data=' + encodeURIComponent(query)
            })
                .then(response => {
                    if (!response.ok) throw new Error(`HTTP ${response.status}`);
                    return response.json();
                })
                .then(data => {
                    if (!data.elements) return;
                    console.log(`Fetched ${data.elements.length} bike paths for ${region.name}`);

                    data.elements.forEach(element => {
                        if (element.type === 'way' && element.geometry) {
                            const latlngs = element.geometry.map(pt => [pt.lat, pt.lon]);

                            L.polyline(latlngs, {
                                color: '#4ade80', // Green-400 (Subtle)
                                weight: 1,
                                opacity: 0.2,
                                className: 'bike-path-overlay'
                            }).addTo(map);
                        }
                    });
                })
                .catch(err => {
                    console.warn(`Error fetching bike network for ${region.name}:`, err);
                });
        }, index * 5000); // Stagger requests by 5 seconds each
    });
}
