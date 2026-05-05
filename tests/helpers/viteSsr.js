import { createServer } from 'vite';
import path from 'node:path';

let viteServer;

export async function loadAppModule(modulePath) {
  if (!viteServer) {
    viteServer = await createServer({
      appType: 'custom',
      configFile: false,
      logLevel: 'error',
      optimizeDeps: {
        entries: []
      },
      resolve: {
        alias: {
          '@': path.resolve('src')
        }
      },
      server: {
        hmr: false,
        middlewareMode: true,
        ws: false
      }
    });
  }

  return viteServer.ssrLoadModule(modulePath);
}

export async function closeAppModuleLoader() {
  if (viteServer) {
    await viteServer.close();
    viteServer = undefined;
  }
}
