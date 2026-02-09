// Bike Duration Calculation Service for VeloRail
// Calculates realistic bike duration based on elevation, speed, and rider weight

import { getRouteElevation, analyzeRouteSegments, type RouteElevationData } from './elevationService';
import type { LineString } from '@/types';

// ============================================
// Types & Defaults
// ============================================

export interface BikeSettings {
  baseSpeedKmh: number;      // Flat ground cruising speed (km/h)
  riderWeightKg: number;     // Rider + bike weight (kg)
}

export const DEFAULT_BIKE_SETTINGS: BikeSettings = {
  baseSpeedKmh: 20,          // 20 km/h default
  riderWeightKg: 80          // 80 kg (rider + bike) default
};

export interface DurationResult {
  totalDuration: number;     // seconds
  totalDistance: number;     // km
  averageSpeed: number;      // km/h
  elevationData?: RouteElevationData;
  segments?: SegmentTiming[];
}

export interface SegmentTiming {
  distance: number;          // meters
  duration: number;          // seconds
  speed: number;             // km/h
  grade: number;             // percentage
}

// ============================================
// Physics Constants
// ============================================

// Air resistance coefficient (simplified)
const AIR_DENSITY = 1.225;           // kg/m³
const DRAG_COEFFICIENT = 0.9;        // Cyclist + bike
const FRONTAL_AREA = 0.5;            // m²

// Rolling resistance
const ROLLING_RESISTANCE = 0.005;    // Typical road bike on asphalt

// Gravity
const GRAVITY = 9.81;                // m/s²

// Power constraints
const MIN_SPEED_KMH = 5;             // Minimum speed even on steep hills
const MAX_SPEED_KMH = 50;            // Maximum speed (safety/braking limit)

// ============================================
// Speed Calculation
// ============================================

/**
 * Calculate bike speed for a given grade using physics-based model
 *
 * On flat ground: rider maintains base speed
 * Uphill: speed decreases based on grade and weight
 * Downhill: speed increases but capped for safety
 */
export function calculateSpeedForGrade(
  grade: number,              // percentage (e.g., 5 = 5% uphill)
  settings: BikeSettings
): number {
  const { baseSpeedKmh, riderWeightKg } = settings;
  const baseSpeedMs = baseSpeedKmh / 3.6;

  // Calculate power required to maintain base speed on flat
  const flatPower = calculatePowerRequired(baseSpeedMs, 0, riderWeightKg);

  // For the given grade, find the speed where power = flatPower
  // This means the rider maintains constant effort

  if (grade >= 0) {
    // Uphill or flat: solve for speed at constant power
    const speed = solveSpeedForPower(flatPower, grade, riderWeightKg);
    return Math.max(MIN_SPEED_KMH, speed);
  } else {
    // Downhill: gravity assists, but limit max speed
    // On descents, riders often don't pedal as hard
    const descentGrade = Math.abs(grade);

    // Simple model: speed increases proportionally to descent grade
    // but capped at max speed
    const gravityBoost = descentGrade * 0.8; // km/h per % grade
    const descentSpeed = baseSpeedKmh + gravityBoost;

    return Math.min(MAX_SPEED_KMH, descentSpeed);
  }
}

/**
 * Calculate power required to maintain a given speed on a grade
 * P = P_gravity + P_rolling + P_air
 */
function calculatePowerRequired(
  speedMs: number,
  gradePercent: number,
  massKg: number
): number {
  const gradeFraction = gradePercent / 100;

  // Gravity component: m * g * v * sin(θ) ≈ m * g * v * grade for small grades
  const powerGravity = massKg * GRAVITY * speedMs * gradeFraction;

  // Rolling resistance: Crr * m * g * v
  const powerRolling = ROLLING_RESISTANCE * massKg * GRAVITY * speedMs;

  // Air resistance: 0.5 * ρ * Cd * A * v³
  const powerAir = 0.5 * AIR_DENSITY * DRAG_COEFFICIENT * FRONTAL_AREA * Math.pow(speedMs, 3);

  return powerGravity + powerRolling + powerAir;
}

/**
 * Solve for speed given power output and grade (iterative)
 */
