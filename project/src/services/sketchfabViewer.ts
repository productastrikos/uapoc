/**
 * Loads the Sketchfab Viewer API script once, however many embeds on the
 * page need it. https://sketchfab.com/developers/viewer — `new Sketchfab(iframe)`
 * is only available once this script has run, and it defines a single
 * global, so a second `<script>` tag for a second embed would just re-run
 * the same definition — this makes every caller share one load.
 */

declare global {
  interface Window {
    Sketchfab: new (iframe: HTMLIFrameElement) => {
      init: (
        uid: string,
        options: {
          success: (api: SketchfabApi) => void;
          error?: () => void;
          [key: string]: unknown;
        }
      ) => void;
    };
  }
}

export interface SketchfabCanvasCoord {
  canvasCoord: [number, number];
  glCoord: [number, number];
}

export interface SketchfabApi {
  start: () => void;
  addEventListener: (event: string, handler: (...args: unknown[]) => void) => void;
  getWorldToScreenCoordinates: (
    worldCoord: [number, number, number],
    callback: (coord: SketchfabCanvasCoord) => void
  ) => void;
}

const SCRIPT_URL = 'https://static.sketchfab.com/api/sketchfab-viewer-1.12.1.js';

let loadPromise: Promise<void> | null = null;

export function loadSketchfabScript(): Promise<void> {
  if (window.Sketchfab) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${SCRIPT_URL}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Sketchfab script failed to load')));
      return;
    }
    const script = document.createElement('script');
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Sketchfab script failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
