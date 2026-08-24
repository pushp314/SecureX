import React, { useState, useEffect } from 'react';
import { TelemetryEvent, DeadLetterEvent } from '../types';
import { api } from '../services/api';
import { Terminal, Search, RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  high: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  medium: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  info: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

export const TelemetryExplorerView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'live' | 'dlq'>('live');
  const [events, setEvents] = useState<TelemetryEvent[]>([]);
  const [dlqEvents, setDlqEvents] = useState<DeadLetterEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<TelemetryEvent | null>(null);
  const [selectedDlqEvent, setSelectedDlqEvent] = useState<DeadLetterEvent | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [categoryFilter, activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'live') {
        const data = await api.getEvents(
          100,
          search || undefined,
          categoryFilter === 'all' ? undefined : categoryFilter
        );
        setEvents(data);
        if (data.length > 0 && !selectedEvent) {
          setSelectedEvent(data[0]);
        }
      } else {
        const dlqData = await api.getDLQEvents();
        setDlqEvents(dlqData);
        if (dlqData.length > 0 && !selectedDlqEvent) {
          setSelectedDlqEvent(dlqData[0]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprocess = async (id: string) => {
    setReprocessingId(id);
    try {
      await api.reprocessDLQEvent(id);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setReprocessingId(null);
    }
  };

  const handleSimulateDlqFailure = async () => {
    try {
      await api.simulateDLQFailure();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredEvents = events.filter((e) =>
    e.eventType.toLowerCase().includes(search.toLowerCase()) ||
    e.sourceService.toLowerCase().includes(search.toLowerCase()) ||
    (e.sourceIp && e.sourceIp.includes(search)) ||
    (e.username && e.username.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span>Normalized Telemetry Stream & Dead Letter Queue (DLQ)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time schema-normalized security events and unparseable poison message quarantine ledger.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#090e1a] p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'live'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Normalized Telemetry
            </button>
            <button
              onClick={() => setActiveTab('dlq')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dlq'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quarantine DLQ ({dlqEvents.length})
            </button>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Refresh Stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {activeTab === 'live' ? (
        /* LIVE TELEMETRY EXPLORER */
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search event type, service, IP, user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#090e1a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-sans"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[#090e1a] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
            >
              <option value="all">All Categories</option>
              <option value="authentication">authentication</option>
              <option value="privilege_change">privilege_change</option>
              <option value="threat_signal">threat_signal</option>
              <option value="system_integrity">system_integrity</option>
              <option value="network_traffic">network_traffic</option>
              <option value="data_access">data_access</option>
              <option value="api_activity">api_activity</option>
            </select>
          </div>

          {/* 2-Column Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Events List */}
            <div className="saas-card p-4 space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400 block pb-1 border-b border-slate-800/80">
                Live Ingested Telemetry ({filteredEvents.length})
              </span>

              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {filteredEvents.map((evt) => {
                  const isSelected = selectedEvent?.id === evt.id;
                  const sev = SEVERITY_COLORS[evt.severity] || SEVERITY_COLORS.info;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEvent(evt)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                        isSelected
                          ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                          : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-white font-mono truncate">{evt.eventType}</span>
                        <span className={`text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full border ${sev}`}>
                          {evt.severity}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{evt.sourceService}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(evt.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Event Payload Inspector */}
            <div className="lg:col-span-2 space-y-4">
              {!selectedEvent ? (
                <div className="saas-card p-12 text-center text-slate-500 text-xs">
                  Select a telemetry event to inspect normalized fields and raw JSON.
                </div>
              ) : (
                <div className="saas-card p-5 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <span className="text-xs font-mono text-indigo-400 font-semibold">{selectedEvent.eventId}</span>
                      <h3 className="text-base font-bold text-white font-mono mt-0.5">{selectedEvent.eventType}</h3>
                    </div>
                    <span className={`text-[10px] font-semibold uppercase px-2.5 py-1 rounded-full border ${SEVERITY_COLORS[selectedEvent.severity]}`}>
                      {selectedEvent.severity}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Source Service</span>
                      <span className="font-semibold text-white mt-0.5 block">{selectedEvent.sourceService}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Outcome</span>
                      <span className="font-semibold text-white mt-0.5 block">{selectedEvent.outcome}</span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090e1a] border border-slate-800/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">Category</span>
                      <span className="font-semibold text-indigo-300 mt-0.5 block">{selectedEvent.category}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-slate-400 block">Raw Telemetry JSON (PostgreSQL Storage)</span>
                    <pre className="p-3.5 bg-[#070a12] rounded-xl border border-slate-800/80 font-mono text-xs text-indigo-300/90 overflow-x-auto leading-relaxed max-h-80">
                      {selectedEvent.rawPayload}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* DEAD LETTER QUEUE (DLQ) RECOVERY WORKBENCH */
        <div className="space-y-4">
          <div className="saas-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-rose-500/30 bg-rose-950/10">
            <div>
              <h3 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Poison Message Isolation Ledger ({dlqEvents.length} Quarantined)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Telemetry payloads rejected by schema validation or serialization errors.
              </p>
            </div>

            <button
              onClick={handleSimulateDlqFailure}
              className="px-3 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-semibold transition-all whitespace-nowrap"
            >
              Simulate Poison Message
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DLQ List */}
            <div className="saas-card p-4 space-y-2">
              <span className="text-xs font-semibold uppercase text-slate-400 block pb-1 border-b border-slate-800/80">
                Quarantined Messages
              </span>

              <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar">
                {dlqEvents.length === 0 ? (
                  <p className="text-xs text-emerald-400 py-8 text-center">DLQ is empty. Zero poison messages.</p>
                ) : (
                  dlqEvents.map((dlq) => {
                    const isSelected = selectedDlqEvent?.id === dlq.id;
                    return (
                      <div
                        key={dlq.id}
                        onClick={() => setSelectedDlqEvent(dlq)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                          isSelected
                            ? 'bg-rose-950/30 border-rose-500/50 shadow-sm'
                            : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-rose-400 truncate">{dlq.errorReason}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {new Date(dlq.failedAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 truncate font-mono">Retries: {dlq.retryCount}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* DLQ Detail & Reprocessing */}
            <div className="lg:col-span-2 space-y-4">
              {!selectedDlqEvent ? (
                <div className="saas-card p-12 text-center text-slate-500 text-xs">
                  Select a quarantined DLQ message to view parser failure reason and re-inject.
                </div>
              ) : (
                <div className="saas-card p-5 space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                    <div>
                      <span className="text-xs font-mono text-rose-400 font-semibold">{selectedDlqEvent.id}</span>
                      <h3 className="text-base font-bold text-white mt-0.5">{selectedDlqEvent.errorReason}</h3>
                    </div>

                    <button
                      onClick={() => handleReprocess(selectedDlqEvent.id)}
                      disabled={reprocessingId === selectedDlqEvent.id}
                      className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${reprocessingId === selectedDlqEvent.id ? 'animate-spin' : ''}`} />
                      <span>{reprocessingId === selectedDlqEvent.id ? 'Re-injecting...' : 'Re-inject into Queue'}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs font-semibold uppercase text-slate-400 block">Corrupted / Poison Payload</span>
                    <pre className="p-3.5 bg-[#070a12] rounded-xl border border-slate-800/80 font-mono text-xs text-rose-300 overflow-x-auto leading-relaxed max-h-80">
                      {selectedDlqEvent.rawPayload}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
