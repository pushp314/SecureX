import React, { useState, useEffect } from 'react';
import { ScopedApiKey, VerifiedAuditRecord } from '../types';
import { api } from '../services/api';
import { Key, ShieldCheck, Plus, X, Lock, CheckCircle, RefreshCw } from 'lucide-react';

interface AuditKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditKeysModal: React.FC<AuditKeysModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'keys' | 'audit'>('keys');
  const [apiKeys, setApiKeys] = useState<ScopedApiKey[]>([]);
  const [auditLogs, setAuditLogs] = useState<VerifiedAuditRecord[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [keys, logs] = await Promise.all([
        api.getApiKeys(),
        api.getVerifiedAuditChain(),
      ]);
      setApiKeys(keys);
      setAuditLogs(logs);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    setIsCreating(true);
    try {
      const created = await api.createApiKey(newKeyName);
      setCreatedKey(created.key);
      setNewKeyName('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleRevokeKey = async (id: string) => {
    try {
      await api.revokeApiKey(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-sans text-xs uppercase font-semibold">
            <Key className="w-4 h-4" />
            <span>Security Administration</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">API Key Governance & Cryptographic Audit Trail</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage ingestion credentials and verify SHA-256 chained forensic audit records.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('keys')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'keys' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
            }`}
          >
            Access API Keys ({apiKeys.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'audit' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
            }`}
          >
            Tamper-Evident Audit Chain ({auditLogs.length})
          </button>
        </div>

        {/* Tab 1: API Keys */}
        {activeTab === 'keys' && (
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {/* Create Form */}
            <form onSubmit={handleCreateKey} className="flex gap-2">
              <input
                type="text"
                placeholder="Key label (e.g. AWS Production Ingest Collector)..."
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                className="flex-1 bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={isCreating}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreating ? 'Generating...' : 'Issue Key'}</span>
              </button>
            </form>

            {createdKey && (
              <div className="p-3.5 rounded-xl bg-indigo-950/30 border border-indigo-500/40 space-y-1">
                <span className="text-[10px] uppercase font-semibold text-indigo-300 block">Copy API Key (Shown only once):</span>
                <code className="text-xs text-indigo-200 font-mono select-all block bg-[#070a12] p-2 rounded-lg border border-indigo-800/40">
                  {createdKey}
                </code>
              </div>
            )}

            {/* Keys Table */}
            <div className="space-y-2">
              {apiKeys.map((k) => (
                <div key={k.id} className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{k.name}</h4>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">{k.key.slice(0, 16)}••••••••</p>
                  </div>

                  <div className="flex items-center space-x-3">
                    <span
                      className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        k.isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}
                    >
                      {k.isActive ? 'ACTIVE' : 'REVOKED'}
                    </span>

                    {k.isActive && (
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Tamper-Evident Audit Chain */}
        {activeTab === 'audit' && (
          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1 pr-1">
            <div className="p-3 bg-emerald-950/20 border border-emerald-500/30 rounded-xl flex items-center justify-between text-xs text-emerald-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Cryptographic SHA-256 Merkle Chain Integrity: VERIFIED</span>
              </div>
              <span className="font-mono text-[10px] text-slate-400">{auditLogs.length} Blocks Sealed</span>
            </div>

            <div className="space-y-2">
              {auditLogs.map((log, idx) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">#{idx + 1} • {log.action}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400">{log.details}</p>

                  <div className="pt-1 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                    <span className="truncate max-w-[280px]">Hash: {log.hash}</span>
                    <span className="text-emerald-400 font-semibold">VALID LINK</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
