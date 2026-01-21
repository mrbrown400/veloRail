// UI event listeners and DOM manipulation
import { compareRoutes } from './routing.js';
import { drawRoute } from './map.js';

export function setupUI() {
  const findRouteBtn = document.getElementById('find-route-btn');
  const startInput = document.getElementById('start');
  const endInput = document.getElementById('end');
  const routeDetails = document.getElementById('route-details');
  const safetySelect = document.getElementById('bike-safety');
  const modeSelect = document.getElementById('travel-mode');

  const formatDuration = (seconds) => {
    const min = Math.round(seconds / 60);
    if (min < 60) return `${min} min`;
    const hr = Math.floor(min / 60);
    const m = min % 60;
    return `${hr} hr ${m} min`;
  };

  findRouteBtn.addEventListener('click', async () => {
    const start = startInput.value;
    const end = endInput.value;

    if (!start || !end) {
      alert('Please enter both start and destination.');
      return;
    }

    findRouteBtn.textContent = 'Calculating...';
    findRouteBtn.disabled = true;
    routeDetails.classList.add('hidden');

    try {
      const safetyPreference = safetySelect ? safetySelect.value : 'balanced';
      const modeFilter = modeSelect ? modeSelect.value : 'all';
      const comparisonResults = await compareRoutes(start, end, safetyPreference, modeFilter);

      // Default to the first result (Bike + Metro) for map
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
  });

  // Helper to render leg details for the active route
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
    if (mode === 'walk') return '🚶'; // walking emoji
    return '📍';
  }
}
