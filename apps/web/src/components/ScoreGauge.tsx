import React, { useState } from 'react';
import { IHealthFactor, IRiskFactor } from '@infra360/types';
import { AlertCircle, CheckCircle, ChevronDown, ChevronUp, ShieldAlert } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  label: string;
  type: 'health' | 'risk';
  factors?: (IHealthFactor | IRiskFactor)[];
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, label, type, factors = [] }) => {
  const [expanded, setExpanded] = useState(false);

  // Color mapping
  let barColor = 'bg-emerald-500';
  let textColor = 'text-emerald-400';
  let borderColor = 'border-emerald-500/30';
  let bgColor = 'bg-emerald-500/10';

  if (type === 'health') {
    if (score < 50) {
      barColor = 'bg-rose-500';
      textColor = 'text-rose-400';
      borderColor = 'border-rose-500/30';
      bgColor = 'bg-rose-500/10';
    } else if (score < 75) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-400';
      borderColor = 'border-amber-500/30';
      bgColor = 'bg-amber-500/10';
    }
  } else {
    // Risk: high is danger
    if (score >= 70) {
      barColor = 'bg-rose-500';
      textColor = 'text-rose-400';
      borderColor = 'border-rose-500/30';
      bgColor = 'bg-rose-500/10';
    } else if (score >= 36) {
      barColor = 'bg-amber-500';
      textColor = 'text-amber-400';
      borderColor = 'border-amber-500/30';
      bgColor = 'bg-amber-500/10';
    }
  }

  return (
    <div className={`p-4 rounded-xl border ${borderColor} ${bgColor} transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {type === 'health' ? (
            <CheckCircle className={`w-5 h-5 ${textColor}`} />
          ) : (
            <ShieldAlert className={`w-5 h-5 ${textColor}`} />
          )}
          <span className="text-xs uppercase tracking-wider font-semibold text-slate-300">
            {label}
          </span>
        </div>
        <span className={`text-2xl font-black font-mono ${textColor}`}>
          {score}<span className="text-xs text-slate-400 font-normal">/100</span>
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.max(4, score)}%` }}
        ></div>
      </div>

      {/* Factor Breakdown Toggle */}
      {factors.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center justify-between w-full text-xs text-slate-400 hover:text-slate-200 py-1 transition-colors border-t border-slate-800/80 mt-2 pt-2"
          >
            <span>{expanded ? 'Hide attribution factors' : `Explain ${label} (${factors.length} factors)`}</span>
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {expanded && (
            <div className="mt-2 space-y-1.5 pt-1">
              {factors.map((f: any, idx) => (
                <div key={idx} className="flex items-start justify-between text-xs bg-slate-900/60 p-2 rounded border border-slate-800/60">
                  <div className="flex items-start gap-1.5 pr-2">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-medium text-slate-200">{f.factor}: </span>
                      <span className="text-slate-400">{f.reason}</span>
                    </div>
                  </div>
                  <span className="font-mono font-semibold text-rose-400 shrink-0">
                    {f.penalty ? `${f.penalty} pts` : f.contribution ? `+${f.contribution}%` : ''}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