function solveSpeedForPower(
  powerWatts: number,
  gradePercent: number,
  massKg: number
): number {
  // Binary search for speed
  let low = 0.5;  // m/s
  let high = 15;  // m/s

  for (let i = 0; i < 20; i++) {
    const mid = (low + high) / 2;
    const requiredPower = calculatePowerRequired(mid, gradePercent, massKg);

    if (requiredPower > powerWatts) {
      high = mid;
    } else {
      low = mid;
    }
  }

  return ((low + high) / 2) * 3.6; // Convert to km/h
}

// ============================================
// Main Duration Calculation
// ============================================

/**
 * Calculate bike duration for a route with elevation adjustment
 */
export async function calculateBikeDuration(
  geometry: LineString,
  distanceKm: number,
  settings: BikeSettings = DEFAULT_BIKE_SETTINGS
): Promise<DurationResult> {
  // Try to get elevation data
  const elevationData = await getRouteElevation(geometry);

  if (!elevationData || elevationData.points.length < 2) {
    // Fall back to flat calculation if no elevation data
    console.log('No elevation data, using flat ground estimate');
    const duration = (distanceKm / settings.baseSpeedKmh) * 3600;
    return {
      totalDuration: duration,
      totalDistance: distanceKm,
      averageSpeed: settings.baseSpeedKmh
    };
  }

  // Analyze segments
  const segments = analyzeRouteSegments(geometry, elevationData);

  // Calculate duration for each segment
  const segmentTimings: SegmentTiming[] = segments.map(segment => {
    const speedKmh = calculateSpeedForGrade(segment.grade, settings);
    const distanceKm = segment.distance / 1000;
    const durationSeconds = (distanceKm / speedKmh) * 3600;

    return {
      distance: segment.distance,
      duration: durationSeconds,
      speed: speedKmh,
      grade: segment.grade
    };
  });

  // Sum up total duration
  const totalDuration = segmentTimings.reduce((sum, s) => sum + s.duration, 0);
  const averageSpeed = (distanceKm / totalDuration) * 3600;

  console.log(`Bike duration calculation:
    Distance: ${distanceKm.toFixed(1)} km
    Elevation gain: ${elevationData.totalAscent.toFixed(0)}m
    Elevation loss: ${elevationData.totalDescent.toFixed(0)}m
    Base speed: ${settings.baseSpeedKmh} km/h
    Rider weight: ${settings.riderWeightKg} kg
    Calculated duration: ${(totalDuration / 60).toFixed(1)} min
    Average speed: ${averageSpeed.toFixed(1)} km/h`);

  return {
    totalDuration,
    totalDistance: distanceKm,
    averageSpeed,
    elevationData,
    segments: segmentTimings
  };
}

/**
 * Quick estimate without elevation API call
 * Uses a simple grade penalty based on total ascent
 */
export function estimateBikeDuration(
  distanceKm: number,
  totalAscentM: number,
  settings: BikeSettings = DEFAULT_BIKE_SETTINGS
): number {
  // Base time on flat
  const flatDuration = (distanceKm / settings.baseSpeedKmh) * 3600;

  // Add penalty for climbing: ~1 min per 10m of elevation per 70kg rider
  // Scale by rider weight (heavier = slower climbing)
  const weightFactor = settings.riderWeightKg / 70;
  const climbPenalty = (totalAscentM / 10) * 60 * weightFactor;

  return flatDuration + climbPenalty;
}

// ============================================
// Settings Storage
// ============================================

const STORAGE_KEY = 'velorail_bike_settings';

export function loadBikeSettings(): BikeSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        baseSpeedKmh: parsed.baseSpeedKmh ?? DEFAULT_BIKE_SETTINGS.baseSpeedKmh,
        riderWeightKg: parsed.riderWeightKg ?? DEFAULT_BIKE_SETTINGS.riderWeightKg
      };
    }
  } catch (e) {
    console.warn('Failed to load bike settings:', e);
  }
  return { ...DEFAULT_BIKE_SETTINGS };
}

export function saveBikeSettings(settings: BikeSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save bike settings:', e);
  }
}
