import React, { useState, useEffect } from 'react';
import { LogParserRule, ParseResult } from '../types';
import { api } from '../services/api';
import { Code, Play, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Send } from 'lucide-react';

export const UniversalLogParsersView: React.FC = () => {
  const [parsers, setParsers] = useState<LogParserRule[]>([]);
  const [selectedParser, setSelectedParser] = useState<LogParserRule | null>(null);
  const [rawLogInput, setRawLogInput] = useState('');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [ingestStatus, setIngestStatus] = useState<string | null>(null);

  useEffect(() => {
    loadParsers();
  }, []);

  const loadParsers = async () => {
    try {
      const list = await api.getParsers();
      setParsers(list);
      if (list.length > 0 && !selectedParser) {
        setSelectedParser(list[0]);
        setRawLogInput(list[0].sampleInput);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectParser = (p: LogParserRule) => {
    setSelectedParser(p);
    setRawLogInput(p.sampleInput);
    setParseResult(null);
    setIngestStatus(null);
  };

  const handleTestParser = async () => {
    if (!rawLogInput.trim()) return;
    setIsTesting(true);
    setIngestStatus(null);

    try {
      const res = await api.testParser(rawLogInput, selectedParser?.id);
      setParseResult(res);
    } catch (err: any) {
      setParseResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleIngestLive = async () => {
    if (!rawLogInput.trim()) return;
    try {
      await api.ingestParsedLog(rawLogInput, selectedParser?.id);
      setIngestStatus('Successfully normalized and ingested into PostgreSQL telemetry pipeline!');
    } catch (err: any) {
      setIngestStatus(`Ingestion failed: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Code className="w-4 h-4 text-emerald-400" />
            <span>Universal Log Ingestion Parsers (Grok / OCSF / Syslog / Windows)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time regex field extraction, schema normalization to Open Cybersecurity Schema (OCSF), and direct ingest.
          </p>
        </div>
      </div>

      {/* Main Grid: Parser Connectors List + Live Emulation Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Available Log Parser Connectors */}
        <div className="saas-card p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs uppercase font-semibold text-slate-400">Log Parsers ({parsers.length})</span>
            <span className="text-[10px] text-emerald-400 font-semibold">OCSF Ready</span>
          </div>

          <div className="space-y-2">
            {parsers.map((parser) => {
              const isSelected = selectedParser?.id === parser.id;
              return (
                <div
                  key={parser.id}
                  onClick={() => handleSelectParser(parser)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/50 shadow-sm'
                      : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded bg-slate-900 text-emerald-300 border border-emerald-800/40">
                      {parser.sourceType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{parser.id}</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{parser.name}</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">{parser.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Live Parsing Playground */}
        <div className="lg:col-span-2 space-y-4">
          <div className="saas-card p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div>
                <span className="text-[10px] font-semibold uppercase text-slate-400">Selected Parser Connector</span>
                <h3 className="text-sm font-bold text-white mt-0.5">{selectedParser?.name}</h3>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleTestParser}
                  disabled={isTesting}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <Play className={`w-3.5 h-3.5 fill-current ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Parsing...' : 'Test Parse'}</span>
                </button>

                <button
                  onClick={handleIngestLive}
                  className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ingest Normalized Event</span>
                </button>
              </div>
            </div>

            {/* Raw Input Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase text-slate-300 block">Raw Unstructured Log Input</label>
              <textarea
                rows={4}
                value={rawLogInput}
                onChange={(e) => setRawLogInput(e.target.value)}
                placeholder="Paste raw syslog, Windows security string, or JSON payload..."
                className="w-full bg-[#070a12] border border-slate-800 rounded-xl p-3 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            {ingestStatus && (
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/40 text-xs text-indigo-200 flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{ingestStatus}</span>
              </div>
            )}

            {/* Parse Results Preview */}
            {parseResult && (
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase text-slate-300 flex items-center space-x-2">
                    {parseResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    )}
                    <span>Normalized OCSF Schema Output</span>
                  </span>

                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-800/50">
                    Schema v1.1 Validated
                  </span>
                </div>

                {parseResult.success && parseResult.normalizedEvent ? (
                  <div className="space-y-3">
                    {/* Key Attributes Pills */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-[#090e1a] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Category</span>
                        <strong className="text-emerald-300">{parseResult.normalizedEvent.category}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#090e1a] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Event Type</span>
                        <strong className="text-white font-mono">{parseResult.normalizedEvent.eventType}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#090e1a] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Severity</span>
                        <strong className="text-rose-400 uppercase">{parseResult.normalizedEvent.severity}</strong>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#090e1a] border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Source Service</span>
                        <strong className="text-indigo-300">{parseResult.normalizedEvent.sourceService}</strong>
                      </div>
                    </div>

                    <pre className="p-3.5 bg-[#070a12] rounded-xl border border-slate-800 font-mono text-xs text-emerald-300/90 overflow-x-auto leading-relaxed max-h-60">
                      {JSON.stringify(parseResult.normalizedEvent, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-300 font-mono">
                    Parser Error: {parseResult.error}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
