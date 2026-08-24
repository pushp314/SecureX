import React, { useState, useEffect } from 'react';
import { SystemDiagnostics } from '../types';
import { api } from '../services/api';
import { Activity, CheckCircle, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [diagnostics, setDiagnostics] = useState<SystemDiagnostics | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testOutput, setTestOutput] = useState<any | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDiagnostics();
    }
  }, [isOpen]);

  const loadDiagnostics = async () => {
    try {
      const data = await api.getDiagnostics();
      setDiagnostics(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunSelfTest = async () => {
    setIsRunningTest(true);
    setTestOutput(null);
    try {
      const res = await api.runDiagnosticSelfTest();
      setTestOutput(res);
      await loadDiagnostics();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRunningTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-500 hover:text-white">
          <X className="w-4 h-4" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-sans text-xs uppercase font-semibold">
            <Activity className="w-4 h-4" />
            <span>Platform Observability & Diagnostics</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Telemetry Pipeline & Engine Health</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time pipeline latency, stream throughput, and automated self-healing integrity suite.
          </p>
        </div>

        {/* High-Level Metrics */}
        {diagnostics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#090e1a] rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Pipeline Status</span>
              <span className="text-sm font-bold text-emerald-400 flex items-center space-x-1 mt-0.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{diagnostics.status}</span>
              </span>
            </div>

            <div className="p-3 bg-[#090e1a] rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Ingestion Rate</span>
              <span className="text-sm font-bold font-mono text-indigo-300 mt-0.5 block">
                {diagnostics.pipelineMetrics.eventsPerSecond} EPS
              </span>
            </div>

            <div className="p-3 bg-[#090e1a] rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Detection Latency</span>
              <span className="text-sm font-bold font-mono text-amber-300 mt-0.5 block">
                {diagnostics.pipelineMetrics.detectionP99LatencyMs} ms (P99)
              </span>
            </div>

            <div className="p-3 bg-[#090e1a] rounded-xl border border-slate-800">
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Integrity Score</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                {diagnostics.integrityScore}%
              </span>
            </div>
          </div>
        )}

        {/* Self-Test Runner Output */}
        {testOutput && (
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-300 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Self-Healing Diagnostic Verification: {testOutput.overallStatus}</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">Score: {testOutput.integrityScore}%</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] pt-1">
              {testOutput.tests.map((t: any, idx: number) => (
                <div key={idx} className="p-2 bg-[#070a12] rounded-lg border border-slate-800">
                  <span className="text-slate-400 block text-[10px] truncate">{t.name}</span>
                  <span className="text-emerald-400 font-bold">{t.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Component Health Breakdown */}
        {diagnostics && (
          <div className="space-y-2 overflow-y-auto max-h-60 custom-scrollbar pr-1">
            <span className="text-xs font-semibold uppercase text-slate-400 block">Core Subsystem Health Ledger</span>
            <div className="space-y-2">
              {diagnostics.componentHealth.map((comp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-white">{comp.name}</h4>
                    <p className="text-[11px] text-slate-400">{comp.message}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {comp.status}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block mt-0.5">{comp.latencyMs}ms</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400 font-mono">Uptime: {diagnostics?.uptimeSeconds ?? 0}s</span>
          <button
            onClick={handleRunSelfTest}
            disabled={isRunningTest}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRunningTest ? 'animate-spin' : ''}`} />
            <span>{isRunningTest ? 'Running Self-Diagnostics...' : 'Execute Diagnostic Self-Test'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
