import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TRANSIT_LINES } from './transit_data.js';
import { initBikeOverlay } from './bike_network.js';
import { getOSRMRoute } from './osrm.js';
import { isLineOperating } from './schedule.js';

let map;
// Cache for bus route geometries (fetched once, reused on re-renders)
const busRouteCache = new Map();

// Vehicle tracking state
let vehicleMarker = null;
let vehicleAnimationFrame = null;

// Layer groups for toggle control
const layerGroups = {
    metroRail: null,
    metroBrt: null,
    ladot: null,
    silverStreak: null,
    otherLines: null  // Metrolink, Amtrak
};

export function initMap(elementId) {
    // Initialize map centered on Los Angeles
    map = L.map(elementId, {
        zoomControl: false // Disable default position, we'll add it manually
    }).setView([34.0522, -118.2437], 11);

    // Add zoom control to top-right to avoid overlap with search card
    L.control.zoom({ position: 'topright' }).addTo(map);

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

// Refresh transit map with new departure time
export async function refreshTransitMap(queryTime = null) {
    if (!map) return;

    // Clear existing layer groups from map
    Object.values(layerGroups).forEach(group => {
        if (group && map.hasLayer(group)) {
            map.removeLayer(group);
            group.clearLayers();
        }
    });

    // Re-render with new time
    await renderTransitMap(queryTime);
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

async function renderTransitMap(queryTime = null) {
    if (!map) return;

    // Use current time if not specified
    const currentTime = queryTime || new Date();

    // Initialize layer groups
    layerGroups.metroRail = L.layerGroup();
    layerGroups.metroBrt = L.layerGroup();
    layerGroups.ladot = L.layerGroup();
    layerGroups.silverStreak = L.layerGroup();
    layerGroups.otherLines = L.layerGroup();

    // Categorize lines - only include operating lines
    const metroRailLines = [];
    const metroBrtLines = [];
    const ladotLines = [];
    const silverStreakLines = [];
    const otherLines = []; // Metrolink, Amtrak

    Object.entries(TRANSIT_LINES).forEach(([lineName, line]) => {
        // Skip lines not operating at current time
        if (!isLineOperating(lineName, currentTime)) {
            return;
        }

        const isLADOT = lineName.startsWith('LADOT CE') || lineName === 'Union/Bunker Shuttle';
        const isBRT = lineName === 'Orange' || lineName === 'Silver';
        const isSilverStreak = lineName === 'Foothill Silver Streak';
        const isMetrolink = lineName.startsWith('Metrolink');
        const isAmtrak = lineName.startsWith('Amtrak');
        const isFlyAway = lineName.startsWith('LAX FlyAway');
        const isPeopleMover = lineName === 'LAX People Mover';

        if (isLADOT || isFlyAway) {
            ladotLines.push({ name: lineName, ...line });
        } else if (isSilverStreak) {
            silverStreakLines.push({ name: lineName, ...line });
        } else if (isBRT) {
            metroBrtLines.push({ name: lineName, ...line });
        } else if (isMetrolink || isAmtrak) {
            otherLines.push({ name: lineName, ...line });
        } else if (isPeopleMover) {
            // Skip People Mover for now (testing status)
            return;
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

    // Render other lines (Metrolink, Amtrak) to layer group
    for (const line of otherLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: line.color,
            weight: 2.5,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.otherLines.addLayer(polyline);

        line.stations.forEach(s => {
            const marker = L.circleMarker([s.lat, s.lon], {
                color: line.color,
                fillColor: '#ffffff',
                fillOpacity: 0.6,
                radius: 2.5,
                weight: 1.5,
                opacity: 0.5
            });
            layerGroups.otherLines.addLayer(marker);
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
    layerGroups.otherLines.addTo(map);
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

// ==================== Vehicle Tracking ====================

/**
 * Create a vehicle marker icon
 * @param {string} type - 'train' or 'bus'
 * @param {number} bearing - Direction in degrees (optional)
 * @param {string} color - Line color
 * @returns {L.DivIcon}
 */
function createVehicleIcon(type = 'train', bearing = null, color = '#3b82f6') {
    const icon = type === 'train' ? '\u{1F686}' : '\u{1F68C}'; // Train or bus emoji
    const rotation = bearing !== null ? `transform: rotate(${bearing}deg);` : '';

    return L.divIcon({
        className: 'vehicle-marker',
        html: `
            <div class="vehicle-marker-container" style="${rotation}">
                <div class="vehicle-marker-pulse" style="background-color: ${color};"></div>
                <div class="vehicle-marker-icon" style="background-color: ${color};">
                    <span>${icon}</span>
                </div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
    });
}

/**
 * Show a vehicle on the map
 * @param {Object} position - Vehicle position data
 * @param {string} type - 'train' or 'bus'
 * @param {string} color - Line color
 */
export function showVehicleMarker(position, type = 'train', color = '#3b82f6') {
    if (!map || !position) return;

    const { latitude, longitude, bearing, label, currentStatus, vehicleId } = position;

    // Create popup content
    const statusText = currentStatus === 'STOPPED_AT' ? 'At station'
        : currentStatus === 'INCOMING_AT' ? 'Arriving'
        : 'In transit';

    const popupContent = `
        <div class="vehicle-popup">
            <strong>${type === 'train' ? 'Train' : 'Bus'} ${label || vehicleId || ''}</strong>
            <div class="vehicle-status">${statusText}</div>
        </div>
    `;

    if (vehicleMarker) {
        // Animate to new position
        animateVehicleMarker(latitude, longitude, bearing, color, type);
    } else {
        // Create new marker
        vehicleMarker = L.marker([latitude, longitude], {
            icon: createVehicleIcon(type, bearing, color),
            zIndexOffset: 1000
        }).addTo(map);

        vehicleMarker.bindPopup(popupContent);
    }

    // Update popup content
    vehicleMarker.setPopupContent(popupContent);
}

/**
 * Animate vehicle marker to new position
 * @param {number} lat - Target latitude
 * @param {number} lng - Target longitude
 * @param {number} bearing - Direction in degrees
 * @param {string} color - Line color
 * @param {string} type - 'train' or 'bus'
 */
function animateVehicleMarker(lat, lng, bearing, color, type) {
    if (!vehicleMarker) return;

    // Cancel any existing animation
    if (vehicleAnimationFrame) {
        cancelAnimationFrame(vehicleAnimationFrame);
    }

    const startLatLng = vehicleMarker.getLatLng();
    const endLatLng = L.latLng(lat, lng);
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease out cubic
        const eased = 1 - Math.pow(1 - progress, 3);

        const newLat = startLatLng.lat + (endLatLng.lat - startLatLng.lat) * eased;
        const newLng = startLatLng.lng + (endLatLng.lng - startLatLng.lng) * eased;

        vehicleMarker.setLatLng([newLat, newLng]);

        // Update icon with bearing
        if (bearing !== null) {
            vehicleMarker.setIcon(createVehicleIcon(type, bearing, color));
        }

        if (progress < 1) {
            vehicleAnimationFrame = requestAnimationFrame(animate);
        }
    }

    vehicleAnimationFrame = requestAnimationFrame(animate);
}

/**
 * Remove vehicle marker from map
 */
export function hideVehicleMarker() {
    if (vehicleAnimationFrame) {
        cancelAnimationFrame(vehicleAnimationFrame);
        vehicleAnimationFrame = null;
    }

    if (vehicleMarker && map) {
        map.removeLayer(vehicleMarker);
        vehicleMarker = null;
    }
}

/**
 * Update vehicle marker position (called by realtime store)
 * @param {Object} position - Vehicle position data
 * @param {string} type - 'train' or 'bus'
 * @param {string} color - Line color
 */
export function updateVehiclePosition(position, type = 'train', color = '#3b82f6') {
    if (!position) {
        hideVehicleMarker();
        return;
    }

    showVehicleMarker(position, type, color);
}

/**
 * Check if a vehicle is currently being tracked on the map
 * @returns {boolean}
 */
export function isVehicleTracked() {
    return vehicleMarker !== null;
}

/**
 * Get the map instance (for external use)
 * @returns {L.Map|null}
 */
export function getMap() {
    return map;
}
