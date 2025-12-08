import '/style.css'
import { initMap } from './map.js'
import { setupUI } from './ui.js'

// HTML is handled in index.html, JS only initializes logic
console.log('App initializing...');

initMap('map-container');
setupUI();
