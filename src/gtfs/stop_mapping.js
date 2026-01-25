/**
 * Stop Mapping - Map VeloRail station names to GTFS stop_ids
 *
 * This module provides the bridge between our internal station names
 * and the official GTFS stop IDs used by LA Metro.
 */

import { getStops } from './gtfs_store.js';

// Manual mapping for LA Metro Rail stations
// Format: "VeloRail station name" -> { metro: "GTFS_STOP_ID" }
// These are parent station IDs (not platform-specific)
const MANUAL_STOP_MAPPING = {
  // B Line (Red)
  "Union Station": { metro: "80122" },
  "Civic Center/Grand Park": { metro: "80121" },
  "Pershing Square": { metro: "80120" },
  "7th St/Metro Center": { metro: "80119" },
  "Westlake/MacArthur Park": { metro: "80118" },
  "Wilshire/Vermont": { metro: "80117" },
  "Wilshire/Normandie": { metro: "80116" },
  "Wilshire/Western": { metro: "80115" },
  "Vermont/Beverly": { metro: "80114" },
  "Vermont/Santa Monica": { metro: "80113" },
  "Vermont/Sunset": { metro: "80112" },
  "Hollywood/Western": { metro: "80111" },
  "Hollywood/Vine": { metro: "80110" },
  "Hollywood/Highland": { metro: "80109" },
  "Universal/Studio City": { metro: "80108" },
  "North Hollywood": { metro: "80107" },

  // D Line (Purple) - shared stations handled above
  "Wilshire/La Brea": { metro: "80209" },
  "Wilshire/Fairfax": { metro: "80210" },
  "Wilshire/La Cienega": { metro: "80211" },
  "Westwood/UCLA": { metro: "80212" },
  "Westwood/VA Hospital": { metro: "80213" },

  // A Line (Blue)
  "Pico": { metro: "80301" },
  "Grand/LATTC": { metro: "80302" },
  "San Pedro St": { metro: "80303" },
  "Washington": { metro: "80304" },
  "Vernon": { metro: "80305" },
  "Slauson": { metro: "80306" },
  "Florence": { metro: "80307" },
  "Firestone": { metro: "80308" },
  "103rd St/Watts Towers": { metro: "80309" },
  "Willowbrook/Rosa Parks": { metro: "80310" },
  "Compton": { metro: "80311" },
  "Artesia": { metro: "80312" },
  "Del Amo": { metro: "80313" },
  "Wardlow": { metro: "80314" },
  "Willow St": { metro: "80315" },
  "Pacific Coast Hwy": { metro: "80316" },
  "Anaheim St": { metro: "80317" },
  "5th St": { metro: "80318" },
  "1st St": { metro: "80319" },
  "Downtown Long Beach": { metro: "80320" },

  // E Line (Expo)
  "LATTC/Ortho Institute": { metro: "80401" },
  "Jefferson/USC": { metro: "80402" },
  "Expo Park/USC": { metro: "80403" },
  "Expo/Vermont": { metro: "80404" },
  "Expo/Western": { metro: "80405" },
  "Expo/Crenshaw": { metro: "80406" },
  "Farmdale": { metro: "80407" },
  "Expo/La Brea": { metro: "80408" },
  "La Cienega/Jefferson": { metro: "80409" },
  "Culver City": { metro: "80410" },
  "Palms": { metro: "80411" },
  "Westwood/Rancho Park": { metro: "80412" },
  "Expo/Sepulveda": { metro: "80413" },
  "Expo/Bundy": { metro: "80414" },
  "26th St/Bergamot": { metro: "80415" },
  "17th St/SMC": { metro: "80416" },
  "Downtown Santa Monica": { metro: "80417" },

  // C Line (Green)
  "Redondo Beach": { metro: "80501" },
  "Douglas": { metro: "80502" },
  "El Segundo": { metro: "80503" },
  "Mariposa": { metro: "80504" },
  "Aviation/LAX": { metro: "80505" },
  "Hawthorne/Lennox": { metro: "80506" },
  "Crenshaw": { metro: "80507" },
  "Vermont/Athens": { metro: "80508" },
  "Harbor Freeway": { metro: "80509" },
  "Avalon": { metro: "80510" },
  "Long Beach Blvd": { metro: "80511" },
  "Lakewood Blvd": { metro: "80512" },
  "Norwalk": { metro: "80513" },

  // L Line (Gold)
  "Atlantic": { metro: "80601" },
  "East LA Civic Center": { metro: "80602" },
  "Maravilla": { metro: "80603" },
  "Indiana": { metro: "80604" },
  "Soto": { metro: "80605" },
  "Mariachi Plaza/Boyle Heights": { metro: "80606" },
  "Pico/Aliso": { metro: "80607" },
  "Little Tokyo/Arts District": { metro: "80608" },
  "Chinatown": { metro: "80609" },
  "Lincoln/Cypress": { metro: "80610" },
  "Heritage Square": { metro: "80611" },
  "Southwest Museum": { metro: "80612" },
  "Highland Park": { metro: "80613" },
  "South Pasadena": { metro: "80614" },
  "Fillmore": { metro: "80615" },
  "Del Mar": { metro: "80616" },
  "Memorial Park": { metro: "80617" },
  "Lake": { metro: "80618" },
  "Allen": { metro: "80619" },
  "Sierra Madre Villa": { metro: "80620" },
  "Arcadia": { metro: "80621" },
  "Monrovia": { metro: "80622" },
  "Duarte/City of Hope": { metro: "80623" },
  "Irwindale": { metro: "80624" },
  "Azusa Downtown": { metro: "80625" },
  "APU/Citrus College": { metro: "80626" },

  // K Line (Crenshaw)
  "Aviation/Century": { metro: "80701" },
  "Downtown Inglewood": { metro: "80702" },
  "Fairview Heights": { metro: "80703" },
  "Hyde Park": { metro: "80704" },
  "Leimert Park": { metro: "80705" },
  "Martin Luther King Jr": { metro: "80706" },
  "Expo/Crenshaw K": { metro: "80707" },

  // J Line (Silver) - BRT
  "El Monte": { metro: "80801" },
  "Cal State LA": { metro: "80802" },
  "Soto J": { metro: "80803" },
  "Harbor Gateway Transit Center": { metro: "80804" }
};

