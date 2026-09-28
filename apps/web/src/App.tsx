import React, { useState } from 'react';
import { UserRole } from '@infra360/types';
import { Navbar } from './components/Navbar';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { AssetDetailPage } from './pages/AssetDetailPage';
import { TopologyPage } from './pages/TopologyPage';
import { DiscoveryPage } from './pages/DiscoveryPage';
import { ScannerPage } from './pages/ScannerPage';
import { AiPage } from './pages/AiPage';
import { AuditPage } from './pages/AuditPage';
import { ApiClient } from './lib/api';
import { Sparkles, Layers, ShieldCheck, Compass, HelpCircle } from 'lucide-react';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedAssetTag, setSelectedAssetTag] = useState<string | null>(null);
  const [scanAssetTag, setScanAssetTag] = useState<string>('AST-SRV-000041');
  const [activeRole, setActiveRole] = useState<UserRole>(ApiClient.getRole());
  const [demoTourOpen, setDemoTourOpen] = useState(false);

  const handleSelectAsset = (assetTag: string) => {
    setSelectedAssetTag(assetTag);
  };

  const handleBackToInventory = () => {
    setSelectedAssetTag(null);
  };

  const handleSelectTab = (tab: string) => {
    setSelectedAssetTag(null);
    setCurrentTab(tab);
  };

  const handleRoleChange = (role: UserRole) => {
    setActiveRole(role);
  };

  const demoScenes = [
    { title: 'Scene 1: Executive Dashboard', tab: 'dashboard', action: () => handleSelectTab('dashboard') },
    { title: 'Scene 2: Asset Inventory (500+ Assets)', tab: 'inventory', action: () => handleSelectTab('inventory') },
    { title: 'Scene 3 & 4: Digital Twin & Explainable Health (AST-SRV-000041)', tab: 'inventory', action: () => { handleSelectTab('inventory'); setSelectedAssetTag('AST-SRV-000041'); } },
    { title: 'Scene 5 & 6: Interactive Topology & Failure Blast Radius', tab: 'topology', action: () => handleSelectTab('topology') },
    { title: 'Scene 7 & 8: Shadow IT Rogue Detection & One-Click Registration', tab: 'discovery', action: () => handleSelectTab('discovery') },
    { title: 'Scene 9 & 10: Grounded INFRA-AI Copilot (AST translation)', tab: 'ai', action: () => handleSelectTab('ai') },
    { title: 'Scene 11 & 12: Predictive Prognostics & Repair vs Replace', tab: 'inventory', action: () => { handleSelectTab('inventory'); setSelectedAssetTag('AST-SRV-000041'); } },
    { title: 'Scene 13: Physical-to-Digital Mobile QR Twin', tab: 'scan', action: () => handleSelectTab('scan') },
    { title: 'Scene 14 & 15: Immutable Audit Ledger & Executive Wrap', tab: 'audit', action: () => handleSelectTab('audit') },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      {/* Navigation */}
      <Navbar
        currentTab={selectedAssetTag ? 'inventory' : currentTab}
        onSelectTab={handleSelectTab}
        onRoleChange={handleRoleChange}
        activeRole={activeRole}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {selectedAssetTag ? (
          <AssetDetailPage
            assetTag={selectedAssetTag}
            onBack={handleBackToInventory}
            onOpenScanner={(tag) => {
              setSelectedAssetTag(null);
              setScanAssetTag(tag);
              setCurrentTab('scan');
            }}
          />
        ) : (
          <>
            {currentTab === 'dashboard' && (
              <DashboardPage
                onNavigateAsset={(tag) => setSelectedAssetTag(tag)}
                onNavigateTab={handleSelectTab}
              />
            )}
            {currentTab === 'inventory' && (
              <InventoryPage
                onSelectAsset={handleSelectAsset}
                onOpenScanner={(tag) => {
                  setSelectedAssetTag(null);
                  setScanAssetTag(tag);
                  setCurrentTab('scan');
                }}
              />
            )}
            {currentTab === 'topology' && <TopologyPage onSelectAsset={handleSelectAsset} />}
            {currentTab === 'discovery' && <DiscoveryPage onSelectAsset={handleSelectAsset} />}
            {currentTab === 'scan' && (
              <ScannerPage
                initialAssetTag={scanAssetTag}
                onOpenAssetDetail={handleSelectAsset}
              />
            )}
            {currentTab === 'ai' && <AiPage onSelectAsset={handleSelectAsset} />}
            {currentTab === 'audit' && <AuditPage />}
          </>
        )}
      </main>

      {/* Floating Demo Tour Navigator (For Judges and Evaluators) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setDemoTourOpen(!demoTourOpen)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-2xl shadow-indigo-600/50 border border-indigo-400/30 transition-all hover:scale-105"
        >
          <Compass className="w-4 h-4 animate-spin" />
          <span>Demo Story Navigator (15 Scenes)</span>
        </button>

        {demoTourOpen && (
          <div className="absolute bottom-12 right-0 w-80 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-3 mb-2 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>5-7 Minute Official Demo Arc</span>
              </span>
              <button
                onClick={() => setDemoTourOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                &times;
              </button>
            </div>
            <div className="py-2 space-y-1 max-h-72 overflow-y-auto pr-1 text-xs">
              {demoScenes.map((scene, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    scene.action();
                    setDemoTourOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-slate-300 hover:bg-slate-800 hover:text-indigo-300 transition-colors flex items-center justify-between"
                >
                  <span className="truncate">{scene.title}</span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-1">&rarr;</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-4 px-6 text-center text-xs text-slate-500 font-mono">
        INFRA360 — Intelligent Infrastructure Asset Lifecycle & Intelligence Platform • Enterprise Edition 2026
      </footer>
    </div>
  );
};
