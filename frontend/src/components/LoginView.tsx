import React, { useState } from 'react';
import { Shield, Lock, Mail, ArrowRight, UserCheck, Scale, Cpu, ShieldAlert, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { AuthUser } from '../types';

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

const PRESET_USERS = [
  {
    role: 'SOC_LEAD',
    label: 'Sarah Connor',
    title: 'SOC Lead / Global Admin',
    email: 'sarah.connor@securex.internal',
    pass: 'SecureX@2026!',
    desc: 'Full administrative access across all modules, playbooks, and detection rules.',
    icon: Shield,
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
  },
  {
    role: 'ANALYST_TIER_2',
    label: 'Alex Mercer',
    title: 'Senior Incident Responder',
    email: 'alex.mercer@securex.internal',
    pass: 'Analyst@2026!',
    desc: 'Deep investigation access, malware sandbox detonation, and threat hunting.',
    icon: Sparkles,
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  },
  {
    role: 'AUDITOR',
    label: 'Robert Vance',
    title: 'Compliance & Governance Auditor',
    email: 'bob.auditor@securex.internal',
    pass: 'Auditor@2026!',
    desc: 'Read-only access to SOC 2, ISO 27001, audit ledgers, and regulatory reports.',
    icon: Scale,
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  },
];

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('sarah.connor@securex.internal');
  const [password, setPassword] = useState('SecureX@2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError(null);
    setIsLoading(true);

    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    try {
      const session = await api.login(targetEmail, targetPass);
      onLoginSuccess(session.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Verify credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_USERS[0]) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    handleLogin(undefined, preset.email, preset.pass);
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Cyber Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 z-10">
        {/* Left Side: Brand & Platform Highlights */}
        <div className="md:col-span-5 flex flex-col justify-between space-y-6 text-left p-2">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/50 glow-cyan flex items-center justify-center">
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold text-white tracking-wider">
                  SECURE<span className="text-cyan-400">X</span>
                </h1>
                <p className="text-xs text-slate-400 font-mono">Cyber SOC & Threat Platform</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans pt-2">
              Next-generation investigation-centered SIEM / XDR intelligence suite with real-time sliding-window detection, multi-cloud posture management, dynamic malware sandboxing, and explainable AI incident copilot.
            </p>
          </div>

          <div className="space-y-2.5 pt-4 border-t border-slate-800/80">
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>Sliding-Window Detection Engine (8 Rules Active)</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>SHA-256 Tamper-Evident Merkle Audit Ledger</span>
            </div>
            <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Dead Letter Queue (DLQ) Poison Isolation</span>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Login Form & 1-Click Role Presets */}
        <div className="md:col-span-7 glass-panel p-6 md:p-8 rounded-3xl border-slate-800 space-y-6 shadow-2xl">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>SOC Operator Authentication</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Select a pre-configured analyst profile or authenticate with credentials.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/50 text-xs font-mono text-rose-300 flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* 1-Click Quick Analyst Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase text-slate-400 tracking-wider">
              1-Click Fast Analyst Login
            </span>
            <div className="grid grid-cols-1 gap-2">
              {PRESET_USERS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <div
                    key={preset.email}
                    onClick={() => handlePresetSelect(preset)}
                    className="p-3 rounded-xl bg-[#070b13] border border-slate-800 hover:border-cyan-500/60 transition-all cursor-pointer group flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-cyan-500/40">
                        <Icon className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                            {preset.label}
                          </span>
                          <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border uppercase ${preset.badgeColor}`}>
                            {preset.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Manual Credential Form */}
          <form onSubmit={handleLogin} className="space-y-4 pt-2 border-t border-slate-800">
            <div className="space-y-3">
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Analyst Email (e.g. name@securex.internal)"
                  required
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className="w-full bg-[#070b13] border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold font-mono text-xs shadow-lg shadow-cyan-500/25 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <span>{isLoading ? 'Authenticating Analyst...' : 'Sign In to SecureX SOC'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
