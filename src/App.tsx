import { useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { MapContainer } from './components/Map/MapContainer';
import { SearchCard } from './components/Search/SearchCard';
import { ResultsSidebar } from './components/Results/ResultsSidebar';
import { useUIStore } from './stores';
import { CONFIG } from './services/config';
import { initGooglePlaces } from './services/geocoding';
import { useRouteResultsBrowserTestSeam } from './testSeams/useRouteResultsBrowserTestSeam';

const libraries: ('places' | 'geometry' | 'routes')[] = ['places', 'geometry', 'routes'];

function App() {
  useRouteResultsBrowserTestSeam();

  const { sidebarOpen } = useUIStore();

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: CONFIG.GOOGLE_MAPS_API_KEY,
    libraries,
  });

  useEffect(() => {
    if (isLoaded && typeof google !== 'undefined') {
      // Initialize places after map loads - will be done in MapContainer
      console.log('Google Maps API loaded');
    }
  }, [isLoaded]);

  if (loadError) {
    return (
      <div className="app-container">
        <div className="app-state">
          <div role="alert">
            <h2 className="app-state-title app-state-title--error">
              Error Loading Google Maps
            </h2>
            <p className="app-state-copy">
              Please check your API key configuration. Route search controls are still available.
            </p>
          </div>
        </div>
        <SearchCard className={sidebarOpen ? 'sidebar-open' : ''} />
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="app-container">
        <div className="app-state">
          <div className="app-state-content" role="status" aria-live="polite">
            <div className="loading-spinner app-state-spinner" aria-hidden="true" />
            <p className="app-state-copy">Loading VeloRail...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <MapContainer onMapLoad={(map) => initGooglePlaces(map)} />
      <SearchCard className={sidebarOpen ? 'sidebar-open' : ''} />
      <ResultsSidebar />
    </div>
  );
}

export default App;
