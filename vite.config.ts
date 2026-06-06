import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const routeServiceChunkModules = [
  '/src/services/bikeDurationService.ts',
  '/src/services/bikeRailScoring.ts',
  '/src/services/elevationService.ts',
  '/src/services/freightCorridorSuitability.ts',
  '/src/services/freightPassengerConversion.ts',
  '/src/services/freightRouteCandidates.ts',
  '/src/services/googleRoutesService.ts',
  '/src/services/multimodalRouter.ts',
  '/src/services/populationDensityScoring.ts',
  '/src/services/routing.ts',
  '/src/services/routingComparison.ts',
  '/src/services/smartStationSelector.ts',
  '/src/services/stationDataProvider.ts',
];

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/node_modules/')) {
            if (
              id.includes('/node_modules/react/')
              || id.includes('/node_modules/react-dom/')
              || id.includes('/node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }

            if (
              id.includes('/node_modules/@react-google-maps/')
              || id.includes('/node_modules/@googlemaps/')
            ) {
              return 'maps-vendor';
            }

            if (
              id.includes('/node_modules/@tanstack/')
              || id.includes('/node_modules/zustand/')
            ) {
              return 'state-vendor';
            }

            return 'vendor';
          }

          if (id.includes('/src/data/')) {
            return 'planning-data';
          }

          if (routeServiceChunkModules.some((modulePath) => id.includes(modulePath))) {
            return 'routing-services';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
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
