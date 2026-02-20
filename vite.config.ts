import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
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
