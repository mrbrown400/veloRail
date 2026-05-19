/**
 * GTFS Loader - Fetch, validate, and parse static GTFS feeds.
 *
 * Static GTFS remains app-owned source data for schedules and exports. Google
 * Maps still owns live map rendering and route UX.
 */

import { storeGTFSData, getMetadata, setMetadata } from './gtfs_store.js';

// CORS proxy for development. Production should route this through an app-owned
// feed refresh job rather than fetching large zips from the browser.
const CORS_PROXY = 'https://corsproxy.io/?';

export const REQUIRED_GTFS_FILES = Object.freeze([
  'routes.txt',
  'stops.txt',
  'trips.txt',
  'stop_times.txt',
  'calendar.txt',
  'calendar_dates.txt'
]);

export const OPTIONAL_GTFS_FILES = Object.freeze([
  'feed_info.txt'
]);

const GTFS_FILE_KEYS = Object.freeze({
  'routes.txt': 'routes',
  'stops.txt': 'stops',
  'trips.txt': 'trips',
  'stop_times.txt': 'stopTimes',
  'calendar.txt': 'calendar',
  'calendar_dates.txt': 'calendarDates',
  'feed_info.txt': 'feedInfo'
});

const REQUIRED_FIELDS = Object.freeze({
  'routes.txt': ['route_id', 'route_type'],
  'stops.txt': ['stop_id', 'stop_name', 'stop_lat', 'stop_lon'],
  'trips.txt': ['route_id', 'service_id', 'trip_id'],
  'stop_times.txt': ['trip_id', 'arrival_time', 'departure_time', 'stop_id', 'stop_sequence'],
  'calendar.txt': [
    'service_id',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
    'start_date',
    'end_date'
  ],
  'calendar_dates.txt': ['service_id', 'date', 'exception_type']
});

const SERVICE_DAY_FIELDS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday'
];

// GTFS feed URLs.
export const GTFS_FEEDS = {
  metro_rail: {
    url: `${CORS_PROXY}${encodeURIComponent('https://gitlab.com/LACMTA/gtfs_rail/-/raw/master/gtfs_rail.zip')}`,
    agency: 'metro',
    type: 'rail',
    sourceName: 'LA Metro Rail GTFS',
    ttl: 24 * 60 * 60 * 1000
  },
  metro_bus: {
    url: `${CORS_PROXY}${encodeURIComponent('https://gitlab.com/LACMTA/gtfs_bus/-/raw/master/gtfs_bus.zip')}`,
    agency: 'metro',
    type: 'bus',
    sourceName: 'LA Metro Bus GTFS',
    ttl: 7 * 24 * 60 * 60 * 1000
  },
  metrolink: {
    url: `${CORS_PROXY}${encodeURIComponent('https://metrolinktrains.com/gtfs/gtfs.zip')}`,
    agency: 'metrolink',
    type: 'rail',
    sourceName: 'Metrolink GTFS',
    ttl: 7 * 24 * 60 * 60 * 1000
  }
};

export class GTFSParseError extends Error {
  constructor(message, context = {}) {
    const location = formatErrorLocation(context);
    super(location ? `${location}: ${message}` : message);
    this.name = 'GTFSParseError';
    this.sourceName = context.sourceName || null;
    this.fileName = context.fileName || null;
    this.rowNumber = context.rowNumber || null;
    this.fieldName = context.fieldName || null;
    if (context.cause) {
      this.cause = context.cause;
    }
  }
}

/**
 * Initialize GTFS data - load from IndexedDB or fetch fresh.
 * @param {boolean} forceRefresh - Force download even if cache valid.
 * @param {string[]} feedIds - Feed IDs to load.
 */
export async function initGTFS(forceRefresh = false, feedIds = ['metro_rail']) {
  for (const feedId of feedIds) {
    const feed = GTFS_FEEDS[feedId];
    if (!feed) {
      console.warn(`[GTFS] Unknown feed ${feedId}, skipping`);
      continue;
    }

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
      }
    } else {
      console.log(`[GTFS] ${feedId} cache valid, skipping download`);
    }
  }
}

