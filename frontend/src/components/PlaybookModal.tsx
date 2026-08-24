import React, { useState, useEffect } from 'react';
import { PlaybookDefinition, Incident } from '../types';
import { api } from '../services/api';
import { Zap, ShieldCheck, Clock, CheckCircle, AlertTriangle, X, Terminal } from 'lucide-react';

interface PlaybookModalProps {
  isOpen: boolean;
  onClose: () => void;
  incident: Incident | null;
  onPlaybookExecuted: () => void;
}

export const PlaybookModal: React.FC<PlaybookModalProps> = ({
  isOpen,
  onClose,
  incident,
  onPlaybookExecuted,
}) => {
  const [playbooks, setPlaybooks] = useState<PlaybookDefinition[]>([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadPlaybooks();
      setExecutionResult(null);
      setSelectedPlaybook(null);
    }
  }, [isOpen]);

  const loadPlaybooks = async () => {
    try {
      const list = await api.getPlaybooks();
      setPlaybooks(list);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !incident) return null;

  const handleRunPlaybook = async () => {
    if (!selectedPlaybook) return;
    setIsExecuting(true);
    try {
      const res = await api.executePlaybook(selectedPlaybook, incident.id, 'Lead SOC Analyst');
      setExecutionResult(res);
      onPlaybookExecuted();
    } catch (err: any) {
      console.error(err);
      setExecutionResult({ success: false, message: err.message });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase font-bold">
            <Zap className="w-4 h-4" />
            <span>SOAR Automation Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Execute Response Playbook</h2>
          <p className="text-xs text-slate-400 mt-1">
            Dispatch automated perimeter containment, session revocation, or war room escalations for{' '}
            <strong className="text-cyan-300 font-mono">{incident.incidentId}</strong> ({incident.entityKey}).
          </p>
        </div>

        {/* Execution Output Banner */}
        {executionResult && (
          <div
            className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs font-mono ${
              executionResult.success
                ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
                : 'bg-rose-950/40 border-rose-500/50 text-rose-300'
            }`}
          >
            <Terminal className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {executionResult.success ? `✅ Execution #${executionResult.executionId} Success` : '❌ Execution Error'}
              </p>
              <p className="mt-0.5 text-slate-300">{executionResult.message}</p>
            </div>
          </div>
        )}

        {/* Playbooks List */}
        <div className="space-y-2.5 max-h-72 overflow-y-auto custom-scrollbar">
          {playbooks.map((pb) => {
            const isSelected = selectedPlaybook === pb.id;
            return (
              <div
                key={pb.id}
                onClick={() => !isExecuting && setSelectedPlaybook(pb.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-950'
                    : 'bg-[#070b13] border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-mono font-bold uppercase text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/40">
                      {pb.id}
                    </span>
                    <h4 className="text-xs font-bold text-white">{pb.name}</h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{pb.estimatedExecutionTime}</span>
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">{pb.description}</p>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleRunPlaybook}
            disabled={!selectedPlaybook || isExecuting}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all ${
              !selectedPlaybook || isExecuting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black shadow-lg shadow-cyan-500/20 hover:scale-[1.02]'
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${isExecuting ? 'animate-spin' : ''}`} />
            <span>{isExecuting ? 'Dispatching Playbook...' : 'Execute Selected Playbook'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
