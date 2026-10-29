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
      case 'active': return 'bg-status-neutral border-status-neutral';
      case 'idle': return 'bg-primary-600 border-primary-600';
      case 'error': return 'bg-status-error border-status-error';
      default: return 'bg-accent-blue border-accent-blueHover';
    }
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'command': return 'text-accent-blue';
      case 'ack': return 'text-status-neutral';
      case 'data': return 'text-status-neutral';
      default: return 'text-text-muted';
    }
  };

  return (
    <div className="bg-primary-800/60 rounded-xl border border-primary-600/40">
      <div className="p-4 border-b border-primary-600/40">
        <div className="flex items-center space-x-2">
          <Activity className="w-6 h-6 text-accent-blue" />
          <div>
            <h3 className="text-lg font-semibold text-text-primary">Node Flow Diagram</h3>
            <p className="text-text-secondary">{subsystemName} - Real-time signal flow</p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="relative bg-primary-900/40 rounded-lg p-6 min-h-96">
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
              <div className={`w-16 h-16 rounded-xl border-2 flex flex-col items-center justify-center text-white font-medium text-sm transition-all duration-300 ${getNodeColor(node.data.status)}`}>
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
                        fill={isAnimated ? '#3B82F6' : '#8A9BA8'}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={sourceNode.position.x}
                    y1={sourceNode.position.y}
                    x2={targetNode.position.x}
                    y2={targetNode.position.y}
                    stroke={isAnimated ? '#3B82F6' : '#8A9BA8'}
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
                    <div className={`flex items-center space-x-1 px-2 py-1 bg-primary-800 rounded-full shadow-lg border border-primary-600/40 ${getSignalColor(edge.data.signal)}`}>
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
        <div className="mt-4 flex items-center justify-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-accent-blue rounded"></div>
            <span className="text-sm text-text-secondary">Command Signal</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-status-neutral rounded"></div>
            <span className="text-sm text-text-secondary">Acknowledgment</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-status-neutral rounded"></div>
            <span className="text-sm text-text-secondary">Data Flow</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeFlowView;
