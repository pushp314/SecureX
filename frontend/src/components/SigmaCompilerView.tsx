import React, { useState, useEffect } from 'react';
import { SigmaRule, SigmaCompileResult } from '../types';
import { api } from '../services/api';
import { FileCode, Upload, Zap, CheckCircle2, AlertTriangle, Code2, Tag, Shield, Play, Loader2 } from 'lucide-react';

export const SigmaCompilerView: React.FC = () => {
  const [rules, setRules] = useState<SigmaRule[]>([]);
  const [selectedRule, setSelectedRule] = useState<SigmaRule | null>(null);
  const [compileResult, setCompileResult] = useState<SigmaCompileResult | null>(null);
  const [customYaml, setCustomYaml] = useState('');
  const [activeTab, setActiveTab] = useState<'library' | 'compile'>('library');
  const [deploying, setDeploying] = useState<string | null>(null);
  const [compiling, setCompiling] = useState(false);

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    try {
      const data = await api.getSigmaRules();
      setRules(data);
    } catch (err) { console.error(err); }
  };

  const handleDeploy = async (id: string) => {
    setDeploying(id);
    try {
      const result = await api.deploySigmaRule(id);
      setRules((prev) => prev.map((r) => r.id === id ? { ...r, isDeployed: true, deployedRuleId: result.deployedRuleId } : r));
    } catch (err) { console.error(err); }
    finally { setDeploying(null); }
  };

  const handleCompile = async () => {
    if (!customYaml.trim()) return;
    setCompiling(true);
    setCompileResult(null);
    try {
      const result = await api.compileSigmaYaml(customYaml);
      setCompileResult(result);
    } catch (err) { console.error(err); }
    finally { setCompiling(false); }
  };

  const levelColor = (l: string) => {
    if (l === 'critical') return '#ef4444';
    if (l === 'high') return '#f97316';
    if (l === 'medium') return '#eab308';
    return '#6b7280';
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Sigma Rule Compiler</h1>
          <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.875rem' }}>Ingest, compile, and deploy industry-standard Sigma detection rules to the live engine</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setActiveTab('library')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              background: activeTab === 'library' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', color: '#f1f5f9' }}
          >
            <FileCode size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Rule Library
          </button>
          <button
            onClick={() => setActiveTab('compile')}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
              background: activeTab === 'compile' ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'rgba(255,255,255,0.06)', color: '#f1f5f9' }}
          >
            <Upload size={14} style={{ marginRight: 6, verticalAlign: 'middle' }} />Compile YAML
          </button>
        </div>
      </div>

      {activeTab === 'library' && (
        <div style={{ display: 'grid', gap: 16 }}>
          {rules.map((rule) => (
            <div key={rule.id} onClick={() => setSelectedRule(selectedRule?.id === rule.id ? null : rule)}
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, cursor: 'pointer',
                borderLeft: `3px solid ${levelColor(rule.level)}`, transition: 'all 0.2s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Shield size={16} style={{ color: levelColor(rule.level) }} />
                    <span style={{ fontWeight: 700, color: '#f1f5f9', fontSize: '0.95rem' }}>{rule.title}</span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                      background: `${levelColor(rule.level)}22`, color: levelColor(rule.level) }}>
                      {rule.level.toUpperCase()}
                    </span>
                    <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 99, fontWeight: 600,
                      background: rule.isDeployed ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.06)',
                      color: rule.isDeployed ? '#22c55e' : '#94a3b8' }}>
                      {rule.isDeployed ? '● DEPLOYED' : '○ STAGED'}
                    </span>
                  </div>
                  <p style={{ color: '#94a3b8', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>{rule.description}</p>
                  <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    {rule.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>
                        <Tag size={10} style={{ marginRight: 3, verticalAlign: 'middle' }} />{tag}
                      </span>
                    ))}
                  </div>
                </div>
                {!rule.isDeployed && (
                  <button onClick={(e) => { e.stopPropagation(); handleDeploy(rule.id); }}
                    disabled={deploying === rule.id}
                    style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)', color: '#fff', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    {deploying === rule.id ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                    {deploying === rule.id ? 'Deploying…' : 'Deploy to Engine'}
                  </button>
                )}
                {rule.isDeployed && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>
                    <CheckCircle2 size={14} /> Live
                  </div>
                )}
              </div>

              {/* Expanded detail */}
              {selectedRule?.id === rule.id && (
                <div style={{ marginTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    <div>
                      <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Raw Sigma YAML</h4>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontSize: '0.7rem', color: '#a5b4fc', overflow: 'auto', maxHeight: 280,
                        border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {rule.rawYaml}
                      </pre>
                    </div>
                    <div>
                      <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compiled KQL Filter</h4>
                      <pre style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 8, padding: 12, fontSize: '0.7rem', color: '#34d399', overflow: 'auto', maxHeight: 280,
                        border: '1px solid rgba(255,255,255,0.04)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                        {rule.compiledKql}
                      </pre>
                      <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 14px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#64748b' }}>Author: </span><span style={{ color: '#e2e8f0' }}>{rule.author || 'Community'}</span>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 8, padding: '8px 14px', fontSize: '0.75rem' }}>
                          <span style={{ color: '#64748b' }}>Status: </span><span style={{ color: '#e2e8f0' }}>{rule.status}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'compile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <h3 style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>
              <Code2 size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Paste Sigma YAML
            </h3>
            <textarea
              value={customYaml}
              onChange={(e) => setCustomYaml(e.target.value)}
              placeholder={`title: My Custom Detection\nstatus: test\ndescription: Detects ...\nlogsource:\n  category: process_creation\n  product: windows\ndetection:\n  selection:\n    CommandLine|contains: 'mimikatz'\n  condition: selection\nlevel: critical`}
              style={{ width: '100%', minHeight: 360, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
                padding: 16, color: '#a5b4fc', fontFamily: 'JetBrains Mono, monospace', fontSize: '0.78rem', resize: 'vertical', lineHeight: 1.6 }}
            />
            <button onClick={handleCompile} disabled={compiling || !customYaml.trim()}
              style={{ marginTop: 12, padding: '10px 24px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600,
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              {compiling ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
              {compiling ? 'Compiling…' : 'Compile to KQL'}
            </button>
          </div>
          <div>
            <h3 style={{ color: '#e2e8f0', fontSize: '0.9rem', fontWeight: 600, marginBottom: 10 }}>
              <Zap size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />Compilation Output
            </h3>
            {compileResult ? (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  {compileResult.success ? <CheckCircle2 size={18} color="#22c55e" /> : <AlertTriangle size={18} color="#ef4444" />}
                  <span style={{ fontWeight: 700, color: compileResult.success ? '#22c55e' : '#ef4444', fontSize: '0.9rem' }}>
                    {compileResult.success ? 'Compilation Successful' : 'Compilation Failed'}
                  </span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Rule ID: </span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.85rem', fontFamily: 'monospace' }}>{compileResult.ruleId}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Title: </span>
                  <span style={{ color: '#e2e8f0', fontSize: '0.85rem' }}>{compileResult.title}</span>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: '#64748b', fontSize: '0.75rem' }}>Severity: </span>
                  <span style={{ color: levelColor(compileResult.level), fontSize: '0.85rem', fontWeight: 600 }}>{compileResult.level.toUpperCase()}</span>
                </div>
                <h4 style={{ color: '#94a3b8', fontSize: '0.7rem', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Compiled KQL</h4>
                <pre style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: 12, fontSize: '0.75rem', color: '#34d399', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                  {compileResult.compiledKql}
                </pre>
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  {compileResult.mitreTags.map((tag) => (
                    <span key={tag} style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>{tag}</span>
                  ))}
                </div>
                {compileResult.syntaxErrors.length > 0 && (
                  <div style={{ marginTop: 12, padding: 10, background: 'rgba(239,68,68,0.1)', borderRadius: 8 }}>
                    {compileResult.syntaxErrors.map((e, i) => (
                      <div key={i} style={{ color: '#fca5a5', fontSize: '0.75rem' }}>⚠ {e}</div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: 12, padding: 60,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569', fontSize: '0.85rem' }}>
                Paste Sigma YAML and click Compile to see output
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
