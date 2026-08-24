import React, { useState } from 'react';
import { TelemetryStats, Incident, Alert, TelemetryEvent } from '../types';
import { ShieldAlert, Activity, Flame, Radio, CheckCircle, ArrowRight, Crosshair, Terminal, Sparkles, Play, Scale, UserCheck, Shield, ChevronRight, Zap, ArrowUpRight } from 'lucide-react';

interface DashboardViewProps {
  stats: TelemetryStats | null;
  incidents: Incident[];
  alerts: Alert[];
  recentEvents: TelemetryEvent[];
  onSelectIncident: (id: string) => void;
  onOpenSimulator: () => void;
  onNavigateTab?: (tab: string) => void;
}

const SEVERITY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  critical: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  high: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  medium: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  info: { bg: 'bg-slate-500/10', text: 'text-slate-400', border: 'border-slate-500/30' },
};

const MITRE_TACTICS = [
  { name: 'Reconnaissance', id: 'TA0043', desc: 'Port scans & service probes' },
  { name: 'Initial Access', id: 'TA0001', desc: 'Brute force & exploit vectors' },
  { name: 'Execution', id: 'TA0002', desc: 'Injected payloads & scripts' },
  { name: 'Privilege Escalation', id: 'TA0004', desc: 'Unauthorized IAM elevation' },
  { name: 'Credential Access', id: 'TA0006', desc: 'Credential dumping & token replay' },
  { name: 'Lateral Movement', id: 'TA0008', desc: 'Internal network pivots' },
  { name: 'Exfiltration', id: 'TA0010', desc: 'Mass S3 cloud exfiltration' },
  { name: 'Impact', id: 'TA0040', desc: 'Ransomware file encryption' },
];

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  incidents,
  alerts,
  recentEvents,
  onSelectIncident,
  onOpenSimulator,
  onNavigateTab,
}) => {
  const [isLiveStreamPaused, setIsLiveStreamPaused] = useState(false);

  const criticalCount = incidents.filter((i) => i.severity === 'critical').length;
  const highCount = incidents.filter((i) => i.severity === 'high').length;
  const openIncidents = incidents.filter((i) => i.status === 'OPEN' || i.status === 'INVESTIGATING');

  // Compute MITRE Heatmap active counts
  const mitreCounts: Record<string, number> = {};
  alerts.forEach((alt) => {
    if (alt.mitreTactic) {
      mitreCounts[alt.mitreTactic] = (mitreCounts[alt.mitreTactic] || 0) + 1;
    }
  });

  return (
    <div className="space-y-6 pb-12">
      {/* SaaS-Pro Quick-Start Guided Action Hub */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#0d1527] via-[#0f172a] to-[#0d1527] border border-indigo-500/20 shadow-lg space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">
              SOC Quick-Start Guided Actions
            </span>
          </div>
          <span className="text-[11px] text-slate-400">1-Click Workflows</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={onOpenSimulator}
            className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-rose-500/50 text-left transition-all group hover:bg-[#0c1322]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-rose-400 font-semibold flex items-center space-x-1.5">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>1. Launch Threat Demo</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Simulate multi-stage APT or ransomware attack</p>
          </button>

          {openIncidents.length > 0 ? (
            <button
              onClick={() => onSelectIncident(openIncidents[0].id)}
              className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-indigo-500/50 text-left transition-all group hover:bg-[#0c1322]"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="text-indigo-400 font-semibold flex items-center space-x-1.5">
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>2. Investigate Breach</span>
                </span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 truncate">Triage {openIncidents[0].title}</p>
            </button>
          ) : (
            <button
              onClick={onOpenSimulator}
              className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-indigo-500/50 text-left transition-all"
            >
              <span className="text-xs font-semibold text-slate-400">2. No Active Breach</span>
              <p className="text-[11px] text-slate-500 mt-1">Launch attack to trigger incident</p>
            </button>
          )}

          <button
            onClick={() => onNavigateTab && onNavigateTab('hunting')}
            className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-purple-500/50 text-left transition-all group hover:bg-[#0c1322]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-400 font-semibold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>3. Threat Hunt</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Mine logs & promote Sigma rules</p>
          </button>

          <button
            onClick={() => onNavigateTab && onNavigateTab('compliance')}
            className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-emerald-500/50 text-left transition-all group hover:bg-[#0c1322]"
          >
            <div className="flex items-center justify-between text-xs">
              <span className="text-emerald-400 font-semibold flex items-center space-x-1.5">
                <Scale className="w-3.5 h-3.5" />
                <span>4. Audit Score</span>
              </span>
              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">SOC 2, ISO 27001 & D3FEND matrix</p>
          </button>
        </div>
      </div>

      {/* Top 4 Key Metrics (Enterprise Minimalism) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Open Incidents</span>
            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5">
            <h3 className="text-3xl font-bold text-white tracking-tight">{openIncidents.length}</h3>
            {criticalCount > 0 && (
              <span className="text-xs font-semibold text-rose-400 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30">
                {criticalCount} Critical
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-amber-400 font-medium">{highCount} High priority</span> requiring triage
          </p>
        </div>

        {/* Metric 2 */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Triggered Detections</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5">
            <h3 className="text-3xl font-bold text-amber-400 tracking-tight">{stats?.totalAlerts || alerts.length}</h3>
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-indigo-400 font-medium">8 MITRE rules</span> actively evaluating in real time
          </p>
        </div>

        {/* Metric 3 */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Indexed Telemetry</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5">
            <h3 className="text-3xl font-bold text-slate-100 tracking-tight">{stats?.totalEvents || recentEvents.length}</h3>
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">PostgreSQL Engine</span> zero queue lag
          </p>
        </div>

        {/* Metric 4 */}
        <div className="saas-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Compliance Readiness</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2.5">
            <h3 className="text-3xl font-bold text-emerald-400 tracking-tight">94%</h3>
          </div>
          <p className="text-xs text-slate-400">
            <span className="text-purple-400 font-medium">SOC 2 / ISO / NIST</span> audit-certified
          </p>
        </div>
      </div>

      {/* MITRE ATT&CK Enterprise Matrix (Clean SaaS-Pro Heatmap) */}
      <div className="saas-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <Radio className="w-4 h-4 text-indigo-400" />
              <span>MITRE ATT&CK® Enterprise Attack Matrix</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Adversary tactics actively triggering sliding-window detection rules across ingested telemetry.
            </p>
          </div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase bg-[#080d17] px-2.5 py-1 rounded-md border border-slate-800">
            V14.1 Matrix
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {MITRE_TACTICS.map((tac) => {
            const count = mitreCounts[tac.name] || 0;
            const hasAlerts = count > 0;
            return (
              <div
                key={tac.id}
                title={`${tac.name}: ${tac.desc}`}
                className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                  hasAlerts
                    ? 'bg-rose-950/30 border-rose-500/40 shadow-sm'
                    : 'bg-[#090e1a] border-slate-800/80 opacity-70'
                }`}
              >
                <div>
                  <span className="text-[9px] font-mono text-slate-400 uppercase block">{tac.id}</span>
                  <h4 className="text-xs font-semibold text-white mt-1 leading-tight">{tac.name}</h4>
                </div>
                <div className="mt-3">
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block ${
                      hasAlerts
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'text-slate-500'
                    }`}
                  >
                    {count} {count === 1 ? 'alert' : 'alerts'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Active Incidents & Live Ingestion Pulse */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Incidents */}
        <div className="lg:col-span-2 saas-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <h3 className="text-sm font-bold text-white">Active Correlated Security Incidents</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Multi-signal composite cases requiring analyst investigation and response.
              </p>
            </div>
            <button
              onClick={() => onNavigateTab && onNavigateTab('incidents')}
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 transition-colors"
            >
              <span>View All ({incidents.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {incidents.slice(0, 4).map((inc) => {
              const sev = SEVERITY_COLORS[inc.severity] || SEVERITY_COLORS.info;
              return (
                <div
                  key={inc.id}
                  onClick={() => onSelectIncident(inc.id)}
                  className="p-4 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer space-y-2 group hover:bg-[#0c1322]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${sev.bg} ${sev.text} ${sev.border}`}
                      >
                        {inc.severity}
                      </span>
                      <span className="text-xs font-mono text-slate-300 font-semibold">{inc.incidentId}</span>
                    </div>

                    <span className="text-[10px] font-medium text-slate-400 bg-slate-900 px-2.5 py-0.5 rounded-md border border-slate-800">
                      {inc.status}
                    </span>
                  </div>

                  <h4 className="text-xs font-semibold text-white group-hover:text-indigo-300 transition-colors">
                    {inc.title}
                  </h4>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                    <span>
                      Target: <strong className="text-slate-200 font-mono">{inc.entityKey}</strong>
                    </span>
                    <span className="text-indigo-400 font-medium flex items-center space-x-1">
                      <span>{inc.alertsCount} Correlated Alerts</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Live Ingestion Stream */}
        <div className="saas-card p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <h3 className="text-sm font-bold text-white">Live Ingestion Pulse</h3>
            </div>
            <button
              onClick={() => setIsLiveStreamPaused(!isLiveStreamPaused)}
              className="text-[10px] font-medium text-slate-400 hover:text-white px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-800 transition-colors"
            >
              {isLiveStreamPaused ? 'Resume Stream' : 'Pause'}
            </button>
          </div>

          <div className="space-y-2 max-h-[450px] overflow-y-auto custom-scrollbar">
            {recentEvents.slice(0, 10).map((evt, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800/70 text-xs space-y-1 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-indigo-300 truncate">{evt.eventType}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(evt.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate max-w-[120px]">{evt.sourceService}</span>
                  <span className="text-slate-300 font-mono truncate max-w-[120px]">
                    {evt.sourceIp || evt.username || 'System'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
