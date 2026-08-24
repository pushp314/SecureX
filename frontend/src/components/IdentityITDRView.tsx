import React, { useState, useEffect } from 'react';
import { ManagedIdentity, IdentityStressTestResult } from '../types';
import { api } from '../services/api';
import { UserCheck, ShieldAlert, Lock, Zap, RefreshCw, Search, Smartphone } from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  GlobalAdmin: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  DevOpsAdmin: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  SecurityAnalyst: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
  StandardUser: 'text-slate-300 bg-slate-900 border-slate-800',
  AutomatedService: 'text-purple-400 bg-purple-500/10 border-purple-500/30',
};

export const IdentityITDRView: React.FC = () => {
  const [identities, setIdentities] = useState<ManagedIdentity[]>([]);
  const [selectedIdentity, setSelectedIdentity] = useState<ManagedIdentity | null>(null);
  const [search, setSearch] = useState('');
  const [isStressTesting, setIsStressTesting] = useState(false);
  const [stressResult, setStressResult] = useState<IdentityStressTestResult | null>(null);

  useEffect(() => {
    loadIdentities();
  }, []);

  const loadIdentities = async () => {
    try {
      const list = await api.getManagedIdentities();
      setIdentities(list);
      if (list.length > 0 && !selectedIdentity) {
        setSelectedIdentity(list[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleContain = async (id: string, action: 'LOCK' | 'REVOKE_SESSIONS' | 'REQUIRE_MFA') => {
    try {
      const updated = await api.containIdentity(id, action);
      setIdentities((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSelectedIdentity(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunStressTest = async (scenario: string) => {
    setIsStressTesting(true);
    setStressResult(null);
    try {
      const result = await api.runIdentityStressTest(scenario, selectedIdentity?.username);
      setStressResult(result);
      await loadIdentities();
    } catch (err) {
      console.error(err);
    } finally {
      setIsStressTesting(false);
    }
  };

  const filteredIdentities = identities.filter((i) =>
    i.username.toLowerCase().includes(search.toLowerCase()) ||
    i.role.toLowerCase().includes(search.toLowerCase()) ||
    i.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <UserCheck className="w-4 h-4 text-indigo-400" />
            <span>Identity Threat Detection & Response (ITDR)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Workload trust analysis, anomalous identity risk scoring, session revocation, and adversarial stress-testing.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search identity, role, account..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#090e1a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-60 font-sans"
          />
        </div>
      </div>

      {/* Stress Testing Harness */}
      <div className="saas-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-semibold text-indigo-300">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Adversarial Identity Stress-Testing Suite</span>
          </div>
          <span className="text-[11px] text-slate-400">Target: {selectedIdentity?.username || 'Global'}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          <button
            onClick={() => handleRunStressTest('MFA_FATIGUE')}
            disabled={isStressTesting}
            className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-rose-500/50 text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 font-semibold">MFA Push Fatigue</span>
              <span className="text-[9px] font-mono text-slate-500">T1621</span>
            </div>
            <p className="text-[11px] text-slate-400">Flood prompts to force approval</p>
          </button>

          <button
            onClick={() => handleRunStressTest('GOLDEN_SAML')}
            disabled={isStressTesting}
            className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-amber-500/50 text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-amber-400 font-semibold">Golden SAML Forgery</span>
              <span className="text-[9px] font-mono text-slate-500">T1606</span>
            </div>
            <p className="text-[11px] text-slate-400">Inject forged IdP assertion</p>
          </button>

          <button
            onClick={() => handleRunStressTest('KERBEROASTING')}
            disabled={isStressTesting}
            className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-purple-500/50 text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-400 font-semibold">Kerberoasting Spike</span>
              <span className="text-[9px] font-mono text-slate-500">T1558</span>
            </div>
            <p className="text-[11px] text-slate-400">Request offline service tickets</p>
          </button>

          <button
            onClick={() => handleRunStressTest('STALE_WORKLOAD')}
            disabled={isStressTesting}
            className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-indigo-500/50 text-left space-y-1 transition-all group"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-400 font-semibold">Stale Token Replay</span>
              <span className="text-[9px] font-mono text-slate-500">T1078</span>
            </div>
            <p className="text-[11px] text-slate-400">Replay expired machine JWT</p>
          </button>
        </div>

        {stressResult && (
          <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs text-emerald-300 flex items-center justify-between">
            <span>✨ {stressResult.scenarioName} injected ({stressResult.eventsInjected} events in {stressResult.responseLatencyMs}ms)</span>
            <span className="font-semibold text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full">ITDR DETECTED</span>
          </div>
        )}
      </div>

      {/* Main Grid: Identity List + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Identities */}
        <div className="saas-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs uppercase font-semibold text-slate-400">Monitored Identities ({identities.length})</span>
          </div>

          <div className="space-y-2 max-h-[550px] overflow-y-auto custom-scrollbar">
            {filteredIdentities.map((id) => {
              const isSelected = selectedIdentity?.id === id.id;
              const isHighRisk = id.riskScore >= 70;
              return (
                <div
                  key={id.id}
                  onClick={() => setSelectedIdentity(id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                      : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${ROLE_COLORS[id.role]}`}>
                      {id.role}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isHighRisk ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      Risk: {id.riskScore}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white truncate">{id.username}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{id.type}</span>
                    <span className="text-indigo-300 font-mono">{id.activeSessions} session(s)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Identity Details & Containment */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedIdentity ? (
            <div className="saas-card p-12 text-center text-slate-500 text-xs">
              Select an enterprise identity to view active risk factors and trigger containment.
            </div>
          ) : (
            <div className="saas-card p-5 space-y-5">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${ROLE_COLORS[selectedIdentity.role]}`}>
                      {selectedIdentity.role}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">[{selectedIdentity.type}]</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{selectedIdentity.username}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Last active from <strong className="text-indigo-300 font-mono">{selectedIdentity.lastLoginIp}</strong>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Identity Risk Score</span>
                  <span
                    className={`text-3xl font-bold tracking-tight ${
                      selectedIdentity.riskScore >= 70 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedIdentity.riskScore}
                  </span>
                </div>
              </div>

              {/* Containment Actions Bar */}
              <div className="p-4 rounded-xl bg-[#090e1a] border border-slate-800/80 space-y-2.5">
                <span className="text-xs font-semibold uppercase text-slate-300 block">
                  ITDR Automated Response & Containment:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleContain(selectedIdentity.id, 'REVOKE_SESSIONS')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs shadow-sm transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Revoke Active Sessions</span>
                  </button>

                  <button
                    onClick={() => handleContain(selectedIdentity.id, 'LOCK')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze Identity Account</span>
                  </button>

                  <button
                    onClick={() => handleContain(selectedIdentity.id, 'REQUIRE_MFA')}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Require Forced MFA Step-Up</span>
                  </button>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400 block">
                  Active Risk Factors & Behavioral Signals ({selectedIdentity.riskFactors.length})
                </span>
                <div className="space-y-2">
                  {selectedIdentity.riskFactors.map((factor, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 flex items-start space-x-2 text-xs">
                      <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <span className="text-slate-200">{factor}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
