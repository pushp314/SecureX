import React, { useState, useEffect } from 'react';
import { KqlQueryResult } from '../types';
import { api } from '../services/api';
import { Search, Play, Terminal, Database, Clock, Sparkles, Download, Layers } from 'lucide-react';

const SAMPLE_QUERIES = [
  { label: 'All Authentication Events', query: 'category == "authentication" | stats count() by sourceIp' },
  { label: 'Critical Severity Logs', query: 'severity == "critical" | top 20' },
  { label: 'Brute Force IP Aggregation', query: 'eventType contains "login" | stats count() by sourceIp | where count > 1' },
  { label: 'Top Talker Services', query: '* | stats count() by sourceService | sort -count' },
  { label: 'IAM Privilege Activity', query: 'category == "privilege_change" | top 10' },
];

export const SiemQueryConsoleView: React.FC = () => {
  const [queryInput, setQueryInput] = useState('category == "authentication" | stats count() by sourceIp');
  const [queryResult, setQueryResult] = useState<KqlQueryResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    handleRunQuery(queryInput);
  }, []);

  const handleRunQuery = async (queryToRun?: string) => {
    const q = queryToRun || queryInput;
    if (!q.trim()) return;
    setIsExecuting(true);
    setErrorMsg(null);

    try {
      const res = await api.executeKqlQuery(q);
      setQueryResult(res);
    } catch (err: any) {
      setErrorMsg(err.message || 'Query syntax error');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleExportJson = () => {
    if (!queryResult) return;
    const blob = new Blob([JSON.stringify(queryResult.records, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `securex-query-export-${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Search className="w-4 h-4 text-indigo-400" />
            <span>Interactive SIEM Query Console (SPL / KQL Engine)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Piped transformations (`| stats | where | top | sort`), sub-second timeseries aggregation, and telemetry mining.
          </p>
        </div>

        {queryResult && queryResult.records.length > 0 && (
          <button
            onClick={handleExportJson}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export ({queryResult.totalRecords} records)</span>
          </button>
        )}
      </div>

      {/* Query Bar & Presets */}
      <div className="saas-card p-4 space-y-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleRunQuery();
          }}
          className="flex flex-col md:flex-row gap-2"
        >
          <div className="relative flex-1">
            <Terminal className="w-4 h-4 text-indigo-400 absolute left-3 top-3" />
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="e.g. category == 'authentication' | stats count() by sourceIp | where count > 2"
              className="w-full bg-[#070a12] border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={isExecuting}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Querying Index...' : 'Run Query'}</span>
          </button>
        </form>

        {/* Quick Query Templates */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 mr-1 flex items-center space-x-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>KQL Presets:</span>
          </span>
          {SAMPLE_QUERIES.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQueryInput(sq.query);
                handleRunQuery(sq.query);
              }}
              className="px-2.5 py-1 rounded-md bg-[#090e1a] hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors"
            >
              {sq.label}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 font-mono">
          Query Execution Error: {errorMsg}
        </div>
      )}

      {/* Main Grid: Field Explorer Drawer + Results Table & Histogram */}
      {queryResult && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Col: Discovered Fields Drawer */}
          <div className="saas-card p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
              <span className="text-xs uppercase font-semibold text-slate-400 flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5 text-indigo-400" />
                <span>Field Explorer</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">{queryResult.discoveredFields.length} indexed</span>
            </div>

            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar">
              {queryResult.discoveredFields.map((field) => (
                <div
                  key={field.name}
                  onClick={() => {
                    const appendPipe = `${queryInput} | stats count() by ${field.name}`;
                    setQueryInput(appendPipe);
                    handleRunQuery(appendPipe);
                  }}
                  className="p-2.5 rounded-lg bg-[#090e1a] border border-slate-800/80 hover:border-indigo-500/40 transition-all cursor-pointer space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-indigo-300 font-semibold">{field.name}</span>
                    <span className="text-[9px] font-mono text-slate-400">{field.distinctCount} distinct</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {field.sampleValues.slice(0, 3).map((val, i) => (
                      <span key={i} className="text-[9px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded truncate max-w-[120px]">
                        {val}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right 3 Cols: Timeseries Histogram + Results Table */}
          <div className="lg:col-span-3 space-y-4">
            {/* Execution Metrics & Timeseries Mini Histogram */}
            <div className="saas-card p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Returned <strong className="text-white">{queryResult.totalRecords} records</strong> in{' '}
                  <strong className="text-emerald-400 font-mono">{queryResult.executionDurationMs} ms</strong>
                </span>
                <span className="text-[10px] uppercase font-semibold text-indigo-400 bg-indigo-950/50 px-2 py-0.5 rounded border border-indigo-800/40">
                  {queryResult.isAggregated ? 'Aggregated View' : 'Raw Event Rows'}
                </span>
              </div>

              {/* Histogram Bars */}
              {queryResult.histogram.length > 0 && (
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-2">
                    Event Ingestion Timeline Distribution
                  </span>
                  <div className="flex items-end space-x-1.5 h-14 bg-[#070a12] p-2 rounded-lg border border-slate-800/80 overflow-x-auto">
                    {queryResult.histogram.map((bucket, idx) => {
                      const maxVal = Math.max(...queryResult.histogram.map((b) => b.count), 1);
                      const heightPercent = Math.max((bucket.count / maxVal) * 100, 15);
                      return (
                        <div
                          key={idx}
                          title={`${bucket.timeBucket}: ${bucket.count} events`}
                          className="flex-1 flex flex-col items-center justify-end group min-w-[20px]"
                        >
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className="w-full rounded-t bg-indigo-500/80 group-hover:bg-indigo-400 transition-all"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Results Table */}
            <div className="saas-card overflow-hidden">
              <div className="overflow-x-auto">
                {queryResult.records.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 text-xs">
                    No records matched your SIEM query criteria.
                  </div>
                ) : (
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="bg-[#0b1220] border-b border-slate-800/80 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        {Object.keys(queryResult.records[0] || {})
                          .filter((k) => k !== 'id')
                          .map((col) => (
                            <th key={col} className="py-3 px-4">
                              {col}
                            </th>
                          ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {queryResult.records.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                          {Object.entries(row)
                            .filter(([k]) => k !== 'id')
                            .map(([k, val]: [string, any], cellIdx) => (
                              <td key={cellIdx} className="py-2.5 px-4 whitespace-nowrap text-slate-300 text-xs">
                                {k === 'count' ? (
                                  <strong className="text-amber-400 font-mono text-sm">{val}</strong>
                                ) : k === 'severity' ? (
                                  <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                                    {val}
                                  </span>
                                ) : (
                                  <span className="font-mono text-xs">{String(val)}</span>
                                )}
                              </td>
                            ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
