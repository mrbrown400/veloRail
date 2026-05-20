// Google Maps module for VeloRail
// Uses Google Maps JavaScript API with built-in Transit Layer

import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { CONFIG, LA_CENTER, isGoogleMapsConfigured } from './config.js';

let map = null;
let mapsLibrary = null;

// Store references to overlays for cleanup
let routeOverlays = []; // Route polylines and markers
let vehicleMarker = null;
let vehicleAnimationFrame = null;

// Google Maps dark theme styling
const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#0f172a" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1e293b" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#94a3b8" }] },
    {
        featureType: "administrative",
        elementType: "geometry",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#cbd5e1" }]
    },
    {
        featureType: "poi",
        stylers: [{ visibility: "off" }]
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#1a2e1a" }, { visibility: "on" }]
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#0f172a" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#2d3a4f" }]
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#94a3b8" }]
    },
    {
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "road.local",
        elementType: "geometry",
        stylers: [{ color: "#1e293b" }]
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2d3a4f" }]
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#cbd5e1" }]
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#0c1929" }]
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4a5568" }]
    }
];

/**
 * Initialize Google Maps
 * @param {string} elementId - Container element ID
 * @returns {Promise<google.maps.Map>}
 */
export async function initMap(elementId) {
    if (!isGoogleMapsConfigured()) {
        console.error('Google Maps API key not configured. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
        const container = document.getElementById(elementId);
        if (container) {
            container.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: #0f172a; color: #f87171; font-family: Inter, sans-serif; padding: 20px; text-align: center;">
                    <div>
                        <h2 style="margin-bottom: 16px;">Google Maps API Key Required</h2>
                        <p style="color: #94a3b8;">Please set <code style="background: #1e293b; padding: 2px 8px; border-radius: 4px;">VITE_GOOGLE_MAPS_API_KEY</code> in your .env file.</p>
                        <p style="color: #64748b; margin-top: 8px; font-size: 0.875rem;">Get your key at <a href="https://console.cloud.google.com/apis/credentials" style="color: #3b82f6;">Google Cloud Console</a></p>
                    </div>
                </div>
            `;
        }
        return null;
    }

    try {
        // Configure the API loader
        setOptions({
            apiKey: CONFIG.GOOGLE_MAPS_API_KEY,
            version: 'weekly'
        });

        // Load required libraries
        mapsLibrary = await importLibrary('maps');
        await importLibrary('places');
        await importLibrary('geometry');
        await importLibrary('routes');

        // Create the map
        map = new mapsLibrary.Map(document.getElementById(elementId), {
            center: LA_CENTER,
            zoom: 11,
            styles: darkMapStyle,
            disableDefaultUI: false,
            zoomControl: true,
            zoomControlOptions: {
                position: google.maps.ControlPosition.TOP_RIGHT
            },
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            gestureHandling: 'greedy'
        });

        // Enable Google's built-in transit layer
        const transitLayer = new google.maps.TransitLayer();
        transitLayer.setMap(map);

        console.log('Google Maps initialized on', elementId);
        return map;
    } catch (error) {
        console.error('Error loading Google Maps:', error);
        return null;
    }
}

/**
 * Invalidate map size (trigger resize)
 */
export function invalidateMapSize() {
    if (map) {
        google.maps.event.trigger(map, 'resize');
    }
}

// Stub functions for compatibility (no longer used)
export function toggleLayerGroup() {}
export function refreshTransitMap() {}

/**
 * Clear all route overlays from the map
 */
function clearRouteOverlays() {
    routeOverlays.forEach(overlay => overlay.setMap(null));
    routeOverlays = [];
}

/**
 * Draw a route on the map
 * @param {Object} routeData - Route data from routing engine
 */
export function drawRoute(routeData) {
    if (!map) return;

    // Clear existing route overlays
    clearRouteOverlays();

    const bounds = new google.maps.LatLngBounds();

    // Add Start Marker
    const startMarker = new google.maps.Marker({
        position: { lat: routeData.start.lat, lng: routeData.start.lon },
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        },
        title: 'Start'
    });
    routeOverlays.push(startMarker);

    // Add info window for start
    const startInfoWindow = new google.maps.InfoWindow({
        content: `<div style="color: #1e293b;"><strong>Start:</strong> ${routeData.start.display_name || 'Your Location'}</div>`
    });
    startMarker.addListener('click', () => startInfoWindow.open(map, startMarker));

    // Add End Marker
    const endMarker = new google.maps.Marker({
        position: { lat: routeData.end.lat, lng: routeData.end.lon },
        map: map,
        icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#ef4444',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2
        },
        title: 'Destination'
    });
    routeOverlays.push(endMarker);

    // Add info window for end
    const endInfoWindow = new google.maps.InfoWindow({
        content: `<div style="color: #1e293b;"><strong>Destination:</strong> ${routeData.end.display_name || 'Destination'}</div>`
    });
    endMarker.addListener('click', () => endInfoWindow.open(map, endMarker));

    bounds.extend({ lat: routeData.start.lat, lng: routeData.start.lon });
    bounds.extend({ lat: routeData.end.lat, lng: routeData.end.lon });

    // Draw each leg
    routeData.legs.forEach(leg => {
        const latlngs = leg.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }));

        if (leg.mode !== 'transit') {
            let color = '#39FF14'; // Default Bike (neon green)
            let isDashed = false;

            if (leg.mode === 'walk') {
                color = '#9ca3af';
                isDashed = true;
            } else if (leg.mode === 'transit_bus') {
                color = '#3b82f6';
                isDashed = true;
            } else if (leg.mode === 'driving') {
                color = '#60A5FA';
            }

            // White outer casing
            const outerCasing = new google.maps.Polyline({
                path: latlngs,
                strokeColor: '#ffffff',
                strokeWeight: 10,
                strokeOpacity: 0.9,
                map: map
            });
            routeOverlays.push(outerCasing);

            // Dark casing
            const darkCasing = new google.maps.Polyline({
                path: latlngs,
                strokeColor: '#1a1a2e',
                strokeWeight: 7,
                strokeOpacity: 1,
                map: map
            });
            routeOverlays.push(darkCasing);

            // Main colored line
            if (isDashed) {
                const dashSymbol = {
                    path: 'M 0,-1 0,1',
                    strokeOpacity: 1,
                    scale: 2
                };
                const mainLine = new google.maps.Polyline({
                    path: latlngs,
                    strokeColor: color,
                    strokeWeight: 4,
                    strokeOpacity: 0,
                    icons: [{
                        icon: dashSymbol,
                        offset: '0',
                        repeat: leg.mode === 'walk' ? '12px' : '14px'
                    }],
                    map: map
                });
                routeOverlays.push(mainLine);
            } else {
                const mainLine = new google.maps.Polyline({
                    path: latlngs,
                    strokeColor: color,
                    strokeWeight: 4,
                    strokeOpacity: 1,
                    map: map
                });
                routeOverlays.push(mainLine);
            }

            latlngs.forEach(pos => bounds.extend(pos));

        } else if (leg.mode === 'transit') {
            // White outer casing
            const outerCasing = new google.maps.Polyline({
                path: latlngs,
                strokeColor: '#ffffff',
                strokeWeight: 12,
                strokeOpacity: 0.9,
                map: map
            });
            routeOverlays.push(outerCasing);

            // Dark casing
            const darkCasing = new google.maps.Polyline({
                path: latlngs,
                strokeColor: '#1a1a2e',
                strokeWeight: 9,
                strokeOpacity: 1,
                map: map
            });
            routeOverlays.push(darkCasing);

            // Main colored line
            const mainLine = new google.maps.Polyline({
                path: latlngs,
                strokeColor: leg.color,
                strokeWeight: 6,
                strokeOpacity: 1,
                map: map
            });
            routeOverlays.push(mainLine);

            // Station markers
            if (leg.stations) {
                leg.stations.forEach(s => {
                    // Outer white circle
                    const outerCircle = new google.maps.Marker({
                        position: { lat: s.lat, lng: s.lon },
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: '#ffffff',
                            fillOpacity: 1,
                            strokeWeight: 0
                        }
                    });
                    routeOverlays.push(outerCircle);

                    // Inner colored circle
                    const innerCircle = new google.maps.Marker({
                        position: { lat: s.lat, lng: s.lon },
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 5,
                            fillColor: leg.color,
                            fillOpacity: 1,
                            strokeColor: '#1a1a2e',
                            strokeWeight: 2
                        },
                        title: s.name
                    });
                    routeOverlays.push(innerCircle);

                    // Info window for station
                    const stationInfoWindow = new google.maps.InfoWindow({
                        content: `<div style="color: #1e293b;"><strong>${s.name}</strong></div>`
                    });
                    innerCircle.addListener('click', () => stationInfoWindow.open(map, innerCircle));

                    bounds.extend({ lat: s.lat, lng: s.lon });
                });
            }

            latlngs.forEach(pos => bounds.extend(pos));
        }
    });

    // Fit map to bounds
    map.fitBounds(bounds, { padding: { top: 50, right: 50, bottom: 50, left: 400 } });
}

// ==================== Vehicle Tracking ====================

/**
 * Show a vehicle marker on the map
 */
export function showVehicleMarker(position, type = 'train', color = '#3b82f6') {
    if (!map || !position) return;

    const { latitude, longitude, bearing, label, currentStatus, vehicleId } = position;

    const statusText = currentStatus === 'STOPPED_AT' ? 'At station'
        : currentStatus === 'INCOMING_AT' ? 'Arriving'
        : 'In transit';

    const popupContent = `
        <div style="color: #1e293b; text-align: center; padding: 4px;">
            <strong>${type === 'train' ? 'Train' : 'Bus'} ${label || vehicleId || ''}</strong>
            <div style="font-size: 0.8rem; color: #64748b;">${statusText}</div>
        </div>
    `;

    if (vehicleMarker) {
        // Animate to new position
        animateVehicleMarker(latitude, longitude, bearing, color, type);
    } else {
        // Create new marker
        vehicleMarker = new google.maps.Marker({
            position: { lat: latitude, lng: longitude },
            map: map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 12,
                fillColor: color,
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 3
            },
            zIndex: 1000
        });

        const infoWindow = new google.maps.InfoWindow({ content: popupContent });
        vehicleMarker.addListener('click', () => infoWindow.open(map, vehicleMarker));
    }
}

/**
 * Animate vehicle marker to new position
 */
function animateVehicleMarker(lat, lng, bearing, color, type) {
    if (!vehicleMarker) return;

    if (vehicleAnimationFrame) {
        cancelAnimationFrame(vehicleAnimationFrame);
    }

    const startPos = vehicleMarker.getPosition();
    const endPos = new google.maps.LatLng(lat, lng);
    const duration = 1000;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);

        const newLat = startPos.lat() + (endPos.lat() - startPos.lat()) * eased;
        const newLng = startPos.lng() + (endPos.lng() - startPos.lng()) * eased;

        vehicleMarker.setPosition({ lat: newLat, lng: newLng });

        if (progress < 1) {
            vehicleAnimationFrame = requestAnimationFrame(animate);
        }
    }

    vehicleAnimationFrame = requestAnimationFrame(animate);
}

/**
 * Hide/remove vehicle marker
 */
export function hideVehicleMarker() {
    if (vehicleAnimationFrame) {
        cancelAnimationFrame(vehicleAnimationFrame);
        vehicleAnimationFrame = null;
    }

    if (vehicleMarker) {
        vehicleMarker.setMap(null);
        vehicleMarker = null;
    }
}

/**
 * Update vehicle position
 */
export function updateVehiclePosition(position, type = 'train', color = '#3b82f6') {
    if (!position) {
        hideVehicleMarker();
        return;
    }
    showVehicleMarker(position, type, color);
}

/**
 * Check if vehicle is being tracked
 */
export function isVehicleTracked() {
    return vehicleMarker !== null;
}

/**
 * Get the map instance
 */
export function getMap() {
    return map;
}

/**
 * Check if Google Maps API is loaded
 */
export function isGoogleMapsLoaded() {
    return typeof google !== 'undefined' && google.maps;
}