/**
 * Load a single GTFS feed from its configured URL and persist it.
 */
export async function loadGTFSFeed(feedId, feed) {
  const response = await fetch(feed.url);
  if (!response.ok) {
    throw new Error(`[${feedId}] HTTP ${response.status}: ${response.statusText}`);
  }

  const zipBlob = await response.blob();
  const gtfsData = await parseGTFSZip(zipBlob, {
    sourceName: feed.sourceName || feedId
  });
  const summary = summarizeGTFSFeed(gtfsData);

  await storeGTFSData(feedId, feed.agency, gtfsData);

  await setMetadata(feedId, {
    feedId,
    agency: feed.agency,
    type: feed.type,
    sourceName: feed.sourceName || feedId,
    lastUpdated: Date.now(),
    feedStartDate: summary.feedStartDate,
    feedEndDate: summary.feedEndDate,
    stopCount: summary.stopCount,
    routeCount: summary.routeCount,
    tripCount: summary.tripCount,
    stopTimeCount: summary.stopTimeCount,
    calendarCount: summary.calendarCount,
    calendarDateCount: summary.calendarDateCount
  });
}

/**
 * Parse a GTFS ZIP file and extract the static tables VeloRail uses.
 */
export async function parseGTFSZip(zipBlob, options = {}) {
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(zipBlob);
  const contentsByFile = {};

  for (const filename of [...REQUIRED_GTFS_FILES, ...OPTIONAL_GTFS_FILES]) {
    const file = findZipFile(zip, filename);
    if (file) {
      contentsByFile[filename] = await file.async('string');
    }
  }

  return parseGTFSFeedFiles(contentsByFile, {
    sourceName: options.sourceName || 'GTFS ZIP'
  });
}

/**
 * Parse GTFS table contents provided as an object or Map keyed by filename.
 * This is the testable import boundary for offline refresh scripts.
 */
export function parseGTFSFeedFiles(fileContents, options = {}) {
  const sourceName = options.sourceName || 'GTFS feed';
  const normalizedFiles = normalizeFileContents(fileContents, sourceName);
  const result = {
    stops: [],
    stopTimes: [],
    trips: [],
    routes: [],
    calendar: [],
    calendarDates: [],
    feedInfo: null
  };

  for (const filename of REQUIRED_GTFS_FILES) {
    if (!Object.prototype.hasOwnProperty.call(normalizedFiles, filename)) {
      throw new GTFSParseError(`Missing required GTFS file "${filename}"`, {
        sourceName,
        fileName: filename
      });
    }
  }

  for (const [filename, key] of Object.entries(GTFS_FILE_KEYS)) {
    if (!Object.prototype.hasOwnProperty.call(normalizedFiles, filename)) {
      continue;
    }

    const parsed = parseGTFSFile(filename, normalizedFiles[filename], sourceName);
    result[key] = key === 'feedInfo' ? parsed[0] || null : parsed;
  }

  validateGTFSReferences(result, sourceName);
  return result;
}

/**
 * Parse CSV content into array of objects.
 * Handles GTFS quoted commas, escaped quotes, CRLF, and quoted newlines.
 */
export function parseCSV(csvText, options = {}) {
  return parseCSVDocument(csvText, options).rows;
}

export function summarizeGTFSFeed(gtfsData) {
  const feedInfo = gtfsData.feedInfo || {};
  const startDates = [];
  const endDates = [];

  if (feedInfo.feed_start_date) startDates.push(feedInfo.feed_start_date);
  if (feedInfo.feed_end_date) endDates.push(feedInfo.feed_end_date);

  for (const calendar of gtfsData.calendar || []) {
    if (calendar.start_date) startDates.push(calendar.start_date);
    if (calendar.end_date) endDates.push(calendar.end_date);
  }

  for (const calendarDate of gtfsData.calendarDates || []) {
    if (calendarDate.date) {
      startDates.push(calendarDate.date);
      endDates.push(calendarDate.date);
    }
  }

  return {
    feedStartDate: minGTFSDate(startDates),
    feedEndDate: maxGTFSDate(endDates),
    stopCount: gtfsData.stops?.length || 0,
    routeCount: gtfsData.routes?.length || 0,
    tripCount: gtfsData.trips?.length || 0,
    stopTimeCount: gtfsData.stopTimes?.length || 0,
    calendarCount: gtfsData.calendar?.length || 0,
    calendarDateCount: gtfsData.calendarDates?.length || 0
  };
}

