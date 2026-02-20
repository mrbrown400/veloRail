// Bike Network Overlay for Google Maps
// Fetches bike paths from Overpass API and displays on map

// Prevent multiple initializations (HMR protection)
let bikeOverlayInitialized = false;
let bikePolylines = [];
let mapInstance = null;
let bikeOverlayVisible = false;

export async function initBikeOverlay(map) {
    if (bikeOverlayInitialized) {
        console.log('Bike overlay already initialized, skipping...');
        return;
    }
    bikeOverlayInitialized = true;
    mapInstance = map;
    console.log('Initializing Bike Network Overlay...');

    // Split into multiple smaller bounding boxes to avoid API timeout
    const regions = [
        { name: 'LA Core', bbox: '33.70,-118.67,34.34,-118.15' },
        { name: 'San Gabriel Valley', bbox: '33.85,-118.20,34.25,-117.70' },
        { name: 'Orange County', bbox: '33.40,-118.15,33.95,-117.45' },
        { name: 'Inland Empire', bbox: '33.85,-117.75,34.20,-117.20' },
        { name: 'Ventura County', bbox: '34.10,-119.35,34.50,-118.65' },
        { name: 'Santa Barbara', bbox: '34.35,-119.90,34.50,-119.30' },
        { name: 'North LA', bbox: '34.30,-118.70,34.75,-118.00' },
        { name: 'South OC', bbox: '33.15,-117.70,33.45,-117.20' }
    ];

    const url = 'https://overpass-api.de/api/interpreter';

    // Fetch a single region
    const fetchRegion = async (region) => {
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

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: 'data=' + encodeURIComponent(query)
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            if (!data.elements) return;
            console.log(`Fetched ${data.elements.length} bike paths for ${region.name}`);

            // Create Google Maps polylines for bike paths
            data.elements.forEach(element => {
                if (element.type === 'way' && element.geometry) {
                    const path = element.geometry.map(pt => ({ lat: pt.lat, lng: pt.lon }));
                    const polyline = new google.maps.Polyline({
                        path: path,
                        strokeColor: '#4ade80',
                        strokeWeight: 1,
                        strokeOpacity: 0.2,
                        map: bikeOverlayVisible ? mapInstance : null
                    });
                    bikePolylines.push(polyline);
                }
            });
        } catch (err) {
            console.warn(`Error fetching bike network for ${region.name}:`, err);
        }
    };

    // Fetch ALL regions in PARALLEL (major performance improvement: 40s -> ~3s)
    await Promise.all(regions.map(region => fetchRegion(region)));
    console.log('Bike network overlay complete');
}

// Toggle bike overlay visibility
export function toggleBikeOverlay(visible) {
    if (!mapInstance) return;

    bikeOverlayVisible = visible;

    bikePolylines.forEach(polyline => {
        polyline.setMap(visible ? mapInstance : null);
    });
}
