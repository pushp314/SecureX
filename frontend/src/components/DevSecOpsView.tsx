import React, { useState, useEffect } from 'react';
import { DevSecOpsEvent } from '../types';
import { api } from '../services/api';
import { GitPullRequest, Search, CheckCircle2, ShieldCheck, AlertOctagon } from 'lucide-react';

export const DevSecOpsView: React.FC = () => {
  const [events, setEvents] = useState<DevSecOpsEvent[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<DevSecOpsEvent | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadDevSecOpsData();
  }, []);

  const loadDevSecOpsData = async () => {
    try {
      const [evts, s] = await Promise.all([
        api.getDevSecOpsEvents(),
        api.getDevSecOpsStats(),
      ]);
      setEvents(evts);
      setStats(s);
      if (evts.length > 0 && !selectedEvent) {
        setSelectedEvent(evts[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id: string, status: 'RESOLVED' | 'SUPPRESSED') => {
    setIsUpdating(true);
    try {
      const updated = await api.resolveDevSecOpsFinding(id, status);
      setEvents((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setSelectedEvent(updated);
      const s = await api.getDevSecOpsStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.repository.toLowerCase().includes(search.toLowerCase()) ||
    e.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <GitPullRequest className="w-4 h-4 text-indigo-400" />
            <span>DevSecOps & Supply Chain Security</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous CI/CD pipeline auditing, committed secret detection, and container image posture.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search repo, author, issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#090e1a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 font-sans"
          />
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Open Supply Chain Findings</p>
          <h3 className="text-2xl font-bold text-white">{stats?.openIssues ?? events.filter((e) => e.status === 'OPEN').length} Issues</h3>
          <span className="text-[11px] text-slate-400">Git commits & pipeline runs</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Hardcoded Secrets Detected</p>
          <h3 className="text-2xl font-bold text-rose-400">{stats?.secretsDetected ?? 1} Leaked Keys</h3>
          <span className="text-[11px] text-rose-300">API tokens & private keys</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Critical Misconfigurations</p>
          <h3 className="text-2xl font-bold text-amber-400">{stats?.criticalIssues ?? 1} Active</h3>
          <span className="text-[11px] text-slate-400">Root execution in Dockerfile</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">CI/CD Guardrail Status</p>
          <h3 className="text-2xl font-bold text-emerald-400">ENFORCING</h3>
          <span className="text-[11px] text-emerald-300">Pre-receive hooks active</span>
        </div>
      </div>

      {/* Main Grid: Events List + Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Events List */}
        <div className="saas-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-semibold uppercase text-slate-400">Security Events ({events.length})</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredEvents.map((evt) => {
              const isSelected = selectedEvent?.id === evt.id;
              const isCrit = evt.severity === 'critical';
              const isResolved = evt.status === 'RESOLVED';
              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                      : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          isCrit ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}
                      >
                        {evt.severity}
                      </span>
                      {isResolved && (
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          RESOLVED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500">
                      {new Date(evt.detectedAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{evt.title}</h4>
                  <p className="text-[11px] text-indigo-300 font-mono mt-1">{evt.repository} • {evt.author}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Details Column */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedEvent ? (
            <div className="saas-card p-12 text-center text-slate-500 text-xs">
              Select a DevSecOps finding to inspect pipeline line numbers and remediation.
            </div>
          ) : (
            <div className="saas-card p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs font-mono text-indigo-400 font-semibold">{selectedEvent.repository}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedEvent.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Author: <strong className="text-slate-200">{selectedEvent.author}</strong></p>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${
                      selectedEvent.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                    }`}
                  >
                    {selectedEvent.status}
                  </span>

                  {selectedEvent.status === 'OPEN' && (
                    <button
                      onClick={() => handleResolve(selectedEvent.id, 'RESOLVED')}
                      disabled={isUpdating}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isUpdating ? 'Updating...' : 'Mark Resolved'}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-semibold uppercase text-slate-400 block">Vulnerability Description</span>
                <p className="text-xs text-slate-300 leading-relaxed">{selectedEvent.description}</p>
              </div>

              {selectedEvent.commitHash && (
                <div className="space-y-2">
                  <span className="text-xs font-semibold uppercase text-slate-400 block">Commit Reference</span>
                  <pre className="p-3 bg-[#070a12] rounded-xl border border-slate-800/80 font-mono text-xs text-amber-300 overflow-x-auto">
                    Commit: {selectedEvent.commitHash} ({selectedEvent.branch})
                  </pre>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 space-y-1">
                <span className="text-xs font-semibold text-emerald-400 block">Recommended Developer Remediation:</span>
                <p className="text-xs text-slate-300">{selectedEvent.remediation}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