/**
 * Check if GTFS data is available and fresh.
 */
export async function isGTFSAvailable(feedId = 'metro_rail') {
  const metadata = await getMetadata(feedId);
  if (!metadata) return false;

  const maxAge = 48 * 60 * 60 * 1000;
  return Date.now() - metadata.lastUpdated < maxAge;
}

/**
 * Get feed status for debugging.
 */
export async function getGTFSStatus() {
  const status = {};

  for (const feedId of Object.keys(GTFS_FEEDS)) {
    const metadata = await getMetadata(feedId);
    status[feedId] = metadata ? {
      loaded: true,
      lastUpdated: new Date(metadata.lastUpdated).toISOString(),
      feedStartDate: metadata.feedStartDate || null,
      feedEndDate: metadata.feedEndDate || null,
      stopCount: metadata.stopCount,
      routeCount: metadata.routeCount,
      tripCount: metadata.tripCount || 0
    } : { loaded: false };
  }

  return status;
}

function parseGTFSFile(filename, content, sourceName) {
  const parsed = parseCSVDocument(content, { sourceName, fileName: filename });
  const requiredFields = REQUIRED_FIELDS[filename] || [];

  for (const field of requiredFields) {
    if (!parsed.headers.includes(field)) {
      throw new GTFSParseError(`Missing required column "${field}"`, {
        sourceName,
        fileName: filename
      });
    }
  }

  return parsed.rows.map((row, index) => {
    const rowNumber = parsed.rowNumbers[index];
    for (const field of requiredFields) {
      requireValue(row, field, { sourceName, fileName: filename, rowNumber });
    }

    validateGTFSRow(filename, row, rowNumber, sourceName);
    return row;
  });
}

function parseCSVDocument(csvText, options = {}) {
  if (typeof csvText !== 'string') {
    throw new GTFSParseError('CSV content must be a string', options);
  }

  const records = parseCSVRecords(csvText, options);
  if (records.length === 0) {
    return { headers: [], rows: [], rowNumbers: [] };
  }

  const headers = records[0].values.map((header) => header.trim());
  const seenHeaders = new Set();
  for (const header of headers) {
    if (!header) {
      throw new GTFSParseError('CSV header contains an empty column name', options);
    }
    if (seenHeaders.has(header)) {
      throw new GTFSParseError(`CSV header contains duplicate column "${header}"`, options);
    }
    seenHeaders.add(header);
  }

  const rows = [];
  const rowNumbers = [];

  for (let index = 1; index < records.length; index += 1) {
    const record = records[index];
    const values = record.values.map((value) => value.trim());
    if (isBlankRecord(values)) {
      continue;
    }

    const extraValues = values.slice(headers.length).filter(Boolean);
    if (extraValues.length > 0) {
      throw new GTFSParseError(`CSV row has ${values.length} values for ${headers.length} columns`, {
        ...options,
        rowNumber: record.lineNumber
      });
    }

    const row = {};
    for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
      row[headers[headerIndex]] = values[headerIndex] || '';
    }

    rows.push(row);
    rowNumbers.push(record.lineNumber);
  }

  return { headers, rows, rowNumbers };
}

