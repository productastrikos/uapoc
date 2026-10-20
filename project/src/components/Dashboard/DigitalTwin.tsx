import React from 'react';
import { Monitor, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';

const DigitalTwin: React.FC = () => {
  const { t } = useLanguage();
  const [isFullscreen, setIsFullscreen] = React.useState(false);
  // The Sketchfab embed streams its model progressively — a half-loaded
  // frame reads as broken, not "loading", so a solid cover stays up until
  // the iframe has actually finished its own document load.
  const [loaded, setLoaded] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // The dashboard hero tile and this component used to each render their own
  // "Digital Twin" header — this is now the only one, sized to fill whatever
  // height its parent gives it instead of a fixed 400px that left dead space
  // in the taller bento cell.
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`h-full flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
    >
      <div className="h-full flex flex-col bg-primary-800 rounded-xl p-4 border border-primary-600">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center space-x-2">
            <Monitor className="h-5 w-5 text-accent-blue" />
            <h3 className="text-base font-semibold text-text-primary">{t('digital_twin.title')}</h3>
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 hover:bg-primary-600 rounded-lg transition-colors group"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4 text-text-muted group-hover:text-text-primary" />
              ) : (
                <Maximize2 className="h-4 w-4 text-text-muted group-hover:text-text-primary" />
              )}
            </button>
            <button className="p-1.5 hover:bg-primary-600 rounded-lg transition-colors group">
              <RotateCcw className="h-4 w-4 text-text-muted group-hover:text-text-primary" />
            </button>
          </div>
        </div>

        <div
          className="sketchfab-embed-wrapper relative rounded-lg overflow-hidden border border-primary-500 flex-1 min-h-0"
        >
          <iframe
            title=" Airport Digital Twin"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; web-share"
            src="https://sketchfab.com/models/7e3435798e0849fba914441f3a02a47b/embed?autostart=1&preload=1&ui_hint=0&ui_infos=0&ui_watermark=0&ui_watermark_link=0&ui_help=0&ui_settings=0&ui_related=0&ui_ar=0&ui_vr=0&ui_inspector=0&ui_annotations=0&ui_controls=0&ui_stop=0&transparent=0&dnt=1"
            className="w-full h-full"
            onLoad={() => {
              // The iframe firing `load` only means its own document is
              // ready, not that the model has streamed in — a short extra
              // hold lets the first frames of actual geometry arrive before
              // the cover lifts.
              window.setTimeout(() => setLoaded(true), 1200);
            }}
          />

          {/* --------------------------------------------------------------
            * Embed chrome mask.
            * The Sketchfab player paints its model title / author byline along
            * the top edge and a watermark + help affordances along the bottom.
            * The ui_* query flags above suppress most of it, but several are
            * Pro-account-gated and still render, so these panels sit on top to
            * keep the viewport reading as a native digital twin rather than a
            * third-party embed. They intentionally capture pointer events so
            * the underlying "view on Sketchfab" links cannot be clicked; the
            * middle of the canvas stays free for orbit / pan / zoom.
            * ------------------------------------------------------------- */}
          {/* Solid bars cover the chrome outright; a short gradient below each
              one blends the seam back into the rendered scene. */}
          <div className="absolute inset-x-0 top-0 h-12 z-10 bg-primary-800" aria-hidden="true" />
          <div
            className="absolute inset-x-0 top-12 h-8 z-10 bg-gradient-to-b from-primary-800 to-transparent"
            aria-hidden="true"
          />
          <div className="absolute inset-x-0 bottom-0 h-10 z-10 bg-primary-800" aria-hidden="true" />
          <div
            className="absolute inset-x-0 bottom-10 h-7 z-10 bg-gradient-to-t from-primary-800 to-transparent"
            aria-hidden="true"
          />

          {/* Native-looking overlay label in place of the embed's own title */}
          <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 pointer-events-none">
            <div className="w-2 h-2 rounded-full bg-status-neutral animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Live 3D Model
            </span>
          </div>

          {/* Loading cover — solid, not a skeleton over visible content,
              since what it's hiding is a half-streamed, visibly-broken-looking
              model rather than empty space. */}
          {!loaded && (
            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-3 bg-primary-800">
              <div className="w-8 h-8 border-2 border-accent-blue/30 border-t-accent-blue rounded-full animate-spin" />
              <span className="text-xs text-text-muted uppercase tracking-widest">Loading 3D model…</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-status-neutral rounded-full animate-pulse"></div>
              <span className="text-text-muted">Real-time synchronization active</span>
            </div>
          </div>
          <div className="text-text-muted">Last updated: {new Date().toLocaleTimeString()}</div>
        </div>
      </div>
    </motion.div>
  );
};

export default DigitalTwin;
