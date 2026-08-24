import React, { useState, useEffect } from 'react';
import { Incident, TimelineEntry, CopilotAnalysisResult } from '../types';
import { api } from '../services/api';
import { PlaybookModal } from './PlaybookModal';
import { ReportModal } from './ReportModal';
import {
  Crosshair,
  Clock,
  Shield,
  FileText,
  Plus,
  Send,
  Lock,
  CheckCircle,
  AlertOctagon,
  ArrowLeft,
  ChevronRight,
  Database,
  User,
  Globe,
  Share2,
  Zap,
  Download,
  Flame,
  AlertTriangle,
  Bot,
  Terminal,
  CheckSquare,
  Search
} from 'lucide-react';

interface InvestigationWorkspaceViewProps {
  incidentId: string | null;
  onBackToIncidents: () => void;
  onSelectIncident: (id: string) => void;
  incidents: Incident[];
}

export const InvestigationWorkspaceView: React.FC<InvestigationWorkspaceViewProps> = ({
  incidentId,
  onBackToIncidents,
  onSelectIncident,
  incidents,
}) => {
  const [incident, setIncident] = useState<Incident | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'graph' | 'evidence' | 'notes' | 'copilot'>('timeline');
  const [noteInput, setNoteInput] = useState('');
  const [evidenceType, setEvidenceType] = useState('ip_address');
  const [evidenceTitle, setEvidenceTitle] = useState('');
  const [evidenceValue, setEvidenceValue] = useState('');
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [showPlaybookModal, setShowPlaybookModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [copilotAnalysis, setCopilotAnalysis] = useState<CopilotAnalysisResult | null>(null);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const targetId = incidentId || (incidents.length > 0 ? incidents[0].id : null);

  useEffect(() => {
    if (!targetId) return;
    loadIncidentData(targetId);
  }, [targetId]);

  const loadIncidentData = async (id: string) => {
    try {
      const [inc, tLine] = await Promise.all([
        api.getIncident(id),
        api.getIncidentTimeline(id),
      ]);
      setIncident(inc);
      setTimeline(tLine);
    } catch (err) {
      console.error('Failed to load incident data:', err);
    }
  };

  const handleRunCopilot = async () => {
    if (!incident) return;
    setIsCopilotLoading(true);
    try {
      const data = await api.getIncidentCopilotAnalysis(incident.id);
      setCopilotAnalysis(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !incident) return;
    try {
      await api.addIncidentNote(incident.id, noteInput, 'Lead SOC Analyst');
      setNoteInput('');
      loadIncidentData(incident.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceTitle || !evidenceValue || !incident) return;
    try {
      await api.addIncidentEvidence(incident.id, {
        type: evidenceType,
        title: evidenceTitle,
        value: evidenceValue,
      });
      setShowEvidenceModal(false);
      setEvidenceTitle('');
      setEvidenceValue('');
      loadIncidentData(incident.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    if (!incident) return;
    try {
      const updated = await api.updateIncidentStatus(incident.id, status);
      setIncident(updated);
    } catch (err) {
      console.error(err);
    }
  };

  if (!targetId || !incident) {
    return (
      <div className="glass-panel p-12 rounded-2xl text-center border-slate-800 my-8">
        <Crosshair className="w-12 h-12 text-slate-600 mx-auto mb-3" />
        <h3 className="text-base font-bold text-white">No Incident Selected</h3>
        <p className="text-xs text-slate-400 mt-1">Select an incident from the incident triage list to open the workspace canvas.</p>
        <button
          onClick={onBackToIncidents}
          className="mt-4 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-semibold"
        >
          View All Incidents
        </button>
      </div>
    );
  }

  const isCrit = incident.severity === 'critical';
  const isHigh = incident.severity === 'high';

  const KILL_CHAIN = [
    { name: 'Reconnaissance', tactic: 'Reconnaissance' },
    { name: 'Initial Access / Credential', tactic: 'Credential Access' },
    { name: 'Privilege Escalation', tactic: 'Privilege Escalation' },
    { name: 'Exfiltration / Impact', tactic: 'Exfiltration' },
  ];

  const activeTactics = incident.mitreTactics ? incident.mitreTactics.split(',').map((t) => t.trim()) : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBackToIncidents}
            className="p-2 rounded-lg bg-[#0b1220] border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-400">Cases</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs font-mono text-indigo-400 font-semibold">{incident.incidentId}</span>
            </div>
            <h2 className="text-base font-bold text-white tracking-tight mt-0.5">{incident.title}</h2>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2.5">
          <select
            value={incident.status}
            onChange={(e) => handleUpdateStatus(e.target.value)}
            className="bg-[#0b1220] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
          >
            <option value="OPEN">OPEN</option>
            <option value="INVESTIGATING">INVESTIGATING</option>
            <option value="CONTAINED">CONTAINED</option>
            <option value="RESOLVED">RESOLVED</option>
          </select>

          <button
            onClick={() => setShowPlaybookModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 text-black text-xs font-semibold shadow-sm transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>SOAR Playbooks</span>
          </button>

          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Kill-Chain Progression Stepper */}
      <div className="saas-card p-4 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-semibold flex items-center space-x-1.5">
            <Flame className="w-4 h-4 text-rose-400" />
            <span>Multi-Stage Attack Kill-Chain Progression</span>
          </span>
          <span className="text-indigo-400 font-medium">
            {activeTactics.length} of {KILL_CHAIN.length} Stages Confirmed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-1">
          {KILL_CHAIN.map((step, idx) => {
            const isCompleted = activeTactics.some((t) => t.toLowerCase().includes(step.tactic.toLowerCase()) || step.name.toLowerCase().includes(t.toLowerCase()));
            return (
              <div
                key={step.name}
                className={`p-3 rounded-xl border flex items-center space-x-2.5 transition-all ${
                  isCompleted
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                    : 'bg-[#090e1a] border-slate-800/80 opacity-60'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {idx + 1}
                </div>
                <div className="truncate">
                  <p className={`text-xs font-semibold ${isCompleted ? 'text-rose-300' : 'text-slate-400'}`}>
                    {step.name}
                  </p>
                  <span className="text-[10px] text-slate-500">
                    {isCompleted ? 'CONFIRMED' : 'PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Incident Context Ribbon */}
      <div className="saas-card p-4 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Severity</span>
          <div className="flex items-center space-x-2 mt-1">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase border ${
                isCrit
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : isHigh
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
              }`}
            >
              {incident.severity}
            </span>
          </div>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Target Entity</span>
          <p className="text-xs font-mono text-indigo-300 font-semibold mt-1 truncate">{incident.entityKey}</p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">MITRE ATT&CK Stages</span>
          <p className="text-xs font-medium text-rose-300 mt-1 truncate">{incident.mitreTactics}</p>
        </div>

        <div>
          <span className="text-[10px] uppercase font-semibold text-slate-400">Correlated Signals</span>
          <p className="text-xs font-semibold text-amber-400 mt-1">
            {incident.alerts?.length || incident.alertsCount || 1} Detection Alerts
          </p>
        </div>
      </div>

      {/* Investigation Views Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-800/80 pb-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'timeline'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Attack Timeline ({timeline.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'graph'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>Entity Attack Graph</span>
        </button>

        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'evidence'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          <span>Evidence Locker ({incident.evidences?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('notes')}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'notes'
              ? 'bg-indigo-600/15 text-indigo-300 border border-indigo-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Analyst Notes ({incident.notes?.length || 0})</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('copilot');
            if (!copilotAnalysis) handleRunCopilot();
          }}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeTab === 'copilot'
              ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 font-semibold'
              : 'text-slate-400 hover:text-purple-300'
          }`}
        >
          <Bot className="w-3.5 h-3.5 text-purple-400" />
          <span>AI Investigation Copilot</span>
        </button>
      </div>

      {/* TAB 1: Chronological Attack Timeline */}
      {activeTab === 'timeline' && (
        <div className="saas-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Chronological Attack Reconstruction</h3>
              <p className="text-xs text-slate-400">Sequenced telemetry events and correlated detection triggers in temporal order.</p>
            </div>
            <span className="text-xs font-semibold text-indigo-400 bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-800/40">
              {timeline.length} Sequenced Milestones
            </span>
          </div>

          <div className="relative border-l border-slate-800 ml-4 space-y-5">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 pl-4">No chronological events found for this incident entity.</p>
            ) : (
              timeline.map((item, idx) => {
                const isAlert = item.type === 'alert';
                const isNote = item.type === 'analyst_note';

                return (
                  <div key={item.id || idx} className="relative pl-6">
                    <div
                      className={`absolute -left-[7px] top-2 w-3.5 h-3.5 rounded-full border-2 ${
                        isAlert
                          ? 'bg-rose-500 border-white glow-rose'
                          : isNote
                          ? 'bg-amber-400 border-white'
                          : 'bg-indigo-500 border-slate-900'
                      }`}
                    />

                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isAlert
                          ? 'bg-rose-950/15 border-rose-500/30'
                          : isNote
                          ? 'bg-amber-950/15 border-amber-500/30'
                          : 'bg-[#090e1a] border-slate-800/80'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 mb-1.5">
                        <div className="flex items-center space-x-2">
                          <span
                            className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-full ${
                              isAlert
                                ? 'bg-rose-500 text-white'
                                : isNote
                                ? 'bg-amber-400 text-black'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {item.type}
                          </span>
                          <span className="text-xs font-semibold text-white">{item.title}</span>
                          {item.mitreTactic && (
                            <span className="text-[10px] text-rose-300 bg-rose-900/30 px-2 py-0.5 rounded border border-rose-700/40">
                              {item.mitreTactic} ({item.mitreTechnique})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

                      {item.metadata && Object.keys(item.metadata).length > 0 && (
                        <div className="mt-2.5 p-2.5 bg-[#070a12] rounded-lg border border-slate-800/80 font-mono text-[11px] text-indigo-300/90 overflow-x-auto">
                          <pre>{JSON.stringify(item.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Entity Attack Graph Canvas */}
      {activeTab === 'graph' && (
        <div className="saas-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Entity Relationship & Attack Propagation Graph</h3>
              <p className="text-xs text-slate-400">Visual topology of the adversary, compromised assets, and attack actions.</p>
            </div>
            <span className="text-xs text-slate-400">Interactive Canvas</span>
          </div>

          <div className="h-[420px] bg-[#070a12] rounded-xl border border-slate-800/80 relative flex items-center justify-center p-8 overflow-hidden">
            <div className="relative z-10 flex flex-col items-center p-4 rounded-2xl bg-rose-950/80 border-2 border-rose-500 glow-rose shadow-xl">
              <Shield className="w-7 h-7 text-rose-400 mb-1" />
              <span className="text-xs font-mono font-bold text-white">{incident.incidentId}</span>
              <span className="text-[10px] text-rose-300 font-semibold">{incident.severity.toUpperCase()} INCIDENT</span>
            </div>

            <div className="absolute left-16 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl bg-[#0b1220] border border-indigo-500/40">
              <Globe className="w-5 h-5 text-indigo-400 mb-1" />
              <span className="text-xs font-mono text-indigo-300 font-semibold">{incident.entityKey}</span>
              <span className="text-[10px] text-slate-400">ATTACK SOURCE</span>
            </div>

            <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center p-3 rounded-xl bg-[#0b1220] border border-amber-500/40">
              <Crosshair className="w-5 h-5 text-amber-400 mb-1" />
              <span className="text-xs font-mono text-amber-300 font-semibold">{incident.mitreTactics}</span>
              <span className="text-[10px] text-slate-400">TACTICS DETECTED</span>
            </div>

            <div className="absolute right-16 top-1/2 -translate-y-1/2 flex flex-col items-center p-3 rounded-xl bg-[#0b1220] border border-purple-500/40">
              <User className="w-5 h-5 text-purple-400 mb-1" />
              <span className="text-xs font-mono text-purple-300 font-semibold">Enterprise Assets</span>
              <span className="text-[10px] text-slate-400">TARGET ACCOUNTS & BUCKETS</span>
            </div>

            <svg className="absolute inset-0 w-full h-full pointer-events-none stroke-indigo-500/30">
              <line x1="20%" y1="50%" x2="50%" y2="50%" strokeWidth="2" stroke="#6366f1" strokeDasharray="4" />
              <line x1="50%" y1="50%" x2="50%" y2="25%" strokeWidth="2" stroke="#f59e0b" strokeDasharray="4" />
              <line x1="50%" y1="50%" x2="80%" y2="50%" strokeWidth="2" stroke="#a855f7" strokeDasharray="4" />
            </svg>
          </div>
        </div>
      )}

      {/* TAB 3: Evidence Locker */}
      {activeTab === 'evidence' && (
        <div className="saas-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Forensic Evidence Locker</h3>
              <p className="text-xs text-slate-400">Tamper-evident indicators and forensics collected during investigation.</p>
            </div>
            <button
              onClick={() => setShowEvidenceModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Attach Evidence</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(!incident.evidences || incident.evidences.length === 0) ? (
              <p className="text-xs text-slate-500 col-span-3 py-6 text-center">No evidence artifacts attached yet.</p>
            ) : (
              incident.evidences.map((ev) => (
                <div key={ev.id} className="p-4 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-indigo-500/40 transition-all space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-indigo-950/50 text-indigo-300 border border-indigo-800/40">
                      {ev.type}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(ev.addedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-white">{ev.title}</h4>
                  <div className="p-2 bg-[#070a12] rounded font-mono text-[11px] text-amber-300 break-all border border-slate-800/80">
                    {ev.value}
                  </div>
                  {ev.notes && <p className="text-[11px] text-slate-400 italic">{ev.notes}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Analyst Notes Thread */}
      {activeTab === 'notes' && (
        <div className="saas-card p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Analyst Findings & Shift Handover</h3>
              <p className="text-xs text-slate-400">Document investigation hypotheses, containment steps, and root causes.</p>
            </div>
          </div>

          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              placeholder="Add investigation hypothesis or containment step..."
              value={noteInput}
              onChange={(e) => setNoteInput(e.target.value)}
              className="flex-1 bg-[#090e1a] border border-slate-800 rounded-xl px-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition-all shadow-sm"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Post</span>
            </button>
          </form>

          <div className="space-y-3">
            {(!incident.notes || incident.notes.length === 0) ? (
              <p className="text-xs text-slate-500 text-center py-6">No analyst notes recorded yet.</p>
            ) : (
              incident.notes.map((n) => (
                <div key={n.id} className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800/80 space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-indigo-400 font-semibold">{n.author}</span>
                    <span className="text-slate-500">{new Date(n.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-xs text-slate-200">{n.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: Explainable AI Investigation Copilot */}
      {activeTab === 'copilot' && (
        <div className="saas-card p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Bot className="w-4 h-4 text-purple-400" />
                <span>Explainable AI Investigation Reasoning Assistant</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evidence-grounded attack narrative synthesis, entry vector validation, and containment checklist.
              </p>
            </div>
            <button
              onClick={handleRunCopilot}
              disabled={isCopilotLoading}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <Bot className={`w-3.5 h-3.5 ${isCopilotLoading ? 'animate-spin' : ''}`} />
              <span>{isCopilotLoading ? 'Synthesizing...' : 'Re-run AI Analysis'}</span>
            </button>
          </div>

          {isCopilotLoading ? (
            <div className="text-center py-16 text-xs text-purple-300 space-y-2">
              <Terminal className="w-5 h-5 animate-spin mx-auto text-purple-400" />
              <p>Analyzing chronological timeline milestones and telemetry citations...</p>
            </div>
          ) : !copilotAnalysis ? (
            <div className="text-center py-16 text-slate-500 text-xs">
              Click "Re-run AI Analysis" to synthesize attack hypotheses and containment playbooks.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Executive Narrative & Confidence */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded-md">
                    Executive Threat Narrative
                  </span>
                  <span className="text-xs text-purple-300 font-semibold">
                    Confidence: {copilotAnalysis.confidenceScore}%
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{copilotAnalysis.executiveNarrative}</p>
              </div>

              {/* Hypothesis & Citations Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Attack Hypothesis */}
                <div className="p-4 rounded-xl bg-[#090e1a] border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Attack Hypothesis & Vector:</h4>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-slate-500 block text-[10px]">ENTRY VECTOR:</span>
                      <span className="text-rose-300 font-semibold">{copilotAnalysis.attackHypothesis.entryVector}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ADVERSARY INTENT:</span>
                      <span className="text-amber-300 font-semibold">{copilotAnalysis.attackHypothesis.adversaryIntent}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">ESTIMATED DWELL TIME:</span>
                      <span className="text-slate-300">{copilotAnalysis.attackHypothesis.estimatedDwellTime}</span>
                    </div>
                  </div>
                </div>

                {/* Containment Checklist */}
                <div className="p-4 rounded-xl bg-[#090e1a] border border-slate-800/80 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Actionable Containment Checklist:</h4>
                  <div className="space-y-2">
                    {copilotAnalysis.containmentChecklist.map((c, i) => (
                      <div key={i} className="flex items-start space-x-2 text-xs">
                        <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span className="text-slate-300">{c.step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evidence Citations */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Grounded Telemetry Citations:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {copilotAnalysis.evidenceCitations.map((cit, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-[#090e1a] border border-slate-800/80 text-xs space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-purple-400 font-semibold">{cit.confidence} CONFIDENCE</span>
                      </div>
                      <p className="text-white font-medium">{cit.fact}</p>
                      <p className="text-slate-500 text-[11px] truncate">{cit.sourceEvidence}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Attach Evidence Modal */}
      {showEvidenceModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Attach Forensic Evidence</h3>

            <form onSubmit={handleAddEvidence} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Evidence Type</label>
                <select
                  value={evidenceType}
                  onChange={(e) => setEvidenceType(e.target.value)}
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="ip_address">IP Address</option>
                  <option value="user_account">User Account</option>
                  <option value="file_hash">File Hash (SHA256)</option>
                  <option value="api_key_id">Compromised API Key</option>
                  <option value="url">Malicious URL / Host</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Title / Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. Attacker C2 IP"
                  value={evidenceTitle}
                  onChange={(e) => setEvidenceTitle(e.target.value)}
                  required
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Value / Payload</label>
                <input
                  type="text"
                  placeholder="e.g. 198.51.100.77"
                  value={evidenceValue}
                  onChange={(e) => setEvidenceValue(e.target.value)}
                  required
                  className="w-full bg-[#070a12] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEvidenceModal(false)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-500"
                >
                  Save Evidence
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SOAR Playbook Modal */}
      <PlaybookModal
        isOpen={showPlaybookModal}
        onClose={() => setShowPlaybookModal(false)}
        incident={incident}
        onPlaybookExecuted={() => loadIncidentData(incident.id)}
      />

      {/* Forensic Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        incidentId={incident.id}
      />
    </div>
  );
};