function parseCSVRecords(csvText, context) {
  const text = csvText.replace(/^\uFEFF/, '');
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;
  let atFieldStart = true;
  let lineNumber = 1;
  let recordLineNumber = 1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (inQuotes) {
        inQuotes = false;
        atFieldStart = false;
      } else if (atFieldStart || field.trim() === '') {
        inQuotes = true;
        atFieldStart = false;
      } else {
        throw new GTFSParseError('Unexpected quote in unquoted CSV field', {
          ...context,
          rowNumber: lineNumber
        });
      }
      continue;
    }

    if ((char === ',' || isLineBreakStart(text, index)) && !inQuotes) {
      record.push(field);
      field = '';
      atFieldStart = true;

      if (isLineBreakStart(text, index)) {
        records.push({ values: record, lineNumber: recordLineNumber });
        record = [];
        lineNumber += 1;
        recordLineNumber = lineNumber;
        if (char === '\r' && text[index + 1] === '\n') {
          index += 1;
        }
      }
      continue;
    }

    if (isLineBreakStart(text, index)) {
      field += '\n';
      lineNumber += 1;
      if (char === '\r' && text[index + 1] === '\n') {
        index += 1;
      }
      continue;
    }

    field += char;
    atFieldStart = false;
  }

  if (inQuotes) {
    throw new GTFSParseError('Unclosed quoted CSV field', {
      ...context,
      rowNumber: recordLineNumber
    });
  }

  record.push(field);
  if (!isBlankRecord(record) || records.length === 0) {
    records.push({ values: record, lineNumber: recordLineNumber });
  }

  return records.filter((entry) => !isBlankRecord(entry.values));
}

function validateGTFSRow(filename, row, rowNumber, sourceName) {
  const context = { sourceName, fileName: filename, rowNumber };

  if (filename === 'routes.txt') {
    if (!row.route_short_name && !row.route_long_name) {
      throw new GTFSParseError('Route must include route_short_name or route_long_name', context);
    }
    requireInteger(row.route_type, 'route_type', context);
    return;
  }

  if (filename === 'stops.txt') {
    requireNumberInRange(row.stop_lat, 'stop_lat', -90, 90, context);
    requireNumberInRange(row.stop_lon, 'stop_lon', -180, 180, context);
    return;
  }

  if (filename === 'stop_times.txt') {
    requireGTFSTime(row.arrival_time, 'arrival_time', context);
    requireGTFSTime(row.departure_time, 'departure_time', context);
    requireNonNegativeInteger(row.stop_sequence, 'stop_sequence', context);
    return;
  }

  if (filename === 'calendar.txt') {
    for (const field of SERVICE_DAY_FIELDS) {
      requireBinaryFlag(row[field], field, context);
    }
    requireGTFSDate(row.start_date, 'start_date', context);
    requireGTFSDate(row.end_date, 'end_date', context);
    if (row.start_date > row.end_date) {
      throw new GTFSParseError('Calendar start_date must be before or equal to end_date', context);
    }
    return;
  }

  if (filename === 'calendar_dates.txt') {
    requireGTFSDate(row.date, 'date', context);
    if (row.exception_type !== '1' && row.exception_type !== '2') {
      throw new GTFSParseError('exception_type must be 1 or 2', {
        ...context,
        fieldName: 'exception_type'
      });
    }
  }
}

function validateGTFSReferences(gtfsData, sourceName) {
  const routeIds = new Set(gtfsData.routes.map((route) => route.route_id));
  const stopIds = new Set(gtfsData.stops.map((stop) => stop.stop_id));
  const serviceIds = new Set([
    ...gtfsData.calendar.map((calendar) => calendar.service_id),
    ...gtfsData.calendarDates.map((calendarDate) => calendarDate.service_id)
  ]);
  const tripIds = new Set(gtfsData.trips.map((trip) => trip.trip_id));

  gtfsData.trips.forEach((trip, index) => {
    if (!routeIds.has(trip.route_id)) {
      throw new GTFSParseError(`Trip references unknown route_id "${trip.route_id}"`, {
        sourceName,
        fileName: 'trips.txt',
        rowNumber: index + 2,
        fieldName: 'route_id'
      });
    }
    if (!serviceIds.has(trip.service_id)) {
      throw new GTFSParseError(`Trip references unknown service_id "${trip.service_id}"`, {
        sourceName,
        fileName: 'trips.txt',
        rowNumber: index + 2,
        fieldName: 'service_id'
      });
    }
  });

  gtfsData.stopTimes.forEach((stopTime, index) => {
    if (!tripIds.has(stopTime.trip_id)) {
      throw new GTFSParseError(`Stop time references unknown trip_id "${stopTime.trip_id}"`, {
        sourceName,
        fileName: 'stop_times.txt',
        rowNumber: index + 2,
        fieldName: 'trip_id'
      });
    }
    if (!stopIds.has(stopTime.stop_id)) {
      throw new GTFSParseError(`Stop time references unknown stop_id "${stopTime.stop_id}"`, {
        sourceName,
        fileName: 'stop_times.txt',
        rowNumber: index + 2,
        fieldName: 'stop_id'
      });
    }
  });
}

