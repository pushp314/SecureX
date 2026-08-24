import React from 'react';
import {
  Shield,
  Radio,
  Terminal,
  AlertTriangle,
  Crosshair,
  Cpu,
  Play,
  ShieldAlert,
  Webhook,
  Wifi,
  GitPullRequest,
  Key,
  Sparkles,
  Activity,
  Cloud,
  Skull,
  UserCheck,
  Scale,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Globe,
  Code,
  TrendingUp,
  HardDrive,
} from 'lucide-react';
import { AuthUser } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  openSimulator: () => void;
  openWebhooks: () => void;
  openAuditKeys: () => void;
  openDiagnostics: () => void;
  currentUser: AuthUser | null;
  onLogout: () => void;
  isWsConnected: boolean;
  liveEventCount: number;
}

interface NavSection {
  title: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  isCollapsed,
  setIsCollapsed,
  openSimulator,
  openWebhooks,
  openAuditKeys,
  openDiagnostics,
  currentUser,
  onLogout,
  isWsConnected,
}) => {
  const sections: NavSection[] = [
    {
      title: 'SIEM Machine & Analytics',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: Radio },
        { id: 'siem_query', label: 'SIEM Query (KQL)', icon: Search },
        { id: 'threat_intel', label: 'Threat Intel (CTI)', icon: Globe },
        { id: 'ueba', label: 'UEBA Analytics', icon: TrendingUp },
        { id: 'geo_radar', label: 'Geo-IP Threat Radar', icon: Globe },
      ],
    },
    {
      title: 'Investigation & Cases',
      items: [
        { id: 'incidents', label: 'Incident Triage', icon: AlertTriangle },
        { id: 'investigation', label: 'Investigation Canvas', icon: Crosshair },
        { id: 'hunting', label: 'Threat Hunting', icon: Sparkles },
        { id: 'sandbox', label: 'Malware Sandbox', icon: Skull },
      ],
    },
    {
      title: 'Defense & Cloud Governance',
      items: [
        { id: 'itdr', label: 'Identity ITDR', icon: UserCheck },
        { id: 'compliance', label: 'Compliance & D3FEND', icon: Scale },
        { id: 'cloud', label: 'Cloud Posture (CSPM)', icon: Cloud },
        { id: 'vulnerabilities', label: 'Exposure Scanner', icon: ShieldAlert },
      ],
    },
    {
      title: 'Data Engine & Ingestion',
      items: [
        { id: 'parsers', label: 'Universal Log Parsers', icon: Code },
        { id: 'retention', label: 'Data Retention & ILM', icon: HardDrive },
        { id: 'network', label: 'Network Monitor', icon: Wifi },
        { id: 'devsecops', label: 'DevSecOps CI/CD', icon: GitPullRequest },
        { id: 'rules', label: 'Rule Engine Studio', icon: Cpu },
        { id: 'explorer', label: 'Telemetry & DLQ', icon: Terminal },
      ],
    },
  ];

  const roleColors: Record<string, string> = {
    SOC_LEAD: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
    ANALYST_TIER_2: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    AUDITOR: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
  };

  return (
    <aside
      className={`h-screen sticky top-0 bg-[#080d17] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-40 select-none ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Top Brand Header */}
      <div className="p-4 border-b border-slate-800/70 flex items-center justify-between">
        <div
          onClick={() => setCurrentTab('dashboard')}
          className="flex items-center space-x-3 cursor-pointer overflow-hidden"
        >
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-600/30 border border-indigo-500/30 glow-accent shrink-0">
            <Shield className="w-5 h-5 text-indigo-400" />
            <span
              className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                isWsConnected ? 'bg-emerald-400' : 'bg-amber-400'
              } animate-ping`}
            />
          </div>

          {!isCollapsed && (
            <div className="transition-opacity duration-200">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  SECURE<span className="text-indigo-400">X</span>
                </span>
                <span className="text-[9px] uppercase font-semibold px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  PRO
                </span>
              </div>
              <p className="text-[10px] text-slate-400 truncate">Security Intelligence</p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-5">
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-1">
            {!isCollapsed ? (
              <h4 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 px-3 pb-1">
                {section.title}
              </h4>
            ) : (
              <div className="h-px bg-slate-800/80 mx-2 my-2" />
            )}

            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center rounded-xl font-medium transition-all ${
                      isCollapsed ? 'justify-center p-2.5' : 'space-x-3 px-3 py-2 text-xs'
                    } ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Controls & User Profile */}
      <div className="p-3 border-t border-slate-800/70 space-y-3 bg-[#0a101c]/60">
        {/* Quick Simulator Launcher */}
        <button
          onClick={openSimulator}
          title="Adversary Attack Simulator"
          className={`w-full flex items-center rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 text-white font-semibold text-xs shadow-md shadow-rose-500/20 transition-transform active:scale-95 ${
            isCollapsed ? 'justify-center p-2.5' : 'space-x-2 px-3 py-2.5'
          }`}
        >
          <Play className="w-3.5 h-3.5 fill-current shrink-0" />
          {!isCollapsed && <span>Threat Simulator</span>}
        </button>

        {/* Quick Utilities Row */}
        <div className={`flex items-center gap-1.5 ${isCollapsed ? 'flex-col' : 'justify-between'}`}>
          <button
            onClick={openDiagnostics}
            title="System Observability (99.98% Healthy)"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 transition-colors"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={openAuditKeys}
            title="API Keys & Cryptographic Audit Trail"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={openWebhooks}
            title="Outbound Webhooks Integration"
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 transition-colors"
          >
            <Webhook className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* User Profile Card & Sign Out */}
        {currentUser && (
          <div
            className={`pt-2 border-t border-slate-800/70 flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between space-x-2'
            }`}
          >
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/60 border border-indigo-500/30 overflow-hidden flex items-center justify-center shrink-0">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                ) : (
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                )}
              </div>

              {!isCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-white leading-tight truncate">
                    {currentUser.name}
                  </p>
                  <span
                    className={`text-[8px] font-mono px-1 py-0.2 rounded border uppercase mt-0.5 inline-block ${
                      roleColors[currentUser.role] || 'text-slate-400'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={onLogout}
              title="Sign Out Session"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
