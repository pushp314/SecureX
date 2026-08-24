import React, { useState, useEffect } from 'react';
import { BasAttackTest, BasExecutionResult } from '../types';
import { api } from '../services/api';
import { Crosshair, Play, CheckCircle2, XCircle, Clock, Shield, Loader2, Zap, Target, BarChart3 } from 'lucide-react';

export const BreachSimulationView: React.FC = () => {
  const [tests, setTests] = useState<BasAttackTest[]>([]);
  const [results, setResults] = useState<Record<string, BasExecutionResult>>({});
  const [matrix, setMatrix] = useState<any>(null);
  const [running, setRunning] = useState<string | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [t, m] = await Promise.all([api.getBasTests(), api.getBasMatrix()]);
      setTests(t);
      setMatrix(m);
    } catch (err) { console.error(err); }
  };

  const handleRun = async (testId: string) => {
    setRunning(testId);
    try {
      const result = await api.runBasTest(testId);
      setResults((prev) => ({ ...prev, [testId]: result }));
      await loadData();
    } catch (err) { console.error(err); }
    finally { setRunning(null); }
  };

  const statusIcon = (status?: string) => {
    if (status === 'PASSED') return <CheckCircle2 size={14} color="#22c55e" />;
    if (status === 'FAILED') return <XCircle size={14} color="#ef4444" />;
    if (status === 'BLOCKED') return <Shield size={14} color="#f97316" />;
    return <Clock size={14} color="#475569" />;
  };

  const sevColor = (s: string) => {
    if (s === 'critical') return '#ef4444';
    if (s === 'high') return '#f97316';
    return '#eab308';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Crosshair size={24} color="#ef4444" />Breach & Attack Simulation
          </h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.875rem' }}>
            Atomic Red Team emulation — validate MITRE ATT&CK detection coverage against real adversary TTPs
          </p>
        </div>
      </div>

      {/* MITRE Coverage Stats */}
      {matrix && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Total Techniques', value: matrix.totalTechniques, icon: <Target size={18} />, color: '#6366f1' },
            { label: 'Coverage', value: `${matrix.coveragePercent}%`, icon: <BarChart3 size={18} />, color: matrix.coveragePercent >= 60 ? '#22c55e' : '#ef4444' },
            { label: 'Passed', value: matrix.passedTests, icon: <CheckCircle2 size={18} />, color: '#22c55e' },
            { label: 'Failed', value: matrix.failedTests, icon: <XCircle size={18} />, color: '#ef4444' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <span style={{ color: '#94a3b8', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Attack Tests */}
      <div style={{ display: 'grid', gap: 12 }}>
        {tests.map((test) => {
          const result = results[test.id];
          return (
            <div key={test.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20,
              borderLeft: `3px solid ${sevColor(test.severity)}`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontFamily: 'monospace' }}>
                      {test.techniqueId}
                    </span>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{test.name}</span>
                    {test.lastStatus && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.7rem', fontWeight: 600,
                        color: test.lastStatus === 'PASSED' ? '#22c55e' : test.lastStatus === 'FAILED' ? '#ef4444' : '#f97316' }}>
                        {statusIcon(test.lastStatus)} {test.lastStatus}
                      </span>
                    )}
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: '0 0 8px' }}>{test.description}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Tactic: <span style={{ color: '#e2e8f0' }}>{test.tactic}</span></span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Platform: <span style={{ color: '#e2e8f0' }}>{test.platform}</span></span>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Expected Rule: <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>{test.expectedRuleId}</span></span>
                    {test.validationLatencyMs != null && (
                      <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Latency: <span style={{ color: test.validationLatencyMs < 500 ? '#22c55e' : '#ef4444' }}>{test.validationLatencyMs}ms</span></span>
                    )}
                  </div>
                </div>
                <button onClick={() => handleRun(test.id)} disabled={running === test.id}
                  style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                  {running === test.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  {running === test.id ? 'Executing…' : 'Run Test'}
                </button>
              </div>

              {/* Execution Result */}
              {result && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16,
                  background: result.detectionTriggered ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.05)', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    {result.detectionTriggered ? <CheckCircle2 size={16} color="#22c55e" /> : <XCircle size={16} color="#ef4444" />}
                    <span style={{ fontWeight: 700, color: result.detectionTriggered ? '#22c55e' : '#ef4444', fontSize: '0.85rem' }}>
                      {result.status}
                    </span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>• {result.validationLatencyMs}ms</span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0 }}>{result.summary}</p>
                  {result.ruleMatched && (
                    <div style={{ marginTop: 8, fontSize: '0.75rem', color: '#64748b' }}>
                      Rule matched: <span style={{ color: '#818cf8', fontFamily: 'monospace' }}>{result.ruleMatched}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
