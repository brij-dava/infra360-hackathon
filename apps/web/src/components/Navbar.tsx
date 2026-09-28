import React, { useState, useEffect } from 'react';
import { UserRole, IUser } from '@infra360/types';
import { ApiClient } from '../lib/api';
import {
  Layers,
  LayoutDashboard,
  Server,
  Network,
  Radar,
  QrCode,
  Sparkles,
  ShieldAlert,
  History,
  UserCheck,
  ChevronDown,
} from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onRoleChange: (role: UserRole) => void;
  activeRole: UserRole;
  shadowCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onRoleChange,
  activeRole,
  shadowCount = 13,
}) => {
  const [personas, setPersonas] = useState<IUser[]>([]);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);

  useEffect(() => {
    ApiClient.getPersonas()
      .then((res) => setPersonas(res.users || []))
      .catch((err) => console.error(err));
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Executive Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'inventory', label: 'Asset Inventory', icon: <Server className="w-4 h-4" /> },
    { id: 'topology', label: 'Topology & Blast Radius', icon: <Network className="w-4 h-4" /> },
    {
      id: 'discovery',
      label: 'Shadow IT',
      icon: <Radar className="w-4 h-4" />,
      badge: shadowCount > 0 ? `${shadowCount}` : undefined,
    },
    { id: 'scan', label: 'Field QR Twin', icon: <QrCode className="w-4 h-4" /> },
    { id: 'ai', label: 'INFRA-AI', icon: <Sparkles className="w-4 h-4 text-indigo-400" /> },
    { id: 'audit', label: 'Audit Ledger', icon: <History className="w-4 h-4" /> },
  ];

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'IT_MANAGER':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'INFRA_ENGINEER':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'TECHNICIAN':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'SECURITY_ANALYST':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'AUDITOR':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-2.5 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30 text-white font-black tracking-tighter">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight text-white font-mono">INFRA360</span>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                INTELLIGENCE v1.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Know every asset. Understand every dependency. Predict every risk.
            </p>
          </div>
        </div>

        {/* Right Section: System status & Role Switcher */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Fleet Telemetry Nominal</span>
            <span className="text-slate-600">|</span>
            <span className="text-rose-400 font-semibold">{shadowCount} Rogues Flagged</span>
          </div>

          {/* Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-200 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">Role:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${getRoleBadgeColor(activeRole)}`}>
                {activeRole.replace('_', ' ')}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {roleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="text-[10px] uppercase font-bold text-slate-400 px-2 py-1 tracking-wider border-b border-slate-800/80 mb-1">
                  Switch Active Persona (RBAC Demo)
                </div>
                {personas.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => {
                      onRoleChange(u.role);
                      ApiClient.setRole(u.role);
                      setRoleDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                      activeRole === u.role ? 'bg-indigo-600/20 text-indigo-200 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-[10px] text-slate-500">{u.department}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${getRoleBadgeColor(u.role)}`}>
                      {u.role}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav className="flex items-center px-6 gap-1 overflow-x-auto no-scrollbar bg-slate-950">
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                isActive
                  ? 'border-indigo-500 text-white bg-indigo-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
