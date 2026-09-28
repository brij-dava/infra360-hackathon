import React, { useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { IAsset, LifecycleStage, IMaintenanceRecord } from '@infra360/types';
import { StatusBadge } from '../components/StatusBadge';
import { ScoreGauge } from '../components/ScoreGauge';
import { BlastRadiusModal } from '../components/BlastRadiusModal';
import { QrModal } from '../components/QrModal';
import {
  Server,
  ArrowLeft,
  QrCode,
  Network,
  Wrench,
  AlertTriangle,
  Calendar,
  DollarSign,
  TrendingDown,
  Cpu,
  Thermometer,
  Layers,
  ShieldCheck,
  CheckCircle,
  Clock,
  Zap,
} from 'lucide-react';

interface AssetDetailPageProps {
  assetTag: string;
  onBack: () => void;
  onOpenScanner?: (assetTag: string) => void;
}

export const AssetDetailPage: React.FC<AssetDetailPageProps> = ({ assetTag, onBack, onOpenScanner }) => {
  const [asset, setAsset] = useState<IAsset | null>(null);
  const [maintenance, setMaintenance] = useState<IMaintenanceRecord[]>([]);
  const [repairAnalysis, setRepairAnalysis] = useState<any>(null);
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Modals & Drawers
  const [blastModalOpen, setBlastModalOpen] = useState(false);
  const [blastData, setBlastData] = useState<any>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Lifecycle transition
  const [targetStage, setTargetStage] = useState<LifecycleStage>('MAINTENANCE');
  const [transitioning, setTransitioning] = useState(false);
  const [transitionError, setTransitionError] = useState<string | null>(null);

  // New Maintenance Work Order form
  const [newMaintTitle, setNewMaintTitle] = useState('');
  const [newMaintCost, setNewMaintCost] = useState(1200);
  const [loggingMaint, setLoggingMaint] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      ApiClient.getAsset(assetTag),
      ApiClient.getMaintenance(assetTag),
      ApiClient.getRepairVsReplace(assetTag),
      ApiClient.getPredictiveFailure(assetTag),
    ])
      .then(([assetRes, maintRes, repairRes, predRes]) => {
        setAsset(assetRes.asset);
        setMaintenance(maintRes.records || []);
        setRepairAnalysis(repairRes.analysis);
        setPrediction(predRes.prediction);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    loadData();
  }, [assetTag]);

  const handleSimulateBlast = async () => {
    try {
      const res = await ApiClient.getBlastRadius(assetTag);
      setBlastData(res.blastRadius);
      setBlastModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to simulate blast radius');
    }
  };

  const handleLifecycleTransition = async () => {
    setTransitioning(true);
    setTransitionError(null);
    try {
      const res = await ApiClient.transitionLifecycle(assetTag, targetStage, `Manual transition to ${targetStage}`);
      setAsset(res.asset);
    } catch (err: any) {
      setTransitionError(err.message || 'Illegal lifecycle transition');
    } finally {
      setTransitioning(false);
    }
  };

  const handleLogMaintenance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMaintTitle) return;
    setLoggingMaint(true);
    try {
      await ApiClient.createMaintenance({
        assetTag,
        type: 'CORRECTIVE',
        status: 'IN_PROGRESS',
        title: newMaintTitle,
        description: 'Field diagnostic intervention logged from Digital Twin view',
        scheduledDate: new Date().toISOString(),
        downtimeMinutes: 60,
        cost: Number(newMaintCost),
        partsReplaced: [],
      });
      setNewMaintTitle('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to log maintenance work order');
    } finally {
      setLoggingMaint(false);
    }
  };

  if (loading || !asset) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400">Loading Digital Twin for {assetTag}...</span>
        </div>
      </div>
    );
  }

  const daysToWarranty = asset.warrantyEndDate
    ? Math.ceil((new Date(asset.warrantyEndDate).getTime() - new Date('2026-09-28T00:00:00Z').getTime()) / (1000 * 3600 * 24))
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Controls */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-medium border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Inventory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setQrModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 transition-colors"
          >
            <QrCode className="w-4 h-4 text-indigo-400" />
            <span>Generate QR Twin</span>
          </button>

          <button
            onClick={handleSimulateBlast}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white text-xs font-bold border border-rose-500/30 transition-colors shadow-lg shadow-rose-950/40"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Failure Blast Radius</span>
          </button>
        </div>
      </div>

      {/* Hero Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-sm font-black px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                {asset.assetTag}
              </span>
              <StatusBadge type="status" value={asset.status} size="md" />
              <StatusBadge type="criticality" value={asset.criticality} size="md" />
              <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-slate-800 text-slate-300 border border-slate-700">
                Stage: {asset.lifecycleStage}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-white">{asset.name}</h1>
            <p className="text-xs text-slate-400 font-mono">
              {asset.manufacturer} {asset.model} • S/N: {asset.serialNumber} • Firmware: {asset.firmwareVersion}
            </p>
          </div>

          {/* Quick Lifecycle Transition Widget */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 shrink-0">
            <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
              Lifecycle State Machine
            </div>
            {transitionError && (
              <div className="text-[10px] text-rose-400 mb-2 max-w-xs">{transitionError}</div>
            )}
            <div className="flex items-center gap-2">
              <select
                value={targetStage}
                onChange={(e) => setTargetStage(e.target.value as LifecycleStage)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 font-mono"
              >
                <option value="PLANNING">PLANNING</option>
                <option value="PROCUREMENT">PROCUREMENT</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="INVENTORIED">INVENTORIED</option>
                <option value="DEPLOYED">DEPLOYED</option>
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="TRANSFERRED">TRANSFERRED</option>
                <option value="RETIRED">RETIRED</option>
                <option value="DISPOSED">DISPOSED</option>
              </select>
              <button
                onClick={handleLifecycleTransition}
                disabled={transitioning || targetStage === asset.lifecycleStage}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
              >
                {transitioning ? 'Updating...' : 'Transition'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Health & Risk Gauges (Transparent Scoring) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ScoreGauge
          type="health"
          score={asset.healthScore}
          label="Infrastructure Health Score"
          factors={asset.healthFactors}
        />
        <ScoreGauge
          type="risk"
          score={asset.riskScore}
          label="Composite Risk Exposure"
          factors={asset.riskFactors}
        />
      </div>

      {/* Row: Machine Learning Predictive Maintenance & Economic Repair vs Replace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ML Predictive Prognostics */}
        {prediction && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Predictive Prognostics (ML)</h3>
                  <p className="text-xs text-slate-400">Scikit-Learn Random Forest failure forecast</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Confidence: {Math.round(prediction.confidenceScore * 100)}%
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400">90-Day Failure Probability</span>
                <span className={`text-xl font-black font-mono ${prediction.failureProbabilityNext90Days >= 0.7 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {Math.round(prediction.failureProbabilityNext90Days * 100)}%
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                <div
                  className={`h-full rounded-full ${prediction.failureProbabilityNext90Days >= 0.7 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                  style={{ width: `${prediction.failureProbabilityNext90Days * 100}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Predicted MTBF Window:</span>
                <span className="font-mono font-bold text-slate-200">~{prediction.predictedTimeToFailureDays} Days</span>
              </div>
            </div>

            {/* Feature Importance */}
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Top Contributing Telemetry Features
              </div>
              {prediction.keyContributingFactors.map((f: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 p-2 rounded border border-slate-800/60">
                  <span className="text-slate-300">{f.feature}</span>
                  <span className="font-mono font-bold text-rose-400">+{f.impact}% weight</span>
                </div>
              ))}
            </div>

            {/* Prescriptive Action */}
            <div className="p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 text-xs text-indigo-300">
              <span className="font-bold text-indigo-200">Prescriptive Action: </span>
              {prediction.prescriptiveActions[0]}
            </div>
          </div>
        )}

        {/* Economic Repair vs Replace Decision Support */}
        {repairAnalysis && (
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Repair vs. Replace Economic Model</h3>
                  <p className="text-xs text-slate-400">Net Present Cost (NPC) comparison</p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${
                  repairAnalysis.recommendation === 'REPLACE'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : repairAnalysis.recommendation === 'REPAIR'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                }`}
              >
                RECOMMENDED: {repairAnalysis.recommendation}
              </span>
            </div>

            {/* Side by side NPC comparison */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">NPC to Continue & Repair</div>
                <div className="text-xl font-black font-mono text-rose-400">
                  ${repairAnalysis.netPresentCostRepair.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Includes downtime risk & maintenance drain</div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="text-xs text-slate-400 mb-1">NPC for New Replacement</div>
                <div className="text-xl font-black font-mono text-emerald-400">
                  ${repairAnalysis.netPresentCostReplace.toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-500 mt-1">Net of 8% salvage value rebate</div>
              </div>
            </div>

            {/* Economic Rationale */}
            <div className="space-y-1.5 mb-4">
              <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Financial Decision Rationale
              </div>
              {repairAnalysis.rationale.map((r: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <span className="text-indigo-400 font-bold">•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Capital Savings Opportunity:</span>
              <span className="font-mono font-bold text-slate-200">
                ${repairAnalysis.economicSavingsOpportunity.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Row: Technical Specifications, Location Coordinates & Warranty */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Physical Coordinates & Rack Locator */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-400" />
            <span>Physical Datacenter Coordinates</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Facility / Site</span>
              <span className="text-slate-200 font-semibold">{asset.location.siteName}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Room / Hall</span>
              <span className="text-slate-200 font-semibold">{asset.location.room}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Rack Identifier</span>
              <span className="text-indigo-400 font-mono font-bold">{asset.location.rack}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Rack Unit Elevation</span>
              <span className="text-slate-200 font-mono font-bold">
                U{asset.location.rackUnitStart} to U{asset.location.rackUnitEnd}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Custodian</span>
              <span className="text-slate-200 font-semibold">{asset.custodianName}</span>
            </div>
          </div>
        </div>

        {/* Operating Telemetry */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Live Operating Telemetry</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">IP Address</span>
              <span className="text-slate-200 font-mono">{asset.ipAddress || '10.10.x.x'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">MAC Address</span>
              <span className="text-slate-200 font-mono">{asset.macAddress || '00:00:00:00:00:00'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">CPU Core Utilization</span>
              <span className="text-slate-200 font-mono font-bold">
                {asset.telemetry.cpuUtilizationPct}%
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Chassis Temp</span>
              <span
                className={`font-mono font-bold ${
                  asset.telemetry.temperatureCelsius > 75
                    ? 'text-rose-400'
                    : asset.telemetry.temperatureCelsius > 65
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {asset.telemetry.temperatureCelsius}°C
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">Bus Error Rate</span>
              <span className="text-slate-200 font-mono">
                {asset.telemetry.errorRatePerMin} errors/min
              </span>
            </div>
          </div>
        </div>

        {/* Financial & Warranty Intelligence */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <h3 className="text-sm font-bold text-slate-100 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span>Warranty & TCO Ledger</span>
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Purchase CapEx</span>
              <span className="text-slate-200 font-mono font-bold">
                ${asset.purchaseCost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Cumulative Maintenance</span>
              <span className="text-rose-400 font-mono font-bold">
                ${asset.accumulatedMaintenanceCost.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-800">
              <span className="text-slate-400">Warranty Expiration</span>
              <span className="text-slate-200 font-mono">
                {new Date(asset.warrantyEndDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-slate-400">OEM Support Status</span>
              <span
                className={`font-bold ${
                  daysToWarranty < 0
                    ? 'text-rose-400'
                    : daysToWarranty <= 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {daysToWarranty < 0 ? `Expired (${Math.abs(daysToWarranty)}d ago)` : `Valid (${daysToWarranty}d left)`}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Maintenance History & Logging Form */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-100">Maintenance & Work Order History</h3>
            <p className="text-xs text-slate-400">Tamper-evident service and repairs record</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-slate-800 text-slate-300">
            {maintenance.length} Work Orders
          </span>
        </div>

        {/* Quick Log Form */}
        <form onSubmit={handleLogMaintenance} className="flex flex-wrap items-center gap-2 p-3 bg-slate-950 rounded-xl border border-slate-800 mb-4">
          <input
            type="text"
            placeholder="Log quick maintenance issue (e.g. Replace Fan Tray 2)"
            value={newMaintTitle}
            onChange={(e) => setNewMaintTitle(e.target.value)}
            className="flex-1 min-w-[200px] px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            required
          />
          <input
            type="number"
            placeholder="Est Cost ($)"
            value={newMaintCost}
            onChange={(e) => setNewMaintCost(Number(e.target.value))}
            className="w-28 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500 font-mono"
          />
          <button
            type="submit"
            disabled={loggingMaint}
            className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
          >
            {loggingMaint ? 'Logging...' : 'Log Work Order'}
          </button>
        </form>

        {/* Maintenance Log Table */}
        {maintenance.length === 0 ? (
          <div className="text-center py-6 text-slate-500 text-xs font-mono">
            No previous maintenance tickets recorded for this asset.
          </div>
        ) : (
          <div className="space-y-2">
            {maintenance.map((m) => (
              <div
                key={m.id}
                className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono font-bold text-indigo-400">{m.ticketId}</span>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">
                      {m.type}
                    </span>
                    <span className="px-2 py-0.2 rounded text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
                      {m.status}
                    </span>
                  </div>
                  <div className="font-semibold text-slate-200">{m.title}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{m.description}</div>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <div className="font-bold text-rose-400">${m.cost.toLocaleString()}</div>
                  <div className="text-[10px] text-slate-500">
                    Tech: {m.technicianName} • {new Date(m.scheduledDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <BlastRadiusModal blast={blastModalOpen ? blastData : null} onClose={() => setBlastModalOpen(false)} />
      <QrModal
        assetTag={qrModalOpen ? asset.assetTag : null}
        assetName={asset.name}
        onClose={() => setQrModalOpen(false)}
        onOpenScanner={onOpenScanner}
      />
    </div>
  );
};
