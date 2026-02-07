import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { TRANSIT_LINES } from './transit_data.js';
import { initBikeOverlay } from './bike_network.js';
import { isLineOperating } from './schedule.js';

let map;

// Vehicle tracking state
let vehicleMarker = null;
let vehicleAnimationFrame = null;

// Layer groups for toggle control
const layerGroups = {
    metroRail: null,
    metroBrt: null,
    ladot: null,
    silverStreak: null,
    otherLines: null,  // Metrolink, Amtrak
    futureLines: null  // Future transit lines (under construction, planned)
};

// UI state reference (will be set by refreshTransitMap)
let futureToggleState = false;

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
export function refreshTransitMap(queryTime = null, includeFuture = false) {
    if (!map) return;

    // Update future toggle state
    futureToggleState = includeFuture;

    // Clear existing layer groups from map
    Object.values(layerGroups).forEach(group => {
        if (group && map.hasLayer(group)) {
            map.removeLayer(group);
            group.clearLayers();
        }
    });

    // Re-render with new time
    renderTransitMap(queryTime);
}

// Generate stylized route geometry (LA Metro map style)
// Uses smooth curves between stations instead of exact road paths or straight lines
function generateStylizedRoute(stations) {
    if (stations.length < 2) {
        return stations.map(s => [s.lat, s.lon]);
    }

    const coords = [];
    const tension = 0.3; // Controls curve smoothness (0 = straight, 1 = very curved)

    for (let i = 0; i < stations.length; i++) {
        const curr = stations[i];
        const prev = stations[i - 1];
        const next = stations[i + 1];

        if (i === 0) {
            // First point - just add it
            coords.push([curr.lat, curr.lon]);
        } else if (i === stations.length - 1) {
            // Last point - add curve to it
            const midLat = (prev.lat + curr.lat) / 2;
            const midLon = (prev.lon + curr.lon) / 2;

            // Add a slight curve point
            const perpLat = (curr.lon - prev.lon) * tension * 0.1;
            const perpLon = -(curr.lat - prev.lat) * tension * 0.1;

            coords.push([midLat + perpLat, midLon + perpLon]);
            coords.push([curr.lat, curr.lon]);
        } else {
            // Middle points - create smooth curves
            const midLat = (prev.lat + curr.lat) / 2;
            const midLon = (prev.lon + curr.lon) / 2;

            // Calculate direction change for curve
            const dir1Lat = curr.lat - prev.lat;
            const dir1Lon = curr.lon - prev.lon;
            const dir2Lat = next.lat - curr.lat;
            const dir2Lon = next.lon - curr.lon;

            // Cross product to determine curve direction
            const cross = dir1Lat * dir2Lon - dir1Lon * dir2Lat;
            const curveFactor = Math.sign(cross) * tension * 0.05;

            // Add curve control point
            const perpLat = (curr.lon - prev.lon) * curveFactor;
            const perpLon = -(curr.lat - prev.lat) * curveFactor;

            coords.push([midLat + perpLat, midLon + perpLon]);
            coords.push([curr.lat, curr.lon]);
        }
    }

    return coords;
}

// Get centered station coordinates (middle of road instead of specific side)
function getCenteredStationCoords(station) {
    // For bus stations, we return the coordinates as-is
    // The station data should already be at road centerlines
    return { lat: station.lat, lon: station.lon };
}

