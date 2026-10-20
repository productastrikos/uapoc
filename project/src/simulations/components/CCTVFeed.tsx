import React, { useState, useEffect } from 'react';
import { Camera, Monitor, AlertTriangle, Grid3X3, Grid2X2, Volume2, VolumeX } from 'lucide-react';

const CCTVFeed: React.FC = () => {
  const [activeFeed, setActiveFeed] = useState(0);
  const [alertMode, setAlertMode] = useState(false);
  const [gridView, setGridView] = useState<'2x2' | '3x3'>('2x2');
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const feeds = [
    {
      id: 1,
      location: 'Gate 13 - Entrance',
      status: 'active',
      alert: true,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/oMWSm7azoCk?si=AUSw4Z9ogEXvK4IB&controls=0&autoplay=1&mute=1&t=1&loop=1&start=2&playlist=oMWSm7azoCk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(1);"></iframe>'
    },
    {
      id: 2,
      location: 'Security Checkpoint A',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/K6qxmXyjWxg?si=dEtedeT-Y3UpvuLE&controls=0&autoplay=1&mute=1&t=1&loop=1&playlist=K6qxmXyjWxg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(1);"></iframe>'


    },
    {
      id: 3,
      location: 'Baggage Claim Area',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/oMWSm7azoCk?si=AUSw4Z9ogEXvK4IB&controls=0&autoplay=1&mute=1&t=1&loop=1&start=2&playlist=oMWSm7azoCk" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(-1);"></iframe>'
    },
    {
      id: 4,
      location: 'Terminal Main Hall',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/bp8lzWiMo18?si=VNNcXNluLuVrGXu1&controls=0&autoplay=1&mute=1&t=1&loop=1&playlist=bp8lzWiMo18" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(1);"></iframe>'
    },
    {
      id: 5,
      location: 'Restricted Access Zone',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/_4w9jFDV3Do?si=DHnLwv4qkUNvcXz3&controls=0&autoplay=1&mute=1&t=182&loop=1&start=190&playlist=_4w9jFDV3Do" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(1);"></iframe>'

    },
    {
      id: 6,
      location: 'Emergency Exit Corridor',
      status: 'maintenance',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/bp8lzWiMo18?si=VNNcXNluLuVrGXu1&controls=0&autoplay=1&mute=1&t=1&loop=1&playlist=bp8lzWiMo18" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(-1);"></iframe>'
    },
    {
      id: 7,
      location: 'Arrival Gate B12',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/_4w9jFDV3Do?si=DHnLwv4qkUNvcXz3&controls=0&autoplay=1&mute=1&t=182&loop=1&start=171&playlist=_4w9jFDV3Do;" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(-1);"></iframe>'
    },
    {
      id: 8,
      location: 'Departure Lounge',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/K6qxmXyjWxg?si=dEtedeT-Y3UpvuLE&controls=0&autoplay=1&mute=1&t=1&loop=1&start=-200&playlist=K6qxmXyjWxg" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(-1.2);"></iframe>'
    },
    {
      id: 9,
      location: 'Customs Control',
      status: 'active',
      alert: false,
      embedCode: '<iframe width="100%" height="100%" src="https://www.youtube.com/embed/_4w9jFDV3Do?si=DHnLwv4qkUNvcXz3&controls=0&autoplay=1&mute=1&t=182&loop=1&start=182&playlist=_4w9jFDV3Do;" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen style="transform: scaleX(1);"></iframe>'
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setAlertMode(prev => !prev);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getGridCols = () => {
    return gridView === '2x2' ? 'grid-cols-2' : 'grid-cols-3';
  };

  const getGridSpacing = () => {
    return gridView === '2x2' ? 'gap-2' : 'gap-1';
  };

  return (
    <div className="bg-primary-800/60 backdrop-blur-lg rounded-xl border border-primary-600/40 p-2.5 shadow-2xl w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Monitor className="w-5 h-5 md:w-6 md:h-6 text-accent-blue" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-text-primary">CCTV Surveillance</h3>
            <p className="text-xs md:text-sm text-text-muted">Live security monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${feeds[activeFeed]?.alert ? 'bg-status-error animate-pulse' : 'bg-status-success'}`}></div>
          <span className={`text-xs ${feeds[activeFeed]?.alert ? 'text-status-error' : 'text-status-success'}`}>{feeds[activeFeed]?.alert ? 'ALERT' : 'NORMAL'}</span>
        </div>
      </div>

      {/* Grid View Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGridView('2x2')}
            className={`p-2 rounded-lg border transition-colors ${
              gridView === '2x2'
                ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                : 'border-primary-600/40 text-text-muted hover:border-accent-blue/50'
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridView('3x3')}
            className={`p-2 rounded-lg border transition-colors ${
              gridView === '3x3'
                ? 'border-accent-blue bg-accent-blue/10 text-accent-blue'
                : 'border-primary-600/40 text-text-muted hover:border-accent-blue/50'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-primary-700/50 hover:bg-primary-600/50 rounded-lg border border-primary-600/40 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-text-secondary" /> : <Volume2 className="w-4 h-4 text-text-secondary" />}
          </button>
        </div>
      </div>

      {/* Camera Grid */}
      <div className={`grid ${getGridCols()} ${getGridSpacing()} flex-1 h-full`}>
        {feeds.slice(0, gridView === '2x2' ? 4 : 9).map((feed, index) => (
          <button
            key={feed.id}
            onClick={() => {
              setActiveFeed(index);
              setIsFullscreen(false);
            }}
            className={`relative aspect-video bg-primary-900 rounded border-2 transition-all duration-200 overflow-hidden ${
              index === activeFeed
                ? 'border-accent-blue shadow-accent-blue/30 shadow-lg'
                : 'border-primary-600/40 hover:border-accent-blue/50'
            }`}
          >
            {/* Video embed - Make strictly visible */}
            <div className="w-full h-full relative z-50" style={{ position: 'absolute', inset: 0 }}>
              <div
                className="w-full h-full"
                style={{ position: 'relative', zIndex: 100 }}
                dangerouslySetInnerHTML={{
                  __html: feed.embedCode
                }}
              />
            </div>

            {/* Minimal overlay - only on corners */}
            <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
              <div className="absolute top-1 left-1 bg-primary-900/80 px-1 rounded text-xs text-text-secondary font-mono">
                CAM {feed.id}
              </div>
              <div className="absolute bottom-1 right-1 flex items-center space-x-1">
                <Camera className="w-3 h-3 text-accent-blue" />
                <div className={`w-1.5 h-1.5 rounded-full ${
                  feed.status === 'active' ? (feed.alert ? 'bg-status-error animate-pulse' : 'bg-status-success') : 'bg-status-warning'
                }`}></div>
              </div>

              {/* Alert overlay for unattended bag */}
              {feed.alert && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" style={{ zIndex: 5 }}>
                  <div className={`flex items-center space-x-1 bg-status-error/90 text-white px-2 py-1 rounded text-xs ${alertMode ? 'animate-pulse' : ''}`}>
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-semibold">BAG ALERT</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-primary-900/80 p-1" style={{ zIndex: 5 }}>
              <p className="text-xs text-text-secondary truncate">{feed.location}</p>
            </div>
            </div>
          </button>
        ))}
      </div>

      {/* Status Panel */}
      <div className="mt-3 bg-primary-900/50 rounded-lg p-2 border border-primary-600/40 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-text-secondary">System Status</span>
          <span className="text-xs text-status-success">OPERATIONAL</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-accent-blue font-semibold">{feeds.filter(f => f.status === 'active').length}/{feeds.length}</div>
            <div className="text-text-muted">Cameras Online</div>
          </div>
          <div className="text-center">
            <div className="text-status-error font-semibold">{feeds.filter(f => f.alert).length}</div>
            <div className="text-text-muted">Active Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-accent-blue font-semibold">98.5%</div>
            <div className="text-text-muted">Coverage</div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-3">
          <div className="w-full max-w-6xl">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <h3 className="text-xl font-bold text-text-primary">{feeds[activeFeed]?.location}</h3>
                <div className={`w-3 h-3 rounded-full ${feeds[activeFeed]?.alert ? 'bg-status-error animate-pulse' : 'bg-status-success'}`}></div>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-text-primary hover:text-status-error text-2xl transition-colors"
              >
                ×
              </button>
            </div>
            <div className="aspect-video bg-primary-900 rounded-lg overflow-hidden relative">
              <div
                className="w-full h-full absolute inset-0"
                dangerouslySetInnerHTML={{
                  __html: feeds[activeFeed]?.embedCode || ''
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CCTVFeed;
