import React, { useEffect, useState } from 'react';
import { ApiClient } from '../lib/api';
import {
  Server,
  ShieldAlert,
  HeartPulse,
  Radar,
  Calendar,
  Wrench,
  DollarSign,
  TrendingUp,
  AlertOctagon,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from 'recharts';

interface DashboardPageProps {
  onNavigateAsset: (assetTag: string) => void;
  onNavigateTab: (tab: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ onNavigateAsset, onNavigateTab }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ApiClient.getDashboardKPIs()
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-mono text-slate-400">Loading Enterprise Telemetry...</span>
        </div>
      </div>
    );
  }

  const { kpis, charts } = data;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Shadow Assets or Critical Degradations exist */}
      {kpis.unknownAssets > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <AlertOctagon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-sm font-bold text-rose-200">
                Security Alert: {kpis.unknownAssets} Unidentified Rogue Endpoints Detected
              </div>
              <div className="text-xs text-rose-300/80">
                Network discovery sweeps observed active devices on subnet 10.14.20.0/24 without corresponding inventory registrations.
              </div>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('discovery')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors shadow-lg shadow-rose-600/30"
          >
            <span>Triage Shadow IT</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 8 Primary Executive KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Fleet Assets</span>
            <Server className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-3xl font-black font-mono text-white mb-1">
            {kpis.totalAssets}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Enterprise CIs</span>
            <span className="text-emerald-400 font-semibold font-mono">100% Tracked</span>
          </div>
        </div>

        {/* Healthy Assets */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Healthy (&ge;80)</span>
            <HeartPulse className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-emerald-400 mb-1">
            {kpis.healthyAssets}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Nominal Operations</span>
            <span className="font-mono text-slate-300 font-semibold">
              {Math.round((kpis.healthyAssets / kpis.totalAssets) * 100)}%
            </span>
          </div>
        </div>

        {/* High Risk Assets */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">High Risk (&ge;70)</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-400 mb-1">
            {kpis.highRiskAssets}
          </div>
          <div className="text-[11px] text-rose-300/80 flex items-center justify-between">
            <span>Critical Attention</span>
            <button
              onClick={() => onNavigateAsset('AST-SRV-000041')}
              className="text-[10px] underline font-semibold text-rose-400 hover:text-rose-300"
            >
              Inspect ERP Server
            </button>
          </div>
        </div>

        {/* Tier 1 Critical */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tier 1 Critical</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-3xl font-black font-mono text-purple-300 mb-1">
            {kpis.criticalAssets}
          </div>
          <div className="text-[11px] text-slate-400">
            Mission-critical core topology nodes
          </div>
        </div>

        {/* Shadow IT Rogues */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-rose-500/50 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Shadow IT Devices</span>
            <Radar className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-3xl font-black font-mono text-rose-400 mb-1">
            {kpis.unknownAssets}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span>Uncatalogued</span>
            <span className="text-rose-400 font-bold font-mono">13 Pending Triage</span>
          </div>
        </div>

        {/* Warranty Expiring */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Warranty Expired / &lt;30d</span>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-black font-mono text-amber-400 mb-1">
            {kpis.warrantyExpiringSoon}
          </div>
          <div className="text-[11px] text-slate-400">
            {kpis.warrantyExpired} expired, SLA renewals due
          </div>
        </div>

        {/* Under Maintenance */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Maintenance</span>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-3xl font-black font-mono text-blue-400 mb-1">
            {kpis.assetsUnderMaintenance}
          </div>
          <div className="text-[11px] text-slate-400">
            Active service orders in progress
          </div>
        </div>

        {/* Fleet Valuation */}
        <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition-colors">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Fleet Replacement Cost</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-black font-mono text-slate-100 mb-1">
            ${(kpis.totalReplacementValue / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-slate-400">
            CapEx Replacement Exposure
          </div>
        </div>
      </div>

      {/* Row 2: Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Donut */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Multi-Factor Risk Distribution</h3>
              <p className="text-xs text-slate-400">Fleet segmented by composite vulnerability</p>
            </div>
            <ShieldAlert className="w-4 h-4 text-indigo-400" />
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {charts.riskDistribution.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2 border-t border-slate-800/80 pt-3">
            {charts.riskDistribution.map((item: any, idx: number) => (
              <div key={idx}>
                <div className="font-bold text-slate-100 font-mono text-sm">{item.value}</div>
                <div className="text-[10px] text-slate-400 truncate">{item.name.split(' ')[0]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Warranty Expiration Timeline */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">OEM Warranty Expiration Cohorts</h3>
              <p className="text-xs text-slate-400">Support contract deadline exposure</p>
            </div>
            <Calendar className="w-4 h-4 text-amber-400" />
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.warrantyCohorts} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {charts.warrantyCohorts.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-400 mt-2 border-t border-slate-800/80 pt-3 flex justify-between">
            <span>Critical renewal window:</span>
            <span className="font-semibold text-rose-400 font-mono">
              {kpis.warrantyExpiringSoon} assets requiring immediate renewal
            </span>
          </div>
        </div>

        {/* Monthly Maintenance Spend */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Monthly Maintenance Spend</h3>
              <p className="text-xs text-slate-400">Cumulative repair & spare parts expenditure</p>
            </div>
            <Wrench className="w-4 h-4 text-blue-400" />
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.monthlyMaintenanceTrends} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  formatter={(val: any) => [`$${val.toLocaleString()}`, 'Spend']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="spend" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#spendGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="text-xs text-slate-400 mt-2 border-t border-slate-800/80 pt-3 flex justify-between">
            <span>6-Month Total:</span>
            <span className="font-semibold text-slate-200 font-mono">
              ${kpis.totalMaintenanceSpend.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Row 3: Equipment Categories & Datacenter Facility Footprint */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100">Equipment Inventory By Category</h3>
            <span className="text-xs text-slate-400 font-mono">10 Heterogeneous Classes</span>
          </div>

          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={charts.categoryDistribution}
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                  itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Datacenter Facilities Footprint */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-100">Datacenter Facilities & Site Footprint</h3>
            <span className="text-xs text-slate-400 font-mono">4 Global Regions</span>
          </div>

          <div className="space-y-3">
            {charts.locationDistribution.map((loc: any, idx: number) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/70 border border-slate-800/80"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-mono font-bold text-xs text-indigo-400">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-200">{loc.name}</div>
                    <div className="text-xs text-slate-400">Active Racks, UPS, Cooling & ToR Switches</div>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-slate-100">{loc.value}</span>
                  <span className="text-xs text-slate-400 ml-1">Assets</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
