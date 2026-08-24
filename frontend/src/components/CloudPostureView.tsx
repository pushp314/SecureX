import React, { useState, useEffect } from 'react';
import { CloudResourcePosture } from '../types';
import { api } from '../services/api';
import { Cloud, ShieldAlert, CheckCircle, Search, Wrench, RefreshCw } from 'lucide-react';

const PROVIDER_COLORS: Record<string, string> = {
  AWS: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
  Azure: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  GCP: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
  Kubernetes: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
};

export const CloudPostureView: React.FC = () => {
  const [resources, setResources] = useState<CloudResourcePosture[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  useEffect(() => {
    loadCloudData();
  }, []);

  const loadCloudData = async () => {
    try {
      const [list, sum] = await Promise.all([
        api.getCloudPosture(),
        api.getCloudSummary(),
      ]);
      setResources(list);
      setSummary(sum);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemediate = async (id: string) => {
    setRemediatingId(id);
    try {
      await api.remediateCloudResource(id);
      await loadCloudData();
    } catch (err) {
      console.error(err);
    } finally {
      setRemediatingId(null);
    }
  };

  const filteredResources = resources.filter((r) =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.resourceId.toLowerCase().includes(search.toLowerCase()) ||
    r.provider.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Cloud className="w-4 h-4 text-indigo-400" />
            <span>Cloud Security Posture Management (CSPM)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous posture assessment across AWS, Kubernetes, Azure, and GCP workloads.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search resource, cloud provider, policy..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#090e1a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-64 font-sans"
          />
        </div>
      </div>

      {/* Metrics Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Cloud Posture Compliance</p>
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-emerald-400">{summary?.postureScore || 72}%</h3>
          </div>
          <span className="text-[11px] text-slate-400">CIS Cloud Benchmark</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Critical Misconfigurations</p>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-2xl font-bold text-rose-400">{summary?.criticalMisconfigurations || 2}</h3>
          </div>
          <span className="text-[11px] text-slate-400">IAM Wildcards & Public Buckets</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">High Severity Drift</p>
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-amber-400">{summary?.highSeverityIssues || 3}</h3>
          </div>
          <span className="text-[11px] text-slate-400">Security Groups & Unencrypted DBs</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Monitored Assets</p>
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-white">{resources.length}</h3>
          </div>
          <span className="text-[11px] text-slate-400">AWS, GCP, Azure, K8s</span>
        </div>
      </div>

      {/* Cloud Inventory Table */}
      <div className="saas-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1220] border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Provider / Resource ID</th>
                <th className="py-3 px-4">Finding Title</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Compliance Policy</th>
                <th className="py-3 px-4 text-right">Auto-Remediation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredResources.map((res) => {
                const isCrit = res.severity === 'critical';
                const isHigh = res.severity === 'high';
                const isPassing = res.status === 'COMPLIANT';
                const isRemediating = remediatingId === res.id;

                return (
                  <tr key={res.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${PROVIDER_COLORS[res.provider]}`}>
                          {res.provider}
                        </span>
                        <span className="font-mono text-slate-300">{res.resourceId}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="text-white font-medium">{res.title}</p>
                      <p className="text-[11px] text-slate-400">{res.description}</p>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                          isCrit
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : isHigh
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                        }`}
                      >
                        {res.severity}
                      </span>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                          isPassing
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {res.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-indigo-300">
                      {res.remediation}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {isPassing ? (
                        <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end space-x-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Remediated</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => handleRemediate(res.id)}
                          disabled={isRemediating}
                          className="px-2.5 py-1 rounded-lg bg-indigo-600/15 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium inline-flex items-center space-x-1 transition-all"
                        >
                          <Wrench className={`w-3.5 h-3.5 ${isRemediating ? 'animate-spin' : ''}`} />
                          <span>{isRemediating ? 'Applying...' : 'Auto-Fix'}</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
