import React, { useState, useEffect } from 'react';
import { ThreatIndicator, ThreatMatchResult } from '../types';
import { api } from '../services/api';
import { Globe, Search, Plus, ExternalLink, Activity } from 'lucide-react';

export const ThreatIntelView: React.FC = () => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [searchVal, setSearchVal] = useState('');
  const [lookupResult, setLookupResult] = useState<ThreatMatchResult | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newIndicator, setNewIndicator] = useState({
    indicatorType: 'ip' as 'ip' | 'domain' | 'sha256' | 'url',
    value: '',
    threatActor: '',
    malwareFamily: '',
    severity: 'HIGH' as 'CRITICAL' | 'HIGH' | 'MEDIUM',
    confidence: 90,
    sourceFeed: 'MISP Threat Sharing',
    description: '',
    tags: ['apt', 'c2'],
  });

  useEffect(() => {
    loadIndicators();
  }, []);

  const loadIndicators = async () => {
    try {
      const data = await api.getThreatIndicators();
      setIndicators(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchVal.trim()) return;
    setIsLookingUp(true);
    setLookupResult(null);

    try {
      const res = await api.lookupThreatIndicator(searchVal.trim());
      setLookupResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLookingUp(false);
    }
  };

  const handleCreateIndicator = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addThreatIndicator(newIndicator);
      setShowAddModal(false);
      loadIndicators();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-rose-400" />
            <span>Threat Intelligence (CTI) & Indicator of Compromise (IOC) Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous threat feed ingestion (STIX/TAXII, MISP, AlienVault OTX, AbuseIPDB) and automated telemetry matching.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Indicator</span>
        </button>
      </div>

      {/* Real-time Indicator Lookup Bar */}
      <div className="saas-card p-4 space-y-3">
        <form onSubmit={handleLookup} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Check IP address, malicious domain, or SHA256 file hash against threat intel..."
              className="w-full bg-[#070a12] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLookingUp}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap flex items-center space-x-1.5"
          >
            <Activity className={`w-3.5 h-3.5 ${isLookingUp ? 'animate-spin' : ''}`} />
            <span>{isLookingUp ? 'Querying CTI...' : 'Check Indicator'}</span>
          </button>
        </form>

        {lookupResult && (
          <div
            className={`p-4 rounded-xl border space-y-2 ${
              lookupResult.isMatch
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider">
                {lookupResult.isMatch ? '🚨 CONFIRMED ADVERSARY IOC MATCH' : '✅ CLEAN (No Known Threat Hits)'}
              </span>
              {lookupResult.enrichment && (
                <span className="text-xs font-mono font-bold bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/40">
                  Abuse Confidence: {lookupResult.enrichment.abuseConfidenceScore}%
                </span>
              )}
            </div>

            {lookupResult.isMatch && lookupResult.indicator && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                <div>
                  <span className="text-slate-400 block text-[10px]">THREAT ACTOR:</span>
                  <strong className="text-white">{lookupResult.indicator.threatActor || 'Unknown'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">MALWARE FAMILY:</span>
                  <strong className="text-white">{lookupResult.indicator.malwareFamily || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SOURCE FEED:</span>
                  <span className="text-slate-300">{lookupResult.indicator.sourceFeed}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active IOC Feed Ledger */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Active Monitored Indicators of Compromise ({indicators.length})
          </h3>
          <span className="text-[11px] text-slate-400">Continuous background correlation</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1220] border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Indicator Value / Type</th>
                <th className="py-3 px-4">Threat Actor & Malware</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Source Feed</th>
                <th className="py-3 px-4">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {indicators.map((ioc) => (
                <tr key={ioc.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {ioc.indicatorType}
                      </span>
                      <span className="font-mono text-xs font-semibold text-rose-300">{ioc.value}</span>
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <p className="text-white font-medium">{ioc.threatActor || 'Adversary Group'}</p>
                    <p className="text-[11px] text-slate-400">{ioc.malwareFamily}</p>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        ioc.severity === 'CRITICAL'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {ioc.severity}
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                    {ioc.confidence}%
                  </td>

                  <td className="py-3 px-4 text-slate-300 text-xs">
                    {ioc.sourceFeed}
                  </td>

                  <td className="py-3 px-4">
                    <div className="flex flex-wrap gap-1">
                      {ioc.tags.map((t, i) => (
                        <span key={i} className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-slate-900 text-slate-400 border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Indicator Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Add Threat Intel Indicator (IOC)</h3>

            <form onSubmit={handleCreateIndicator} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Indicator Type</label>
                <select
                  value={newIndicator.indicatorType}
                  onChange={(e: any) => setNewIndicator({ ...newIndicator, indicatorType: e.target.value })}
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ip">IP Address</option>
                  <option value="domain">Domain / Host</option>
                  <option value="sha256">SHA256 File Hash</option>
                  <option value="url">Malicious URL</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Indicator Value</label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.99 or evil-c2.org"
                  value={newIndicator.value}
                  onChange={(e) => setNewIndicator({ ...newIndicator, value: e.target.value })}
                  required
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Threat Actor</label>
                  <input
                    type="text"
                    placeholder="e.g. APT29"
                    value={newIndicator.threatActor}
                    onChange={(e) => setNewIndicator({ ...newIndicator, threatActor: e.target.value })}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Severity</label>
                  <select
                    value={newIndicator.severity}
                    onChange={(e: any) => setNewIndicator({ ...newIndicator, severity: e.target.value })}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="e.g. CobaltStrike listener endpoint"
                  value={newIndicator.description}
                  onChange={(e) => setNewIndicator({ ...newIndicator, description: e.target.value })}
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
                >
                  Save Indicator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
