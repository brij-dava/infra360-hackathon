import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ApiClient } from '../lib/api';
import { AssetNode } from '../components/AssetNode';
import { BlastRadiusModal } from '../components/BlastRadiusModal';
import {
  Network,
  AlertTriangle,
  Play,
  RotateCcw,
  Layers,
  ZoomIn,
} from 'lucide-react';

const nodeTypes = {
  assetNode: AssetNode,
};

interface TopologyPageProps {
  onSelectAsset?: (assetTag: string) => void;
}

export const TopologyPage: React.FC<TopologyPageProps> = ({ onSelectAsset }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [selectedTag, setSelectedTag] = useState<string>('AST-NET-000012');
  const [blastData, setBlastData] = useState<any>(null);
  const [blastModalOpen, setBlastModalOpen] = useState(false);
  const [simulating, setSimulating] = useState(false);

  const fetchGraph = () => {
    ApiClient.getTopology().then((data) => {
      setNodes(data.nodes || []);
      setEdges(data.edges || []);
    });
  };

  useEffect(() => {
    fetchGraph();
  }, []);

  const handleSimulateBlast = useCallback(
    async (rootTag: string) => {
      setSimulating(true);
      try {
        const res = await ApiClient.getBlastRadius(rootTag);
        setBlastData(res.blastRadius);

        // Highlight affected nodes in React Flow
        const affectedTags = new Set(res.blastRadius.downstreamAssets.map((d: any) => d.assetTag));
        affectedTags.add(rootTag);

        setNodes((nds) =>
          nds.map((node) => {
            const isRoot = node.id === rootTag;
            const isAffected = affectedTags.has(node.id);

            return {
              ...node,
              selected: isRoot,
              data: {
                ...node.data,
                isBlasted: isAffected,
              },
              style: isRoot
                ? { filter: 'drop-shadow(0 0 12px #ef4444)' }
                : isAffected
                ? { filter: 'drop-shadow(0 0 8px #f97316)' }
                : { opacity: 0.4 },
            };
          })
        );

        setEdges((eds) =>
          eds.map((edge) => {
            const isSevered = affectedTags.has(edge.source) && affectedTags.has(edge.target);
            return {
              ...edge,
              animated: true,
              style: isSevered
                ? { stroke: '#ef4444', strokeWidth: 3 }
                : { opacity: 0.2 },
            };
          })
        );

        setBlastModalOpen(true);
      } catch (err: any) {
        alert(err.message || 'Failed to simulate blast radius');
      } finally {
        setSimulating(false);
      }
    },
    [setNodes, setEdges]
  );

  const handleResetGraph = () => {
    fetchGraph();
    setBlastData(null);
  };

  const onNodeClick = (_: any, node: Node) => {
    setSelectedTag(node.id);
  };

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col space-y-3">
      {/* Top Controls Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <span>Interactive Dependency Topology & Blast Radius Canvas</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {nodes.length} Nodes • {edges.length} Edges
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Traverse physical, network, and application service dependencies in real-time.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Target Asset Picker */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Target Node:</span>
            <select
              value={selectedTag}
              onChange={(e) => setSelectedTag(e.target.value)}
              className="bg-transparent text-indigo-300 font-mono font-bold focus:outline-none"
            >
              <option value="AST-NET-000012">AST-NET-000012 (Core Switch Alpha)</option>
              <option value="AST-SRV-000041">AST-SRV-000041 (Core ERP Server)</option>
              {nodes.slice(0, 15).map((n) => (
                <option key={n.id} value={n.id}>
                  {n.id} ({String((n.data as any)?.name || '')})
                </option>
              ))}
            </select>
          </div>

          {/* Simulate Button */}
          <button
            onClick={() => handleSimulateBlast(selectedTag)}
            disabled={simulating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/30 disabled:opacity-50"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Blast Radius</span>
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetGraph}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Reset Graph Highlighting"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Canvas */}
      <div className="flex-1 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-2xl relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.2}
          maxZoom={1.5}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1.5} color="#1e293b" />
          <Controls />
          <MiniMap
            nodeColor={(node: any) => {
              if (node.data.status === 'DEGRADED') return '#f59e0b';
              if (node.data.status === 'DEFECTIVE') return '#ef4444';
              return '#6366f1';
            }}
          />
        </ReactFlow>

        {/* Canvas floating quick guide */}
        <div className="absolute bottom-4 left-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-300 shadow-xl max-w-xs space-y-1">
          <div className="font-bold text-slate-200 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>Topological Navigation</span>
          </div>
          <div>• Click any node to select it as the failure root.</div>
          <div>• Click <strong>Simulate Blast Radius</strong> to trace downstream cascading severance.</div>
        </div>
      </div>

      {/* Blast Radius Result Modal */}
      <BlastRadiusModal blast={blastModalOpen ? blastData : null} onClose={() => setBlastModalOpen(false)} />
    </div>
  );
};
