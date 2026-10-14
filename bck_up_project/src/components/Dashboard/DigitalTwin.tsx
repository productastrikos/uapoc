import React from 'react';
import { Monitor, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../../hooks/useLanguage';

const DigitalTwin: React.FC = () => {
  const { t } = useLanguage();
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-8 ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}
    >
      <div className="gradient-mesh-1 rounded-xl p-6 border border-primary-600 hover:border-accent-teal transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Monitor className="h-6 w-6 text-accent-teal" />
            <h3 className="text-xl font-semibold text-text-primary">{t('digital_twin.title')}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={toggleFullscreen}
              className="p-2 hover:bg-primary-600 rounded-lg transition-colors group"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize2 className="h-5 w-5 text-text-muted group-hover:text-text-primary" />
              ) : (
                <Maximize2 className="h-5 w-5 text-text-muted group-hover:text-text-primary" />
              )}
            </button>
            <button className="p-2 hover:bg-primary-600 rounded-lg transition-colors group">
              <RotateCcw className="h-5 w-5 text-text-muted group-hover:text-text-primary" />
            </button>
          </div>
        </div>
        
        <div
          className="sketchfab-embed-wrapper relative rounded-lg overflow-hidden border border-primary-500"
          style={{ height: isFullscreen ? 'calc(100vh - 140px)' : '400px' }}
        >
          <iframe
            title=" Airport Digital Twin"
            frameBorder="0"
            allowFullScreen
            allow="autoplay; fullscreen; xr-spatial-tracking; accelerometer; gyroscope; magnetometer; web-share"
            src="https://sketchfab.com/models/7e3435798e0849fba914441f3a02a47b/embed?autostart=1&preload=1&ui_hint=0&ui_infos=0&ui_watermark=0&ui_watermark_link=0&ui_help=0&ui_settings=0&ui_related=0&ui_ar=0&ui_vr=0&ui_inspector=0&ui_annotations=0&ui_controls=0&ui_stop=0&transparent=0&dnt=1"
            className="w-full h-full"
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
            <div className="w-2 h-2 rounded-full bg-status-success animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary">
              Live 3D Model
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-status-success rounded-full animate-pulse"></div>
              <span className="text-text-muted">Real-time synchronization active</span>
            </div>
            <div className="text-text-muted">Last updated: {new Date().toLocaleTimeString()}</div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-text-muted"></span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DigitalTwin;