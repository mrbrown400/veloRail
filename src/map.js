import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TRANSIT_LINES } from './transit_data.js';
import { initBikeOverlay } from './bike_network.js';

let map;

export function initMap(elementId) {
    // Initialize map centered on Los Angeles
    map = L.map(elementId).setView([34.0522, -118.2437], 11); // Zoom out slightly

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    setTimeout(() => {
        map.invalidateSize();
    }, 100);

    renderTransitMap();
    initBikeOverlay(map);

    console.log('Leaflet Map initialized on', elementId);
}

function renderTransitMap() {
    if (!map) return;

    // Render all transit lines as background
    Object.entries(TRANSIT_LINES).forEach(([lineName, line]) => {
        const coords = line.stations.map(s => [s.lat, s.lon]);

        // Determine line type for styling
        const isCommuterExpress = lineName.startsWith('LADOT CE') || lineName === 'Union/Bunker Shuttle';
        const isBRT = lineName === 'Orange' || lineName === 'Silver' || lineName === 'Foothill Silver Streak';
        const isRail = !isCommuterExpress && !isBRT;

        if (isCommuterExpress) {
            // LADOT Commuter Express - subtle dashed lines
            L.polyline(coords, {
                color: '#4a90d9',
                weight: 2,
                opacity: 0.25,
                dashArray: '8, 8',
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
        } else if (isBRT) {
            // BRT lines - dashed with casing
            // Outer casing
            L.polyline(coords, {
                color: '#000000',
                weight: 6,
                opacity: 0.3,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            // Inner colored line (dashed)
            L.polyline(coords, {
                color: line.color,
                weight: 4,
                opacity: 0.5,
                dashArray: '12, 6',
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            // Station markers for BRT
            line.stations.forEach(s => {
                L.circleMarker([s.lat, s.lon], {
                    color: '#1a1a2e',
                    fillColor: line.color,
                    fillOpacity: 0.5,
                    radius: 3,
                    weight: 1.5,
                    opacity: 0.5
                }).addTo(map);
            });
        } else {
            // Rail lines - solid with casing (Google/Apple Maps style)
            // Outer dark casing for depth
            L.polyline(coords, {
                color: '#0d0d15',
                weight: 7,
                opacity: 0.5,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            // Inner colored line
            L.polyline(coords, {
                color: line.color,
                weight: 4,
                opacity: 0.6,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);
            // Station markers - white fill with colored border
            line.stations.forEach(s => {
                L.circleMarker([s.lat, s.lon], {
                    color: line.color,
                    fillColor: '#ffffff',
                    fillOpacity: 0.7,
                    radius: 3.5,
                    weight: 2,
                    opacity: 0.6
                }).addTo(map);
            });
        }
    });
}


export function drawRoute(routeData) {
    if (!map) return;

    // Clear existing layers - crude but effective for PoC
    // Ideally, use a specific LayerGroup for route items

    // Clear existing layers instead of destroying map
    map.eachLayer((layer) => {
        // Keep the tile layer (it typically doesn't have a specific property we check easily, 
        // but often we want to keep base tiles. 
        // Simpler approach: Remove everything, then re-init tiles? 
        // Or better: Just remove Markers and Polylines.
        // Let's rely on standard Leaflet practice:
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
            map.removeLayer(layer);
        }
    });

    // Re-render static transit map (background)
    renderTransitMap();


    const bounds = L.latLngBounds();

    // Add Start/End Markers
    const startIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: #3b82f6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
    });
    const endIcon = L.divIcon({
        className: 'custom-icon',
        html: `<div style="background-color: #ef4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`
    });

    L.marker([routeData.start.lat, routeData.start.lon], { icon: startIcon, title: 'Start' })
        .addTo(map)
        .bindPopup('Start: ' + routeData.start.display_name);

    L.marker([routeData.end.lat, routeData.end.lon], { icon: endIcon, title: 'Destination' })
        .addTo(map)
        .bindPopup('Destination: ' + routeData.end.display_name);

    bounds.extend([routeData.start.lat, routeData.start.lon]);
    bounds.extend([routeData.end.lat, routeData.end.lon]);

    // Draw Legs
    routeData.legs.forEach(leg => {

        if (leg.mode !== 'transit') {
            // Access/Direct Legs (Bike, Walk, Bus, Driving)
            // Geometry is typically LineString [lon, lat]
            const latlngs = leg.geometry.coordinates.map(c => [c[1], c[0]]);

            let color = '#39FF14'; // Default Bike
            let dashArray = null;

            if (leg.mode === 'walk') {
                color = '#9ca3af'; // Grey
                dashArray = '4, 8';
            } else if (leg.mode === 'transit_bus') {
                color = '#3b82f6'; // Blue
                dashArray = '6, 8';
            } else if (leg.mode === 'driving') {
                color = '#60A5FA'; // Light Blue
            }

            // White outer casing for visibility
            L.polyline(latlngs, {
                color: '#ffffff',
                weight: 10,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Dark casing
            L.polyline(latlngs, {
                color: '#1a1a2e',
                weight: 7,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Main colored line
            L.polyline(latlngs, {
                color: color,
                weight: 4,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: dashArray
            }).addTo(map);
            bounds.extend(latlngs);

        } else if (leg.mode === 'transit') {
            // Transit Line - highlighted route (Google/Apple Maps style)
            // leg.geometry is our constructed LineString from station data
            const latlngs = leg.geometry.coordinates.map(c => [c[1], c[0]]);

            // Outer glow/casing for visibility (white outline)
            L.polyline(latlngs, {
                color: '#ffffff',
                weight: 12,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Dark casing for depth
            L.polyline(latlngs, {
                color: '#1a1a2e',
                weight: 9,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Main colored line
            L.polyline(latlngs, {
                color: leg.color,
                weight: 6,
                opacity: 1,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Add station markers for this segment - larger and more prominent
            leg.stations.forEach(s => {
                // Outer white ring
                L.circleMarker([s.lat, s.lon], {
                    color: '#ffffff',
                    fillColor: '#ffffff',
                    fillOpacity: 1,
                    radius: 8,
                    weight: 0
                }).addTo(map);
                // Inner colored circle
                L.circleMarker([s.lat, s.lon], {
                    color: '#1a1a2e',
                    fillColor: leg.color,
                    fillOpacity: 1,
                    radius: 5,
                    weight: 2
                }).addTo(map).bindPopup(s.name);
                bounds.extend([s.lat, s.lon]);
            });
        }
    });

    map.fitBounds(bounds, { padding: [50, 50] });
}