function renderTransitMap(queryTime = null) {
    if (!map) return;

    // Use current time if not specified
    const currentTime = queryTime || new Date();

    // Initialize layer groups
    layerGroups.metroRail = L.layerGroup();
    layerGroups.metroBrt = L.layerGroup();
    layerGroups.ladot = L.layerGroup();
    layerGroups.silverStreak = L.layerGroup();
    layerGroups.otherLines = L.layerGroup();
    layerGroups.futureLines = L.layerGroup();

    // Categorize lines - only include operating lines (or future if toggle is on)
    const metroRailLines = [];
    const metroBrtLines = [];
    const ladotLines = [];
    const silverStreakLines = [];
    const otherLines = []; // Metrolink, Amtrak
    const futureLines = []; // Future transit lines

    Object.entries(TRANSIT_LINES).forEach(([lineName, line]) => {
        // Check if line is a future line
        const isFutureLine = line.status === 'testing' || line.status === 'under_construction' || line.status === 'planned';

        // Skip lines not operating at current time (unless future toggle is on for future lines)
        if (!isLineOperating(lineName, currentTime, { includeFuture: futureToggleState })) {
            return;
        }

        const isLADOT = lineName.startsWith('LADOT CE') || lineName === 'Union/Bunker Shuttle';
        const isBRT = lineName === 'Orange' || lineName === 'Silver';
        const isSilverStreak = lineName === 'Foothill Silver Streak';
        const isMetrolink = lineName.startsWith('Metrolink');
        const isAmtrak = lineName.startsWith('Amtrak');
        const isFlyAway = lineName.startsWith('LAX FlyAway');
        const isPeopleMover = lineName === 'LAX People Mover';

        // Route future lines to their own layer group
        if (isFutureLine) {
            futureLines.push({ name: lineName, ...line });
        } else if (isLADOT || isFlyAway) {
            ladotLines.push({ name: lineName, ...line });
        } else if (isSilverStreak) {
            silverStreakLines.push({ name: lineName, ...line });
        } else if (isBRT) {
            metroBrtLines.push({ name: lineName, ...line });
        } else if (isMetrolink || isAmtrak) {
            otherLines.push({ name: lineName, ...line });
        } else if (isPeopleMover) {
            // Skip People Mover for now (testing status) - handled above as future line
            return;
        } else {
            metroRailLines.push({ name: lineName, ...line });
        }
    });

    // Generate stylized route geometries (LA Metro map style - no road fetching needed)
    const allStylizedLines = [...ladotLines, ...silverStreakLines, ...metroBrtLines, ...otherLines];
    const routeMap = new Map();

    for (const line of allStylizedLines) {
        const coords = generateStylizedRoute(line.stations);
        routeMap.set(line.name, coords);
    }

    // Render other lines (Metrolink, Amtrak) to layer group
    // Google Maps style: no station dots, just the route line
    for (const line of otherLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: line.color,
            weight: 3,
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.otherLines.addLayer(polyline);
    }

    // Render LADOT lines to layer group
    // Google Maps style: no station dots, just the route line
    for (const line of ladotLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: '#4a90d9',
            weight: 3,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.ladot.addLayer(polyline);
    }

    // Render Silver Streak to layer group
    // Google Maps style: no station dots, just the route line
    for (const line of silverStreakLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: line.color,
            weight: 3,
            opacity: 0.5,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.silverStreak.addLayer(polyline);
    }

    // Render BRT lines to layer group
    // Google Maps style: no station dots, just the route line
    for (const line of metroBrtLines) {
        const coords = routeMap.get(line.name);

        const polyline = L.polyline(coords, {
            color: line.color,
            weight: 3,
            opacity: 0.6,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.metroBrt.addLayer(polyline);
    }

    // Render Metro Rail lines to layer group
    // Google Maps style: no station dots, just solid colored lines
    for (const line of metroRailLines) {
        const coords = line.stations.map(s => [s.lat, s.lon]);

        // Outer casing for visual depth
        const casing = L.polyline(coords, {
            color: '#0d0d15',
            weight: 6,
            opacity: 0.4,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.metroRail.addLayer(casing);

        // Main colored line
        const mainLine = L.polyline(coords, {
            color: line.color,
            weight: 4,
            opacity: 0.85,
            lineCap: 'round',
            lineJoin: 'round'
        });
        layerGroups.metroRail.addLayer(mainLine);
    }

    // Render Future Lines with dashed styling
    // Google Maps style: no station dots, just dashed lines for future/planned routes
    for (const line of futureLines) {
        const coords = line.stations.map(s => [s.lat, s.lon]);

        // Determine dash pattern based on status
        // under_construction: dashed 8,4 with 70% opacity
        // planned: more sparse dash 4,8 with 50% opacity
        const isPlanned = line.status === 'planned';
        const dashArray = isPlanned ? '4, 8' : '8, 4';
        const lineOpacity = isPlanned ? 0.6 : 0.75;

        // Outer casing (lighter for future lines)
        const casing = L.polyline(coords, {
            color: '#0d0d15',
            weight: 5,
            opacity: 0.3,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: dashArray
        });
        layerGroups.futureLines.addLayer(casing);

        // Main dashed line
        const mainLine = L.polyline(coords, {
            color: line.color,
            weight: 3.5,
            opacity: lineOpacity,
            lineCap: 'round',
            lineJoin: 'round',
            dashArray: dashArray
        });
        layerGroups.futureLines.addLayer(mainLine);
    }

    // Add all layer groups to map (all visible by default)
    layerGroups.otherLines.addTo(map);
    layerGroups.ladot.addTo(map);
    layerGroups.silverStreak.addTo(map);
    layerGroups.metroBrt.addTo(map);
    layerGroups.metroRail.addTo(map);

    // Add future lines layer if toggle is on
    if (futureToggleState) {
        layerGroups.futureLines.addTo(map);
    }
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
