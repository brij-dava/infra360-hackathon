import React, { useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { IAsset, IMaintenanceRecord } from '@infra360/types';
import { StatusBadge } from '../components/StatusBadge';
import {
  QrCode,
  AlertCircle,
  Wrench,
  ArrowRightLeft,
  CheckCircle,
  Server,
  Layers,
  Calendar,
  Eye,
  Check,
} from 'lucide-react';

interface ScannerPageProps {
  initialAssetTag?: string;
  onOpenAssetDetail: (assetTag: string) => void;
}

export const ScannerPage: React.FC<ScannerPageProps> = ({
  initialAssetTag = 'AST-SRV-000041',
  onOpenAssetDetail,
}) => {
  const [assetTagInput, setAssetTagInput] = useState(initialAssetTag);
  const [activeTag, setActiveTag] = useState(initialAssetTag);
  const [asset, setAsset] = useState<IAsset | null>(null);
  const [maintenance, setMaintenance] = useState<IMaintenanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Field Action Modals
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueTitle, setIssueTitle] = useState('');
  const [issueDesc, setIssueDesc] = useState('');

  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferDept, setTransferDept] = useState('Data Science & Analytics');

  const loadScannedAsset = (tag: string) => {
    setLoading(true);
    setActionMessage(null);
    Promise.all([ApiClient.getAsset(tag), ApiClient.getMaintenance(tag)])
      .then(([assetRes, maintRes]) => {
        setAsset(assetRes.asset);
        setMaintenance(maintRes.records || []);
        setActiveTag(tag);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setAsset(null);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadScannedAsset(initialAssetTag);
  }, [initialAssetTag]);

  const handleStartMaintenance = async () => {
    if (!asset) return;
    try {
      await ApiClient.transitionLifecycle(asset.assetTag, 'MAINTENANCE', 'Field technician started scheduled maintenance');
      setActionMessage('Asset status switched to MAINTENANCE. Work order session started.');
      loadScannedAsset(asset.assetTag);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReportIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset || !issueTitle) return;
    try {
      await ApiClient.createMaintenance({
        assetTag: asset.assetTag,
        type: 'EMERGENCY_REPAIR',
        status: 'IN_PROGRESS',
        title: issueTitle,
        description: issueDesc || 'Physical anomaly reported via field mobile QR scanner',
        scheduledDate: new Date().toISOString(),
        downtimeMinutes: 45,
        cost: 850,
        partsReplaced: [],
      });
      setIssueModalOpen(false);
      setIssueTitle('');
      setIssueDesc('');
      setActionMessage('Critical issue logged! Ticket dispatched to Network Operations Center.');
      loadScannedAsset(asset.assetTag);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;
    try {
      await ApiClient.updateAsset(asset.assetTag, { department: transferDept });
      setTransferModalOpen(false);
      setActionMessage(`Asset custody transferred to ${transferDept}.`);
      loadScannedAsset(asset.assetTag);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Field Scanner Header & Quick Tag Switcher */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl text-center">
        <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
          <QrCode className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-100">Physical-to-Digital Mobile Twin Scan</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto mt-0.5">
          Simulating the technician mobile device experience when scanning a physical equipment chassis QR tag.
        </p>

        {/* Tag Switcher Bar */}
        <div className="mt-4 flex items-center justify-center gap-2 max-w-sm mx-auto">
          <input
            type="text"
            value={assetTagInput}
            onChange={(e) => setAssetTagInput(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                loadScannedAsset(assetTagInput);
              }
            }}
            placeholder="Scan / Type Asset Tag..."
            className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-center text-slate-100 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={() => loadScannedAsset(assetTagInput)}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shrink-0"
          >
            Scan Tag
          </button>
        </div>

        {/* Quick Demo Previews */}
        <div className="flex items-center justify-center gap-2 mt-3 text-[11px] font-mono text-slate-400">
          <span>Demo Tags:</span>
          <button
            onClick={() => {
              setAssetTagInput('AST-SRV-000041');
              loadScannedAsset('AST-SRV-000041');
            }}
            className="underline hover:text-indigo-300"
          >
            AST-SRV-000041 (ERP Core)
          </button>
          <span>•</span>
          <button
            onClick={() => {
              setAssetTagInput('AST-NET-000012');
              loadScannedAsset('AST-NET-000012');
            }}
            className="underline hover:text-indigo-300"
          >
            AST-NET-000012 (Core Switch)
          </button>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-slate-400 font-mono text-xs">
          Reading Cryptographic QR Twin...
        </div>
      ) : !asset ? (
        <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-mono">
          Asset tag "{activeTag}" not found in digital twin database.
        </div>
      ) : (
        /* Mobile Digital Twin Diagnostic Card */
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
          {/* Identity & Status */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-indigo-400 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/30">
                  {asset.assetTag}
                </span>
                <StatusBadge type="status" value={asset.status} />
              </div>
              <h3 className="text-lg font-bold text-slate-100">{asset.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {asset.manufacturer} {asset.model} • S/N: {asset.serialNumber}
              </p>
            </div>

            <div className="text-right">
              <div className="text-[10px] text-slate-400">HEALTH</div>
              <div
                className={`text-xl font-black font-mono ${
                  asset.healthScore < 50
                    ? 'text-rose-400'
                    : asset.healthScore < 75
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {asset.healthScore}/100
              </div>
            </div>
          </div>

          {/* Location & Custody Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Physical Coordinates</span>
              </span>
              <span className="text-slate-200 font-mono font-bold">
                {asset.location.rack} (U{asset.location.rackUnitStart}-{asset.location.rackUnitEnd})
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Facility / Hall</span>
              <span className="text-slate-200">{asset.location.siteName} • {asset.location.room}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Department / Custodian</span>
              <span className="text-slate-200">{asset.department} ({asset.custodianName})</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-800 pt-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>OEM Warranty</span>
              </span>
              <span className="text-slate-200 font-mono">
                {new Date(asset.warrantyEndDate).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Quick Action Buttons for Field Technicians */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setIssueModalOpen(true)}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/30"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Report Physical Issue</span>
            </button>

            <button
              onClick={handleStartMaintenance}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors shadow-lg shadow-blue-600/30"
            >
              <Wrench className="w-4 h-4" />
              <span>Start Maintenance</span>
            </button>

            <button
              onClick={() => setTransferModalOpen(true)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <span>Request Transfer</span>
            </button>

            <button
              onClick={() => onOpenAssetDetail(asset.assetTag)}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Eye className="w-4 h-4 text-indigo-400" />
              <span>Inspect Full Twin</span>
            </button>
          </div>

          {/* Recent Maintenance Timeline Preview */}
          <div className="border-t border-slate-800 pt-4">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Recent Maintenance Events ({maintenance.length})
            </div>
            {maintenance.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono">No work orders recorded.</div>
            ) : (
              <div className="space-y-2">
                {maintenance.slice(0, 2).map((m) => (
                  <div key={m.id} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
                    <div className="flex justify-between font-semibold text-slate-200">
                      <span>{m.title}</span>
                      <span className="font-mono text-rose-400">${m.cost}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Tech: {m.technicianName} • {new Date(m.scheduledDate).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Report Physical Issue */}
      {issueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleReportIssue} className="w-full max-w-md p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>Report Equipment Defect / Anomaly</span>
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Issue Title *</label>
              <input
                type="text"
                placeholder="e.g. PSU Redundancy Loss / Amber Alarm"
                value={issueTitle}
                onChange={(e) => setIssueTitle(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Field Observations</label>
              <textarea
                placeholder="Observed temperature, audible fan whine, error codes on front panel..."
                value={issueDesc}
                onChange={(e) => setIssueDesc(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIssueModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-500 text-white"
              >
                Submit Incident Ticket
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Request Transfer */}
      {transferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <form onSubmit={handleTransfer} className="w-full max-w-md p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-cyan-400" />
              <span>Request Asset Custody Transfer</span>
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Department</label>
              <select
                value={transferDept}
                onChange={(e) => setTransferDept(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500"
              >
                <option value="Data Science & Analytics">Data Science & Analytics</option>
                <option value="Network & Cloud Engineering">Network & Cloud Engineering</option>
                <option value="Cybersecurity Operations">Cybersecurity Operations</option>
                <option value="Financial Systems">Financial Systems</option>
                <option value="Corporate Workplace IT">Corporate Workplace IT</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTransferModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white"
              >
                Execute Handshake Transfer
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
