import React, { useState } from 'react';
import { ApiClient } from '../lib/api';
import { AssetCategory, Criticality } from '@infra360/types';
import { PlusCircle, X, Server } from 'lucide-react';

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated: (newAsset: any) => void;
}

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({ isOpen, onClose, onAssetCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'SERVER' as AssetCategory,
    manufacturer: '',
    model: '',
    serialNumber: '',
    siteId: 'DC-EAST-01',
    rack: 'Rack-A1',
    rackUnitStart: 10,
    rackUnitEnd: 12,
    department: 'Core Infrastructure',
    criticality: 'TIER_2_OPERATIONAL' as Criticality,
    purchaseCost: 15000,
    expectedLifespanMonths: 60,
    ipAddress: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.manufacturer || !formData.model) {
      setError('Please fill in all required fields (Name, Manufacturer, Model)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const siteNames: Record<string, string> = {
        'DC-EAST-01': 'Ashburn Datacenter Alpha',
        'DC-WEST-02': 'Oregon Datacenter Beta',
        'HQ-BLR-01': 'Bangalore Technology Center',
        'BR-LON-01': 'London Regional Operations',
      };

      const payload = {
        name: formData.name,
        category: formData.category,
        manufacturer: formData.manufacturer,
        model: formData.model,
        serialNumber: formData.serialNumber || `SN-${formData.manufacturer.substring(0, 3).toUpperCase()}-${Math.floor(Math.random() * 900000 + 100000)}`,
        criticality: formData.criticality,
        department: formData.department,
        purchaseCost: Number(formData.purchaseCost),
        expectedLifespanMonths: Number(formData.expectedLifespanMonths),
        ipAddress: formData.ipAddress || `10.10.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
        location: {
          siteId: formData.siteId,
          siteName: siteNames[formData.siteId] || 'Datacenter Primary',
          building: 'Building 1',
          floor: 'Floor 1',
          room: 'Server Room 101',
          rack: formData.rack,
          rackUnitStart: Number(formData.rackUnitStart),
          rackUnitEnd: Number(formData.rackUnitEnd),
        },
      };

      const res = await ApiClient.createAsset(payload);
      onAssetCreated(res.asset);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create asset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Onboard Infrastructure Asset</h3>
              <p className="text-xs text-slate-400">Registers digital twin, creates QR tag, and initializes telemetry</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Asset Name *</label>
              <input
                type="text"
                placeholder="e.g. Core Virtualization Cluster Host 03"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AssetCategory })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100"
              >
                <option value="SERVER">Server / Compute Node</option>
                <option value="SWITCH">Switch / Fabric</option>
                <option value="ROUTER">Router / Edge Gateway</option>
                <option value="FIREWALL">Next-Gen Firewall</option>
                <option value="STORAGE">Storage SAN / NAS</option>
                <option value="UPS">Modular UPS & PDU</option>
                <option value="ACCESS_POINT">Wi-Fi Access Point</option>
                <option value="WORKSTATION">Workstation</option>
                <option value="IOT">IoT / Telemetry Probe</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Business Criticality</label>
              <select
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value as Criticality })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100"
              >
                <option value="TIER_1_CRITICAL">Tier 1 Mission Critical</option>
                <option value="TIER_2_OPERATIONAL">Tier 2 Operational</option>
                <option value="TIER_3_SUPPORT">Tier 3 Supporting / Ancillary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Manufacturer *</label>
              <input
                type="text"
                placeholder="e.g. Dell, Cisco, HPE, Pure"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Model *</label>
              <input
                type="text"
                placeholder="e.g. PowerEdge R750"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number</label>
              <input
                type="text"
                placeholder="Auto-generated if left blank"
                value={formData.serialNumber}
                onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">IP Address</label>
              <input
                type="text"
                placeholder="e.g. 10.10.14.88"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Datacenter Site</label>
              <select
                value={formData.siteId}
                onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100"
              >
                <option value="DC-EAST-01">Ashburn Datacenter Alpha (DC-EAST-01)</option>
                <option value="DC-WEST-02">Oregon Datacenter Beta (DC-WEST-02)</option>
                <option value="HQ-BLR-01">Bangalore Technology Center (HQ-BLR-01)</option>
                <option value="BR-LON-01">London Regional Hub (BR-LON-01)</option>
              </select>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Rack</label>
                <input
                  type="text"
                  value={formData.rack}
                  onChange={(e) => setFormData({ ...formData, rack: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Start U</label>
                <input
                  type="number"
                  value={formData.rackUnitStart}
                  onChange={(e) => setFormData({ ...formData, rackUnitStart: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">End U</label>
                <input
                  type="number"
                  value={formData.rackUnitEnd}
                  onChange={(e) => setFormData({ ...formData, rackUnitEnd: parseInt(e.target.value) || 2 })}
                  className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Purchase Cost ($ USD)</label>
              <input
                type="number"
                value={formData.purchaseCost}
                onChange={(e) => setFormData({ ...formData, purchaseCost: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Lifespan (Months)</label>
              <input
                type="number"
                value={formData.expectedLifespanMonths}
                onChange={(e) => setFormData({ ...formData, expectedLifespanMonths: parseInt(e.target.value) || 60 })}
                className="w-full px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 font-mono"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {loading ? 'Registering Asset...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
