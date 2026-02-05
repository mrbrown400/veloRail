import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      // Proxy Swiftly API requests to avoid CORS
      '/api/swiftly': {
        target: 'https://api.goswift.ly',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/swiftly/, ''),
        headers: {
          'Origin': 'https://api.goswift.ly'
        }
      },
      // Proxy Metrolink API requests to avoid CORS
      '/api/metrolink': {
        target: 'https://metrolink-gtfsrt.gbsdigital.us',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/metrolink/, ''),
        headers: {
          'Origin': 'https://metrolink-gtfsrt.gbsdigital.us'
        }
      }
    }
  }
});
