import React, { useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { IAsset } from '@infra360/types';
import { StatusBadge } from '../components/StatusBadge';
import { CreateAssetModal } from '../components/CreateAssetModal';
import { QrModal } from '../components/QrModal';
import {
  Search,
  Filter,
  Plus,
  QrCode,
  Eye,
  RefreshCw,
  AlertTriangle,
  Server,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface InventoryPageProps {
  onSelectAsset: (assetTag: string) => void;
  onOpenScanner?: (assetTag: string) => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ onSelectAsset, onOpenScanner }) => {
  const [assets, setAssets] = useState<IAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [status, setStatus] = useState('ALL');
  const [criticality, setCriticality] = useState('ALL');
  const [minRisk, setMinRisk] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(0);
  const limit = 25;

  // Modals
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [qrModalAsset, setQrModalAsset] = useState<IAsset | null>(null);

  const fetchAssets = () => {
    setLoading(true);
    ApiClient.getAssets({
      search,
      category: category === 'ALL' ? undefined : category,
      status: status === 'ALL' ? undefined : status,
      criticality: criticality === 'ALL' ? undefined : criticality,
      minRisk,
      skip: page * limit,
      limit,
    })
      .then((res) => {
        setAssets(res.assets || []);
        setTotal(res.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchAssets();
  }, [search, category, status, criticality, minRisk, page]);

  return (
    <div className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100">Enterprise Infrastructure Inventory</h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {total} Assets
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time digital twin repository with continuous health telemetry and topological dependency mapping.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchAssets()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Onboard Asset</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tag, name, IP, serial, model..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 placeholder:text-slate-500"
          />
        </div>

        {/* Category */}
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
        >
          <option value="ALL">All Categories</option>
          <option value="SERVER">Servers</option>
          <option value="SWITCH">Switches</option>
          <option value="ROUTER">Routers</option>
          <option value="FIREWALL">Firewalls</option>
          <option value="STORAGE">Storage SAN/NAS</option>
          <option value="UPS">Modular UPS</option>
          <option value="ACCESS_POINT">Access Points</option>
          <option value="WORKSTATION">Workstations</option>
          <option value="IOT">IoT Devices</option>
        </select>

        {/* Status */}
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
        >
          <option value="ALL">All Statuses</option>
          <option value="OPERATIONAL">Operational</option>
          <option value="DEGRADED">Degraded</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="DEFECTIVE">Defective</option>
          <option value="OFFLINE">Offline</option>
        </select>

        {/* Criticality */}
        <select
          value={criticality}
          onChange={(e) => {
            setCriticality(e.target.value);
            setPage(0);
          }}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
        >
          <option value="ALL">All Criticalities</option>
          <option value="TIER_1_CRITICAL">Tier 1 Critical</option>
          <option value="TIER_2_OPERATIONAL">Tier 2 Operational</option>
          <option value="TIER_3_SUPPORT">Tier 3 Support</option>
        </select>

        {/* High Risk Toggle */}
        <button
          onClick={() => {
            setMinRisk(minRisk === 70 ? undefined : 70);
            setPage(0);
          }}
          className={`px-3 py-2 rounded-lg border font-semibold transition-colors flex items-center gap-1.5 ${
            minRisk === 70
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
              : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>High Risk Only (&ge;70)</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Asset ID</th>
                <th className="py-3 px-4">Name & Specs</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Location (Rack)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Health</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    Loading inventory records...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    No matching infrastructure assets found.
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.assetTag}
                    className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                    onClick={() => onSelectAsset(asset.assetTag)}
                  >
                    {/* Tag */}
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-400 whitespace-nowrap">
                      {asset.assetTag}
                    </td>

                    {/* Name & Hardware */}
                    <td className="py-3.5 px-4 max-w-[260px]">
                      <div className="font-semibold text-slate-100 truncate group-hover:text-indigo-300 transition-colors">
                        {asset.name}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        {asset.manufacturer} {asset.model} • {asset.ipAddress || '10.10.x.x'}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                        {asset.category}
                      </span>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-slate-200 font-mono text-[11px]">
                        {asset.location.rack} (U{asset.location.rackUnitStart}-{asset.location.rackUnitEnd})
                      </div>
                      <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                        {asset.location.siteId} • {asset.location.room}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge type="status" value={asset.status} />
                    </td>

                    {/* Health */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                      <span
                        className={
                          asset.healthScore < 50
                            ? 'text-rose-400'
                            : asset.healthScore < 75
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }
                      >
                        {asset.healthScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">/100</span>
                    </td>

                    {/* Risk */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-mono font-bold">
                      <span className={asset.riskScore >= 70 ? 'text-rose-400' : 'text-slate-300'}>
                        {asset.riskScore}
                      </span>
                      <span className="text-[10px] text-slate-500 font-normal">/100</span>
                    </td>

                    {/* Criticality */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <StatusBadge type="criticality" value={asset.criticality} />
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setQrModalAsset(asset)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                          title="Generate QR Tag"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectAsset(asset.assetTag)}
                          className="p-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white transition-colors"
                          title="View Digital Twin"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{page * limit + 1}</span> to{' '}
            <span className="font-semibold text-slate-200">{Math.min(total, (page + 1) * limit)}</span> of{' '}
            <span className="font-semibold text-slate-200">{total}</span> assets
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-slate-300 text-xs">
              Page {page + 1} of {Math.ceil(total / limit) || 1}
            </span>
            <button
              disabled={(page + 1) * limit >= total}
              onClick={() => setPage(page + 1)}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 disabled:opacity-40 disabled:hover:bg-slate-900 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateAssetModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onAssetCreated={(newAsset) => {
          fetchAssets();
          onSelectAsset(newAsset.assetTag);
        }}
      />

      <QrModal
        assetTag={qrModalAsset?.assetTag || null}
        assetName={qrModalAsset?.name}
        onClose={() => setQrModalAsset(null)}
        onOpenScanner={onOpenScanner}
      />
    </div>
  );
};
