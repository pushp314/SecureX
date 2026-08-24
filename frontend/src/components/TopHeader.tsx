import React from 'react';
import { Search, Play } from 'lucide-react';

interface TopHeaderProps {
  currentTab: string;
  openCommandPalette: () => void;
  openSimulator: () => void;
  isWsConnected: boolean;
  liveEventCount: number;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Threat Operations Dashboard',
    subtitle: 'High-level operational overview, MITRE matrix heatmap, and real-time posture metrics',
  },
  incidents: {
    title: 'Incident Triage & Security Cases',
    subtitle: 'Correlated multi-signal attack sequences grouped by entity and MITRE tactics',
  },
  investigation: {
    title: 'Investigation Canvas & Forensic Stepper',
    subtitle: 'Attack kill-chain reconstruction, entity blast radius, AI Copilot, and SOAR playbooks',
  },
  hunting: {
    title: 'Threat Hunting Workbench & Sigma Engine',
    subtitle: 'Proactive hypothesis testing, sub-second telemetry mining, and 1-click rule promotion',
  },
  itdr: {
    title: 'Identity Threat Detection & Response (ITDR)',
    subtitle: 'Workload risk scoring, automated containment, and adversary stress-testing suite',
  },
  compliance: {
    title: 'Regulatory Compliance & MITRE D3FEND',
    subtitle: 'Continuous governance across SOC 2, ISO 27001, HIPAA, PCI-DSS, and NIST CSF 2.0',
  },
  cloud: {
    title: 'Cloud Security Posture Management (CSPM)',
    subtitle: 'Multi-cloud resource inventory (AWS, Azure, GCP, K8s) and 1-click auto-remediation',
  },
  sandbox: {
    title: 'Automated Malware Detonation Sandbox',
    subtitle: 'Dynamic execution analysis, process tree visualization, and system API interception',
  },
  network: {
    title: 'Network Flow & Traffic Anomaly Monitor',
    subtitle: 'NetFlow / IPFIX analysis, C2 beaconing heartbeats, and DNS tunneling detection',
  },
  devsecops: {
    title: 'DevSecOps & Supply Chain Security',
    subtitle: 'Committed secrets scanner, Dockerfile root checks, and deployment guardrails',
  },
  vulnerabilities: {
    title: 'Asset Exposure & Vulnerability Scanner',
    subtitle: 'Continuous CVE enumeration, CVSS v3.1 scoring, and incident correlation',
  },
  rules: {
    title: 'Rule Engine Studio & Backtesting',
    subtitle: 'Sliding-window MITRE rule editor, real-time condition builder, and replay engine',
  },
  explorer: {
    title: 'Telemetry Stream & Dead Letter Queue (DLQ)',
    subtitle: 'Schema-normalized security events and quarantined poison message recovery',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  openCommandPalette,
  openSimulator,
  isWsConnected,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'Security Operations',
    subtitle: 'Real-time telemetry and threat intelligence',
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#070a12]/80 backdrop-blur-md sticky top-0 z-30 px-6 py-3 flex items-center justify-between gap-4">
      {/* View Title & Breadcrumb */}
      <div>
        <div className="flex items-center space-x-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400">
            SecureX SOC
          </span>
          <span className="text-slate-600">/</span>
          <h2 className="text-sm font-semibold text-white tracking-tight">{currentInfo.title}</h2>
        </div>
        <p className="text-[11px] text-slate-400 hidden sm:block mt-0.5">{currentInfo.subtitle}</p>
      </div>

      {/* Action Controls & Realtime Status */}
      <div className="flex items-center space-x-3 shrink-0">
        {/* Global Search (Cmd+K) */}
        <button
          onClick={openCommandPalette}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#0d1424] hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white transition-colors shadow-sm"
          title="Search anything (⌘K)"
        >
          <Search className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Search...</span>
          <kbd className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700 text-slate-400 font-mono">
            ⌘K
          </kbd>
        </button>

        {/* Live Stream Pulse Badge */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#0d1424] border border-slate-800 text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              isWsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-300 font-medium hidden md:inline">
            {isWsConnected ? 'Live Stream' : 'Connecting'}
          </span>
        </div>

        {/* Simulator Button */}
        <button
          onClick={openSimulator}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 text-white text-xs font-semibold shadow-sm transition-transform active:scale-95 whitespace-nowrap"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          <span className="hidden sm:inline">Simulate Attack</span>
        </button>
      </div>
    </header>
  );
};
