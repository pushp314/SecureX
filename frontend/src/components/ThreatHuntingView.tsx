import React, { useState, useEffect } from 'react';
import { ThreatHuntTemplate, ThreatHuntResult } from '../types';
import { api } from '../services/api';
import { Crosshair, Play, CheckCircle, Sparkles } from 'lucide-react';

export const ThreatHuntingView: React.FC = () => {
  const [templates, setTemplates] = useState<ThreatHuntTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<ThreatHuntTemplate | null>(null);
  const [isHunting, setIsHunting] = useState(false);
  const [huntResult, setHuntResult] = useState<ThreatHuntResult | null>(null);
  const [promotedRuleSuccess, setPromotedRuleSuccess] = useState<string | null>(null);

  // Filter Form State
  const [category, setCategory] = useState('');
  const [eventType, setEventType] = useState('');
  const [outcome, setOutcome] = useState('');
  const [severity, setSeverity] = useState('');

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const data = await api.getHuntTemplates();
      setTemplates(data);
      if (data.length > 0) {
        handleSelectTemplate(data[0]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectTemplate = (tmpl: ThreatHuntTemplate) => {
    setSelectedTemplate(tmpl);
    setCategory(tmpl.filter.category || '');
    setEventType(tmpl.filter.eventType || '');
    setOutcome(tmpl.filter.outcome || '');
    setSeverity(tmpl.filter.severity || '');
    setHuntResult(null);
    setPromotedRuleSuccess(null);
  };

  const handleRunHunt = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsHunting(true);
    setPromotedRuleSuccess(null);

    try {
      const filter: any = {};
      if (category) filter.category = category;
      if (eventType) filter.eventType = eventType;
      if (outcome) filter.outcome = outcome;
      if (severity) filter.severity = severity;

      const result = await api.executeThreatHunt(filter);
      setHuntResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsHunting(false);
    }
  };

  const handlePromoteToRule = async () => {
    if (!selectedTemplate) return;
    try {
      const rule = await api.convertHuntToRule({
        name: `Detection: ${selectedTemplate.name}`,
        category: category || 'threat_signal',
        mitreTactic: selectedTemplate.mitreTactic,
        mitreTechnique: selectedTemplate.mitreTechnique,
        filter: { category, eventType, outcome, severity },
        thresholdCount: 3,
        windowSeconds: 60,
      });
      setPromotedRuleSuccess(`Rule created: ${rule.ruleId} (${rule.name})`);
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold text-white flex items-center space-x-2">
          <Crosshair className="w-4 h-4 text-purple-400" />
          <span>Threat Hunting Workbench & Sigma Engine</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Proactive threat hypothesis testing, historical telemetry mining, and 1-click detection rule promotion.
        </p>
      </div>

      {/* Main Grid: Templates (1 Col) + Query Workbench (2 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Threat Hunt Templates */}
        <div className="saas-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs uppercase font-semibold text-slate-400">Pre-built Hunt Catalog</span>
            <span className="text-[10px] font-semibold text-purple-400">MITRE ATT&CK</span>
          </div>

          <div className="space-y-2.5">
            {templates.map((tmpl) => {
              const isSelected = selectedTemplate?.id === tmpl.id;
              return (
                <div
                  key={tmpl.id}
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-purple-950/30 border-purple-500/50 shadow-sm'
                      : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold text-purple-300 bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-800/50">
                      {tmpl.mitreTactic} ({tmpl.mitreTechnique})
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{tmpl.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{tmpl.hypothesis}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Query Workbench & Results */}
        <div className="lg:col-span-2 space-y-4">
          {/* Query Filter Builder */}
          <div className="saas-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">Active Hunt Hypothesis</span>
                <h3 className="text-xs font-bold text-white mt-0.5">{selectedTemplate?.name || 'Custom Telemetry Hunt'}</h3>
              </div>

              <button
                onClick={() => handleRunHunt()}
                disabled={isHunting}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${isHunting ? 'animate-spin' : ''}`} />
                <span>{isHunting ? 'Mining Logs...' : 'Execute Threat Hunt'}</span>
              </button>
            </div>

            <form onSubmit={handleRunHunt} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Category</label>
                <input
                  type="text"
                  placeholder="e.g. privilege_change"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Event Type</label>
                <input
                  type="text"
                  placeholder="e.g. iam.role_escalation"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Outcome</label>
                <input
                  type="text"
                  placeholder="e.g. success / failure"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">Severity</label>
                <input
                  type="text"
                  placeholder="e.g. critical / high"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full bg-[#090e1a] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                />
              </div>
            </form>
          </div>

          {/* Promotion Banner */}
          {promotedRuleSuccess && (
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/50 rounded-xl text-xs font-mono text-emerald-300 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{promotedRuleSuccess} — Now active in Detection Rule Engine Studio!</span>
            </div>
          )}

          {/* Hunt Execution Results */}
          {huntResult && (
            <div className="saas-card p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-400">Query Duration: <strong className="text-emerald-400 font-mono">{huntResult.executionDurationMs} ms</strong></span>
                  <span>•</span>
                  <span className="text-slate-400">Events Matched: <strong className="text-purple-300 font-bold">{huntResult.totalEventsMatched}</strong></span>
                  <span>•</span>
                  <span className="text-slate-400">Target Entities: <strong className="text-indigo-300">{huntResult.uniqueEntities.length}</strong></span>
                </div>

                {huntResult.totalEventsMatched > 0 && (
                  <button
                    onClick={handlePromoteToRule}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Promote to Detection Rule</span>
                  </button>
                )}
              </div>

              {/* Matched Events Preview */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matched Telemetry Logs:</h4>
                <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                  {huntResult.matchedEvents.map((evt) => (
                    <div key={evt.id} className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-indigo-300 font-semibold font-mono">{evt.eventType}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(evt.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-slate-300 text-[11px]">
                        Service: <strong className="text-white">{evt.sourceService}</strong> • Entity: <strong className="text-amber-300 font-mono">{evt.sourceIp || evt.username}</strong>
                      </p>
                      <pre className="p-2 rounded-lg bg-[#070a12] text-[10px] text-slate-400 overflow-x-auto border border-slate-800/60 font-mono">{evt.rawPayload}</pre>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
