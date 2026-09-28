import React, { useState } from 'react';
import { ApiClient } from '../lib/api';
import { IAsset, INaturalLanguageQueryResult } from '@infra360/types';
import { StatusBadge } from '../components/StatusBadge';
import {
  Sparkles,
  Send,
  Code,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Database,
  Bot,
  User,
} from 'lucide-react';

interface AiPageProps {
  onSelectAsset: (assetTag: string) => void;
}

export const AiPage: React.FC<AiPageProps> = ({ onSelectAsset }) => {
  const [activeMode, setActiveMode] = useState<'NLQ' | 'CHAT'>('NLQ');

  // NLQ state
  const [nlqPrompt, setNlqPrompt] = useState('Show high-risk servers');
  const [nlqResult, setNlqResult] = useState<INaturalLanguageQueryResult | null>(null);
  const [nlqLoading, setNlqLoading] = useState(false);

  // Chat state
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string; context?: any }>>([
    {
      sender: 'ai',
      text: 'Hello, I am **INFRA-AI**. I have direct access to your verified telemetry, dependency topology, and lifecycle ledger. Ask me to evaluate the failure impact of any asset, summarize high-risk hardware, or forecast quarterly replacement capital needs.',
    },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const samplePrompts = [
    'Show high-risk servers',
    'Which warranties expire within 60 days?',
    'What happens if AST-NET-000012 fails?',
    'Show unknown shadow devices',
    'Which assets require attention this quarter and why?',
    'Show network assets in Ashburn',
  ];

  const handleExecuteNLQ = async (queryText: string) => {
    setNlqLoading(true);
    setNlqPrompt(queryText);
    try {
      const res = await ApiClient.queryAI(queryText);
      setNlqResult(res);
    } catch (err: any) {
      alert(err.message || 'Query failed');
    } finally {
      setNlqLoading(false);
    }
  };

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput.trim();
    setChatInput('');
    setChatMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setChatLoading(true);

    try {
      const res = await ApiClient.chatAI(userText);
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: res.response, context: res.groundedContext },
      ]);
    } catch (err: any) {
      setChatMessages((prev) => [
        ...prev,
        { sender: 'ai', text: `Error: ${err.message || 'Unable to query AI service'}` },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">INFRA-AI Grounded Intelligence Copilot</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl">
              Zero-hallucination architecture. Natural language is parsed into structured AST queries executed directly against validated telemetry and graph models.
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveMode('NLQ')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeMode === 'NLQ' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Natural Language Query (NLQ)
            </button>
            <button
              onClick={() => setActiveMode('CHAT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                activeMode === 'CHAT' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Grounded Diagnostic Chat
            </button>
          </div>
        </div>

        {/* Preset Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-800/80">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Example Prompts:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (activeMode === 'NLQ') {
                  handleExecuteNLQ(p);
                } else {
                  setChatInput(p);
                }
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 text-xs border border-slate-800/80 transition-colors"
            >
              "{p}"
            </button>
          ))}
        </div>
      </div>

      {activeMode === 'NLQ' ? (
        /* ======================== MODE 1: NLQ FILTER TRANSLATOR ======================== */
        <div className="space-y-6">
          {/* Query Bar */}
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
            <Sparkles className="w-5 h-5 text-indigo-400 ml-2" />
            <input
              type="text"
              value={nlqPrompt}
              onChange={(e) => setNlqPrompt(e.target.value)}
              placeholder="Ask anything (e.g. 'Which servers have warranty expiring in 60 days?')"
              className="flex-1 bg-transparent border-none text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none px-2"
              onKeyDown={(e) => e.key === 'Enter' && handleExecuteNLQ(nlqPrompt)}
            />
            <button
              onClick={() => handleExecuteNLQ(nlqPrompt)}
              disabled={nlqLoading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              {nlqLoading ? 'Translating...' : 'Execute Query'}
            </button>
          </div>

          {/* AST Translation Box */}
          {nlqResult && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-300 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-emerald-400" />
                  <span>Sanitized Structured Query Translation</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold">
                  {nlqResult.matchedAssetCount} Records Matched
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-300">
                <div className="text-[11px] text-slate-500 mb-1">// Parsed Intent: {nlqResult.interpretedIntent}</div>
                <div className="text-indigo-300">{JSON.stringify(nlqResult.structuredFilter, null, 2)}</div>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{nlqResult.explanation}</span>
              </div>
            </div>
          )}

          {/* Rendered Live Results Table */}
          {nlqResult && nlqResult.results && (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
              <div className="p-4 border-b border-slate-800 text-xs font-bold text-slate-200">
                Query Results ({nlqResult.results.length} Displayed)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Asset ID</th>
                      <th className="py-3 px-4">Name & Specs</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Health</th>
                      <th className="py-3 px-4">Risk</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {nlqResult.results.map((asset) => (
                      <tr
                        key={asset.assetTag}
                        onClick={() => onSelectAsset(asset.assetTag)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                          {asset.assetTag}
                        </td>
                        <td className="py-3.5 px-4 max-w-[240px]">
                          <div className="font-semibold text-slate-100 truncate group-hover:text-indigo-300">
                            {asset.name}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono truncate">
                            {asset.manufacturer} {asset.model} • {asset.location.rack}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                            {asset.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <StatusBadge type="status" value={asset.status} />
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {asset.healthScore}/100
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={asset.riskScore >= 70 ? 'text-rose-400' : 'text-slate-300'}>
                            {asset.riskScore}/100
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-indigo-400 text-xs font-semibold group-hover:underline">
                            Inspect &rarr;
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ======================== MODE 2: GROUNDED DIAGNOSTIC CHAT ======================== */
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="h-[480px] overflow-y-auto space-y-4 pr-2">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 text-xs leading-relaxed ${
                  msg.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-2xl p-4 rounded-2xl whitespace-pre-line shadow-md ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-950 text-slate-200 border border-slate-800/80 rounded-tl-none'
                  }`}
                >
                  <div>{msg.text}</div>

                  {msg.context && Object.keys(msg.context).length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
                        <Database className="w-3.5 h-3.5" />
                        <span>Grounded Telemetry Context:</span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800 text-[10px] overflow-x-auto max-h-32">
                        {JSON.stringify(msg.context, null, 2)}
                      </div>
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-indigo-400 font-mono p-3 bg-slate-950 rounded-xl border border-slate-800/80 max-w-xs">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <span>Executing database telemetry synthesis...</span>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendChat} className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask Infra-AI (e.g. 'What happens if AST-NET-000012 fails?')"
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
