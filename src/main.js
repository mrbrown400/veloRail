import '/style.css'
import { initMap } from './map.js'
import { setupUI } from './ui.js'
import { initGTFS, getGTFSStatus } from './gtfs/gtfs_loader.js'
import { initRealtimeStore, getStoreStatus } from './realtime/realtime_store.js'
import { isRealtimeConfigured } from './realtime/gtfs_rt_fetcher.js'

// HTML is handled in index.html, JS only initializes logic
console.log('App initializing...');

initMap('map-container');
setupUI();

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
