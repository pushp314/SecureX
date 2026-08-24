import React, { useState, useEffect } from 'react';
import { StorageTierStatus, RetentionPolicy } from '../types';
import { api } from '../services/api';
import { HardDrive, ShieldCheck, Archive, RefreshCw, CheckCircle2, Clock, FileCheck } from 'lucide-react';

export const DataRetentionView: React.FC = () => {
  const [tiers, setTiers] = useState<StorageTierStatus[]>([]);
  const [policies, setPolicies] = useState<RetentionPolicy[]>([]);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveResult, setArchiveResult] = useState<any | null>(null);

  useEffect(() => {
    loadRetentionData();
  }, []);

  const loadRetentionData = async () => {
    try {
      const [t, p] = await Promise.all([
        api.getStorageTiers(),
        api.getRetentionPolicies(),
      ]);
      setTiers(t);
      setPolicies(p);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTriggerArchival = async () => {
    setIsArchiving(true);
    setArchiveResult(null);
    try {
      const res = await api.triggerArchival();
      setArchiveResult(res);
      await loadRetentionData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <HardDrive className="w-4 h-4 text-amber-400" />
            <span>Data Retention & Storage Tiering (ILM / Hot-Warm-Cold Lifecycle)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            PostgreSQL Hot Index → Parquet Warm Storage → Immutable AWS S3 Glacier Cold Archive with PCI-DSS 1-Year compliance certification.
          </p>
        </div>

        <button
          onClick={handleTriggerArchival}
          disabled={isArchiving}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap"
        >
          <Archive className={`w-3.5 h-3.5 ${isArchiving ? 'animate-spin' : ''}`} />
          <span>{isArchiving ? 'Archiving to S3 Glacier...' : 'Trigger S3 Glacier Archival'}</span>
        </button>
      </div>

      {archiveResult && (
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-1.5 text-xs text-emerald-200">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <strong className="text-white">Tamper-Proof Archival Cycle Completed:</strong>
          </div>
          <p className="font-mono text-[11px] text-emerald-300">Destination: {archiveResult.destinationBucket}</p>
          <p className="font-mono text-[10px] text-slate-400">SHA256: {archiveResult.sha256Digest}</p>
        </div>
      )}

      {/* Storage Tiering Cards (Hot, Warm, Cold) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tiers.map((tier) => {
          const isHot = tier.tierName === 'HOT';
          const isWarm = tier.tierName === 'WARM';
          return (
            <div
              key={tier.tierName}
              className={`saas-card p-5 space-y-3 ${
                isHot ? 'border-indigo-500/40' : isWarm ? 'border-amber-500/40' : 'border-emerald-500/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                    isHot
                      ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                      : isWarm
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                  }`}
                >
                  {tier.tierName} TIER ({tier.retentionWindowDays} Days)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{tier.status}</span>
              </div>

              <div>
                <h4 className="text-base font-bold text-white">{tier.storageEngine}</h4>
                <p className="text-xs text-slate-400 mt-1">{tier.compressionRatio}</p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                <span className="text-slate-400 font-mono">{tier.totalEventsStored} Telemetry Events</span>
                <span className="text-indigo-300 font-bold font-mono">{tier.totalSizeBytesMb} MB</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Regulatory Compliance Policies Ledger */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">
            Active Regulatory Retention Policies ({policies.length})
          </h3>
          <span className="text-[10px] text-emerald-400 font-semibold flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>WORM Object Lock Active</span>
          </span>
        </div>

        <div className="divide-y divide-slate-800/60 font-sans">
          {policies.map((pol) => (
            <div key={pol.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/20 transition-colors">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-mono font-semibold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/50">
                    {pol.regulatoryStandard}
                  </span>
                  <h4 className="text-xs font-semibold text-white">{pol.name}</h4>
                </div>
                <p className="text-[11px] text-slate-400">
                  Minimum Retention Window: <strong className="text-slate-200">{pol.minimumRetentionDays} Days</strong> • Auto S3 Archive: <strong className="text-emerald-400">ENABLED</strong>
                </p>
              </div>

              <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 whitespace-nowrap">
                Compliance Certified
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
