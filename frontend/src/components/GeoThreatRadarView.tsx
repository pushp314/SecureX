import React, { useState, useEffect } from 'react';
import { Globe, ShieldAlert, RefreshCw, Activity } from 'lucide-react';
import { api } from '../services/api';

interface GeoAttackOrigin {
  id: string;
  countryCode: string;
  countryName: string;
  city: string;
  ipAddress: string;
  asn: string;
  threatActor: string;
  attackType: string;
  eventCount: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  coordinates: [number, number]; // lat, lon
  lastSeen?: string;
}

export const GeoThreatRadarView: React.FC = () => {
  const [origins, setOrigins] = useState<GeoAttackOrigin[]>([]);
  const [selectedOrigin, setSelectedOrigin] = useState<GeoAttackOrigin | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadGeoData();
    const interval = setInterval(loadGeoData, 4000);
    return () => clearInterval(interval);
  }, []);

  const loadGeoData = async () => {
    try {
      const data = await api.getGeoRadarOrigins();
      setOrigins(data);
      if (data.length > 0 && !selectedOrigin) {
        setSelectedOrigin(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const totalThreatEvents = origins.reduce((acc, o) => acc + (o.eventCount || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Global Threat Radar & Geo-IP Blast Radius</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geospatial origin mapping, Autonomous System (ASN) attribution, and cross-border impossible travel detection.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <span className="px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>{origins.length} Ingress Vector Nodes Active</span>
          </span>

          <button
            onClick={() => {
              setIsLoading(true);
              loadGeoData().finally(() => setIsLoading(false));
            }}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* World Map Visual Simulation Canvas */}
      <div className="saas-card p-6 space-y-4 relative overflow-hidden bg-[#070b14]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Live Adversary Attack Ingress Vector Map ({totalThreatEvents} Correlated Signals)
            </span>
          </div>

          <span className="text-[10px] font-mono text-slate-400">MaxMind GeoLite2 & PostgreSQL Telemetry</span>
        </div>

        {/* Tactical Radar Matrix */}
        <div className="p-6 rounded-2xl bg-[#050811] border border-slate-800/80 relative min-h-[220px] flex items-center justify-center">
          {origins.length === 0 ? (
            <div className="text-slate-500 text-xs py-8">Scanning for live external threat signals...</div>
          ) : (
            <div className="w-full grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 z-10">
              {origins.map((origin) => {
                const isSelected = selectedOrigin?.id === origin.id;
                return (
                  <div
                    key={origin.id}
                    onClick={() => setSelectedOrigin(origin)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-lg'
                        : 'bg-[#090e1a] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center space-x-1.5">
                        <span>{origin.countryName}</span>
                        <span className="text-[10px] text-slate-400 font-mono">({origin.countryCode})</span>
                      </span>
                      <span className="text-[10px] font-mono font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">
                        {origin.eventCount} alerts
                      </span>
                    </div>

                    <p className="text-[11px] text-cyan-300 font-mono">{origin.ipAddress}</p>
                    <p className="text-[11px] text-slate-400 truncate">{origin.threatActor}</p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Selected Threat Origin Breakdown */}
      {selectedOrigin && (
        <div className="saas-card p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs uppercase font-semibold text-slate-400">{selectedOrigin.countryName} Ingress Node</span>
                <span className="text-xs font-mono text-cyan-400">[{selectedOrigin.ipAddress}]</span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">{selectedOrigin.attackType}</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Attributed Threat Actor: <strong className="text-rose-400">{selectedOrigin.threatActor}</strong>
              </p>
            </div>

            <span className="text-xs font-semibold uppercase px-3 py-1 rounded-full border bg-rose-500/10 text-rose-400 border-rose-500/30">
              {selectedOrigin.severity} Threat
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Autonomous System (ASN)</span>
              <span className="font-semibold text-white mt-0.5 block">{selectedOrigin.asn}</span>
            </div>

            <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Target Coordinate Geo-Point</span>
              <span className="font-mono text-cyan-300 mt-0.5 block">
                {selectedOrigin.coordinates[0]}° N, {selectedOrigin.coordinates[1]}° E
              </span>
            </div>

            <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Target Blast Radius</span>
              <span className="font-semibold text-rose-300 mt-0.5 block">Cross-Region VPC & Cloud IAM Roles</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
