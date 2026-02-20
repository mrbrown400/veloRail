import { useEffect } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { MapContainer } from './components/Map/MapContainer';
import { SearchCard } from './components/Search/SearchCard';
import { ResultsSidebar } from './components/Results/ResultsSidebar';
import { useUIStore } from './stores';
import { CONFIG } from './services/config';
import { initGooglePlaces } from './services/geocoding';

const libraries: ('places' | 'geometry')[] = ['places', 'geometry'];

function App() {
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
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          padding: '20px',
          textAlign: 'center',
          background: '#f8f9fa'
        }}>
          <div>
            <h2 style={{ color: '#d93025', marginBottom: '16px' }}>
              Error Loading Google Maps
            </h2>
            <p style={{ color: '#5f6368' }}>
              Please check your API key configuration.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="app-container">
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          background: '#f8f9fa'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ marginBottom: '16px' }} />
            <p style={{ color: '#5f6368' }}>Loading VeloRail...</p>
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
