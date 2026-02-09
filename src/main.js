import '/style.css'
import { initMap, getMap } from './google_map.js'
import { setupUI } from './ui.js'
import { initGTFS, getGTFSStatus } from './gtfs/gtfs_loader.js'
import { initRealtimeStore, getStoreStatus } from './realtime/realtime_store.js'
import { isRealtimeConfigured } from './realtime/gtfs_rt_fetcher.js'
import { initNetworkUpdates } from './network_updates.js'
import { initGooglePlaces } from './geocoding.js'
import { initDirectionsService } from './google_directions.js'

// HTML is handled in index.html, JS only initializes logic
console.log('App initializing...');

// Initialize map and wait for it to load before setting up UI
initMap('map-container').then((map) => {
    if (map) {
        // Initialize Google Places with the map
        initGooglePlaces(map);

        // Initialize Directions service
        initDirectionsService();

        console.log('Google Maps services initialized');
    }

    // Setup UI (can work without Google Maps for fallback)
    setupUI();
}).catch(error => {
    console.error('Map initialization failed:', error);
    // Still setup UI with fallback providers
    setupUI();
});

// Initialize network updates (check for transit line status changes)
initNetworkUpdates().then(() => {
  console.log('[NetworkUpdates] Update check complete');
}).catch(error => {
  console.warn('[NetworkUpdates] Update check failed:', error);
});

// Initialize GTFS data in background (non-blocking)
initGTFS().then(() => {
  console.log('[GTFS] Data loaded successfully');
  getGTFSStatus().then(status => {
    console.log('[GTFS] Status:', status);
  });

  // Initialize real-time updates after GTFS is loaded
  if (isRealtimeConfigured()) {
    console.log('[Realtime] API keys detected, starting real-time updates');
    initRealtimeStore();

    // Log initial status after a brief delay
    setTimeout(() => {
      const rtStatus = getStoreStatus();
      console.log('[Realtime] Status:', rtStatus);
    }, 2000);
  } else {
    console.log('[Realtime] No API keys configured, using static GTFS schedules');
  }
}).catch(error => {
  console.warn('[GTFS] Initialization failed, using frequency-based estimates:', error);
});
