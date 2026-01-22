// UI event listeners and DOM manipulation
import { compareRoutes } from './routing.js';
import { drawRoute } from './map.js';
import { requestGeolocation, getCurrentLocationState } from './geolocation.js';

// UI State
let uiState = {
  mode: 'collapsed',          // 'collapsed' | 'expanded'
  startLocation: null,        // Geolocation coords or null
  isUsingGeolocation: false,
  hasSearched: false
};

export function setupUI() {
  // DOM Elements - Collapsed state
  const searchCollapsed = document.getElementById('search-collapsed');
  const endInput = document.getElementById('end');
  const locationStatus = document.getElementById('location-status');

  // DOM Elements - Expanded state
  const searchExpanded = document.getElementById('search-expanded');
  const startInput = document.getElementById('start');
  const endInputExpanded = document.getElementById('end-expanded');
  const useLocationBtn = document.getElementById('use-location-btn');

  // DOM Elements - Shared
  const findRouteBtn = document.getElementById('find-route-btn');
  const routeDetails = document.getElementById('route-details');
  const safetySelect = document.getElementById('bike-safety');
  const modeSelect = document.getElementById('travel-mode');

  // Initialize geolocation on page load
  initGeolocation();

  // Event Listeners
  findRouteBtn.addEventListener('click', handleSearch);

  if (startInput) {
    startInput.addEventListener('input', handleStartInputChange);
  }

  if (useLocationBtn) {
    useLocationBtn.addEventListener('click', handleUseLocationClick);
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
        statusText.innerHTML = 'Location access denied. <button type="button" class="link-btn" id="enter-start-btn">Enter start location</button>';
        locationStatus.className = 'location-status warning';
        attachEnterStartHandler();
        break;
      case 'unavailable':
        statusIcon.textContent = '';
        statusText.innerHTML = 'Location unavailable. <button type="button" class="link-btn" id="enter-start-btn">Enter start location</button>';
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
      // Permission denied
      updateLocationStatus('denied');
    } else {
      // Position unavailable or timeout
      updateLocationStatus('unavailable');
    }
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

    // If user clears the field or changes from "Your Location"
    if (value !== 'Your Location') {
      uiState.isUsingGeolocation = false;
      uiState.startLocation = null;
      startInput.classList.remove('using-geolocation');
    }
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
      // In collapsed mode, we need geolocation or show error
      if (uiState.isUsingGeolocation && uiState.startLocation) {
        startValue = uiState.startLocation; // Pass coordinates directly
      } else {
        // No geolocation available, expand UI for manual entry
        expandSearchUI(destinationValue);
        alert('Please enter a starting location.');
        startInput.focus();
        return;
      }
    } else {
      // In expanded mode
      if (uiState.isUsingGeolocation && uiState.startLocation && startInput.value === 'Your Location') {
        startValue = uiState.startLocation; // Pass coordinates directly
      } else {
        startValue = startInput.value; // Pass string to be geocoded
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
    routeDetails.classList.add('hidden');

    try {
      const safetyPreference = safetySelect ? safetySelect.value : 'balanced';
      const modeFilter = modeSelect ? modeSelect.value : 'all';
      const comparisonResults = await compareRoutes(startValue, destinationValue, safetyPreference, modeFilter);

      // After first successful search, expand UI
      if (!uiState.hasSearched && uiState.mode === 'collapsed') {
        expandSearchUI(destinationValue);
        uiState.hasSearched = true;
      }

      // Default to the first result for map
      const primaryRoute = comparisonResults[0];
      if (primaryRoute) drawRoute(primaryRoute);

      // Update UI with comparison list
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

      // Add click handlers for switching routes
      const options = routeDetails.querySelectorAll('.route-option');
      options.forEach(opt => {
        opt.addEventListener('click', () => {
          // Visual selection
          options.forEach(o => o.classList.remove('selected'));
          opt.classList.add('selected');

          // Update Map & Details
          const idx = opt.dataset.index;
          const selectedRoute = comparisonResults[idx];
          drawRoute(selectedRoute);
          document.getElementById('active-route-details').innerHTML = renderRouteDetails(selectedRoute);
        });
      });

      routeDetails.classList.remove('hidden');

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

    // Hide collapsed, show expanded
    searchCollapsed.classList.add('hidden');
    searchExpanded.classList.remove('hidden');

    // Populate fields
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

    return `
            <div class="legs mt-4">
            ${routeData.legs.map((leg) => `
                <div class="leg-item">
                <span class="mode-icon">${getModeIcon(leg.mode)}</span>
                <div class="leg-info">
                    <span class="leg-mode">${getInstruction(leg)}</span>
                    <span class="leg-details">${leg.distance.toFixed(1)} km • ${formatDuration(leg.duration)}${
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
