// UI event listeners and DOM manipulation
import { compareRoutes } from './routing.js';
import { drawRoute, toggleLayerGroup, invalidateMapSize } from './map.js';
import { requestGeolocation, getCurrentLocationState } from './geolocation.js';
import { toggleBikeOverlay } from './bike_network.js';

// UI State
let uiState = {
  mode: 'collapsed',          // 'collapsed' | 'expanded'
  startLocation: null,        // Geolocation coords or null
  isUsingGeolocation: false,
  hasSearched: false,
  sidebarOpen: false,
  layers: {
    bike: true,
    metroRail: true,
    metroBrt: true,
    ladot: true,
    silverStreak: true
  }
};

export function setupUI() {
  // DOM Elements - Search Card
  const searchCollapsed = document.getElementById('search-collapsed');
  const endInput = document.getElementById('end');
  const locationStatus = document.getElementById('location-status');

  // DOM Elements - Expanded state
  const searchExpanded = document.getElementById('search-expanded');
  const startInput = document.getElementById('start');
  const endInputExpanded = document.getElementById('end-expanded');
  const useLocationBtn = document.getElementById('use-location-btn');

  // DOM Elements - Options Row
  const findRouteBtn = document.getElementById('find-route-btn');
  const safetySelect = document.getElementById('bike-safety');
  const modeSelect = document.getElementById('travel-mode');

  // DOM Elements - Time Selector
  const timeRadios = document.querySelectorAll('input[name="departure-time"]');
  const customTimeInput = document.getElementById('custom-time');

  // DOM Elements - Layers
  const layersBtn = document.getElementById('layers-btn');
  const layersPanel = document.getElementById('layers-panel');

  // DOM Elements - Results Sidebar
  const resultsSidebar = document.getElementById('results-sidebar');
  const closeSidebarBtn = document.getElementById('close-sidebar');
  const routeDetails = document.getElementById('route-details');

  // Initialize geolocation on page load
  initGeolocation();

  // Setup event listeners
  findRouteBtn.addEventListener('click', handleSearch);

  // Make location status clickable to change start location
  if (locationStatus) {
    locationStatus.addEventListener('click', handleLocationStatusClick);
  }

  if (startInput) {
    startInput.addEventListener('input', handleStartInputChange);
  }

  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', handleUseLocationClick);
  }

  // Time selector
  setupTimeSelector();

  // Layers panel
  setupLayersControl();

  // Sidebar
  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', hideResultsSidebar);
  }

  // --- Geolocation ---

  async function initGeolocation() {
    updateLocationStatus('pending');

    try {
      const location = await requestGeolocation();
      uiState.startLocation = location;
      uiState.isUsingGeolocation = true;
      updateLocationStatus('granted');
    } catch (error) {
      console.warn('Geolocation error:', error);
      handleGeolocationError(error);
    }
  }

  function updateLocationStatus(status) {
    const statusIcon = locationStatus.querySelector('.status-icon');
    const statusText = locationStatus.querySelector('.status-text');

    switch (status) {
      case 'pending':
        statusIcon.textContent = '';
        statusText.textContent = 'Getting your location...';
        locationStatus.className = 'location-status pending';
        break;
      case 'granted':
        statusIcon.textContent = '';
        statusText.textContent = 'Using your location';
        locationStatus.className = 'location-status success';
        break;
      case 'denied':
        statusIcon.textContent = '';
        statusText.innerHTML = 'Location access denied. <button type="button" class="link-btn" id="enter-start-btn">Enter start</button>';
        locationStatus.className = 'location-status warning';
        attachEnterStartHandler();
        break;
      case 'unavailable':
        statusIcon.textContent = '';
        statusText.innerHTML = 'Location unavailable. <button type="button" class="link-btn" id="enter-start-btn">Enter start</button>';
        locationStatus.className = 'location-status warning';
        attachEnterStartHandler();
        break;
    }
  }

  function attachEnterStartHandler() {
    const enterStartBtn = document.getElementById('enter-start-btn');
    if (enterStartBtn) {
      enterStartBtn.addEventListener('click', () => {
        expandSearchUI('');
        startInput.focus();
      });
    }
  }

  function handleGeolocationError(error) {
    if (error.code === 1) {
      updateLocationStatus('denied');
    } else {
      updateLocationStatus('unavailable');
    }
  }

  function handleLocationStatusClick() {
    // Expand search UI to allow changing start location
    const destinationValue = endInput.value || '';
    expandSearchUI(destinationValue);
    startInput.focus();
    startInput.select();
  }

  async function handleUseLocationClick() {
    try {
      const location = await requestGeolocation();
      uiState.startLocation = location;
      uiState.isUsingGeolocation = true;
      startInput.value = 'Your Location';
      startInput.classList.add('using-geolocation');
    } catch (error) {
      console.warn('Geolocation error:', error);
      alert('Could not get your location. Please enter a start address.');
    }
  }

  function handleStartInputChange(event) {
    const value = event.target.value;

    if (value !== 'Your Location') {
      uiState.isUsingGeolocation = false;
      uiState.startLocation = null;
      startInput.classList.remove('using-geolocation');
    }
  }

  // --- Time Selector ---

  function setupTimeSelector() {
    // Initialize custom time input with current time
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    customTimeInput.value = now.toISOString().slice(0, 16);

    // Handle radio button changes
    timeRadios.forEach(radio => {
      radio.addEventListener('change', () => {
        if (radio.value === 'depart') {
          customTimeInput.classList.remove('hidden');
          // Update to current time when switching to custom
          const now = new Date();
          now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
          customTimeInput.value = now.toISOString().slice(0, 16);
        } else {
          customTimeInput.classList.add('hidden');
        }
      });
    });
  }

  function getDepartureTime() {
    const selectedRadio = document.querySelector('input[name="departure-time"]:checked');
    if (selectedRadio && selectedRadio.value === 'depart' && customTimeInput.value) {
      return new Date(customTimeInput.value);
    }
    return new Date(); // "Leave now" - use current time
  }

  // --- Layers Control ---

  function setupLayersControl() {
    // Toggle panel visibility
    layersBtn.addEventListener('click', () => {
      layersPanel.classList.toggle('hidden');
    });

    // Close panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!layersPanel.classList.contains('hidden') &&
          !layersPanel.contains(e.target) &&
          !layersBtn.contains(e.target)) {
        layersPanel.classList.add('hidden');
      }
    });

    // Layer toggle handlers
    document.getElementById('layer-bike').addEventListener('change', (e) => {
      uiState.layers.bike = e.target.checked;
      toggleBikeOverlay(e.target.checked);
    });

    document.getElementById('layer-metro-rail').addEventListener('change', (e) => {
      uiState.layers.metroRail = e.target.checked;
      toggleLayerGroup('metroRail', e.target.checked);
    });

    document.getElementById('layer-metro-brt').addEventListener('change', (e) => {
      uiState.layers.metroBrt = e.target.checked;
      toggleLayerGroup('metroBrt', e.target.checked);
    });

    document.getElementById('layer-ladot').addEventListener('change', (e) => {
      uiState.layers.ladot = e.target.checked;
      toggleLayerGroup('ladot', e.target.checked);
    });

    document.getElementById('layer-silver-streak').addEventListener('change', (e) => {
      uiState.layers.silverStreak = e.target.checked;
      toggleLayerGroup('silverStreak', e.target.checked);
    });
  }

  // --- Sidebar Management ---

  function showResultsSidebar() {
    resultsSidebar.classList.add('visible');
    document.getElementById('app').classList.add('sidebar-open');
    uiState.sidebarOpen = true;
    // Invalidate map size after animation
    setTimeout(() => invalidateMapSize(), 350);
  }

  function hideResultsSidebar() {
    resultsSidebar.classList.remove('visible');
    document.getElementById('app').classList.remove('sidebar-open');
    uiState.sidebarOpen = false;
    // Invalidate map size after animation
    setTimeout(() => invalidateMapSize(), 350);
  }

  // --- Search Flow ---

  async function handleSearch() {
    // Get destination value based on current UI mode
    const destinationValue = uiState.mode === 'collapsed'
      ? endInput.value
      : endInputExpanded.value;

    if (!destinationValue) {
      alert('Please enter a destination.');
      return;
    }

    // Determine start location
    let startValue;
    if (uiState.mode === 'collapsed') {
      if (uiState.isUsingGeolocation && uiState.startLocation) {
        startValue = uiState.startLocation;
      } else {
        expandSearchUI(destinationValue);
        alert('Please enter a starting location.');
        startInput.focus();
        return;
      }
    } else {
      if (uiState.isUsingGeolocation && uiState.startLocation && startInput.value === 'Your Location') {
        startValue = uiState.startLocation;
      } else {
        startValue = startInput.value;
        if (!startValue) {
          alert('Please enter a starting location.');
          startInput.focus();
          return;
        }
      }
    }

    // Show loading state
    findRouteBtn.textContent = 'Calculating...';
    findRouteBtn.disabled = true;

    try {
      const safetyPreference = safetySelect ? safetySelect.value : 'balanced';
      const modeFilter = modeSelect ? modeSelect.value : 'all';
      const departureTime = getDepartureTime();
      const comparisonResults = await compareRoutes(startValue, destinationValue, safetyPreference, modeFilter, departureTime);

      // Expand search UI if not already
      if (!uiState.hasSearched && uiState.mode === 'collapsed') {
        expandSearchUI(destinationValue);
        uiState.hasSearched = true;
      }

      // Draw primary route on map
      const primaryRoute = comparisonResults[0];
      if (primaryRoute) drawRoute(primaryRoute);

      // Render route options in sidebar
      routeDetails.innerHTML = `
        <h2>Route Options</h2>
        <div class="route-options">
          ${comparisonResults.map((route, index) => `
            <div class="route-option ${index === 0 ? 'selected' : ''}" data-index="${index}">
              <div class="option-header">
                <span class="option-label">${route.label}</span>
                <span class="option-time">${route.formattedDuration}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div id="active-route-details">
          ${renderRouteDetails(primaryRoute)}
        </div>
      `;

      // Add click handlers for route options
      const options = routeDetails.querySelectorAll('.route-option');
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          options.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          const idx = opt.dataset.index;
          const selectedRoute = comparisonResults[idx];
          drawRoute(selectedRoute);
          document.getElementById('active-route-details').innerHTML = renderRouteDetails(selectedRoute);
        });
      });

      // Show results sidebar
      showResultsSidebar();

    } catch (error) {
      console.error("[UI Error]", error);
      alert('Error finding route: ' + error.message);
    } finally {
      findRouteBtn.textContent = 'Find Route';
      findRouteBtn.disabled = false;
    }
  }

  // --- UI State Management ---

  function expandSearchUI(destinationValue) {
    uiState.mode = 'expanded';

    searchCollapsed.classList.add('hidden');
    searchExpanded.classList.remove('hidden');

    if (uiState.isUsingGeolocation && uiState.startLocation) {
      startInput.value = 'Your Location';
      startInput.classList.add('using-geolocation');
    } else {
      startInput.value = '';
      startInput.classList.remove('using-geolocation');
    }

    endInputExpanded.value = destinationValue;
  }

  // --- Helper Functions ---

  const formatDuration = (seconds) => {
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;
    const hr = Math.floor(min / 60);
    const m = min % 60;
    return `${hr} hr ${m} min`;
  };

  function renderRouteDetails(routeData) {
    if (!routeData) return '';

    const getInstruction = (leg) => {
      if (leg.mode === 'transit') return `Take ${leg.line} Line to ${leg.to.name}`;
      if (leg.mode === 'bike') return `Bike to ${leg.to.name || 'Destination'}`;
      if (leg.mode === 'walk') return `Walk to ${leg.to.name || 'Destination'}`;
      if (leg.mode === 'transit_bus') return `Take Bus (or Walk) to ${leg.to.name || 'Destination'}`;
      if (leg.mode === 'driving') return `Drive to Destination`;
      return `${leg.mode.toUpperCase()}`;
    };

    const getSafetyClass = (score) => {
      if (score >= 70) return 'safety-good';
      if (score >= 40) return 'safety-moderate';
      return 'safety-poor';
    };

    const getSafetyLabel = (score) => {
      if (score >= 70) return 'Safe';
      if (score >= 40) return 'Moderate';
      return 'Caution';
    };

    const formatWaitTime = (seconds) => {
      const minutes = Math.round(seconds / 60);
      if (minutes < 1) return 'arriving';
      return `~${minutes} min wait`;
    };

    return `
      <div class="legs mt-4">
        ${routeData.legs.map((leg) => `
          <div class="leg-item">
            <span class="mode-icon">${getModeIcon(leg.mode)}</span>
            <div class="leg-info">
              <span class="leg-mode">${getInstruction(leg)}</span>
              <span class="leg-details">${leg.distance.toFixed(1)} km • ${formatDuration(leg.duration)}${
                leg.waitTime && leg.mode === 'transit'
                  ? ` <span class="leg-wait">(${formatWaitTime(leg.waitTime)})</span>`
                  : ''
              }${
                leg.safety && leg.mode === 'bike'
                  ? ` <span class="leg-safety ${getSafetyClass(leg.safety.score)}">${getSafetyLabel(leg.safety.score)}</span>`
                  : ''
              }</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  function getModeIcon(mode) {
    if (mode === 'bike') return '🚲';
    if (mode === 'transit') return '🚆';
    if (mode === 'driving') return '🚗';
    if (mode === 'transit_bus') return '🚌';
    if (mode === 'walk') return '🚶';
    return '📍';
  }
}
