import React, { useState, useEffect } from 'react';
import { RuleNoiseProfile } from '../types';
import { api } from '../services/api';
import { Volume2, VolumeX, BarChart3, Activity, Zap, CheckCircle2, AlertTriangle, Shield, Loader2, TrendingDown, Clock } from 'lucide-react';

export const NoiseCancellationView: React.FC = () => {
  const [rules, setRules] = useState<RuleNoiseProfile[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [tuning, setTuning] = useState<string | null>(null);
  const [tuneResults, setTuneResults] = useState<Record<string, any>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [r, s] = await Promise.all([api.getTuningRules(), api.getTuningSummary()]);
      setRules(r);
      setSummary(s);
    } catch (err) { console.error(err); }
  };

  const handleTune = async (ruleId: string) => {
    setTuning(ruleId);
    try {
      const result = await api.applyTuning(ruleId);
      setTuneResults((prev) => ({ ...prev, [ruleId]: result }));
      // Reload data to reflect updated metrics
      await loadData();
    } catch (err) { console.error(err); }
    finally { setTuning(null); }
  };

  const statusColor = (s: string) => {
    if (s === 'NOISY') return '#ef4444';
    if (s === 'CRITICAL_COVERAGE') return '#22c55e';
    return '#6366f1';
  };

  const fprColor = (fpr: number) => {
    if (fpr > 80) return '#ef4444';
    if (fpr > 40) return '#f97316';
    if (fpr > 15) return '#eab308';
    return '#22c55e';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <VolumeX size={24} color="#6366f1" />Adaptive Noise Cancellation
        </h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.875rem' }}>
          Self-healing detection auto-tuner — suppress false positives by learning from analyst dismissal patterns
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {[
            { label: 'Rules Analyzed', value: summary.totalRulesAnalyzed, icon: <BarChart3 size={18} />, color: '#6366f1' },
            { label: 'Noisy Rules', value: summary.noisyRules, icon: <Volume2 size={18} />, color: '#ef4444' },
            { label: 'Overall FPR', value: `${summary.overallFalsePositiveRate}%`, icon: <Activity size={18} />, color: fprColor(summary.overallFalsePositiveRate) },
            { label: 'Hours Saved/Week', value: `${summary.estimatedHoursSavedPerWeek}h`, icon: <Clock size={18} />, color: '#22c55e' },
          ].map((stat, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ color: stat.color }}>{stat.icon}</div>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{stat.label}</span>
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Rule Profiles */}
      <div style={{ display: 'grid', gap: 12 }}>
        {rules.map((rule) => {
          const result = tuneResults[rule.ruleId];
          return (
            <div key={rule.ruleId} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20,
              borderLeft: `3px solid ${statusColor(rule.status)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4,
                      background: 'rgba(255,255,255,0.06)', color: '#94a3b8', fontWeight: 600 }}>{rule.ruleId}</span>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{rule.ruleName}</span>
                    <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700,
                      background: `${statusColor(rule.status)}22`, color: statusColor(rule.status) }}>
                      {rule.status === 'NOISY' && '🔊 NOISY'}
                      {rule.status === 'HEALTHY' && '✓ HEALTHY'}
                      {rule.status === 'CRITICAL_COVERAGE' && '🛡 HIGH-VALUE'}
                    </span>
                  </div>

                  {/* Metrics Row */}
                  <div style={{ display: 'flex', gap: 20, marginTop: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Total Firings</div>
                      <div style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 700 }}>{rule.totalFirings.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Escalated</div>
                      <div style={{ color: '#22c55e', fontSize: '1rem', fontWeight: 700 }}>{rule.escalatedCount}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Dismissed</div>
                      <div style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 700 }}>{rule.dismissedCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>FP Rate</div>
                      <div style={{ color: fprColor(rule.falsePositiveRate), fontSize: '1rem', fontWeight: 700 }}>{rule.falsePositiveRate}%</div>
                    </div>
                    <div>
                      <div style={{ color: '#64748b', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 600 }}>Threshold</div>
                      <div style={{ color: '#e2e8f0', fontSize: '1rem', fontWeight: 700 }}>
                        {rule.currentThreshold}
                        {rule.currentThreshold !== rule.recommendedThreshold && (
                          <span style={{ color: '#818cf8', fontSize: '0.75rem' }}> → {rule.recommendedThreshold}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* FP Rate Bar */}
                  <div style={{ width: '100%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden', marginBottom: 8 }}>
                    <div style={{ width: `${rule.falsePositiveRate}%`, height: '100%', borderRadius: 99, transition: 'width 0.5s ease',
                      background: `linear-gradient(90deg, ${fprColor(rule.falsePositiveRate)}, ${fprColor(rule.falsePositiveRate)}88)` }} />
                  </div>

                  <p style={{ color: '#94a3b8', fontSize: '0.78rem', margin: 0, lineHeight: 1.5 }}>{rule.suppressionRecommendation}</p>
                </div>

                {rule.status === 'NOISY' && (
                  <button onClick={() => handleTune(rule.ruleId)} disabled={tuning === rule.ruleId}
                    style={{ padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', marginLeft: 16 }}>
                    {tuning === rule.ruleId ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {tuning === rule.ruleId ? 'Tuning…' : 'Auto-Tune'}
                  </button>
                )}
                {rule.status === 'CRITICAL_COVERAGE' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: '0.75rem', fontWeight: 700, marginLeft: 16 }}>
                    <Shield size={14} />Protected
                  </div>
                )}
              </div>

              {/* Tune Result */}
              {result && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16,
                  background: 'rgba(99,102,241,0.05)', borderRadius: 8, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <CheckCircle2 size={16} color="#22c55e" />
                    <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.85rem' }}>Tuning Applied</span>
                    <span style={{ color: '#64748b', fontSize: '0.7rem' }}>
                      • Threshold {result.previousThreshold} → {result.newThreshold}
                    </span>
                    <span style={{ color: '#818cf8', fontSize: '0.7rem', fontWeight: 600 }}>
                      ~{result.estimatedNoiseReduction}% noise reduction
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: 4 }}>
                    {result.suppressionFilters.map((f: string, i: number) => (
                      <div key={i} style={{ color: '#94a3b8', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TrendingDown size={12} color="#818cf8" />{f}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
