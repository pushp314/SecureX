import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import {
  Search,
  Radio,
  Crosshair,
  Sparkles,
  Scale,
  Cloud,
  Skull,
  Wifi,
  ShieldAlert,
  Cpu,
  Terminal,
  Zap,
  X,
  Globe,
  Code,
  TrendingUp,
  HardDrive,
  UserCheck,
  GitPullRequest,
} from 'lucide-react';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string) => void;
  onSelectIncident: (id: string) => void;
  onOpenSimulator: () => void;
  incidents: Incident[];
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectIncident,
  onOpenSimulator,
  incidents,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const NAV_ITEMS = [
    // SIEM Machine & Analytics
    { id: 'dashboard', label: 'Threat Operations Dashboard', icon: Radio, category: 'SIEM Machine' },
    { id: 'siem_query', label: 'SIEM Piped Query Console (KQL / SPL)', icon: Search, category: 'SIEM Machine' },
    { id: 'threat_intel', label: 'Threat Intelligence (CTI) & IOC Hub', icon: Globe, category: 'SIEM Machine' },
    { id: 'ueba', label: 'User & Entity Behavioral Analytics (UEBA)', icon: TrendingUp, category: 'SIEM Machine' },
    { id: 'geo_radar', label: 'Global Geo-IP Threat Radar', icon: Globe, category: 'SIEM Machine' },

    // Investigation & Cases
    { id: 'incidents', label: 'Incident Triage & Case Management', icon: ShieldAlert, category: 'Investigation' },
    { id: 'investigation', label: 'Investigation Canvas & Kill-Chain', icon: Crosshair, category: 'Investigation' },
    { id: 'hunting', label: 'Threat Hunting Workbench', icon: Sparkles, category: 'Investigation' },
    { id: 'sandbox', label: 'Automated Malware Sandbox', icon: Skull, category: 'Investigation' },

    // Defense & Governance
    { id: 'itdr', label: 'Identity ITDR & Workload Risk', icon: UserCheck, category: 'Defense' },
    { id: 'compliance', label: 'Compliance & D3FEND Matrix', icon: Scale, category: 'Defense' },
    { id: 'cloud', label: 'Cloud Security Posture (CSPM)', icon: Cloud, category: 'Defense' },
    { id: 'vulnerabilities', label: 'Asset Exposure & CVE Scanner', icon: ShieldAlert, category: 'Defense' },

    // Data Ingestion & Engine
    { id: 'parsers', label: 'Universal Log Ingestion Parsers', icon: Code, category: 'Data Engine' },
    { id: 'retention', label: 'Data Retention & Storage Tiering (ILM)', icon: HardDrive, category: 'Data Engine' },
    { id: 'network', label: 'Network Flow Anomaly Monitor', icon: Wifi, category: 'Data Engine' },
    { id: 'devsecops', label: 'DevSecOps Supply Chain CI/CD', icon: GitPullRequest, category: 'Data Engine' },
    { id: 'rules', label: 'Detection Rule Engine Studio', icon: Cpu, category: 'Data Engine' },
    { id: 'explorer', label: 'Telemetry Stream & DLQ Quarantine', icon: Terminal, category: 'Data Engine' },
  ];

  const filteredNav = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase()) ||
    item.category.toLowerCase().includes(query.toLowerCase()) ||
    item.id.toLowerCase().includes(query.toLowerCase())
  );

  const filteredIncidents = incidents.filter((inc) =>
    inc.title.toLowerCase().includes(query.toLowerCase()) ||
    inc.incidentId.toLowerCase().includes(query.toLowerCase()) ||
    inc.entityKey.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-xl w-full p-4 space-y-4 shadow-2xl relative">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Type a command, tab, or search incident (e.g. KQL, IOC, UEBA, INC)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-[#070a12] border border-slate-800 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500"
          />
          <button onClick={onClose} className="absolute right-3.5 top-3 text-slate-500 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Launch Action */}
        <div className="space-y-1">
          <div
            onClick={() => {
              onOpenSimulator();
              onClose();
            }}
            className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-blue-950/20 border border-indigo-500/30 hover:border-indigo-500 flex items-center justify-between text-xs cursor-pointer transition-all"
          >
            <div className="flex items-center space-x-2 text-indigo-300 font-semibold font-sans">
              <Zap className="w-4 h-4 text-indigo-400" />
              <span>Launch Adversary Threat Simulation</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">Multi-Stage Attack</span>
          </div>
        </div>

        {/* Results List */}
        <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
          {/* Matching Incidents */}
          {filteredIncidents.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-semibold text-slate-400 px-1 block">Active Incident Cases</span>
              {filteredIncidents.slice(0, 3).map((inc) => (
                <div
                  key={inc.id}
                  onClick={() => {
                    onSelectIncident(inc.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-2 truncate">
                    <span className="font-mono text-indigo-400 text-xs font-semibold">{inc.incidentId}</span>
                    <span className="text-white truncate font-medium">{inc.title}</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30 shrink-0">
                    {inc.severity}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Matching Navigation Views */}
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-semibold text-slate-400 px-1 block">Navigation Views</span>
            {filteredNav.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-xl bg-[#090e1a] border border-slate-800 hover:border-slate-700 flex items-center justify-between text-xs cursor-pointer transition-all"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-indigo-400" />
                    <span className="text-white font-medium">{item.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{item.category}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
