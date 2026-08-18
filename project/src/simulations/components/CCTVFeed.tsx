import React, { useState, useEffect } from 'react';
import { Camera, Monitor, ZoomIn, ZoomOut, RotateCcw, AlertTriangle, Grid3X3, Grid2X2, Volume2, VolumeX } from 'lucide-react';

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
    <div className="bg-sim-800/90 backdrop-blur-lg rounded-xl border border-simteal-400/30 p-3 shadow-2xl w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Monitor className="w-5 h-5 md:w-6 md:h-6 text-simteal-400" />
          <div>
            <h3 className="text-base md:text-lg font-semibold text-simteal-100">CCTV Surveillance</h3>
            <p className="text-xs md:text-sm text-simteal-200/70">Live security monitoring</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${feeds[activeFeed]?.alert ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span className="text-xs text-simteal-300">{feeds[activeFeed]?.alert ? 'ALERT' : 'NORMAL'}</span>
        </div>
      </div>

      {/* Grid View Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setGridView('2x2')}
            className={`p-2 rounded-lg border transition-colors ${
              gridView === '2x2' 
                ? 'border-simteal-400 bg-simteal-950/30 text-simteal-400' 
                : 'border-sim-600 text-sim-400 hover:border-simteal-400/50'
            }`}
          >
            <Grid2X2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setGridView('3x3')}
            className={`p-2 rounded-lg border transition-colors ${
              gridView === '3x3' 
                ? 'border-simteal-400 bg-simteal-950/30 text-simteal-400' 
                : 'border-sim-600 text-sim-400 hover:border-simteal-400/50'
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 bg-sim-700/50 hover:bg-sim-600/50 rounded-lg border border-simteal-400/30 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-simteal-300" /> : <Volume2 className="w-4 h-4 text-simteal-300" />}
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
            className={`relative aspect-video bg-sim-900 rounded border-2 transition-all duration-200 overflow-hidden ${
              index === activeFeed
                ? 'border-simteal-400 shadow-simteal-400/30 shadow-lg'
                : 'border-sim-600/50 hover:border-simteal-400/50'
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
              <div className="absolute top-1 left-1 text-xs text-simteal-300 font-mono">
                CAM {feed.id}
              </div>
              <div className="absolute bottom-1 right-1 flex items-center space-x-1">
                <Camera className="w-3 h-3 text-simteal-400" />
                <div className={`w-1.5 h-1.5 rounded-full ${
                  feed.status === 'active' ? (feed.alert ? 'bg-red-500 animate-pulse' : 'bg-green-500') : 'bg-simgold-500'
                }`}></div>
              </div>
              
              {/* Alert overlay for unattended bag */}
              {feed.alert && (
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2" style={{ zIndex: 5 }}>
                  <div className={`flex items-center space-x-1 bg-red-500/90 text-white px-2 py-1 rounded text-xs ${alertMode ? 'animate-pulse' : ''}`}>
                    <AlertTriangle className="w-3 h-3" />
                    <span className="font-semibold">BAG ALERT</span>
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1" style={{ zIndex: 5 }}>
              <p className="text-xs text-simteal-300 truncate">{feed.location}</p>
            </div>
            </div>
          </button>
        ))}
      </div>

      {/* Status Panel */}
      <div className="mt-3 bg-sim-900/50 rounded-lg p-2 border border-simteal-400/20 flex-shrink-0">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-simteal-200">System Status</span>
          <span className="text-xs text-green-400">OPERATIONAL</span>
        </div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-simteal-300 font-semibold">{feeds.filter(f => f.status === 'active').length}/{feeds.length}</div>
            <div className="text-simteal-200/70">Cameras Online</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 font-semibold">{feeds.filter(f => f.alert).length}</div>
            <div className="text-simteal-200/70">Active Alerts</div>
          </div>
          <div className="text-center">
            <div className="text-simteal-300 font-semibold">98.5%</div>
            <div className="text-simteal-200/70">Coverage</div>
          </div>
        </div>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-6xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <h3 className="text-xl font-bold text-white">{feeds[activeFeed]?.location}</h3>
                <div className={`w-3 h-3 rounded-full ${feeds[activeFeed]?.alert ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
              </div>
              <button
                onClick={() => setIsFullscreen(false)}
                className="text-white hover:text-red-400 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="aspect-video bg-sim-900 rounded-lg overflow-hidden relative">
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