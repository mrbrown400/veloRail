/**
 * GTFS Loader - Fetch and parse GTFS ZIP files
 *
 * Downloads GTFS data from transit agencies and parses the CSV files
 * into structured data for storage in IndexedDB.
 */

import { storeGTFSData, getMetadata, setMetadata } from './gtfs_store.js';

// CORS proxy for development (use own proxy in production)
const CORS_PROXY = 'https://corsproxy.io/?';

// GTFS feed URLs
const GTFS_FEEDS = {
  metro_rail: {
    url: `${CORS_PROXY}${encodeURIComponent('https://gitlab.com/LACMTA/gtfs_rail/-/raw/master/gtfs_rail.zip')}`,
    agency: 'metro',
    type: 'rail',
    ttl: 24 * 60 * 60 * 1000 // 24 hours
  },
  metro_bus: {
    url: `${CORS_PROXY}${encodeURIComponent('https://gitlab.com/LACMTA/gtfs_bus/-/raw/master/gtfs_bus.zip')}`,
    agency: 'metro',
    type: 'bus',
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  },
  metrolink: {
    url: `${CORS_PROXY}${encodeURIComponent('https://metrolinktrains.com/gtfs/gtfs.zip')}`,
    agency: 'metrolink',
    type: 'rail',
    ttl: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
};

/**
 * Initialize GTFS data - load from IndexedDB or fetch fresh
 * @param {boolean} forceRefresh - Force download even if cache valid
 */
export async function initGTFS(forceRefresh = false) {
  const feeds = ['metro_rail']; // Start with just Metro Rail for now

  for (const feedId of feeds) {
    const feed = GTFS_FEEDS[feedId];
    const metadata = await getMetadata(feedId);

    const needsUpdate = forceRefresh ||
      !metadata ||
      Date.now() - metadata.lastUpdated > feed.ttl;

    if (needsUpdate) {
      console.log(`[GTFS] Loading ${feedId}...`);
      try {
        await loadGTFSFeed(feedId, feed);
        console.log(`[GTFS] ${feedId} loaded successfully`);
      } catch (error) {
        console.error(`[GTFS] Failed to load ${feedId}:`, error);
        // Continue with other feeds
      }
    } else {
      console.log(`[GTFS] ${feedId} cache valid, skipping download`);
    }
  }
}

/**
 * Load a single GTFS feed
 */
async function loadGTFSFeed(feedId, feed) {
  // Fetch the ZIP file
  const response = await fetch(feed.url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const zipBlob = await response.blob();
  const gtfsData = await parseGTFSZip(zipBlob);

  // Store in IndexedDB
  await storeGTFSData(feedId, feed.agency, gtfsData);

  // Update metadata
  await setMetadata(feedId, {
    feedId,
    agency: feed.agency,
    type: feed.type,
    lastUpdated: Date.now(),
    feedStartDate: gtfsData.feedInfo?.start_date,
    feedEndDate: gtfsData.feedInfo?.end_date,
    stopCount: gtfsData.stops?.length || 0,
    routeCount: gtfsData.routes?.length || 0
  });
}

/**
 * Parse a GTFS ZIP file and extract relevant data
 * Uses JSZip for ZIP extraction
 */
async function parseGTFSZip(zipBlob) {
  // Dynamically import JSZip (we'll add as optional dependency)
  // For now, use a simple approach with native APIs where possible
  const JSZip = (await import('jszip')).default;

  const zip = await JSZip.loadAsync(zipBlob);

  const result = {
    stops: [],
    stopTimes: [],
    trips: [],
    routes: [],
    calendar: [],
    calendarDates: [],
    feedInfo: null
  };

  // Parse each file
  const files = {
    'stops.txt': 'stops',
    'stop_times.txt': 'stopTimes',
    'trips.txt': 'trips',
    'routes.txt': 'routes',
    'calendar.txt': 'calendar',
    'calendar_dates.txt': 'calendarDates',
    'feed_info.txt': 'feedInfo'
  };

  for (const [filename, key] of Object.entries(files)) {
    const file = zip.file(filename);
    if (file) {
      const content = await file.async('string');
      const parsed = parseCSV(content);

      if (key === 'feedInfo' && parsed.length > 0) {
        result[key] = parsed[0]; // Single row
      } else {
        result[key] = parsed;
      }
    }
  }

  return result;
}

/**
 * Parse CSV content into array of objects
 * Handles GTFS-specific CSV formatting (quoted fields, newlines)
 */
export function parseCSV(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length === 0) return [];

  // Parse header
  const headers = parseCSVLine(lines[0]);

  // Parse rows
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    const row = {};

    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }

    rows.push(row);
  }

  return rows;
}

/**
 * Parse a single CSV line handling quoted fields
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Check if GTFS data is available and fresh
 */
export async function isGTFSAvailable() {
  const metadata = await getMetadata('metro_rail');
  if (!metadata) return false;

  // Check if data is not too old (allow some staleness)
  const maxAge = 48 * 60 * 60 * 1000; // 48 hours
  return Date.now() - metadata.lastUpdated < maxAge;
}

/**
 * Get feed status for debugging
 */
export async function getGTFSStatus() {
  const status = {};

  for (const feedId of Object.keys(GTFS_FEEDS)) {
    const metadata = await getMetadata(feedId);
    status[feedId] = metadata ? {
      loaded: true,
      lastUpdated: new Date(metadata.lastUpdated).toISOString(),
      stopCount: metadata.stopCount,
      routeCount: metadata.routeCount
    } : { loaded: false };
  }

  return status;
}
