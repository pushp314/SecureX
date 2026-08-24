import React, { useState, useEffect } from 'react';
import { ComplianceFramework, D3FENDCountermeasure } from '../types';
import { api } from '../services/api';
import { Scale, ShieldCheck, FileText } from 'lucide-react';

export const ComplianceView: React.FC = () => {
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [d3fendMatrix, setD3fendMatrix] = useState<D3FENDCountermeasure[]>([]);
  const [activeTab, setActiveTab] = useState<'frameworks' | 'd3fend'>('frameworks');
  const [reportData, setReportData] = useState<{ markdown: string; overallScore: number; timestamp: string } | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  useEffect(() => {
    loadComplianceData();
  }, []);

  const loadComplianceData = async () => {
    try {
      const [fwList, d3List] = await Promise.all([
        api.getComplianceFrameworks(),
        api.getD3FENDMatrix(),
      ]);
      setFrameworks(fwList);
      if (fwList.length > 0 && !selectedFramework) {
        setSelectedFramework(fwList[0]);
      }
      setD3fendMatrix(d3List);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const rep = await api.getComplianceReport();
      setReportData(rep);
      setIsReportOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center space-x-2">
            <Scale className="w-4 h-4 text-emerald-400" />
            <span>Enterprise Compliance & MITRE D3FEND Matrix</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Continuous audit evidence mapping across SOC 2, ISO 27001, HIPAA, PCI-DSS, NIST CSF 2.0, and D3FEND countermeasures.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center bg-[#090e1a] p-1 rounded-xl border border-slate-800/80">
            <button
              onClick={() => setActiveTab('frameworks')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'frameworks'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Regulatory Standards
            </button>
            <button
              onClick={() => setActiveTab('d3fend')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'd3fend'
                  ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              MITRE D3FEND
            </button>
          </div>

          <button
            onClick={handleGenerateReport}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Executive Report</span>
          </button>
        </div>
      </div>

      {activeTab === 'frameworks' ? (
        <div className="space-y-6">
          {/* Framework Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {frameworks.map((fw) => {
              const isSelected = selectedFramework?.id === fw.id;
              return (
                <div
                  key={fw.id}
                  onClick={() => setSelectedFramework(fw)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-950/30 border-indigo-500/50 shadow-sm'
                      : 'bg-[#090e1a] border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{fw.version}</span>
                    <span className="text-xs font-bold text-emerald-400">{fw.overallScore}%</span>
                  </div>
                  <h4 className="text-xs font-semibold text-white truncate">{fw.name}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">{fw.controlsPassed}/{fw.totalControls} Controls Ready</p>
                </div>
              );
            })}
          </div>

          {/* Selected Framework Controls Breakdown */}
          {selectedFramework && (
            <div className="saas-card p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>{selectedFramework.name} — Technical Audit Controls</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedFramework.description}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-semibold text-slate-400 block">Compliance Score</span>
                  <span className="text-2xl font-bold text-emerald-400">{selectedFramework.overallScore}%</span>
                </div>
              </div>

              <div className="space-y-3">
                {selectedFramework.controls.map((ctrl) => (
                  <div
                    key={ctrl.id}
                    className="p-4 rounded-xl bg-[#090e1a] border border-slate-800/80 hover:border-slate-700 space-y-2 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-semibold text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/50">
                          {ctrl.controlCode}
                        </span>
                        <h4 className="text-xs font-semibold text-white">{ctrl.title}</h4>
                      </div>
                      <span className="text-[10px] font-semibold uppercase text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        {ctrl.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300">{ctrl.description}</p>

                    <div className="p-2 rounded-lg bg-[#070a12] border border-slate-800/60 text-[11px] font-mono text-slate-400 flex items-center justify-between">
                      <div>
                        <span className="text-slate-500 font-semibold mr-1">TECHNICAL EVIDENCE:</span>
                        <span className="text-indigo-400">{ctrl.evidencedBy}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">Continuous Assessment</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* MITRE D3FEND Tab */
        <div className="space-y-4">
          <div className="saas-card p-4">
            <h3 className="text-sm font-bold text-white mb-0.5">MITRE D3FEND™ Defensive Countermeasure Matrix</h3>
            <p className="text-xs text-slate-400">
              Affirmative cyber defense techniques mapped directly against active MITRE ATT&CK adversary tactics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {d3fendMatrix.map((d3) => (
              <div key={d3.id} className="saas-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-semibold text-purple-400 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-800/50">
                      {d3.d3fendCode}
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      {d3.category}
                    </span>
                  </div>
                  <span className="text-[10px] font-semibold uppercase text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    ACTIVE
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-white">{d3.technique}</h4>
                  <p className="text-xs text-slate-400 mt-1">{d3.description}</p>
                </div>

                <div className="p-2.5 rounded-lg bg-[#090e1a] border border-slate-800 text-[11px] text-rose-300">
                  <span className="text-slate-500 font-semibold mr-1">COUNTERS ATT&CK:</span>
                  <span>{d3.countersMitreAttack}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Executive Report Modal */}
      {isReportOpen && reportData && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Executive Governance & Audit Certification Report</span>
              </h3>
              <button
                onClick={() => setIsReportOpen(false)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-[#070a12] rounded-xl border border-slate-800 font-mono">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                {reportData.markdown}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
