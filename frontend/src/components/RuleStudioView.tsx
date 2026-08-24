import React, { useState, useEffect } from 'react';
import { DetectionRule, BacktestResult } from '../types';
import { api } from '../services/api';
import { Cpu, Plus, Search, Play, Clock, Check, X, ShieldAlert } from 'lucide-react';

export const RuleStudioView: React.FC = () => {
  const [rules, setRules] = useState<DetectionRule[]>([]);
  const [search, setSearch] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [backtestRuleData, setBacktestRuleData] = useState<DetectionRule | null>(null);
  const [backtestResult, setBacktestResult] = useState<BacktestResult | null>(null);
  const [isBacktesting, setIsBacktesting] = useState(false);

  const [newRule, setNewRule] = useState<Partial<DetectionRule>>({
    name: '',
    description: '',
    category: 'threat_signal',
    severity: 'medium',
    ruleType: 'threshold',
    mitreTactic: 'Execution',
    mitreTechnique: 'T1204',
    windowSeconds: 60,
    thresholdCount: 3,
    conditionJson: JSON.stringify({ eventTypes: ['api.abuse'], groupBy: 'ip' }, null, 2),
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      const data = await api.getRules();
      setRules(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleRule = async (id: string, current: boolean) => {
    try {
      await api.toggleRule(id, !current);
      loadRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createRule(newRule);
      setShowNewModal(false);
      loadRules();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunBacktest = async (rule: DetectionRule) => {
    setBacktestRuleData(rule);
    setIsBacktesting(true);
    setBacktestResult(null);

    try {
      const result = await api.backtestRule({
        name: rule.name,
        category: rule.category,
        severity: rule.severity,
        ruleType: rule.ruleType,
        mitreTactic: rule.mitreTactic,
        mitreTechnique: rule.mitreTechnique,
        conditionJson: rule.conditionJson,
        windowSeconds: rule.windowSeconds,
        thresholdCount: rule.thresholdCount,
        timeRangeHours: 48,
      });
      setBacktestResult(result);
    } catch (err) {
      console.error(err);
    } finally {
      setIsBacktesting(false);
    }
  };

  const filteredRules = rules.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.mitreTactic.toLowerCase().includes(search.toLowerCase()) ||
    r.mitreTechnique.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>Detection Rule Engine Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sliding-window rule evaluator, MITRE ATT&CK alignment, and historical telemetry backtesting.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search rule, tactic, ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#090e1a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 w-60 font-sans"
            />
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Rule</span>
          </button>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRules.map((rule) => {
          const isCrit = rule.severity === 'critical';
          const isHigh = rule.severity === 'high';
          return (
            <div
              key={rule.id}
              className={`saas-card p-5 space-y-3 transition-all ${
                rule.isEnabled ? '' : 'opacity-60 bg-[#070b13]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${
                      isCrit
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : isHigh
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                    }`}
                  >
                    {rule.severity}
                  </span>
                  <span className="text-xs font-mono text-slate-300 font-semibold">{rule.ruleId}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleRunBacktest(rule)}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-white transition-colors"
                    title="Backtest Rule Over 48h Logs"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                  </button>

                  <button
                    onClick={() => handleToggleRule(rule.id, rule.isEnabled)}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${
                      rule.isEnabled
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}
                  >
                    {rule.isEnabled ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-white">{rule.name}</h4>
                <p className="text-[11px] text-slate-400 mt-1">{rule.description}</p>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span className="text-rose-300 bg-rose-950/30 px-2 py-0.5 rounded border border-rose-800/30 font-medium">
                  {rule.mitreTactic} ({rule.mitreTechnique})
                </span>
                <span className="text-slate-300 font-mono">
                  {rule.thresholdCount} events in {rule.windowSeconds}s
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backtest Results Drawer / Modal */}
      {backtestRuleData && (
        <div className="saas-card p-5 space-y-4 border-indigo-500/40 bg-[#0d1424]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
            <div>
              <span className="text-[10px] uppercase font-semibold text-slate-400 block">Simulation & Historical Replay</span>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2 mt-0.5">
                <span>Backtest Result: {backtestRuleData.name}</span>
              </h3>
            </div>

            <button
              onClick={() => setBacktestRuleData(null)}
              className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {isBacktesting ? (
            <div className="text-center py-8 text-xs text-indigo-300 space-y-2">
              <Cpu className="w-6 h-6 animate-spin mx-auto text-indigo-400" />
              <p>Replaying historical PostgreSQL telemetry against detection condition...</p>
            </div>
          ) : backtestResult ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Events Evaluated</span>
                  <span className="text-base font-bold text-white mt-0.5 block">{backtestResult.totalEventsAnalyzed}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Alerts Generated</span>
                  <span className="text-base font-bold text-amber-400 mt-0.5 block">{backtestResult.totalMatches}</span>
                </div>

                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Est. Alert Rate</span>
                  <span className="text-base font-bold text-indigo-300 mt-0.5 block">
                    {backtestResult.estimatedAlertRatePerHour} / hr
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-400 block">Replay Duration</span>
                  <span className="text-base font-bold text-emerald-400 mt-0.5 block font-mono">
                    {backtestResult.executionDurationMs} ms
                  </span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* New Rule Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white">Create MITRE Detection Rule</h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Rule Name</label>
                <input
                  type="text"
                  placeholder="e.g. S3 Data Exfiltration Spike"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  required
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Explain detection rationale..."
                  value={newRule.description}
                  onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                  required
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Severity</label>
                  <select
                    value={newRule.severity}
                    onChange={(e) => setNewRule({ ...newRule, severity: e.target.value })}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="critical">Critical</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Category</label>
                  <select
                    value={newRule.category}
                    onChange={(e) => setNewRule({ ...newRule, category: e.target.value })}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  >
                    <option value="authentication">authentication</option>
                    <option value="privilege_change">privilege_change</option>
                    <option value="threat_signal">threat_signal</option>
                    <option value="system_integrity">system_integrity</option>
                    <option value="data_access">data_access</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Window (Seconds)</label>
                  <input
                    type="number"
                    value={newRule.windowSeconds}
                    onChange={(e) => setNewRule({ ...newRule, windowSeconds: parseInt(e.target.value) || 60 })}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Threshold Count</label>
                  <input
                    type="number"
                    value={newRule.thresholdCount}
                    onChange={(e) => setNewRule({ ...newRule, thresholdCount: parseInt(e.target.value) || 1 })}
                    className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Condition JSON</label>
                <textarea
                  rows={3}
                  value={newRule.conditionJson}
                  onChange={(e) => setNewRule({ ...newRule, conditionJson: e.target.value })}
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
                >
                  Deploy Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
