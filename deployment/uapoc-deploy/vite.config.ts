import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';

/**
 * maplibre-gl v6 finds its web worker at `new URL('./maplibre-gl-worker.mjs',
 * import.meta.url)` — i.e. next to whichever script it was bundled into. The
 * dev server happens to serve that from node_modules, but a production build
 * never references the worker statically, so Rollup doesn't emit it and every
 * map's vector layers (building outlines, zones, markers) sit unloaded behind a
 * 404 on `/assets/maplibre-gl-worker.mjs`. The worker imports the shared chunk
 * by its plain name too, so both are emitted un-hashed alongside the bundle.
 */
const maplibreWorker = (): Plugin => ({
  name: 'emit-maplibre-worker',
  apply: 'build',
  generateBundle() {
    for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs']) {
      this.emitFile({
        type: 'asset',
        fileName: `assets/${file}`,
        source: readFileSync(new URL(`./node_modules/maplibre-gl/dist/${file}`, import.meta.url)),
      });
    }
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), maplibreWorker()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
  optimizeDeps: {
    // maplibre-gl v6 ships its worker as a separate ESM chunk that imports a
    // shared module. Vite's dep pre-bundling rewrites the two independently,
    // the worker loses the link, and every vector/GeoJSON source then sits
    // unloaded forever with no error raised — raster still draws, which is
    // what made it look like a styling problem rather than a bundling one.
    exclude: ['lucide-react', 'maplibre-gl'],
  },
  build: {
    sourcemap: false,
  },
});
