/**
 * Network Updates Module
 *
 * Quarterly update checker for transit network changes.
 * - Checks for remote config updates
 * - Auto-transitions line/station statuses based on expectedOpening dates
 * - Stores update metadata in IndexedDB
 */

import { openDB } from 'idb';
import { TRANSIT_LINES } from './transit_data.js';

const DB_NAME = 'velorail_updates';
const DB_VERSION = 1;
const UPDATE_CHECK_INTERVAL = 90 * 24 * 60 * 60 * 1000; // 90 days (quarterly)

// Remote config URL - update with your repo
const NETWORK_CONFIG_URL = 'https://raw.githubusercontent.com/mrbrown400/veloRail/main/config/network_updates.json';

let dbPromise = null;

/**
 * Get or create the IndexedDB database for update metadata
 */
async function getDB() {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                if (!db.objectStoreNames.contains('metadata')) {
                    db.createObjectStore('metadata');
                }
                if (!db.objectStoreNames.contains('announcements')) {
                    db.createObjectStore('announcements', { keyPath: 'id' });
                }
            }
        });
    }
    return dbPromise;
}

/**
 * Check if quarterly update is due
 * @returns {Promise<boolean>}
 */
export async function shouldCheckForUpdates() {
    try {
        const db = await getDB();
        const lastCheck = await db.get('metadata', 'lastUpdateCheck');
        if (!lastCheck) return true;
        return Date.now() - lastCheck > UPDATE_CHECK_INTERVAL;
    } catch (error) {
        console.warn('[NetworkUpdates] Error checking update status:', error);
        return true;
    }
}

/**
 * Fetch remote network updates
 * @returns {Promise<Object|null>}
 */
export async function checkNetworkUpdates() {
    try {
        const response = await fetch(NETWORK_CONFIG_URL, {
            cache: 'no-cache'
        });

        if (!response.ok) {
            console.warn('[NetworkUpdates] Config fetch failed:', response.status);
            return null;
        }

        const updates = await response.json();

        // Store last check timestamp
        const db = await getDB();
        await db.put('metadata', Date.now(), 'lastUpdateCheck');
        await db.put('metadata', updates.version, 'lastVersion');

        return updates;
    } catch (error) {
        console.warn('[NetworkUpdates] Failed to fetch updates:', error);
        return null;
    }
}

/**
 * Parse opening date strings in various formats
 * @param {string} dateStr - "2025", "2025-Q3", "2025-09", "2025-09-15"
 * @returns {Date|null}
 */
function parseOpeningDate(dateStr) {
    if (!dateStr) return null;

    // Year only: "2025" -> Jan 1, 2025
    if (/^\d{4}$/.test(dateStr)) {
        return new Date(`${dateStr}-01-01`);
    }

    // Quarter: "2025-Q3" -> Jul 1, 2025
    if (/^\d{4}-Q(\d)$/.test(dateStr)) {
        const match = dateStr.match(/^(\d{4})-Q(\d)$/);
        const year = parseInt(match[1]);
        const quarter = parseInt(match[2]);
        const month = (quarter - 1) * 3; // Q1->0, Q2->3, Q3->6, Q4->9
        return new Date(year, month, 1);
    }

    // Month: "2025-09" -> Sep 1, 2025
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
        return new Date(`${dateStr}-01`);
    }

    // Full date: "2025-09-15"
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        return new Date(dateStr);
    }

    return null;
}

/**
 * Get lines/stations that should auto-transition based on expectedOpening
 * @returns {Array<{line: string, station?: string, from: string, to: string, date: string}>}
 */
export function getAutoTransitions() {
    const now = new Date();
    const transitions = [];

    for (const [lineName, line] of Object.entries(TRANSIT_LINES)) {
        // Check line-level status
        if (line.expectedOpening && line.status && line.status !== 'operating') {
            const openingDate = parseOpeningDate(line.expectedOpening);
            if (openingDate && now >= openingDate) {
                transitions.push({
                    line: lineName,
                    from: line.status,
                    to: 'operating',
                    date: line.expectedOpening
                });
            }
        }

        // Check station-level statuses
        if (line.stations) {
            for (const station of line.stations) {
                if (station.expectedOpening && station.status && station.status !== 'operating') {
                    const openingDate = parseOpeningDate(station.expectedOpening);
                    if (openingDate && now >= openingDate) {
                        transitions.push({
                            line: lineName,
                            station: station.name,
                            from: station.status,
                            to: 'operating',
                            date: station.expectedOpening
                        });
                    }
                }
            }
        }
    }

    return transitions;
}

/**
 * Apply remote status overrides (does not persist - for display only)
 * @param {Object} updates - Remote update config
 */
