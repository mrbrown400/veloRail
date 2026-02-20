// Google Elevation API Service for VeloRail
// Fetches elevation data along a route for accurate bike duration calculation

import { isGoogleMapsConfigured } from './config';
import type { LineString } from '@/types';

// Elevation service instance
let elevationService: google.maps.ElevationService | null = null;

export interface ElevationPoint {
  lat: number;
  lon: number;
  elevation: number; // meters
}

export interface RouteElevationData {
  points: ElevationPoint[];
  totalAscent: number;   // meters gained
  totalDescent: number;  // meters lost
  minElevation: number;
  maxElevation: number;
}

// ============================================
// Initialization
// ============================================

export function initElevationService(): boolean {
  if (typeof google !== 'undefined' && google.maps) {
    elevationService = new google.maps.ElevationService();
    return true;
  }
  return false;
}

function ensureService(): google.maps.ElevationService | null {
  if (!elevationService) {
    initElevationService();
  }
  return elevationService;
}

// ============================================
// Elevation Fetching
// ============================================

/**
 * Get elevation data along a route path
 * Samples points along the route for elevation
 */
export async function getRouteElevation(
  geometry: LineString,
  sampleCount: number = 50
): Promise<RouteElevationData | null> {
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    console.warn('Google Elevation service not available');
    return null;
  }

  const coordinates = geometry.coordinates;
  if (coordinates.length < 2) {
    return null;
  }

  // Convert coordinates to Google LatLng path
  const path = coordinates.map(([lon, lat]) => new google.maps.LatLng(lat, lon));

  try {
    const result = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
      service.getElevationAlongPath({
        path: path,
        samples: Math.min(sampleCount, 512) // Google's max is 512
      }, (results, status) => {
        if (status === google.maps.ElevationStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Elevation request failed: ${status}`));
        }
      });
    });

    return processElevationResults(result);
  } catch (error) {
    console.error('Elevation service error:', error);
    return null;
  }
}

/**
 * Get elevation for specific points (not along a path)
 */
export async function getPointElevations(
  points: Array<{ lat: number; lon: number }>
): Promise<ElevationPoint[] | null> {
  const service = ensureService();
  if (!service || !isGoogleMapsConfigured()) {
    return null;
  }

  const locations = points.map(p => new google.maps.LatLng(p.lat, p.lon));

  try {
    const result = await new Promise<google.maps.ElevationResult[]>((resolve, reject) => {
      service.getElevationForLocations({
        locations: locations
      }, (results, status) => {
        if (status === google.maps.ElevationStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Elevation request failed: ${status}`));
        }
      });
    });

    return result.map(r => ({
      lat: r.location!.lat(),
      lon: r.location!.lng(),
      elevation: r.elevation
    }));
  } catch (error) {
    console.error('Elevation service error:', error);
    return null;
  }
}

// ============================================
// Processing
// ============================================

function processElevationResults(
  results: google.maps.ElevationResult[]
): RouteElevationData {
  const points: ElevationPoint[] = results.map(r => ({
    lat: r.location!.lat(),
    lon: r.location!.lng(),
    elevation: r.elevation
  }));

  let totalAscent = 0;
  let totalDescent = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;

  for (let i = 0; i < points.length; i++) {
    const elevation = points[i].elevation;

    minElevation = Math.min(minElevation, elevation);
    maxElevation = Math.max(maxElevation, elevation);

    if (i > 0) {
      const elevationChange = elevation - points[i - 1].elevation;
      if (elevationChange > 0) {
        totalAscent += elevationChange;
      } else {
        totalDescent += Math.abs(elevationChange);
      }
    }
  }

  return {
    points,
    totalAscent,
    totalDescent,
    minElevation: minElevation === Infinity ? 0 : minElevation,
    maxElevation: maxElevation === -Infinity ? 0 : maxElevation
  };
}

// ============================================
// Segment Analysis
// ============================================

export interface ElevationSegment {
  startIndex: number;
  endIndex: number;
  distance: number;        // meters
  elevationChange: number; // meters (positive = uphill)
  grade: number;           // percentage (e.g., 5 = 5% grade)
}

/**
 * Analyze route segments for grade calculation
 * Returns segments with distance and grade for speed adjustment
 */
export function analyzeRouteSegments(
  geometry: LineString,
  elevationData: RouteElevationData
): ElevationSegment[] {
  const segments: ElevationSegment[] = [];
  const points = elevationData.points;
  const coordinates = geometry.coordinates;

  if (points.length < 2) {
    return segments;
  }

  // Calculate distance between elevation sample points
  const totalDistance = calculateTotalDistance(coordinates);
  const segmentDistance = totalDistance / (points.length - 1);

  for (let i = 0; i < points.length - 1; i++) {
    const elevationChange = points[i + 1].elevation - points[i].elevation;
    const grade = (elevationChange / segmentDistance) * 100;

    segments.push({
      startIndex: i,
      endIndex: i + 1,
      distance: segmentDistance,
      elevationChange,
      grade: Math.round(grade * 10) / 10 // Round to 1 decimal
    });
  }

  return segments;
}

/**
 * Calculate total distance of a route in meters
 */
function calculateTotalDistance(coordinates: [number, number][]): number {
  let total = 0;
  for (let i = 0; i < coordinates.length - 1; i++) {
    total += haversineDistance(
      coordinates[i][1], coordinates[i][0],
      coordinates[i + 1][1], coordinates[i + 1][0]
    );
  }
  return total;
}

/**
 * Haversine distance between two points in meters
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}
