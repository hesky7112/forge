import React, { useState, useMemo } from 'react';
import {
  Network,
  Search,
  Sliders,
  Flame,
  Layers,
  Info,
  Maximize2,
  RefreshCw,
  ExternalLink,
  Code2,
} from 'lucide-react';
import { GraphNode, GraphEdge } from '../../types';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Drawer } from '../common/Drawer';
import { Input } from '../common/Input';
import { useToast } from '../common/Toast';
import { useTheme } from '../../context/ThemeContext';

interface KnowledgeGraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNavigateToSource?: (file: string, line: number) => void;
}

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({ nodes, edges, onNavigateToSource }) => {
  const { addToast } = useToast();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [minPageRank, setMinPageRank] = useState(0.5);
  const [isBlastRadiusOverlay, setIsBlastRadiusOverlay] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedCluster, setSelectedCluster] = useState<string>('all');

  const clusters = [
    { name: 'Auth & Crypto', color: '#388bfd' },
    { name: 'Routing & API', color: '#a371f7' },
    { name: 'Storage & S3', color: '#3fb950' },
    { name: 'UI & Visual', color: '#f0883e' },
    { name: 'CI Pipeline', color: '#f85149' },
  ];

  // Filter nodes based on PageRank, search, and cluster
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const matchesSearch =
        node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.file.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRank = node.pageRank >= minPageRank;
      const matchesCluster = selectedCluster === 'all' || node.cluster === selectedCluster;
      return matchesSearch && matchesRank && matchesCluster;
    });
  }, [nodes, searchQuery, minPageRank, selectedCluster]);

  const activeNodeIds = useMemo(() => new Set(filteredNodes.map((n) => n.id)), [filteredNodes]);

  const filteredEdges = useMemo(() => {
    return edges.filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
  }, [edges, activeNodeIds]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.max(0.6, Math.min(2.0, prev + delta)));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setSearchQuery('');
    setMinPageRank(0.5);
    setSelectedCluster('all');
    setIsBlastRadiusOverlay(false);
    addToast({
      type: 'info',
      title: 'Canvas Reset',
      description: 'Camera reset to default graphify-rs coordinates',
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden bg-[#07090e] select-none">
      {/* Top Filter and Controls Bar */}
      <div className="h-12 border-b border-[#21262d] bg-[#0d1117] px-4 flex items-center justify-between gap-4 shrink-0 text-xs">
        {/* Left: Dynamic Search */}
        <div className="flex items-center gap-3">
          <div className="w-64">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search struct, function, or module..."
              icon={<Search size={13} />}
              onClear={() => setSearchQuery('')}
            />
          </div>

          {/* Centrality Filter Slider */}
          <div className="flex items-center gap-2 border-l border-[#21262d] pl-3">
            <Sliders size={13} className="text-[#8b949e]" />
            <span className="text-[#8b949e] font-mono text-[11px]">PageRank ≥</span>
            <input
              type="range"
              min="0.5"
              max="0.9"
              step="0.05"
              value={minPageRank}
              onChange={(e) => setMinPageRank(parseFloat(e.target.value))}
              className="w-24 accent-[#388bfd] cursor-pointer"
            />
            <span className="font-mono text-[#58a6ff] text-[11px] w-8">
              {minPageRank.toFixed(2)}
            </span>
          </div>

          {/* Cluster filter selector */}
          <div className="flex items-center gap-1 border-l border-[#21262d] pl-3">
            <button
              onClick={() => setSelectedCluster('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                selectedCluster === 'all'
                  ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]'
                  : 'text-[#8b949e] hover:text-[#f0f6fc]'
              }`}
            >
              All Clusters
            </button>
            {clusters.map((c) => (
              <button
                key={c.name}
                onClick={() => setSelectedCluster(c.name)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors flex items-center gap-1 ${
                  selectedCluster === c.name
                    ? 'bg-[#21262d] text-[#f0f6fc] border border-[#30363d]'
                    : 'text-[#8b949e] hover:text-[#f0f6fc]'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }} />
                <span>{c.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Blast-Radius Overlay toggle & Zoom controls */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={isBlastRadiusOverlay ? 'danger' : 'secondary'}
            icon={<Flame size={14} className={isBlastRadiusOverlay ? 'animate-bounce' : ''} />}
            onClick={() => {
              setIsBlastRadiusOverlay(!isBlastRadiusOverlay);
              addToast({
                type: isBlastRadiusOverlay ? 'info' : 'warning',
                title: isBlastRadiusOverlay ? 'Blast Overlay Disabled' : 'PR Blast-Radius Active',
                description: isBlastRadiusOverlay
                  ? 'Showing full architectural graph'
                  : 'Dimmed non-impacted nodes; highlighting changed symbols',
              });
            }}
          >
            {isBlastRadiusOverlay ? 'Blast Radius: ON' : 'PR Blast Overlay'}
          </Button>

          <div className="flex items-center gap-1 bg-[#161b22] border border-[#30363d] rounded-md p-0.5">
            <button
              onClick={() => handleZoom(-0.15)}
              className="px-2 py-1 text-xs text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d]"
            >
              -
            </button>
            <span className="text-[10px] font-mono text-[#8b949e] px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => handleZoom(0.15)}
              className="px-2 py-1 text-xs text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d]"
            >
              +
            </button>
            <button
              onClick={handleReset}
              title="Reset View"
              className="p-1 text-[#8b949e] hover:text-[#f0f6fc] rounded hover:bg-[#21262d] ml-1"
            >
              <RefreshCw size={11} />
            </button>
          </div>
        </div>
      </div>

      {/* SVG / Canvas Graph Display Stage */}
      <div className="flex-1 relative overflow-hidden bg-[#07090e]">
        {/* Subtle grid backdrop */}
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, #30363d 1px, transparent 0)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Legend bar */}
        <div className="absolute bottom-4 left-4 bg-[#161b22]/90 backdrop-blur-md border border-[#30363d] rounded-lg p-2.5 z-10 space-y-1.5 shadow-xl">
          <div className="text-[10px] uppercase font-mono text-[#8b949e] tracking-wider">
            Leiden Algorithmic Communities
          </div>
          <div className="flex items-center gap-3 text-[11px] font-mono">
            {clusters.map((c) => (
              <div key={c.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                <span className="text-[#f0f6fc]">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SVG Graph Viewport with Dynamic Transform */}
        <div
          className="w-full h-full flex items-center justify-center transition-transform duration-200"
          style={{ transform: `scale(${zoomLevel})` }}
        >
          <svg className="w-[1000px] h-[600px] overflow-visible">
            <defs>
              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path
                  d="M 0 0 L 10 5 L 0 10 z"
                  fill={theme === 'light' ? '#8c959f' : theme === 'oled' ? '#333333' : '#484f58'}
                />
              </marker>
              <marker
                id="arrow-impact"
                viewBox="0 0 10 10"
                refX="22"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f85149" />
              </marker>
            </defs>

            {/* Render Edges */}
            {filteredEdges.map((edge, idx) => {
              const srcNode = nodes.find((n) => n.id === edge.source);
              const tgtNode = nodes.find((n) => n.id === edge.target);
              if (!srcNode || !tgtNode) return null;

              const isEdgeImpacted = isBlastRadiusOverlay && (srcNode.impacted || tgtNode.impacted);

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={srcNode.x || 0}
                    y1={srcNode.y || 0}
                    x2={tgtNode.x || 0}
                    y2={tgtNode.y || 0}
                    stroke={
                      isEdgeImpacted
                        ? '#f85149'
                        : theme === 'light'
                        ? '#d0d7de'
                        : theme === 'oled'
                        ? '#222222'
                        : '#30363d'
                    }
                    strokeWidth={isEdgeImpacted ? 2 : 1}
                    strokeDasharray={isEdgeImpacted ? '4 2' : 'none'}
                    markerEnd={isEdgeImpacted ? 'url(#arrow-impact)' : 'url(#arrow)'}
                    className="transition-all"
                  />
                  {/* Flow label */}
                  <text
                    x={((srcNode.x || 0) + (tgtNode.x || 0)) / 2}
                    y={((srcNode.y || 0) + (tgtNode.y || 0)) / 2 - 4}
                    fill={theme === 'light' ? '#57606a' : theme === 'oled' ? '#9e9e9e' : '#8b949e'}
                    fontSize="9"
                    fontFamily="Fira Code"
                    textAnchor="middle"
                  >
                    {edge.type}
                  </text>
                </g>
              );
            })}

            {/* Render Nodes */}
            {filteredNodes.map((node) => {
              const isSelected = selectedNode?.id === node.id;
              const isDimmed = isBlastRadiusOverlay && !node.impacted;
              const isImpacted = isBlastRadiusOverlay && node.impacted;

              const nodeRadius = 16 + node.pageRank * 16; // 16px to 32px based on PageRank

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x || 0}, ${node.y || 0})`}
                  onClick={() => setSelectedNode(node)}
                  className="cursor-pointer transition-opacity duration-300"
                  opacity={isDimmed ? 0.15 : 1}
                >
                  {/* Pulse ring if impacted in blast radius */}
                  {isImpacted && (
                    <circle
                      r={nodeRadius + 8}
                      fill="none"
                      stroke="#f85149"
                      strokeWidth="2"
                      className="animate-ping opacity-50"
                    />
                  )}

                  {/* Node Outer Circle */}
                  <circle
                    r={nodeRadius}
                    fill={
                      theme === 'oled'
                        ? '#050505'
                        : theme === 'light'
                        ? '#ffffff'
                        : '#161b22'
                    }
                    stroke={
                      isSelected
                        ? theme === 'light'
                          ? '#0969da'
                          : '#ffffff'
                        : isImpacted
                        ? '#f85149'
                        : node.clusterColor
                    }
                    strokeWidth={isSelected ? 3 : 2}
                    filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.15))"
                  />

                  {/* Inner Cluster Fill */}
                  <circle
                    r={nodeRadius - 4}
                    fill={node.clusterColor}
                    fillOpacity={
                      isImpacted
                        ? 0.5
                        : theme === 'oled'
                        ? 0.25
                        : theme === 'light'
                        ? 0.22
                        : 0.15
                    }
                  />

                  {/* Node Text Label */}
                  <text
                    y={nodeRadius + 14}
                    textAnchor="middle"
                    fill={
                      isSelected
                        ? theme === 'light'
                          ? '#0969da'
                          : '#ffffff'
                        : theme === 'light'
                        ? '#1f2328'
                        : theme === 'oled'
                        ? '#ffffff'
                        : '#f0f6fc'
                    }
                    fontSize="11"
                    fontFamily="Plus Jakarta Sans"
                    fontWeight="600"
                  >
                    {node.name}
                  </text>

                  {/* PageRank Subtitle */}
                  <text
                    y={nodeRadius + 26}
                    textAnchor="middle"
                    fill={
                      theme === 'light'
                        ? '#57606a'
                        : theme === 'oled'
                        ? '#9e9e9e'
                        : '#8b949e'
                    }
                    fontSize="9"
                    fontFamily="Fira Code"
                  >
                    PR: {node.pageRank.toFixed(2)} · {node.type}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Node Inspector Drawer */}
      <Drawer
        isOpen={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name || 'Node Inspector'}
        subtitle={selectedNode?.file}
        width="md"
      >
        {selectedNode && (
          <div className="space-y-4">
            <div className="p-3 bg-[#0d1117] border border-[#21262d] rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">Leiden Community</span>
                <span
                  className="text-xs font-mono font-medium px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: `${selectedNode.clusterColor}20`,
                    color: selectedNode.clusterColor,
                  }}
                >
                  {selectedNode.cluster}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">PageRank Centrality</span>
                <span className="font-mono text-xs text-[#58a6ff]">
                  {selectedNode.pageRank.toFixed(3)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">Declared Symbol Type</span>
                <span className="font-mono text-xs text-[#f0f6fc]">{selectedNode.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#8b949e]">Source Span</span>
                <span className="font-mono text-xs text-[#8b949e]">
                  {selectedNode.lines} lines in {selectedNode.file}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-[#f0f6fc]">Direct Callers & Dependents</h4>
              <div className="space-y-1.5">
                {edges
                  .filter((e) => e.target === selectedNode.id)
                  .map((e, i) => {
                    const caller = nodes.find((n) => n.id === e.source);
                    return (
                      <div
                        key={i}
                        className="p-2 rounded bg-[#0d1117] border border-[#21262d] text-xs font-mono flex items-center justify-between"
                      >
                        <span className="text-[#388bfd]">{caller?.name || e.source}</span>
                        <span className="text-[#8b949e] text-[10px]">{e.type}</span>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full"
                icon={<Code2 size={13} />}
                onClick={() => {
                  addToast({
                    type: 'info',
                    title: 'Click-to-Definition',
                    description: `Navigating directly to ${selectedNode.name} in Monaco diff host`,
                  });
                  onNavigateToSource?.(selectedNode.file, 42);
                  setSelectedNode(null);
                }}
              >
                Jump to Source Definition
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
