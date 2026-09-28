import React from 'react';
import { IBlastRadiusResult } from '@infra360/types';
import { AlertTriangle, DollarSign, Users, Layers, ShieldCheck, X } from 'lucide-react';

interface BlastRadiusModalProps {
  blast: IBlastRadiusResult | null;
  onClose: () => void;
}

export const BlastRadiusModal: React.FC<BlastRadiusModalProps> = ({ blast, onClose }) => {
  if (!blast) return null;

  const severityColor =
    blast.severity === 'CATASTROPHIC'
      ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
      : blast.severity === 'HIGH'
      ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
      : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <AlertTriangle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-100">
                  Cascading Failure Impact Analysis
                </h3>
                <span className={`px-2.5 py-0.5 text-xs font-black rounded-full border ${severityColor}`}>
                  {blast.severity} SEVERITY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Simulated root failure point: <span className="text-indigo-400 font-semibold">{blast.rootAssetName}</span> ({blast.rootAssetTag})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Impact Stats Grid */}
          <div className="grid grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span>Impacted Nodes</span>
              </div>
              <div className="text-2xl font-black font-mono text-slate-100">
                {blast.impactedAssetsCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Services Severed</span>
              </div>
              <div className="text-2xl font-black font-mono text-amber-400">
                {blast.impactedServicesCount}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Impacted Users</span>
              </div>
              <div className="text-2xl font-black font-mono text-cyan-300">
                {blast.totalImpactedUsers.toLocaleString()}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
                <DollarSign className="w-4 h-4 text-rose-400" />
                <span>Outage Exposure</span>
              </div>
              <div className="text-2xl font-black font-mono text-rose-400">
                ${blast.estimatedHourlyFinancialLoss.toLocaleString()}
                <span className="text-[10px] text-slate-500 font-normal">/hr</span>
              </div>
            </div>
          </div>

          {/* Compromised Business Services */}
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-2 flex items-center gap-1.5">
              <span>Compromised Enterprise Services</span>
            </h4>
            <div className="space-y-2">
              {blast.compromisedServices.map((svc, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-sm"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{svc.serviceName}</div>
                    <div className="text-xs text-slate-400">SLA Contract: {svc.slaTier}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-rose-400">
                      ${svc.hourlyRevenueImpact.toLocaleString()} / hr
                    </div>
                    <div className="text-xs text-slate-400">{svc.userCount.toLocaleString()} active users</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Downstream Topology Trace */}
          <div>
            <h4 className="text-xs uppercase font-bold text-slate-300 tracking-wider mb-2">
              Downstream Dependent Nodes ({blast.downstreamAssets.length})
            </h4>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {blast.downstreamAssets.map((node, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-950 border border-slate-800/60 text-xs font-mono"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500 font-bold">Hop +{node.hopDistance}</span>
                    <span className="text-slate-200 font-semibold">{node.assetTag}</span>
                    <span className="text-slate-400 truncate max-w-[280px]">{node.name}</span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                    {node.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Mitigations */}
          <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
            <h4 className="text-xs uppercase font-bold text-indigo-300 tracking-wider mb-2 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>Recommended Mitigations & Action Plan</span>
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {blast.recommendedMitigations.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors"
          >
            Close Analysis
          </button>
        </div>
      </div>
    </div>
  );
};
