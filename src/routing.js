import { geocode } from './geocoding.js';
import { TRANSIT_LINES } from './transit_data.js';
import { getBikeRoute, getOSRMRoute } from './osrm.js';
import { getRouteElevation } from './elevation.js';
import { getORSBikeRoute } from './ors.js';
import { calculateRouteSafetyScore } from './bike_safety.js';
import { CONFIG } from './config.js';
import { isLineOperating, estimateWaitTime, getOperatingLines, getNextDeparture } from './schedule.js';

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// Flatten all stations from all lines for searching
// Optional departureTime filters to only operating lines
function getAllStations(departureTime = null) {
    let all = [];
    for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
        // Skip lines not operating at the query time
        if (departureTime && !isLineOperating(lineName, departureTime)) {
            continue;
        }
        data.stations.forEach(s => {
            all.push({ ...s, line: lineName, color: data.color });
        });
    }
    return all;
}

function findNearestStation(lat, lon, departureTime = null) {
    let nearest = null;
    let minDist = Infinity;
    const stations = getAllStations(departureTime);

    for (const station of stations) {
        const dist = getDistance(lat, lon, station.lat, station.lon);
        if (dist < minDist) {
            minDist = dist;
            nearest = { ...station, distance: dist };
        }
    }
    return nearest;
}

// Identify shared lines between two stations
// Optional departureTime filters to only operating lines
function getCommonLines(s1, s2, departureTime = null) {
    // s1 and s2 might be on different lines physically, but we're simplifying.
    // In our data, stations don't list ALL lines they are on in the object (simplified),
    // but names match.
    // Better approach: Find all line definitions that contain station Name 1 AND station Name 2.
    // AND the index of S1 < Index S2 or vice versa.

    let routes = [];

    for (const [lineName, data] of Object.entries(TRANSIT_LINES)) {
        // Skip lines not operating at the query time
        if (departureTime && !isLineOperating(lineName, departureTime)) {
            continue;
        }

        const idx1 = data.stations.findIndex(s => s.name === s1.name);
        const idx2 = data.stations.findIndex(s => s.name === s2.name);

        if (idx1 !== -1 && idx2 !== -1) {
            // Found a common line
            // Extract the segment of stations
            const start = Math.min(idx1, idx2);
            const end = Math.max(idx1, idx2);
            const segment = data.stations.slice(start, end + 1);
            if (idx1 > idx2) segment.reverse(); // Maintain direction

            routes.push({
                line: lineName,
                color: data.color,
                gtfsRouteId: data.gtfsRouteId || null,
                segment: segment
            });
        }
    }
    return routes;
}


