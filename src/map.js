import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TRANSIT_LINES } from './transit_data.js';
import { initBikeOverlay } from './bike_network.js';
import { getOSRMRoute } from './osrm.js';

let map;
// Cache for bus route geometries (fetched once, reused on re-renders)
const busRouteCache = new Map();

// Layer groups for toggle control
const layerGroups = {
    metroRail: null,
    metroBrt: null,
    ladot: null,
    silverStreak: null
};

export function initMap(elementId) {
    // Initialize map centered on Los Angeles
    map = L.map(elementId).setView([34.0522, -118.2437], 11);

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

export function invalidateMapSize() {
    if (map) {
        map.invalidateSize();
    }
}

// Toggle layer group visibility
export function toggleLayerGroup(groupName, visible) {
    const group = layerGroups[groupName];
    if (!group || !map) return;

    if (visible) {
        if (!map.hasLayer(group)) {
            map.addLayer(group);
        }
    } else {
        if (map.hasLayer(group)) {
            map.removeLayer(group);
        }
    }
}

// Fetch road-following route for a bus line
async function fetchBusRouteGeometry(lineName, stations) {
    if (busRouteCache.has(lineName)) {
        return busRouteCache.get(lineName);
    }

    try {
        const waypoints = stations.map(s => ({ lat: s.lat, lon: s.lon }));
        const route = await getOSRMRoute(waypoints, 'driving');

        if (route && route.geometry && route.geometry.coordinates) {
            const coords = route.geometry.coordinates.map(c => [c[1], c[0]]);
            busRouteCache.set(lineName, coords);
            return coords;
        }
    } catch (err) {
        console.warn(`Failed to fetch route for ${lineName}:`, err);
    }

    const fallback = stations.map(s => [s.lat, s.lon]);
    busRouteCache.set(lineName, fallback);
    return fallback;
}

async function renderTransitMap() {
    if (!map) return;

    // Initialize layer groups
    layerGroups.metroRail = L.layerGroup();
    layerGroups.metroBrt = L.layerGroup();
    layerGroups.ladot = L.layerGroup();
    layerGroups.silverStreak = L.layerGroup();

    // Categorize lines
    const metroRailLines = [];
    const metroBrtLines = [];
    const ladotLines = [];
    const silverStreakLines = [];
    const otherLines = []; // Metrolink, Amtrak - keep visible always

    Object.entries(TRANSIT_LINES).forEach(([lineName, line]) => {
        const isLADOT = lineName.startsWith('LADOT CE') || lineName === 'Union/Bunker Shuttle';
        const isBRT = lineName === 'Orange' || lineName === 'Silver';
        const isSilverStreak = lineName === 'Foothill Silver Streak';
        const isMetrolink = lineName.startsWith('Metrolink');
        const isAmtrak = lineName.startsWith('Amtrak');

        if (isLADOT) {
            ladotLines.push({ name: lineName, ...line });
        } else if (isSilverStreak) {
            silverStreakLines.push({ name: lineName, ...line });
        } else if (isBRT) {
            metroBrtLines.push({ name: lineName, ...line });
        } else if (isMetrolink || isAmtrak) {
            otherLines.push({ name: lineName, ...line });
        } else {
            metroRailLines.push({ name: lineName, ...line });
        }
    });

    // Fetch route geometries for routed lines
    const allRoutedLines = [...ladotLines, ...silverStreakLines, ...metroBrtLines, ...otherLines];
    const batchSize = 5;
    const batchDelay = 200;
    const routeResults = [];

    for (let i = 0; i < allRoutedLines.length; i += batchSize) {
        const batch = allRoutedLines.slice(i, i + batchSize);
        const batchPromises = batch.map(line =>
            fetchBusRouteGeometry(line.name, line.stations)
                .then(coords => ({ line, coords }))
                .catch(err => {
                    console.warn(`Failed to fetch route for ${line.name}:`, err);
                    return { line, coords: line.stations.map(s => [s.lat, s.lon]) };
                })
        );

        const batchResults = await Promise.all(batchPromises);
        routeResults.push(...batchResults);

        if (i + batchSize < allRoutedLines.length) {
            await new Promise(resolve => setTimeout(resolve, batchDelay));
        }
    }

    const routeMap = new Map();
    routeResults.forEach(({ line, coords }) => {
        routeMap.set(line.name, coords);
    });

    // Render other lines (Metrolink, Amtrak) directly to map
    for (const line of otherLines) {
        const coords = routeMap.get(line.name);

        L.polyline(coords, {
            color: line.color,
            weight: 2.5,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round'
        }).addTo(map);

        line.stations.forEach(s => {
            L.circleMarker([s.lat, s.lon], {
                color: line.color,
                fillColor: '#ffffff',
                fillOpacity: 0.6,
                radius: 2.5,
                weight: 1.5,
                opacity: 0.5
            }).addTo(map);
        });
    }

    // Render LADOT lines to layer group
    for (const line of ladotLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: '#4a90d9',
            weight: 2.5,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.ladot.addLayer(polyline);

        line.stations.forEach(s => {
            const marker = L.circleMarker([s.lat, s.lon], {
                color: '#4a90d9',
                fillColor: '#ffffff',
                fillOpacity: 0.6,
                radius: 2.5,
                weight: 1.5,
                opacity: 0.4
            });
            layerGroups.ladot.addLayer(marker);
        });
    }

    // Render Silver Streak to layer group
    for (const line of silverStreakLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: line.color,
            weight: 2.5,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.silverStreak.addLayer(polyline);

        line.stations.forEach(s => {
            const marker = L.circleMarker([s.lat, s.lon], {
                color: line.color,
                fillColor: '#ffffff',
                fillOpacity: 0.6,
                radius: 2.5,
                weight: 1.5,
                opacity: 0.4
            });
            layerGroups.silverStreak.addLayer(marker);
        });
    }

    // Render BRT lines to layer group
    for (const line of metroBrtLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: line.color,
            weight: 2.5,
            opacity: 0.35,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.metroBrt.addLayer(polyline);

        line.stations.forEach(s => {
            const marker = L.circleMarker([s.lat, s.lon], {
                color: line.color,
                fillColor: '#ffffff',
                fillOpacity: 0.6,
                radius: 2.5,
                weight: 1.5,
                opacity: 0.4
            });
            layerGroups.metroBrt.addLayer(marker);
        });
    }

    // Render Metro Rail lines to layer group
    for (const line of metroRailLines) {
        const coords = line.stations.map(s => [s.lat, s.lon]);

        // Outer casing
        const casing = L.polyline(coords, {
            color: '#0d0d15',
            weight: 7,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.metroRail.addLayer(casing);

        // Main line
        const mainLine = L.polyline(coords, {
            color: line.color,
            weight: 4,
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.metroRail.addLayer(mainLine);

        // Station markers
        line.stations.forEach(s => {
            const marker = L.circleMarker([s.lat, s.lon], {
                color: line.color,
                fillColor: '#ffffff',
                fillOpacity: 0.7,
                radius: 3.5,
                weight: 2,
                opacity: 0.6
            });
            layerGroups.metroRail.addLayer(marker);
        });
    }

    // Add all layer groups to map (all visible by default)
    layerGroups.ladot.addTo(map);
    layerGroups.silverStreak.addTo(map);
    layerGroups.metroBrt.addTo(map);
    layerGroups.metroRail.addTo(map);
}


export function drawRoute(routeData) {
    if (!map) return;

    // Clear existing route layers (markers and polylines, but not layer groups)
    map.eachLayer((layer) => {
        if (layer instanceof L.Marker || layer instanceof L.Polyline || layer instanceof L.CircleMarker) {
            // Check if layer belongs to a layer group we want to keep
            let belongsToGroup = false;
            Object.values(layerGroups).forEach(group => {
                if (group && group.hasLayer(layer)) {
                    belongsToGroup = true;
                }
            });
            if (!belongsToGroup) {
                map.removeLayer(layer);
            }
        }
    });

    // Re-render static transit map (this will skip if layer groups exist)
    // Actually, we need to be smarter - only re-render if needed
    // For now, just add the route on top

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
            const latlngs = leg.geometry.coordinates.map(c => [c[1], c[0]]);

            let color = '#39FF14'; // Default Bike
            let dashArray = null;

            if (leg.mode === 'walk') {
                color = '#9ca3af';
                dashArray = '4, 8';
            } else if (leg.mode === 'transit_bus') {
                color = '#3b82f6';
                dashArray = '6, 8';
            } else if (leg.mode === 'driving') {
                color = '#60A5FA';
            }

            // White outer casing
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
            const latlngs = leg.geometry.coordinates.map(c => [c[1], c[0]]);

            // White outer casing
            L.polyline(latlngs, {
                color: '#ffffff',
                weight: 12,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round'
            }).addTo(map);

            // Dark casing
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

            // Station markers
            leg.stations.forEach(s => {
                L.circleMarker([s.lat, s.lon], {
                    color: '#ffffff',
                    fillColor: '#ffffff',
                    fillOpacity: 1,
                    radius: 8,
                    weight: 0
                }).addTo(map);

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