// Cache for dynamically built mappings
let dynamicMappingCache = null;

/**
 * Get GTFS stop_id for a station name
 * @param {string} stationName - VeloRail station name
 * @param {string} agency - Agency ID (default: 'metro')
 * @returns {string|null} GTFS stop_id or null if not found
 */
export async function getGTFSStopId(stationName, agency = 'metro') {
  // Try manual mapping first
  const manual = MANUAL_STOP_MAPPING[stationName];
  if (manual && manual[agency]) {
    return manual[agency];
  }

  // Try normalized name lookup
  const normalized = normalizeStationName(stationName);

  // Check manual mapping with normalized name
  for (const [name, mapping] of Object.entries(MANUAL_STOP_MAPPING)) {
    if (normalizeStationName(name) === normalized && mapping[agency]) {
      return mapping[agency];
    }
  }

  // Try dynamic mapping from loaded GTFS data
  const dynamicMapping = await getDynamicMapping(agency);
  if (dynamicMapping && dynamicMapping[normalized]) {
    return dynamicMapping[normalized];
  }

  return null;
}

/**
 * Normalize station name for matching
 */
function normalizeStationName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove special chars
    .replace(/station$/g, '')  // Remove trailing "station"
    .trim();
}

/**
 * Build dynamic mapping from loaded GTFS stops
 */
async function getDynamicMapping(feedId) {
  if (dynamicMappingCache) {
    return dynamicMappingCache;
  }

  try {
    const stops = await getStops(feedId === 'metro' ? 'metro_rail' : feedId);
    if (!stops || stops.length === 0) {
      return null;
    }

    dynamicMappingCache = {};
    for (const stop of stops) {
      const normalized = normalizeStationName(stop.stop_name);
      // Prefer parent stations over child platforms
      if (!dynamicMappingCache[normalized] || !stop.parent_station) {
        dynamicMappingCache[normalized] = stop.stop_id;
      }
    }

    return dynamicMappingCache;
  } catch (error) {
    console.warn('[StopMapping] Failed to build dynamic mapping:', error);
    return null;
  }
}

/**
 * Clear the dynamic mapping cache (call when GTFS data is updated)
 */
export function clearMappingCache() {
  dynamicMappingCache = null;
}

/**
 * Get all available stop mappings for debugging
 */
export function getManualMappings() {
  return { ...MANUAL_STOP_MAPPING };
}

/**
 * Find station name by GTFS stop_id (reverse lookup)
 */
export function getStationNameByStopId(stopId, agency = 'metro') {
  for (const [name, mapping] of Object.entries(MANUAL_STOP_MAPPING)) {
    if (mapping[agency] === stopId) {
      return name;
    }
  }
  return null;
}