export function applyNetworkUpdates(updates) {
    if (!updates || !updates.statusOverrides) return;

    const now = new Date();

    for (const [lineName, override] of Object.entries(updates.statusOverrides)) {
        if (!TRANSIT_LINES[lineName]) continue;

        // Check if override is effective
        if (override.effectiveDate) {
            const effectiveDate = new Date(override.effectiveDate);
            if (now < effectiveDate) continue;
        }

        // Apply status override (runtime only, not persisted)
        if (override.status) {
            TRANSIT_LINES[lineName].status = override.status;
            console.log(`[NetworkUpdates] Applied status override: ${lineName} -> ${override.status}`);
        }
    }
}

/**
 * Show notification for pending status transitions
 * @param {Array} transitions - List of pending transitions
 */
function notifyStatusTransitions(transitions) {
    if (transitions.length === 0) return;

    console.log('[NetworkUpdates] Status transitions detected:', transitions);

    // Group by line for cleaner display
    const byLine = {};
    for (const t of transitions) {
        if (!byLine[t.line]) byLine[t.line] = [];
        byLine[t.line].push(t);
    }

    for (const [lineName, lineTransitions] of Object.entries(byLine)) {
        const stationCount = lineTransitions.filter(t => t.station).length;
        const lineLevel = lineTransitions.find(t => !t.station);

        if (lineLevel) {
            console.log(`[NetworkUpdates] ${lineName}: Transitioned to operating (expected ${lineLevel.date})`);
        }

        if (stationCount > 0) {
            const stationNames = lineTransitions.filter(t => t.station).map(t => t.station);
            console.log(`[NetworkUpdates] ${lineName}: ${stationCount} stations now open - ${stationNames.join(', ')}`);
        }
    }
}

/**
 * Store seen announcements to avoid showing duplicates
 * @param {string} announcementId
 */
async function markAnnouncementSeen(announcementId) {
    try {
        const db = await getDB();
        await db.put('announcements', { id: announcementId, seenAt: Date.now() });
    } catch (error) {
        console.warn('[NetworkUpdates] Error marking announcement seen:', error);
    }
}

/**
 * Check if announcement has been seen
 * @param {string} announcementId
 * @returns {Promise<boolean>}
 */
async function isAnnouncementSeen(announcementId) {
    try {
        const db = await getDB();
        const record = await db.get('announcements', announcementId);
        return !!record;
    } catch (error) {
        return false;
    }
}

/**
 * Process and display new announcements
 * @param {Array} announcements
 */
async function processAnnouncements(announcements) {
    if (!announcements || announcements.length === 0) return;

    const now = new Date();

    for (const announcement of announcements) {
        // Check if already seen
        if (await isAnnouncementSeen(announcement.id)) continue;

        // Check if effective
        if (announcement.effectiveDate) {
            const effectiveDate = new Date(announcement.effectiveDate);
            if (now < effectiveDate) continue;
        }

        // Log announcement
        console.log(`[NetworkUpdates] Announcement: ${announcement.title}`);
        console.log(`[NetworkUpdates] ${announcement.message}`);

        // Mark as seen
        await markAnnouncementSeen(announcement.id);
    }
}

/**
 * Get the last update check timestamp
 * @returns {Promise<number|null>}
 */
export async function getLastUpdateCheck() {
    try {
        const db = await getDB();
        return await db.get('metadata', 'lastUpdateCheck');
    } catch (error) {
        return null;
    }
}

/**
 * Get the current network config version
 * @returns {Promise<string|null>}
 */
export async function getConfigVersion() {
    try {
        const db = await getDB();
        return await db.get('metadata', 'lastVersion');
    } catch (error) {
        return null;
    }
}

/**
 * Initialize network update checker
 * Called on app startup
 */
export async function initNetworkUpdates() {
    console.log('[NetworkUpdates] Initializing...');

    try {
        // Check for auto-transitions first (local data)
        const transitions = getAutoTransitions();
        if (transitions.length > 0) {
            notifyStatusTransitions(transitions);
        }

        // Check if remote update is due
        if (await shouldCheckForUpdates()) {
            console.log('[NetworkUpdates] Checking for remote updates...');
            const updates = await checkNetworkUpdates();

            if (updates) {
                console.log(`[NetworkUpdates] Config version: ${updates.version}`);

                // Apply status overrides
                applyNetworkUpdates(updates);

                // Process announcements
                if (updates.announcements) {
                    await processAnnouncements(updates.announcements);
                }
            }
        } else {
            const lastCheck = await getLastUpdateCheck();
            const daysAgo = lastCheck ? Math.floor((Date.now() - lastCheck) / (24 * 60 * 60 * 1000)) : 'unknown';
            console.log(`[NetworkUpdates] Last check: ${daysAgo} days ago (next check in ${90 - daysAgo} days)`);
        }
    } catch (error) {
        console.warn('[NetworkUpdates] Initialization failed:', error);
    }
}

/**
 * Force a network update check (for debugging/manual trigger)
 */
export async function forceUpdateCheck() {
    console.log('[NetworkUpdates] Forcing update check...');

    // Clear last check time
    const db = await getDB();
    await db.delete('metadata', 'lastUpdateCheck');

    // Run update check
    return await initNetworkUpdates();
}
