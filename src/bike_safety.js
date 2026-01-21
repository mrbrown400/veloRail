// Bike Safety Scoring using OSM data via Overpass API

// Cache for Overpass safety data (keyed by rounded bbox)
const safetyDataCache = new Map();

/**
 * Calculate safety score for a bike route geometry
 * @param {Object} geometry - GeoJSON LineString
 * @returns {Promise<{score, breakdown, warnings}>}
 */
export async function calculateRouteSafetyScore(geometry) {
    if (!geometry || geometry.type !== 'LineString' || !geometry.coordinates?.length) {
        return { score: 50, breakdown: {}, warnings: [] };
    }

    const coordinates = geometry.coordinates;
    const bbox = getBoundingBox(coordinates);

    try {
        const safetyData = await fetchSafetyData(bbox);
        return analyzeRouteSafety(coordinates, safetyData);
    } catch (error) {
        console.warn('Safety scoring failed:', error);
        return { score: 50, breakdown: {}, warnings: ['Safety data unavailable'] };
    }
}

function getBoundingBox(coordinates) {
    let minLon = Infinity, maxLon = -Infinity;
    let minLat = Infinity, maxLat = -Infinity;

    for (const [lon, lat] of coordinates) {
        minLon = Math.min(minLon, lon);
        maxLon = Math.max(maxLon, lon);
        minLat = Math.min(minLat, lat);
        maxLat = Math.max(maxLat, lat);
    }

    // Add small buffer (~200m)
    const buffer = 0.002;
    return `${minLat - buffer},${minLon - buffer},${maxLat + buffer},${maxLon + buffer}`;
}

async function fetchSafetyData(bbox) {
    // Round bbox to 2 decimal places for cache key (covers ~1km grid)
    const bboxParts = bbox.split(',').map(n => parseFloat(n).toFixed(2));
    const cacheKey = bboxParts.join(',');

    if (safetyDataCache.has(cacheKey)) {
        console.log('Safety data cache hit');
        return safetyDataCache.get(cacheKey);
    }

    const query = `
        [out:json][timeout:30];
        (
          // Protected bike infrastructure (GOOD)
          way["highway"="cycleway"](${bbox});
          way["cycleway"="track"](${bbox});
          way["cycleway"="lane"](${bbox});
          way["bicycle"="designated"](${bbox});

          // High-speed roads (BAD)
          way["highway"="primary"](${bbox});
          way["highway"="secondary"](${bbox});
          way["highway"="trunk"](${bbox});
          way["maxspeed"](${bbox});
        );
        out geom;
    `;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: 'data=' + encodeURIComponent(query)
    });

    if (!response.ok) throw new Error('Overpass API failed');
    const data = await response.json();

    // Cache the result
    safetyDataCache.set(cacheKey, data);
    return data;
}

function analyzeRouteSafety(routeCoords, osmData) {
    const breakdown = {
        protectedLanes: 0,
        highSpeedRoads: 0
    };

    const warnings = [];
    const elements = osmData.elements || [];

    // Build spatial index of route segments for faster lookup
    const routeSegments = [];
    for (let i = 0; i < routeCoords.length - 1; i++) {
        routeSegments.push({
            start: routeCoords[i],
            end: routeCoords[i + 1]
        });
    }

    let protectedDistance = 0;
    let highSpeedDistance = 0;
    let totalRouteDistance = 0;

    // Calculate total route distance
    for (const seg of routeSegments) {
        totalRouteDistance += haversineDistance(seg.start, seg.end);
    }

    // Analyze each OSM way
    for (const element of elements) {
        if (element.type !== 'way' || !element.geometry) continue;

        const tags = element.tags || {};
        const wayCoords = element.geometry.map(pt => [pt.lon, pt.lat]);

        // Check overlap with route
        const overlapDist = calculateOverlap(routeCoords, wayCoords);
        if (overlapDist <= 0) continue;

        // Categorize the way
        const isProtected = (
            tags.highway === 'cycleway' ||
            tags.cycleway === 'track' ||
            tags.cycleway === 'lane' ||
            tags.bicycle === 'designated'
        );

        const isHighSpeed = (
            tags.highway === 'primary' ||
            tags.highway === 'secondary' ||
            tags.highway === 'trunk' ||
            (parseInt(tags.maxspeed) || 0) >= 50
        );

        if (isProtected) {
            protectedDistance += overlapDist;
        }

        if (isHighSpeed && !isProtected) {
            highSpeedDistance += overlapDist;
            const speed = parseInt(tags.maxspeed);
            if (speed >= 50) {
                warnings.push(`Route includes ${speed} km/h road`);
            }
        }
    }

    // Calculate percentages
    if (totalRouteDistance > 0) {
        breakdown.protectedLanes = Math.min(100, Math.round((protectedDistance / totalRouteDistance) * 100));
        breakdown.highSpeedRoads = Math.min(100, Math.round((highSpeedDistance / totalRouteDistance) * 100));
    }

    // Calculate overall score (0-100, higher is safer)
    // Weight: 60% for protected lanes, 40% penalty for high-speed roads
    const score = Math.round(
        (breakdown.protectedLanes * 0.6) +
        ((100 - breakdown.highSpeedRoads) * 0.4)
    );

    return {
        score: Math.max(0, Math.min(100, score)),
        breakdown,
        warnings: [...new Set(warnings)].slice(0, 3)
    };
}

function calculateOverlap(routeCoords, wayCoords) {
    // Simplified: check proximity of way points to route
    const threshold = 0.0003; // ~30m in degrees
    let overlapCount = 0;

    for (const [wLon, wLat] of wayCoords) {
        for (const [rLon, rLat] of routeCoords) {
            if (Math.abs(rLon - wLon) < threshold && Math.abs(rLat - wLat) < threshold) {
                overlapCount++;
                break;
            }
        }
    }

    // Estimate overlap distance based on matching points
    if (overlapCount < 2) return 0;

    let wayLength = 0;
    for (let i = 0; i < wayCoords.length - 1; i++) {
        wayLength += haversineDistance(wayCoords[i], wayCoords[i + 1]);
    }

    return wayLength * (overlapCount / wayCoords.length);
}

function haversineDistance([lon1, lat1], [lon2, lat2]) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}
