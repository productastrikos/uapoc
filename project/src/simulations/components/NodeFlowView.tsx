import React, { useEffect, useState } from 'react';
import { NodeFlowData } from '../types';
import { Activity, ArrowRight, Zap } from 'lucide-react';

interface NodeFlowViewProps {
  nodeFlow: NodeFlowData;
  subsystemName: string;
}

const NodeFlowView: React.FC<NodeFlowViewProps> = ({ nodeFlow, subsystemName }) => {
  const [animatedEdges, setAnimatedEdges] = useState<Set<string>>(new Set());
  const [pulseNodes, setPulseNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly animate edges
      const randomEdge = nodeFlow.edges[Math.floor(Math.random() * nodeFlow.edges.length)];
      if (randomEdge) {
        setAnimatedEdges(prev => new Set(prev).add(randomEdge.id));
        setPulseNodes(prev => new Set(prev).add(randomEdge.source).add(randomEdge.target));
        
        setTimeout(() => {
          setAnimatedEdges(prev => {
            const newSet = new Set(prev);
            newSet.delete(randomEdge.id);
            return newSet;
          });
          setPulseNodes(prev => {
            const newSet = new Set(prev);
            newSet.delete(randomEdge.source);
            newSet.delete(randomEdge.target);
            return newSet;
          });
        }, 2000);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [nodeFlow.edges]);

  const getNodeColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 border-emerald-600';
      case 'idle': return 'bg-sim-400 border-sim-500';
      case 'error': return 'bg-red-500 border-red-600';
      default: return 'bg-simteal-500 border-simteal-600';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'command': return 'text-simteal-500';
      case 'ack': return 'text-simgold-500';
      case 'data': return 'text-emerald-500';
      default: return 'text-sim-500';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-sim-200">
      <div className="p-6 border-b border-sim-200">
        <div className="flex items-center space-x-3">
          <Activity className="w-6 h-6 text-simteal-600" />
          <div>
            <h3 className="text-lg font-semibold text-sim-900">Node Flow Diagram</h3>
            <p className="text-sim-600">{subsystemName} - Real-time signal flow</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="relative bg-sim-50 rounded-lg p-8 min-h-96">
          {/* Nodes */}
          {nodeFlow.nodes.map(node => (
            <div
              key={node.id}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${
                pulseNodes.has(node.id) ? 'animate-pulse' : ''
              }`}
              style={{
                left: `${node.position.x}px`,
                top: `${node.position.y}px`
              }}
            >
              <div className={`w-20 h-20 rounded-xl border-2 flex flex-col items-center justify-center text-white font-medium text-sm transition-all duration-300 ${getNodeColor(node.data.status)}`}>
                <div className="text-center">
                  <div>{node.data.label}</div>
                  <div className="text-xs opacity-75 capitalize">{node.data.status}</div>
                </div>
              </div>
            </div>
          ))}

          {/* Edges */}
          {nodeFlow.edges.map(edge => {
            const sourceNode = nodeFlow.nodes.find(n => n.id === edge.source);
            const targetNode = nodeFlow.nodes.find(n => n.id === edge.target);
            
            if (!sourceNode || !targetNode) return null;

            const isAnimated = animatedEdges.has(edge.id);
            
            return (
              <div key={edge.id}>
                {/* Connection Line */}
                <svg
                  className="absolute inset-0 pointer-events-none"
                  style={{ zIndex: 1 }}
                >
                  <defs>
                    <marker
                      id={`arrowhead-${edge.id}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={isAnimated ? '#01A3A4' : '#8A9BA8'}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={sourceNode.position.x}
                    y1={sourceNode.position.y}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y}
                    stroke={isAnimated ? '#01A3A4' : '#8A9BA8'}
                    strokeWidth={isAnimated ? '3' : '2'}
                    markerEnd={`url(#arrowhead-${edge.id})`}
                    className={isAnimated ? 'animate-pulse' : ''}
                  />
                </svg>

                {/* Signal Indicator */}
                {isAnimated && edge.data && (
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
                    style={{
                      left: `${(sourceNode.position.x + targetNode.position.x) / 2}px`,
                      top: `${(sourceNode.position.y + targetNode.position.y) / 2}px`
                    }}
                  >
                    <div className={`flex items-center space-x-1 px-2 py-1 bg-white rounded-full shadow-lg border ${getSignalColor(edge.data.signal)}`}>
                      {edge.data.signal === 'command' && <ArrowRight className="w-3 h-3" />}
                      {edge.data.signal === 'ack' && <Zap className="w-3 h-3" />}
                      {edge.data.signal === 'data' && <Activity className="w-3 h-3" />}
                      <span className="text-xs font-medium capitalize">{edge.data.signal}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center space-x-8">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-simteal-500 rounded"></div>
            <span className="text-sm text-sim-600">Command Signal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-simgold-500 rounded"></div>
            <span className="text-sm text-sim-600">Acknowledgment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-emerald-500 rounded"></div>
            <span className="text-sm text-sim-600">Data Flow</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeFlowView;