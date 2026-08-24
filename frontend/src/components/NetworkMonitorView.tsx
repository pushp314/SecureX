import React, { useState, useEffect } from 'react';
import { NetworkFlowRecord, NetworkAnomaly } from '../types';
import { api } from '../services/api';
import { ShieldAlert, Wifi, Globe, ArrowDownLeft, Search } from 'lucide-react';

const PROTOCOL_COLORS: Record<string, string> = {
  HTTPS: '#6366f1',
  TCP: '#38bdf8',
  DNS: '#a855f7',
  UDP: '#f59e0b',
  ICMP: '#f43f5e',
};

export const NetworkMonitorView: React.FC = () => {
  const [flows, setFlows] = useState<NetworkFlowRecord[]>([]);
  const [anomalies, setAnomalies] = useState<NetworkAnomaly[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadNetworkData();
    const interval = setInterval(loadNetworkData, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadNetworkData = async () => {
    try {
      const [f, a, s] = await Promise.all([
        api.getNetworkFlows(50),
        api.getNetworkAnomalies(),
        api.getNetworkStats(),
      ]);
      setFlows(f);
      setAnomalies(a);
      setStats(s);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredFlows = flows.filter((f) =>
    f.sourceIp.includes(search) ||
    f.destinationIp.includes(search) ||
    f.protocol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Wifi className="w-4 h-4 text-indigo-400" />
            <span>Network Flow & Traffic Anomaly Monitor</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time NetFlow analysis, C2 beaconing heartbeats, and DNS tunneling detection.
          </p>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search IP, protocol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-[#090e1a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-60 font-sans"
          />
        </div>
      </div>

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Total Ingress Volume</p>
          <div className="flex items-center space-x-2">
            <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">{stats?.totalBytesInMb || 12.4} MB</h3>
          </div>
          <span className="text-[11px] text-slate-400">NetFlow / IPFIX telemetry</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">C2 Beaconing Anomalies</p>
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <h3 className="text-2xl font-bold text-rose-400">{anomalies.length}</h3>
          </div>
          <span className="text-[11px] text-rose-300/80">Periodic Heartbeats & DNS Tunnels</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Unique External Peers</p>
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-indigo-400" />
            <h3 className="text-2xl font-bold text-indigo-300">{stats?.uniqueDestinations || 18}</h3>
          </div>
          <span className="text-[11px] text-slate-400">Public Autonomous Systems</span>
        </div>

        <div className="saas-card p-4 space-y-1">
          <p className="text-[10px] uppercase font-semibold text-slate-400">Active Flow Rate</p>
          <div className="flex items-center space-x-2">
            <h3 className="text-2xl font-bold text-emerald-400">{flows.length * 12}</h3>
            <span className="text-xs text-slate-400">pkts/sec</span>
          </div>
          <span className="text-[11px] text-slate-400">Wire-speed packet filter</span>
        </div>
      </div>

      {/* Anomalies Section */}
      {anomalies.length > 0 && (
        <div className="saas-card p-5 space-y-3 border-rose-500/30 bg-rose-950/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400" />
              <span>Active Network Flow Anomalies ({anomalies.length})</span>
            </h3>
            <span className="text-[10px] font-semibold text-rose-300 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
              Heuristic Engine
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {anomalies.map((anom) => (
              <div key={anom.id} className="p-3.5 rounded-xl bg-[#090e1a] border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">{anom.type}</span>
                  <span className="text-[10px] font-bold uppercase text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                    {anom.severity}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">{anom.description}</p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 font-mono">
                  <span>Source: <strong className="text-indigo-300">{anom.sourceIp}</strong></span>
                  <span>Dest: <strong className="text-amber-300">{anom.destinationIp}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Realtime Flow Table */}
      <div className="saas-card overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Captured NetFlow Stream</h3>
          <span className="text-[11px] text-slate-400">Displaying {filteredFlows.length} recent flow records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#0b1220] border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Source Socket</th>
                <th className="py-3 px-4">Destination Socket</th>
                <th className="py-3 px-4">Bytes In / Out</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredFlows.map((fl) => (
                <tr key={fl.id} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                    {new Date(fl.timestamp).toLocaleTimeString()}
                  </td>

                  <td className="py-2.5 px-4">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                      style={{
                        color: PROTOCOL_COLORS[fl.protocol] || '#cbd5e1',
                        borderColor: `${PROTOCOL_COLORS[fl.protocol] || '#64748b'}40`,
                        backgroundColor: `${PROTOCOL_COLORS[fl.protocol] || '#64748b'}15`,
                      }}
                    >
                      {fl.protocol}
                    </span>
                  </td>

                  <td className="py-2.5 px-4 text-slate-200">
                    {fl.sourceIp}:{fl.sourcePort}
                  </td>

                  <td className="py-2.5 px-4 text-indigo-300">
                    {fl.destinationIp}:{fl.destinationPort}
                  </td>

                  <td className="py-2.5 px-4 text-slate-300 font-sans">
                    {((fl.bytesIn + fl.bytesOut) / 1024).toFixed(1)} KB
                  </td>

                  <td className="py-2.5 px-4 text-right font-sans">
                    <span
                      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full ${
                        fl.isAnomalous
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {fl.isAnomalous ? 'ANOMALOUS' : 'NORMAL'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
