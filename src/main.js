import '/style.css'
import { initMap } from './map.js'
import { setupUI } from './ui.js'
import { initGTFS, getGTFSStatus } from './gtfs/gtfs_loader.js'

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
}).catch(error => {
  console.warn('[GTFS] Initialization failed, using frequency-based estimates:', error);
});