function normalizeFileContents(fileContents, sourceName) {
  const normalized = {};
  const entries = fileContents instanceof Map
    ? [...fileContents.entries()]
    : Object.entries(fileContents || {});

  for (const [name, content] of entries) {
    const filename = basename(String(name)).toLowerCase();
    if (!Object.prototype.hasOwnProperty.call(GTFS_FILE_KEYS, filename)) {
      continue;
    }
    if (typeof content !== 'string') {
      throw new GTFSParseError(`GTFS table "${filename}" must be provided as text`, {
        sourceName,
        fileName: filename
      });
    }
    normalized[filename] = content;
  }

  return normalized;
}

function findZipFile(zip, filename) {
  const wantedName = filename.toLowerCase();
  let found = zip.file(filename);
  if (found) return found;

  zip.forEach((relativePath, file) => {
    if (!found && !file.dir && basename(relativePath).toLowerCase() === wantedName) {
      found = file;
    }
  });

  return found;
}

function requireValue(row, field, context) {
  if (!row[field]) {
    throw new GTFSParseError(`Missing required value "${field}"`, {
      ...context,
      fieldName: field
    });
  }
}

function requireNumberInRange(value, field, min, max, context) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new GTFSParseError(`${field} must be a number between ${min} and ${max}`, {
      ...context,
      fieldName: field
    });
  }
}

function requireInteger(value, field, context) {
  if (!/^-?\d+$/.test(value)) {
    throw new GTFSParseError(`${field} must be an integer`, {
      ...context,
      fieldName: field
    });
  }
}

function requireNonNegativeInteger(value, field, context) {
  if (!/^\d+$/.test(value)) {
    throw new GTFSParseError(`${field} must be a non-negative integer`, {
      ...context,
      fieldName: field
    });
  }
}

function requireBinaryFlag(value, field, context) {
  if (value !== '0' && value !== '1') {
    throw new GTFSParseError(`${field} must be 0 or 1`, {
      ...context,
      fieldName: field
    });
  }
}

function requireGTFSDate(value, field, context) {
  if (!/^\d{8}$/.test(value)) {
    throw new GTFSParseError(`${field} must use YYYYMMDD format`, {
      ...context,
      fieldName: field
    });
  }
}

function requireGTFSTime(value, field, context) {
  if (!/^\d{1,3}:[0-5]\d:[0-5]\d$/.test(value)) {
    throw new GTFSParseError(`${field} must use HH:MM:SS GTFS time format`, {
      ...context,
      fieldName: field
    });
  }
}

function isLineBreakStart(text, index) {
  return text[index] === '\n' || text[index] === '\r';
}

function isBlankRecord(values) {
  return values.every((value) => value.trim() === '');
}

function basename(filePath) {
  return filePath.split('/').pop();
}

function minGTFSDate(values) {
  const dates = values.filter(Boolean).sort();
  return dates[0] || null;
}

function maxGTFSDate(values) {
  const dates = values.filter(Boolean).sort();
  return dates[dates.length - 1] || null;
}

function formatErrorLocation(context) {
  const parts = [];
  if (context.sourceName) parts.push(context.sourceName);
  if (context.fileName) parts.push(context.fileName);
  if (context.rowNumber) parts.push(`row ${context.rowNumber}`);
  if (context.fieldName) parts.push(context.fieldName);
  return parts.length > 0 ? `[${parts.join(' ')}]` : '';
}
