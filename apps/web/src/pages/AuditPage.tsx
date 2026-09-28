import React, { useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { IAuditLog } from '@infra360/types';
import { History, Shield, Filter, RefreshCw, FileText } from 'lucide-react';

export const AuditPage: React.FC = () => {
  const [logs, setLogs] = useState<IAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<IAuditLog | null>(null);

  const fetchLogs = () => {
    setLoading(true);
    ApiClient.getAuditLogs({
      entityType: entityFilter === 'ALL' ? undefined : entityFilter,
      limit: 100,
    })
      .then((res) => {
        setLogs(res.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchLogs();
  }, [entityFilter]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <History className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100">Immutable Governance Audit Ledger</h2>
          </div>
          <p className="text-xs text-slate-400">
            Append-only, tamper-evident cryptographic change trail recording every asset mutation, topology edit, and lifecycle shift.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Entity Types</option>
            <option value="ASSET">Assets</option>
            <option value="LIFECYCLE">Lifecycle Transitions</option>
            <option value="MAINTENANCE">Maintenance Work Orders</option>
            <option value="DISCOVERY">Shadow IT Triage</option>
            <option value="RELATIONSHIP">Topology Relationships</option>
          </select>

          <button
            onClick={fetchLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Target Entity</th>
                <th className="py-3 px-4">Justification & Diff</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    No matching audit records found.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>

                    {/* Actor */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-200">{log.actorName}</div>
                      <div className="text-[10px] font-mono text-indigo-400">{log.actorRole}</div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-100 text-[11px]">
                      {log.action}
                    </td>

                    {/* Target Entity */}
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      <span className="text-slate-400">{log.entityType}: </span>
                      <span className="text-indigo-300 font-semibold">{log.entityId}</span>
                    </td>

                    {/* Reason */}
                    <td className="py-3.5 px-4 text-slate-300 max-w-[260px] truncate">
                      {log.reason || 'Routine operation'}
                    </td>

                    {/* Payload View */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition-colors"
                      >
                        View Diff
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diff Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-2xl p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-100">Audit Transaction Diff Record</h3>
                <p className="text-xs text-slate-400 font-mono">
                  {selectedLog.id} • {selectedLog.action}
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-3 py-1 text-xs rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div>
                <div className="text-[11px] text-rose-400 font-bold mb-1">Previous State (-):</div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 overflow-x-auto max-h-40 text-slate-400">
                  {JSON.stringify(selectedLog.diff?.previous, null, 2)}
                </div>
              </div>

              <div>
                <div className="text-[11px] text-emerald-400 font-bold mb-1">Current State (+):</div>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800/80 overflow-x-auto max-h-40 text-emerald-300">
                  {JSON.stringify(selectedLog.diff?.current, null, 2)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
