import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server, HardDrive, Network, Shield, Cpu, Zap, Radio, Laptop } from 'lucide-react';
import { AssetCategory } from '@infra360/types';

const getCategoryIcon = (category: AssetCategory) => {
  switch (category) {
    case 'SERVER':
      return <Server className="w-4 h-4 text-indigo-400" />;
    case 'SWITCH':
    case 'ROUTER':
      return <Network className="w-4 h-4 text-emerald-400" />;
    case 'FIREWALL':
      return <Shield className="w-4 h-4 text-rose-400" />;
    case 'STORAGE':
      return <HardDrive className="w-4 h-4 text-purple-400" />;
    case 'UPS':
      return <Zap className="w-4 h-4 text-amber-400" />;
    case 'ACCESS_POINT':
      return <Radio className="w-4 h-4 text-cyan-400" />;
    case 'WORKSTATION':
      return <Laptop className="w-4 h-4 text-blue-400" />;
    default:
      return <Cpu className="w-4 h-4 text-slate-400" />;
  }
};

export const AssetNode = ({ data, selected }: any) => {
  const isDegraded = data.status === 'DEGRADED';
  const isDefective = data.status === 'DEFECTIVE';
  const isHighRisk = data.riskScore >= 70;

  return (
    <div
      className={`min-w-[220px] rounded-xl bg-slate-900/95 backdrop-blur-md border p-3 shadow-xl transition-all ${
        selected
          ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
          : isDegraded || isDefective
          ? 'border-rose-500/60 shadow-rose-950/40 ring-1 ring-rose-500/30'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <Handle type="target" position={Position.Top} className="!bg-indigo-500 !w-2.5 !h-2.5" />

      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60">
            {getCategoryIcon(data.category)}
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              {data.assetTag}
            </div>
            <div className="text-xs font-semibold text-slate-100 max-w-[130px] truncate" title={data.name}>
              {data.name}
            </div>
          </div>
        </div>

        {/* Status Dot */}
        <span
          className={`w-2 h-2 rounded-full ${
            data.status === 'OPERATIONAL'
              ? 'bg-emerald-500'
              : data.status === 'DEGRADED'
              ? 'bg-amber-500 animate-ping'
              : data.status === 'DEFECTIVE'
              ? 'bg-rose-500'
              : 'bg-slate-500'
          }`}
          title={data.status}
        ></span>
      </div>

      {/* Network & Physical Location */}
      <div className="text-[10px] text-slate-400 font-mono mb-2 flex items-center justify-between border-t border-slate-800/80 pt-1.5">
        <span>{data.ipAddress || '10.10.x.x'}</span>
        <span>{data.location || 'Rack-A1'}</span>
      </div>

      {/* Score pills */}
      <div className="grid grid-cols-2 gap-1.5 text-[10px]">
        <div className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-500">HLTH</span>
          <span className={`font-mono font-bold ${data.healthScore < 50 ? 'text-rose-400' : data.healthScore < 75 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {data.healthScore}
          </span>
        </div>
        <div className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800/80 flex items-center justify-between">
          <span className="text-slate-500">RISK</span>
          <span className={`font-mono font-bold ${isHighRisk ? 'text-rose-400' : 'text-slate-300'}`}>
            {data.riskScore}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-indigo-500 !w-2.5 !h-2.5" />
    </div>
  );
};
