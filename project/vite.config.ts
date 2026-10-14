import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';



// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
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
