import React, { useState, useEffect } from 'react';
import { ApiClient } from '../lib/api';
import { IDiscoveredDevice, TriageStatus } from '@infra360/types';
import {
  Radar,
  ShieldAlert,
  CheckCircle,
  PlusCircle,
  Lock,
  EyeOff,
  RefreshCw,
  Search,
  ExternalLink,
  Cpu,
  Wifi,
} from 'lucide-react';

interface DiscoveryPageProps {
  onSelectAsset?: (assetTag: string) => void;
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onSelectAsset }) => {
  const [devices, setDevices] = useState<IDiscoveredDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchDevices = () => {
    setLoading(true);
    ApiClient.getDiscoveredDevices(filterStatus === 'ALL' ? undefined : filterStatus)
      .then((res) => {
        setDevices(res.devices || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDevices();
  }, [filterStatus]);

  const handleScan = async () => {
    setScanning(true);
    try {
      const res = await ApiClient.triggerDiscoveryScan('10.14.20.0/24');
      setFeedback(`Active subnet sweep completed. Observed ${res.newDevicesFound || 0} newly active endpoints.`);
      fetchDevices();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Scan failed');
    } finally {
      setScanning(false);
    }
  };

  const handleTriage = async (deviceId: string, action: TriageStatus, targetCategory: string = 'SERVER') => {
    try {
      const res = await ApiClient.triageDevice(deviceId, action, targetCategory);
      if (res.registeredAsset) {
        setFeedback(`Successfully registered discovered device as managed asset: ${res.registeredAsset.assetTag}`);
      } else {
        setFeedback(`Device status updated to ${action}`);
      }
      fetchDevices();
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      alert(err.message || 'Triage failed');
    }
  };

  const unidentifiedCount = devices.filter((d) => d.triageStatus === 'UNIDENTIFIED').length;
  const filtered = devices.filter((d) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      d.ipAddress.includes(q) ||
      d.macAddress.toLowerCase().includes(q) ||
      d.detectedManufacturer.toLowerCase().includes(q) ||
      d.detectedType.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner: Discovery Comparison */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Radar className="w-5 h-5 animate-spin" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">
                Shadow IT & Rogue Hardware Detection
              </h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Continuous Layer 2/3 ARP sweeps and SNMP probes cross-reference active network endpoints against the authorized inventory ledger.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Authorized Target: </span>
                <span className="text-slate-200 font-bold">250 Assets</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500">Observed Endpoints: </span>
                <span className="text-indigo-400 font-bold">263 Devices</span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
                <span className="text-rose-400 font-bold">13 Unidentified Rogues</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
            <button
              onClick={handleScan}
              disabled={scanning}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${scanning ? 'animate-spin' : ''}`} />
              <span>{scanning ? 'Sweeping Subnets...' : 'Execute Network Subnet Sweep'}</span>
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-indigo-400 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search discovered devices by IP, MAC, Manufacturer, Fingerprint..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-100 placeholder:text-slate-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
        >
          <option value="ALL">All Triage Statuses</option>
          <option value="UNIDENTIFIED">Unidentified Rogues</option>
          <option value="INVESTIGATING">Investigating</option>
          <option value="REGISTERED">Registered into Inventory</option>
          <option value="AUTHORIZED_BYOD">Authorized BYOD</option>
          <option value="QUARANTINED">Quarantined on Switch</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {/* Discovered Devices Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Endpoint IP / MAC</th>
                <th className="py-3 px-4">Manufacturer & Fingerprint</th>
                <th className="py-3 px-4">Detected Hardware Type</th>
                <th className="py-3 px-4">Subnet</th>
                <th className="py-3 px-4">Open Ports</th>
                <th className="py-3 px-4">Risk</th>
                <th className="py-3 px-4">Triage Status</th>
                <th className="py-3 px-4 text-right">Triage Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    Polling network discovery feeds...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    No matching devices found in discovery ledger.
                  </td>
                </tr>
              ) : (
                filtered.map((device) => {
                  const isRogue = device.triageStatus === 'UNIDENTIFIED';
                  const isQuarantined = device.triageStatus === 'QUARANTINED';
                  const isRegistered = device.triageStatus === 'REGISTERED';

                  return (
                    <tr
                      key={device.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isRogue ? 'bg-rose-500/5' : ''
                      }`}
                    >
                      {/* IP / MAC */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-slate-100 flex items-center gap-1.5">
                          {device.ipAddress}
                        </div>
                        <div className="text-[11px] text-slate-400">{device.macAddress}</div>
                      </td>

                      {/* Manufacturer */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-200">{device.detectedManufacturer}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Probe Source: {device.discoverySource}
                        </div>
                      </td>

                      {/* Detected Type */}
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {device.detectedType}
                        </span>
                      </td>

                      {/* Subnet */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                        {device.subnet}
                      </td>

                      {/* Open Ports */}
                      <td className="py-3.5 px-4 font-mono">
                        {device.openPorts && device.openPorts.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {device.openPorts.map((p) => (
                              <span
                                key={p}
                                className={`px-1.5 py-0.2 rounded text-[10px] ${
                                  p === 22 || p === 502
                                    ? 'bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30'
                                    : 'bg-slate-800 text-slate-300'
                                }`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500">None detected</span>
                        )}
                      </td>

                      {/* Risk */}
                      <td className="py-3.5 px-4 font-mono font-bold">
                        <span
                          className={
                            device.riskScore >= 75
                              ? 'text-rose-400'
                              : device.riskScore >= 50
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {device.riskScore}/100
                        </span>
                      </td>

                      {/* Triage Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            isRogue
                              ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse'
                              : isQuarantined
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : isRegistered
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}
                        >
                          {device.triageStatus}
                        </span>
                        {device.associatedAssetTag && (
                          <div className="text-[10px] font-mono text-indigo-400 mt-0.5">
                            Tag: {device.associatedAssetTag}
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isRegistered ? (
                          <button
                            onClick={() => onSelectAsset && onSelectAsset(device.associatedAssetTag!)}
                            className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white text-xs font-semibold transition-colors"
                          >
                            View Managed Twin
                          </button>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleTriage(device.id, 'REGISTERED', 'SERVER')}
                              className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors shadow-sm"
                              title="Convert to Managed Asset"
                            >
                              Register Asset
                            </button>
                            <button
                              onClick={() => handleTriage(device.id, 'QUARANTINED')}
                              className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-300 hover:text-rose-400 transition-colors"
                              title="Quarantine Switch Port"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleTriage(device.id, 'AUTHORIZED_BYOD')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                              title="Authorize as Non-Managed Peripheral"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-400" />
                            </button>
                            <button
                              onClick={() => handleTriage(device.id, 'DISMISSED')}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                              title="Dismiss / Ignore"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
