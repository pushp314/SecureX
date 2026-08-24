import React, { useState, useEffect } from 'react';
import { UebaEntityProfile } from '../types';
import { api } from '../services/api';
import { UserCheck, ShieldAlert, Activity, TrendingUp, Users, AlertCircle, ArrowUpRight } from 'lucide-react';

export const UebaAnalyticsView: React.FC = () => {
  const [profiles, setProfiles] = useState<UebaEntityProfile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<UebaEntityProfile | null>(null);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      const data = await api.getUebaProfiles();
      setProfiles(data);
      if (data.length > 0 && !selectedProfile) {
        setSelectedProfile(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const anomalousCount = profiles.filter((p) => p.anomalyFlag).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-purple-400" />
            <span>User & Entity Behavioral Analytics (UEBA Baseline & Z-Score Anomaly)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Statistical deviation modeling (Z-Score &gt; 3.0), impossible hours activity, and data egress spikes.
          </p>
        </div>

        <span className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 text-xs font-semibold">
          {anomalousCount} Behavioral Anomaly Outliers Flagged
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Total Profiled Identities</p>
          <h3 className="text-2xl font-bold text-white">{profiles.length} Entities</h3>
          <span className="text-[11px] text-slate-400">Users, Headless Hosts & Service Accts</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Critical Outliers (Z &gt; 3.0)</p>
          <h3 className="text-2xl font-bold text-rose-400">{anomalousCount}</h3>
          <span className="text-[11px] text-rose-300">Statistical anomalies (&gt;3σ)</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Baseline Window Duration</p>
          <h3 className="text-2xl font-bold text-purple-300">30-Day Rolling</h3>
          <span className="text-[11px] text-slate-400">Historical gaussian curve</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">ML Heuristic Model</p>
          <h3 className="text-2xl font-bold text-emerald-400">ONLINE</h3>
          <span className="text-[11px] text-emerald-300">Continuous scoring active</span>
        </div>
      </div>

      {/* Main Grid: Profiles List + Deep Statistical Analysis Drawer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Profiles List */}
        <div className="saas-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs uppercase font-semibold text-slate-400">Monitored Entities ({profiles.length})</span>
            <span className="text-[10px] text-purple-400 font-semibold">Z-Score Engine</span>
          </div>

          <div className="space-y-2">
            {profiles.map((prof) => {
              const isSelected = selectedProfile?.id === prof.id;
              const isCrit = prof.riskTier === 'CRITICAL';
              return (
                <div
                  key={prof.id}
                  onClick={() => setSelectedProfile(prof)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-sm'
                      : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate">{prof.entityName}</span>
                    <span
                      className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                        isCrit
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {prof.riskTier}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{prof.department}</span>
                    <span className={`font-mono font-semibold ${prof.zScore.compositeAnomalyScore > 50 ? 'text-rose-400' : 'text-slate-300'}`}>
                      Score: {prof.zScore.compositeAnomalyScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Selected Entity Baseline Comparison */}
        <div className="lg:col-span-2 space-y-4">
          {!selectedProfile ? (
            <div className="saas-card p-12 text-center text-slate-500 text-xs">
              Select an entity to inspect 30-day baseline vs today's observed activity.
            </div>
          ) : (
            <div className="saas-card p-5 space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs font-mono text-purple-400 font-semibold uppercase">{selectedProfile.entityType}</span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedProfile.entityName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Department: <strong className="text-slate-200">{selectedProfile.department}</strong></p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Composite Anomaly Score</span>
                  <span
                    className={`text-3xl font-bold tracking-tight ${
                      selectedProfile.zScore.compositeAnomalyScore >= 70 ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {selectedProfile.zScore.compositeAnomalyScore}/100
                  </span>
                </div>
              </div>

              {/* Anomaly Callout */}
              {selectedProfile.anomalyFlag && selectedProfile.anomalyReason && (
                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/40 space-y-1">
                  <span className="text-xs font-bold text-rose-300 flex items-center space-x-1.5">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Behavioral Deviation Reason</span>
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedProfile.anomalyReason}</p>
                </div>
              )}

              {/* Statistical Baseline vs Current Comparison Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Daily Login Velocity</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-400">Baseline (μ): <strong className="text-white">{selectedProfile.baseline.avgDailyLogins}</strong></span>
                    <span className="text-sm font-bold text-amber-400 font-mono">Observed: {selectedProfile.observedCurrent.loginsToday}</span>
                  </div>
                  <span className="text-[10px] text-rose-400 block font-mono">Z-Score: +{selectedProfile.zScore.loginZScore}σ</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Daily Data Egress</span>
                  <div className="flex items-baseline justify-between pt-1">
                    <span className="text-xs text-slate-400">Baseline (μ): <strong className="text-white">{selectedProfile.baseline.avgDailyEgressMb} MB</strong></span>
                    <span className="text-sm font-bold text-rose-400 font-mono">{selectedProfile.observedCurrent.egressMbToday} MB</span>
                  </div>
                  <span className="text-[10px] text-rose-400 block font-mono">Z-Score: +{selectedProfile.zScore.egressZScore}σ</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Working Hours / Location</span>
                  <div className="text-[11px] text-slate-300 pt-1 space-y-0.5">
                    <p>Expected: <span className="text-slate-400">{selectedProfile.baseline.normalWorkingHours}</span></p>
                    <p>Current: <strong className="text-purple-300">{selectedProfile.observedCurrent.currentLocation}</strong></p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
