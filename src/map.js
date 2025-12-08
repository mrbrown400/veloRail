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
    Object.values(TRANSIT_LINES).forEach(line => {
        const coords = line.stations.map(s => [s.lat, s.lon]);

        // Draw the line
        L.polyline(coords, {
            color: line.color,
            weight: 3,
            opacity: 0.4, // Dimmed by default
            smoothFactor: 1
        }).addTo(map);

        // Draw stations (small dots)
        line.stations.forEach(s => {
            L.circleMarker([s.lat, s.lon], {
                color: line.color,
                radius: 2,
                opacity: 0.4,
                fillOpacity: 0.4
            }).addTo(map);
        });
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
            let weight = 5;

            if (leg.mode === 'walk') {
                color = '#777777'; // Grey
                dashArray = '5, 10';
            } else if (leg.mode === 'transit_bus') {
                color = '#3b82f6'; // Blue
                dashArray = '5, 10';
            } else if (leg.mode === 'driving') {
                color = '#60A5FA'; // Light Blue
            }

            L.polyline(latlngs, {
                color: color,
                weight: weight,
                opacity: 0.8,
                lineJoin: 'round',
                dashArray: dashArray
            }).addTo(map);
            bounds.extend(latlngs);

        } else if (leg.mode === 'transit') {
            // Transit Line
            // leg.geometry is our constructed LineString from station data
            const latlngs = leg.geometry.coordinates.map(c => [c[1], c[0]]);

            const pl = L.polyline(latlngs, {
                color: leg.color,
                weight: 6,
                opacity: 1,
            }).addTo(map);

            // Add station markers for this segment
            leg.stations.forEach(s => {
                L.circleMarker([s.lat, s.lon], {
                    color: 'white',
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