export async function calculateRoute(startAddr, endAddr, travelMode = 'bike', safetyPreference = 'balanced', departureTime = null) {
    // Default to current time if not specified
    const queryTime = departureTime || new Date();
    console.log(`Calculating route (${travelMode}) for departure at ${queryTime.toLocaleTimeString()}...`);

    const startLoc = (typeof startAddr === 'string') ? await geocode(startAddr) : startAddr;
    if (!startLoc) throw new Error(`Could not find location: ${startAddr} `);

    const endLoc = (typeof endAddr === 'string') ? await geocode(endAddr) : endAddr;
    if (!endLoc) throw new Error(`Could not find location: ${endAddr} `);

    const directDist = getDistance(startLoc.lat, startLoc.lon, endLoc.lat, endLoc.lon);

    // Config based on mode
    // Config based on mode
    const isWalking = travelMode === 'walk';
    const isBus = travelMode === 'transit_bus'; // New mode

    // Actually, line 95 says: isWalking ? 'walking' : 'cycling'.
    // Let's refine:

    let profile = 'cycling';
    if (isWalking) profile = 'walking';
    if (isBus) profile = 'driving';

    const osrmProfile = profile;

    // Speed Config
    // Walk: 5, Bike: 20 (base), Bus: 15
    let fallbackSpeed = 20;
    if (isWalking) fallbackSpeed = 5;
    if (isBus) fallbackSpeed = 15;

    const fallbackSpeedMs = fallbackSpeed / 3.6;
    const busPenaltySeconds = isBus ? 600 : 0; // 10 mins penalty for bus

    const entryStation = findNearestStation(startLoc.lat, startLoc.lon, queryTime);
    const exitStation = findNearestStation(endLoc.lat, endLoc.lon, queryTime);

    let legs = [];

    // Helper to format duration
    const formatDuration = (seconds) => {
        const min = Math.round(seconds / 60);
        if (min < 60) return `${min} min`;
        const hr = Math.floor(min / 60);
        const m = min % 60;
        return `${hr} hr ${m} min`;
    };

    // Helper for elevation-aware bike duration
    const calculateBikeDuration = async (distanceKm, geometry) => {
        if (travelMode !== 'bike' || !geometry || geometry.type !== 'LineString') {
            return (distanceKm * 1000 / fallbackSpeedMs);
        }

        const samples = await getRouteElevation(geometry.coordinates);
        if (samples.length < 2) return (distanceKm * 1000 / fallbackSpeedMs);

        let totalSeconds = 0;
        const BASE_SPEED = 20;
        const MIN_SPEED = 5;
        const MAX_SPEED = 40;

        for (let i = 0; i < samples.length - 1; i++) {
            const p1 = samples[i];
            const p2 = samples[i + 1];

            const segDistKm = getDistance(p1.location.lat, p1.location.lon, p2.location.lat, p2.location.lon);
            if (segDistKm <= 0.001) continue; // skip tiny segments

            const elevChange = p2.elevation - p1.elevation; // meters
            const grade = (elevChange / (segDistKm * 1000)) * 100; // %

            let speed = BASE_SPEED;
            if (grade > 2) {
                // Uphill: Slower
                speed = BASE_SPEED - (grade * 1.5);
            } else if (grade < -2) {
                // Downhill: Faster
                speed = BASE_SPEED + (Math.abs(grade) * 1.0); // Less boost than penalty
            }

            // Clamp speed
            speed = Math.max(MIN_SPEED, Math.min(speed, MAX_SPEED));

            totalSeconds += (segDistKm / speed) * 3600;
        }

        // If logic produced 0 (e.g. all tiny segments), fallback
        return totalSeconds > 0 ? totalSeconds : (distanceKm * 1000 / fallbackSpeedMs);
    };

    // Get bike route with safety preference (ORS with OSRM fallback)
    const getBikeRouteWithSafety = async (waypoints, safetyPref) => {
        // Try ORS first for safe/balanced preferences
        if (travelMode === 'bike' && safetyPref !== 'fast') {
            const orsRoute = await getORSBikeRoute(waypoints, safetyPref);
            if (orsRoute) {
                const safetyInfo = await calculateRouteSafetyScore(orsRoute.geometry);
                return { ...orsRoute, safety: safetyInfo };
            }
        }

        // Fallback to OSRM
        const osrmRoute = await getOSRMRoute(waypoints, osrmProfile);
        if (osrmRoute) {
            const safetyInfo = travelMode === 'bike'
                ? await calculateRouteSafetyScore(osrmRoute.geometry)
                : null;
            return { ...osrmRoute, source: 'osrm', safety: safetyInfo };
        }

        return null;
    };

    const commonRoutes = getCommonLines(entryStation, exitStation, queryTime);
    let transitPlan = null;

    if (commonRoutes.length > 0) {
        transitPlan = { type: 'direct', line: commonRoutes[0] };
    } else {
        // Try finding a transfer hub
        const hubs = ["Union Station", "7th St/Metro Center"];
        const stations = (await import('./stations.js')).STATIONS;

        for (const hubName of hubs) {
            const hub = stations.find(s => s.name === hubName);
            if (hub) {
                const leg1 = getCommonLines(entryStation, hub, queryTime);
                const leg2 = getCommonLines(hub, exitStation, queryTime);
                if (leg1.length > 0 && leg2.length > 0) {
                    transitPlan = {
                        type: 'transfer',
                        hub: hub,
                        leg1: leg1[0],
                        leg2: leg2[0]
                    };
                    break;
                }
            }
        }
    }

    const canTakeTransit = transitPlan !== null;

    // Direct Route Condition
    // If short distance, or no transit, or same station
    if (directDist < (isWalking ? 1.5 : 5) || !canTakeTransit || entryStation.name === exitStation.name) {
        console.log(`Using direct ${travelMode} route`);
        const route = travelMode === 'bike'
            ? await getBikeRouteWithSafety([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: endLoc.lat, lon: endLoc.lon }], safetyPreference)
            : await getOSRMRoute([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: endLoc.lat, lon: endLoc.lon }], osrmProfile);

        // Fallback calc
        const distKm = route ? route.distance : directDist;
        // Always calc duration based on consistent speed (and elevation for bike)
        const duration = await calculateBikeDuration(distKm, route ? route.geometry : null);

        legs.push({
            mode: travelMode,
            from: startLoc,
            to: endLoc,
            geometry: route ? route.geometry : { type: "LineString", coordinates: [[startLoc.lon, startLoc.lat], [endLoc.lon, endLoc.lat]] },
            distance: distKm,
            duration: duration + busPenaltySeconds,
            safety: route?.safety || null
        });
    } else {
        console.log('Using Multimodal route');

        // Leg 1: Access -> Entry
        const l1 = travelMode === 'bike'
            ? await getBikeRouteWithSafety([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: entryStation.lat, lon: entryStation.lon }], safetyPreference)
            : await getOSRMRoute([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: entryStation.lat, lon: entryStation.lon }], osrmProfile);
        const d1 = l1 ? l1.distance : getDistance(startLoc.lat, startLoc.lon, entryStation.lat, entryStation.lon);
        legs.push({
            mode: travelMode,
            from: startLoc,
            to: entryStation,
            geometry: l1 ? l1.geometry : { type: "LineString", coordinates: [[startLoc.lon, startLoc.lat], [entryStation.lon, entryStation.lat]] },
            distance: d1,
            duration: (await calculateBikeDuration(d1, l1 ? l1.geometry : null)) + busPenaltySeconds,
            safety: l1?.safety || null
        });

        // Leg 2: Transit (Direct or Transfer)
        if (transitPlan.type === 'direct') {
            const bestTransit = transitPlan.line;

            console.log(`Routing transit leg (${bestTransit.line})`);

            const waypoints = bestTransit.segment;
            const transitCoordinates = waypoints.map(s => [s.lon, s.lat]);

            // Calc dist/dur
            let transitDistance = 0;
            for (let i = 0; i < waypoints.length - 1; i++) {
                transitDistance += getDistance(waypoints[i].lat, waypoints[i].lon, waypoints[i + 1].lat, waypoints[i + 1].lon);
            }

            const avgSpeedKmh = 35;

            // Calculate when user arrives at station (access time from leg 1)
            const accessTimeSeconds = legs[0].duration;
            const arrivalAtStation = new Date(queryTime.getTime() + accessTimeSeconds * 1000);

            // Get actual departure time from GTFS (or estimated wait time)
            const departureInfo = await getNextDeparture(bestTransit.line, arrivalAtStation, entryStation.name);
            const waitTimeSeconds = departureInfo.waitSeconds;
            const transitDuration = (transitDistance / avgSpeedKmh) * 3600 + waitTimeSeconds;

            legs.push({
                mode: 'transit',
                line: bestTransit.line,
                routeId: bestTransit.gtfsRouteId || null,
                color: bestTransit.color,
                from: entryStation,
                to: exitStation,
                geometry: { type: "LineString", coordinates: transitCoordinates },
                distance: transitDistance,
                duration: transitDuration,
                waitTime: waitTimeSeconds,
                departureTime: departureInfo.departureTime || null,
                headsign: departureInfo.headsign || null,
                isRealtimeSchedule: !departureInfo.isEstimate,
                stations: bestTransit.segment
            });
        } else if (transitPlan.type === 'transfer') {
            const { hub, leg1, leg2 } = transitPlan;
            console.log(`Routing transit transfer: ${entryStation.name} -> ${hub.name} -> ${exitStation.name}`);

            const avgSpeedKmh = 35;

            // Calculate when user arrives at first station
            const accessTimeSeconds = legs[0].duration;
            const arrivalAtEntry = new Date(queryTime.getTime() + accessTimeSeconds * 1000);

            // Get actual departure for first leg
            const departureInfo1 = await getNextDeparture(leg1.line, arrivalAtEntry, entryStation.name);

            // Calculate leg1 distance and duration
            let leg1Distance = 0;
            for (let i = 0; i < leg1.segment.length - 1; i++) {
                leg1Distance += getDistance(leg1.segment[i].lat, leg1.segment[i].lon, leg1.segment[i + 1].lat, leg1.segment[i + 1].lon);
            }
            const leg1TravelTime = (leg1Distance / avgSpeedKmh) * 3600;
            const leg1Coordinates = leg1.segment.map(s => [s.lon, s.lat]);

            // First transit leg: entry station → hub
            legs.push({
                mode: 'transit',
                line: leg1.line,
                routeId: leg1.gtfsRouteId || null,
                color: leg1.color,
                from: entryStation,
                to: hub,
                geometry: {
                    type: "LineString",
                    coordinates: leg1Coordinates
                },
                distance: leg1Distance,
                duration: leg1TravelTime + departureInfo1.waitSeconds,
                waitTime: departureInfo1.waitSeconds,
                departureTime: departureInfo1.departureTime || null,
                headsign: departureInfo1.headsign || null,
                isRealtimeSchedule: !departureInfo1.isEstimate,
                stations: leg1.segment
            });

            // Calculate arrival at hub
            const arrivalAtHub = new Date(arrivalAtEntry.getTime() + (departureInfo1.waitSeconds + leg1TravelTime) * 1000);

            // Get actual departure for second leg from hub
            const departureInfo2 = await getNextDeparture(leg2.line, arrivalAtHub, hub.name);

            // Calculate leg2 distance and duration
            let leg2Distance = 0;
            for (let i = 0; i < leg2.segment.length - 1; i++) {
                leg2Distance += getDistance(leg2.segment[i].lat, leg2.segment[i].lon, leg2.segment[i + 1].lat, leg2.segment[i + 1].lon);
            }
            const leg2TravelTime = (leg2Distance / avgSpeedKmh) * 3600;
            const leg2Coordinates = leg2.segment.map(s => [s.lon, s.lat]);

            // Second transit leg: hub → exit station
            legs.push({
                mode: 'transit',
                line: leg2.line,
                routeId: leg2.gtfsRouteId || null,
                color: leg2.color,
                from: hub,
                to: exitStation,
                geometry: {
                    type: "LineString",
                    coordinates: leg2Coordinates
                },
                distance: leg2Distance,
                duration: leg2TravelTime + departureInfo2.waitSeconds,
                waitTime: departureInfo2.waitSeconds,
                departureTime: departureInfo2.departureTime || null,
                headsign: departureInfo2.headsign || null,
                isRealtimeSchedule: !departureInfo2.isEstimate,
                stations: leg2.segment,
                isTransfer: true // Mark as transfer leg for UI
            });
        }

        // Leg 3: Egress -> Dest
        const l3 = travelMode === 'bike'
            ? await getBikeRouteWithSafety([{ lat: exitStation.lat, lon: exitStation.lon }, { lat: endLoc.lat, lon: endLoc.lon }], safetyPreference)
            : await getOSRMRoute([{ lat: exitStation.lat, lon: exitStation.lon }, { lat: endLoc.lat, lon: endLoc.lon }], osrmProfile);
        const d3 = l3 ? l3.distance : getDistance(exitStation.lat, exitStation.lon, endLoc.lat, endLoc.lon);
        legs.push({
            mode: travelMode,
            from: exitStation,
            to: endLoc,
            geometry: l3 ? l3.geometry : { type: "LineString", coordinates: [[exitStation.lon, exitStation.lat], [endLoc.lon, endLoc.lat]] },
            distance: d3,
            duration: (await calculateBikeDuration(d3, l3 ? l3.geometry : null)) + busPenaltySeconds,
            safety: l3?.safety || null
        });
    }

    const totalDistance = legs.reduce((acc, leg) => acc + leg.distance, 0);
    const totalDuration = legs.reduce((acc, leg) => acc + leg.duration, 0);

    return {
        type: travelMode === 'bike' ? 'Bike + Metro' : (travelMode === 'transit_bus' ? 'Transit + Bus' : 'Walk + Metro'),
        start: startLoc,
        end: endLoc,
        legs: legs,
        totalDistance: totalDistance,
        totalDuration: totalDuration,
        formattedDuration: formatDuration(totalDuration),
        summary: legs.length === 1 ?
            `Direct ${travelMode === 'bike' ? 'Bike' : 'Walk'} (${legs[0].distance.toFixed(1)} km)` :
            (transitPlan.type === 'direct' ?
                `${isBus ? 'Bus' : (travelMode === 'bike' ? 'Bike' : 'Walk')} to ${entryStation.name}, Take ${transitPlan.line.line} Line` :
                `${isBus ? 'Bus' : (travelMode === 'bike' ? 'Bike' : 'Walk')} to ${entryStation.name}, Take ${transitPlan.leg1.line}/${transitPlan.leg2.line} (Transfer at ${transitPlan.hub.name})`)
    };
}

