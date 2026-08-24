import React, { useState } from 'react';
import { BlastRadiusResult } from '../types';
import { api } from '../services/api';
import { Atom, Search, Lock, AlertTriangle, Database, Key, Server, Globe, Shield, User, Cloud, Loader2, CheckCircle2 } from 'lucide-react';

const NODE_ICONS: Record<string, React.ReactNode> = {
  identity: <User size={16} />,
  iam_role: <Key size={16} />,
  vpc: <Globe size={16} />,
  database: <Database size={16} />,
  s3_bucket: <Cloud size={16} />,
  api_key: <Key size={16} />,
  token: <Shield size={16} />,
  compute: <Server size={16} />,
};

const SEV_COLOR: Record<string, string> = {
  critical: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#6b7280',
};

const PRESET_ENTITIES = [
  '198.51.100.77',
  '10.0.4.112',
  '203.0.113.45',
];

export const BlastRadiusView: React.FC = () => {
  const [entityKey, setEntityKey] = useState('198.51.100.77');
  const [result, setResult] = useState<BlastRadiusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [locking, setLocking] = useState(false);
  const [lockResult, setLockResult] = useState<any>(null);

  const handleAnalyze = async () => {
    if (!entityKey.trim()) return;
    setLoading(true);
    setResult(null);
    setLockResult(null);
    try {
      const data = await api.analyzeBlastRadius(entityKey);
      setResult(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleLock = async () => {
    if (!entityKey.trim()) return;
    setLocking(true);
    try {
      const data = await api.lockBlastPerimeter(entityKey);
      setLockResult(data);
    } catch (err) { console.error(err); }
    finally { setLocking(false); }
  };

  const formatUsd = (n: number) => '$' + n.toLocaleString();

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Atom size={24} color="#f97316" />Blast Radius Forensics
        </h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.875rem' }}>
          Graph-based transitive exposure mapping — trace compromise reach across IAM, VPC, data stores, and secrets
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }} />
          <input
            value={entityKey}
            onChange={(e) => setEntityKey(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="Enter entity key (IP, user, hostname)"
            style={{ width: '100%', padding: '12px 16px 12px 40px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 10, color: '#f1f5f9', fontSize: '0.9rem', fontFamily: 'JetBrains Mono, monospace' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRESET_ENTITIES.map((e) => (
            <button key={e} onClick={() => { setEntityKey(e); }}
              style={{ padding: '8px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontFamily: 'monospace',
                background: entityKey === e ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.06)', color: entityKey === e ? '#818cf8' : '#94a3b8', fontWeight: 600 }}>
              {e}
            </button>
          ))}
        </div>
        <button onClick={handleAnalyze} disabled={loading}
          style={{ padding: '12px 24px', borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700,
            background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Atom size={16} />}
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </div>

      {result && (
        <>
          {/* Severity Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Blast Severity Index', value: result.blastSeverityIndex, suffix: '/100', color: result.blastSeverityIndex >= 70 ? '#ef4444' : result.blastSeverityIndex >= 40 ? '#f97316' : '#22c55e' },
              { label: 'Reachable Assets', value: result.totalReachableAssets, color: '#6366f1' },
              { label: 'Financial Exposure', value: formatUsd(result.estimatedExposureUsd), color: '#ef4444' },
              { label: 'Containment Actions', value: result.containmentActions.length, color: '#f97316' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                <div style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{s.label}</div>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.value}{s.suffix || ''}</div>
              </div>
            ))}
          </div>

          {/* Attack Graph Nodes */}
          <div>
            <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Exposure Graph — Reachable Assets</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 12 }}>
              {result.nodes.map((node) => (
                <div key={node.id} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${SEV_COLOR[node.severity]}33`, borderRadius: 10, padding: 16,
                  borderLeft: `3px solid ${SEV_COLOR[node.severity]}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ color: SEV_COLOR[node.severity] }}>{NODE_ICONS[node.type] || <Server size={16} />}</div>
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.85rem', flex: 1 }}>{node.label}</span>
                    <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: 99, fontWeight: 700,
                      background: `${SEV_COLOR[node.severity]}22`, color: SEV_COLOR[node.severity] }}>
                      {node.severity.toUpperCase()}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.73rem', margin: 0, lineHeight: 1.5 }}>{node.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Attack Paths / Edges */}
          <div>
            <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700, marginBottom: 12 }}>Attack Paths & Lateral Movement</h3>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, overflow: 'hidden' }}>
              {result.edges.map((edge, i) => (
                <div key={i} style={{ padding: '12px 20px', borderBottom: i < result.edges.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, minWidth: 100 }}>{edge.from}</span>
                  <span style={{ color: '#ef4444', fontSize: '0.8rem' }}>→</span>
                  <span style={{ color: '#f97316', fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600, minWidth: 100 }}>{edge.to}</span>
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', flex: 1 }}>{edge.relationship}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Containment Actions */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ color: '#e2e8f0', fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Recommended Containment Actions</h3>
              <button onClick={handleLock} disabled={locking}
                style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 700,
                  background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: '#fff', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                {locking ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
                {locking ? 'Locking…' : 'Lock Perimeter'}
              </button>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {result.containmentActions.map((action, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '12px 16px',
                  display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '0.6rem', padding: '2px 8px', borderRadius: 99, fontWeight: 700, whiteSpace: 'nowrap',
                    background: action.priority === 'IMMEDIATE' ? 'rgba(239,68,68,0.15)' : action.priority === 'HIGH' ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.06)',
                    color: action.priority === 'IMMEDIATE' ? '#ef4444' : action.priority === 'HIGH' ? '#f97316' : '#94a3b8' }}>
                    {action.priority}
                  </span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.8rem' }}>{action.action}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Lock Result */}
          {lockResult && (
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 12, padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <CheckCircle2 size={18} color="#22c55e" />
                <span style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.95rem' }}>{lockResult.message}</span>
              </div>
              <div style={{ display: 'grid', gap: 6 }}>
                {lockResult.actionsExecuted.map((a: string, i: number) => (
                  <div key={i} style={{ color: '#94a3b8', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle2 size={12} color="#22c55e" />{a}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!result && !loading && (
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 16, padding: 80,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: '#475569' }}>
          <Atom size={48} strokeWidth={1} />
          <span style={{ fontSize: '0.9rem' }}>Enter an entity key and click Analyze to map the blast radius</span>
        </div>
      )}
    </div>
  );
};
