import React, { useState } from 'react';
import { Incident } from '../types';
import { ShieldAlert, Search, Eye, ShieldCheck, AlertCircle, Crosshair, ArrowUpRight } from 'lucide-react';

interface IncidentsViewProps {
  incidents: Incident[];
  onSelectIncident: (id: string) => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
};

export const IncidentsView: React.FC<IncidentsViewProps> = ({
  incidents,
  onSelectIncident,
  onUpdateStatus,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const openCount = incidents.filter((i) => i.status === 'OPEN').length;
  const investigatingCount = incidents.filter((i) => i.status === 'INVESTIGATING').length;
  const containedCount = incidents.filter((i) => i.status === 'CONTAINED' || i.status === 'RESOLVED').length;

  const filteredIncidents = incidents.filter((inc) => {
    if (filterSeverity !== 'all' && inc.severity !== filterSeverity) return false;
    if (filterStatus !== 'all' && inc.status !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        inc.incidentId.toLowerCase().includes(q) ||
        inc.title.toLowerCase().includes(q) ||
        inc.entityKey.toLowerCase().includes(q) ||
        inc.mitreTactics.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Incident Triage & Security Cases</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Correlated multi-signal attack cases grouped by entity and MITRE tactics for triage and response.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search entity, tactic, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#0b1320] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-60 font-sans"
            />
          </div>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-[#0b1320] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'all'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Cases ({incidents.length})
        </button>

        <button
          onClick={() => setFilterStatus('OPEN')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'OPEN'
              ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Open ({openCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('INVESTIGATING')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'INVESTIGATING'
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Crosshair className="w-3.5 h-3.5" />
          <span>Investigating ({investigatingCount})</span>
        </button>

        <button
          onClick={() => setFilterStatus('CONTAINED')}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            filterStatus === 'CONTAINED'
              ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Contained / Resolved ({containedCount})</span>
        </button>
      </div>

      {/* Incidents Table */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1220] border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Severity / Case ID</th>
                <th className="py-3 px-4">Correlated Entity</th>
                <th className="py-3 px-4">Incident Summary</th>
                <th className="py-3 px-4">MITRE Tactics</th>
                <th className="py-3 px-4">Alerts</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                    No incidents matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((inc) => {
                  const sev = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.info;
                  return (
                    <tr key={inc.id} className="hover:bg-slate-800/20 transition-colors">
                      {/* Severity & ID */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${sev.bg} ${sev.text} ${sev.border}`}
                          >
                            {inc.severity}
                          </span>
                          <span className="font-mono text-slate-200 font-semibold">{inc.incidentId}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {new Date(inc.updatedAt).toLocaleTimeString()}
                        </span>
                      </td>

                      {/* Correlated Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="font-mono text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded-md border border-indigo-800/40 text-xs">
                          {inc.entityKey}
                        </span>
                      </td>

                      {/* Title & Summary */}
                      <td className="py-3.5 px-4 max-w-sm">
                        <p className="text-white font-medium truncate">{inc.title}</p>
                        <p className="text-slate-400 text-[11px] line-clamp-1 mt-0.5">{inc.summary}</p>
                      </td>

                      {/* Tactics */}
                      <td className="py-3.5 px-4">
                        <span className="text-[11px] text-rose-300 bg-rose-950/30 px-2 py-0.5 rounded-md border border-rose-800/30 font-medium">
                          {inc.mitreTactics}
                        </span>
                      </td>

                      {/* Alerts count */}
                      <td className="py-3.5 px-4 font-semibold text-amber-400">
                        {inc.alertsCount || 1}
                      </td>

                      {/* Status Selector */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={inc.status}
                          onChange={(e) => onUpdateStatus(inc.id, e.target.value)}
                          className={`text-xs font-semibold px-2 py-1 rounded-md border focus:outline-none ${
                            inc.status === 'OPEN'
                              ? 'bg-rose-950/30 text-rose-300 border-rose-500/40'
                              : inc.status === 'INVESTIGATING'
                              ? 'bg-amber-950/30 text-amber-300 border-amber-500/40'
                              : inc.status === 'CONTAINED'
                              ? 'bg-blue-950/30 text-blue-300 border-blue-500/40'
                              : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          <option value="OPEN">OPEN</option>
                          <option value="INVESTIGATING">INVESTIGATING</option>
                          <option value="CONTAINED">CONTAINED</option>
                          <option value="RESOLVED">RESOLVED</option>
                        </select>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onSelectIncident(inc.id)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-medium flex items-center space-x-1 ml-auto transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Investigate</span>
                        </button>
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
