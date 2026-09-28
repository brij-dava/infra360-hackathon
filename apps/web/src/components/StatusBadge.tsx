import React from 'react';
import { AssetStatus, Criticality, LifecycleStage } from '@infra360/types';

interface StatusBadgeProps {
  type?: 'status' | 'lifecycle' | 'criticality' | 'risk';
  value: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ type = 'status', value, size = 'sm' }) => {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  // Asset Status
  if (type === 'status') {
    switch (value as AssetStatus) {
      case 'OPERATIONAL':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Operational
          </span>
        );
      case 'DEGRADED':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping"></span>
            Degraded
          </span>
        );
      case 'MAINTENANCE':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Maintenance
          </span>
        );
      case 'DEFECTIVE':
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Defective
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Offline
          </span>
        );
    }
  }

  // Criticality
  if (type === 'criticality') {
    switch (value as Criticality) {
      case 'TIER_1_CRITICAL':
        return (
          <span className={`inline-flex items-center font-semibold rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/30 ${sizeClasses}`}>
            Tier 1 Mission Critical
          </span>
        );
      case 'TIER_2_OPERATIONAL':
        return (
          <span className={`inline-flex items-center font-medium rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/30 ${sizeClasses}`}>
            Tier 2 Operational
          </span>
        );
      case 'TIER_3_SUPPORT':
      default:
        return (
          <span className={`inline-flex items-center font-normal rounded-md bg-slate-800 text-slate-400 border border-slate-700 ${sizeClasses}`}>
            Tier 3 Ancillary
          </span>
        );
    }
  }

  // Risk
  if (type === 'risk') {
    const num = parseInt(value, 10);
    if (num >= 70) {
      return (
        <span className={`inline-flex items-center font-bold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
          Risk {num}/100 (High)
        </span>
      );
    } else if (num >= 36) {
      return (
        <span className={`inline-flex items-center font-medium rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
          Risk {num}/100 (Med)
        </span>
      );
    }
    return (
      <span className={`inline-flex items-center font-medium rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
        Risk {num}/100 (Low)
      </span>
    );
  }

  // Lifecycle
  return (
    <span className={`inline-flex items-center font-mono rounded bg-slate-800 text-slate-300 border border-slate-700/60 ${sizeClasses}`}>
      {value}
    </span>
  );
};
