import React, { useState } from 'react';
import { api } from '../services/api';
import { Play, ShieldAlert, Zap, Skull, Terminal, CheckCircle2, X, Sliders } from 'lucide-react';

interface SimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSimulationTriggered: () => void;
}

export const SimulationModal: React.FC<SimulationModalProps> = ({
  isOpen,
  onClose,
  onSimulationTriggered,
}) => {
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');
  const [isRunning, setIsRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<string | null>(null);
  const [progressMsg, setProgressMsg] = useState<string>('');

  // Custom campaign builder states
  const [customIp, setCustomIp] = useState('185.220.101.5');
  const [customUser, setCustomUser] = useState('john.doe@corp.internal');
  const [customTactic, setCustomTactic] = useState<'bruteforce' | 'ransomware' | 'sqli' | 'c2_beacon'>('bruteforce');
  const [customCount, setCustomCount] = useState(6);

  if (!isOpen) return null;

  const now = () => new Date().toISOString();

  const runScenario = async (type: 'apt' | 'ransomware' | 'exploit' | 'benign') => {
    setIsRunning(true);
    setActiveScenario(type);

    try {
      if (type === 'apt') {
        setProgressMsg('Injecting Stage 1: Port Reconnaissance Probe (T1046)...');
        const reconEvents = Array.from({ length: 6 }).map((_, i) => ({
          timestamp: now(),
          category: 'network_traffic',
          eventType: 'network.port_scan_probe',
          outcome: 'denied',
          severity: 'low',
          network: { sourceIp: '198.51.100.77', destinationPort: 8000 + i },
          metadata: { probe: 'SYN_SCAN' },
        }));
        await api.ingestTelemetry(reconEvents);
        await new Promise((r) => setTimeout(r, 400));

        setProgressMsg('Injecting Stage 2: High-Velocity Brute Force Login Storm (T1110.001)...');
        const bruteEvents = Array.from({ length: 6 }).map((_, i) => ({
          timestamp: now(),
          category: 'authentication',
          eventType: 'auth.login_failed',
          outcome: 'failure',
          severity: 'medium',
          identity: { username: 'sarah.connor@corp.internal' },
          network: { sourceIp: '198.51.100.77', userAgent: 'Hydra/9.5 (Kali Linux)' },
          metadata: { attempt: i + 1 },
        }));
        await api.ingestTelemetry(bruteEvents);
        await new Promise((r) => setTimeout(r, 400));

        setProgressMsg('Injecting Stage 3 & 4: Admin IAM Privilege Escalation (T1098)...');
        await api.ingestTelemetry([
          {
            timestamp: now(),
            category: 'privilege_change',
            eventType: 'iam.role_escalation',
            outcome: 'success',
            severity: 'critical',
            identity: { username: 'sarah.connor@corp.internal', role: 'GlobalAdmin' },
            network: { sourceIp: '198.51.100.77' },
            resource: { resourceType: 'iam_policy', resourceName: 'AdminAccessPolicy', action: 'attach_policy' },
          },
        ]);
        await new Promise((r) => setTimeout(r, 400));

        setProgressMsg('Injecting Stage 5: Mass Sensitive Cloud Data Exfiltration (T1567)...');
        const exfilEvents = Array.from({ length: 4 }).map((_, i) => ({
          timestamp: now(),
          category: 'data_access',
          eventType: 'data.s3_bulk_download',
          outcome: 'success',
          severity: 'critical',
          identity: { username: 'sarah.connor@corp.internal' },
          network: { sourceIp: '198.51.100.77' },
          resource: { resourceType: 's3_bucket', resourceName: `customer-pii-vault-${i + 1}` },
          metadata: { bytes: 104857600 * (i + 1) },
        }));
        await api.ingestTelemetry(exfilEvents);
      } else if (type === 'ransomware') {
        setProgressMsg('Injecting Rapid Encryption & Mass File Modification Storm (T1486)...');
        const encryptEvents = Array.from({ length: 9 }).map((_, i) => ({
          timestamp: now(),
          category: 'system_integrity',
          eventType: 'system.file_encrypted',
          outcome: 'success',
          severity: 'critical',
          network: { sourceIp: '10.0.4.112' },
          resource: { resourceType: 'filesystem', resourceName: `/var/data/finance/ledger_${i + 1}.enc` },
          metadata: { extension: '.lockbit', entropy: 7.98 },
        }));
        await api.ingestTelemetry(encryptEvents);
      } else if (type === 'exploit') {
        setProgressMsg('Injecting Web Application Injection & Stolen Token Replay...');
        await api.ingestTelemetry([
          {
            timestamp: now(),
            category: 'api_activity',
            eventType: 'api.exploit_probe',
            outcome: 'denied',
            severity: 'high',
            network: { sourceIp: '203.0.113.45', userAgent: 'sqlmap/1.7' },
            resource: { resourceType: 'http_api', resourceName: '/api/v1/checkout?id=1%27%20OR%201=1--' },
          },
          {
            timestamp: now(),
            category: 'authentication',
            eventType: 'auth.token_replay',
            outcome: 'denied',
            severity: 'high',
            network: { sourceIp: '203.0.113.45' },
            identity: { username: 'devops-lead' },
          },
        ]);
      } else if (type === 'benign') {
        setProgressMsg('Injecting Baseline Production Web & API Traffic...');
        const benignEvents = Array.from({ length: 8 }).map((_, i) => ({
          timestamp: now(),
          category: 'api_activity',
          eventType: 'api.request_success',
          outcome: 'success',
          severity: 'info',
          identity: { username: `user_${i + 1}@corp.internal` },
          network: { sourceIp: `192.168.1.${10 + i}` },
          resource: { resourceType: 'api_endpoint', resourceName: '/api/v1/dashboard' },
        }));
        await api.ingestTelemetry(benignEvents);
      }

      setProgressMsg('Simulation telemetry processed by Detection & Correlation engines!');
      onSimulationTriggered();
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(err);
      setProgressMsg('Error sending telemetry.');
    } finally {
      setIsRunning(false);
      setActiveScenario(null);
    }
  };

  const handleRunCustomCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRunning(true);
    setProgressMsg(`Injecting custom campaign against ${customIp}...`);

    try {
      if (customTactic === 'bruteforce') {
        const events = Array.from({ length: customCount }).map((_, i) => ({
          timestamp: now(),
          category: 'authentication',
          eventType: 'auth.login_failed',
          outcome: 'failure',
          severity: 'medium',
          identity: { username: customUser },
          network: { sourceIp: customIp, userAgent: 'Hydra/9.5 (Custom Target)' },
          metadata: { attempt: i + 1, tactic: 'credential_stuffing' },
        }));
        await api.ingestTelemetry(events);
      } else if (customTactic === 'ransomware') {
        const events = Array.from({ length: customCount }).map((_, i) => ({
          timestamp: now(),
          category: 'system_integrity',
          eventType: 'system.file_encrypted',
          outcome: 'success',
          severity: 'critical',
          identity: { username: customUser },
          network: { sourceIp: customIp },
          resource: { resourceType: 'filesystem', resourceName: `/var/data/custom_file_${i + 1}.lock` },
          metadata: { entropy: 7.95, customCampaign: true },
        }));
        await api.ingestTelemetry(events);
      } else if (customTactic === 'sqli') {
        const events = Array.from({ length: customCount }).map((_, i) => ({
          timestamp: now(),
          category: 'api_activity',
          eventType: 'api.exploit_probe',
          outcome: 'denied',
          severity: 'high',
          network: { sourceIp: customIp, userAgent: 'sqlmap/1.7' },
          resource: { resourceType: 'http_endpoint', resourceName: `/api/v1/users?id=${i}%27%20UNION%20SELECT%20NULL--` },
        }));
        await api.ingestTelemetry(events);
      } else if (customTactic === 'c2_beacon') {
        const events = Array.from({ length: customCount }).map((_, i) => ({
          timestamp: now(),
          category: 'network_traffic',
          eventType: 'network.outbound_beacon',
          outcome: 'success',
          severity: 'high',
          network: { sourceIp: '10.0.1.25', destinationIp: customIp, destinationPort: 443 },
          metadata: { jitter: 0.05, intervalSeconds: 60, sequence: i + 1 },
        }));
        await api.ingestTelemetry(events);
      }

      setProgressMsg('Custom adversary campaign synthesized & evaluated!');
      onSimulationTriggered();
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(err);
      setProgressMsg('Error sending custom simulation.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 p-1 rounded-lg text-slate-500 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-rose-500 font-mono text-xs uppercase font-bold">
            <Zap className="w-4 h-4" />
            <span>Adversary Attack Simulator</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Live Multi-Stage Threat Injector</h2>
          <p className="text-xs text-slate-400 mt-1">
            Simulate realistic multi-stage cyber campaigns or compose custom targeted attack patterns to test real-time detection, correlation, and SOAR response.
          </p>
        </div>

        {/* Mode Toggle Tabs */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setMode('presets')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              mode === 'presets'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Skull className="w-3.5 h-3.5" />
            <span>Pre-Configured APT Presets</span>
          </button>

          <button
            onClick={() => setMode('custom')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors ${
              mode === 'custom'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Custom Campaign Composer</span>
          </button>
        </div>

        {mode === 'presets' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Scenario 1 */}
            <div className="p-4 rounded-2xl bg-[#070b13] border border-slate-800 hover:border-rose-500/50 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    CRITICAL APT CAMPAIGN
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">5 Stages</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2">APT28 Advanced Cyber Kill-Chain</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Port scan probe $\rightarrow$ Hydra brute force $\rightarrow$ IAM admin role escalation $\rightarrow$ bulk S3 exfiltration.
                </p>
              </div>
              <button
                onClick={() => runScenario('apt')}
                disabled={isRunning}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{activeScenario === 'apt' ? 'Simulating...' : 'Launch APT Campaign'}</span>
              </button>
            </div>

            {/* Scenario 2 */}
            <div className="p-4 rounded-2xl bg-[#070b13] border border-slate-800 hover:border-amber-500/50 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    HIGH RANSOMWARE
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">T1486</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2">LockBit 3.0 Encryption Burst</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Simulates rapid high-entropy file encryption across finance shares (`.lockbit` extension).
                </p>
              </div>
              <button
                onClick={() => runScenario('ransomware')}
                disabled={isRunning}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{activeScenario === 'ransomware' ? 'Simulating...' : 'Launch Ransomware Burst'}</span>
              </button>
            </div>

            {/* Scenario 3 */}
            <div className="p-4 rounded-2xl bg-[#070b13] border border-slate-800 hover:border-purple-500/50 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    MEDIUM EXPLOIT
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">T1190 & T1528</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2">API SQLi & Stolen Token Replay</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sends SQL injection probes on checkout API followed by unauthorized session token replay.
                </p>
              </div>
              <button
                onClick={() => runScenario('exploit')}
                disabled={isRunning}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{activeScenario === 'exploit' ? 'Simulating...' : 'Launch API Exploit'}</span>
              </button>
            </div>

            {/* Scenario 4 */}
            <div className="p-4 rounded-2xl bg-[#070b13] border border-slate-800 hover:border-cyan-500/50 transition-all flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    BENIGN BASELINE
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">NORMAL TRAFFIC</span>
                </div>
                <h3 className="text-sm font-bold text-white mt-2">Normal Enterprise Web Traffic</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sends authorized API requests from internal users to generate operational baseline telemetry.
                </p>
              </div>
              <button
                onClick={() => runScenario('benign')}
                disabled={isRunning}
                className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-all active:scale-95 disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{activeScenario === 'benign' ? 'Simulating...' : 'Generate Baseline Events'}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Custom Campaign Composer */
          <form onSubmit={handleRunCustomCampaign} className="space-y-4 p-4 rounded-2xl bg-[#070b13] border border-slate-800 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 font-mono block mb-1">Attacker Source IP:</label>
                <input
                  type="text"
                  value={customIp}
                  onChange={(e) => setCustomIp(e.target.value)}
                  className="w-full bg-[#0b1320] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Victim / Target Identity:</label>
                <input
                  type="text"
                  value={customUser}
                  onChange={(e) => setCustomUser(e.target.value)}
                  className="w-full bg-[#0b1320] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Attack Tactic / Category:</label>
                <select
                  value={customTactic}
                  onChange={(e: any) => setCustomTactic(e.target.value)}
                  className="w-full bg-[#0b1320] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-rose-500"
                >
                  <option value="bruteforce">Credential Stuffing / Brute Force (T1110)</option>
                  <option value="ransomware">Fast Encryption & File Modification (T1486)</option>
                  <option value="sqli">Web SQL Injection Probe (T1190)</option>
                  <option value="c2_beacon">C2 Beaconing Callback (T1071)</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 font-mono block mb-1">Event Batch Volume ({customCount}):</label>
                <input
                  type="range"
                  min={3}
                  max={20}
                  value={customCount}
                  onChange={(e) => setCustomCount(Number(e.target.value))}
                  className="w-full mt-2 accent-rose-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isRunning}
              className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Launch Custom Adversary Campaign</span>
            </button>
          </form>
        )}

        {/* Live Progress Banner */}
        {isRunning && (
          <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded-xl flex items-center space-x-3 text-xs font-mono text-rose-300">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-400 animate-ping" />
            <span>{progressMsg}</span>
          </div>
        )}

        {!isRunning && progressMsg && (
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl flex items-center space-x-2 text-xs font-mono text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{progressMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