export async function compareRoutes(startInput, endInput, safetyPreference = 'balanced', modeFilter = 'all', departureTime = null) {
    // Support both string addresses and coordinate objects (for geolocation)
    const startLoc = (typeof startInput === 'string') ? await geocode(startInput) : startInput;
    const endLoc = (typeof endInput === 'string') ? await geocode(endInput) : endInput;

    if (!startLoc || !endLoc) {
        throw new Error("Could not find start or end location");
    }

    // Default to current time if not specified
    const queryTime = departureTime || new Date();

    const formatDuration = (seconds) => {
        const min = Math.round(seconds / 60);
        if (min < 60) return `${min} min`;
        const hr = Math.floor(min / 60);
        const m = min % 60;
        return `${hr} hr ${m} min`;
    };

    // Build array of route promises based on mode filter
    const routePromises = [];

    // Bike + Rail
    if (modeFilter === 'all' || modeFilter === 'bike') {
        routePromises.push(
            calculateRoute(startLoc, endLoc, 'bike', safetyPreference, queryTime)
                .then(route => ({ ...route, label: "Bike + Rail" }))
                .catch(e => { console.error("Bike route failed", e); return null; })
        );
    }

    // Driving (not affected by transit schedules)
    if (modeFilter === 'all' || modeFilter === 'driving') {
        routePromises.push(
            getOSRMRoute([{ lat: startLoc.lat, lon: startLoc.lon }, { lat: endLoc.lat, lon: endLoc.lon }], 'driving')
                .then(drivingRoute => {
                    if (!drivingRoute) return null;
                    return {
                        type: 'Driving',
                        label: "Driving",
                        start: startLoc,
                        end: endLoc,
                        legs: [{
                            mode: 'driving',
                            from: startLoc,
                            to: endLoc,
                            geometry: drivingRoute.geometry,
                            distance: drivingRoute.distance,
                            duration: drivingRoute.duration * 1.5
                        }],
                        totalDistance: drivingRoute.distance,
                        totalDuration: drivingRoute.duration * 1.5,
                        formattedDuration: formatDuration(drivingRoute.duration * 1.5),
                        summary: `Direct Drive (${drivingRoute.distance.toFixed(1)} km)`
                    };
                })
                .catch(e => { console.error("Driving route failed", e); return null; })
        );
    }

    // Walk + Rail
    if (modeFilter === 'all' || modeFilter === 'walk') {
        routePromises.push(
            calculateRoute(startLoc, endLoc, 'walk', 'balanced', queryTime)
                .then(route => ({ ...route, label: "Walk + Rail" }))
                .catch(e => { console.error("Walk route failed", e); return null; })
        );
    }

    // Bus + Rail (only in 'all' mode)
    if (modeFilter === 'all') {
        routePromises.push(
            calculateRoute(startLoc, endLoc, 'transit_bus', 'balanced', queryTime)
                .then(route => ({ ...route, label: "Bus + Rail" }))
                .catch(e => { console.error("Bus route failed", e); return null; })
        );
    }

    // Execute all route calculations in parallel
    const results = await Promise.all(routePromises);

    // Filter out null results (failed routes)
    return results.filter(route => route !== null);
}
