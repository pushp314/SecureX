import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FileText, Copy, Download, Check, X, Shield, Terminal } from 'lucide-react';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidentId: string | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  incidentId,
}) => {
  const [report, setReport] = useState<{ markdown: string; json: any } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && incidentId) {
      loadReport(incidentId);
      setCopied(false);
    }
  }, [isOpen, incidentId]);

  const loadReport = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.getIncidentReport(id);
      setReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!report || !incidentId) return;
    const blob = new Blob([report.markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SecureX-Forensic-Report-${report.json.incident.incidentId}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col">
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-cyan-400 font-mono text-xs uppercase font-bold">
            <FileText className="w-4 h-4" />
            <span>Forensic Case Export</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">Incident Investigation Report</h2>
          <p className="text-xs text-slate-400 mt-1">
            Certified forensic summary including MITRE ATT&CK taxonomy, chronological timeline, evidence locker, and remediation audit trail.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center justify-between bg-[#070b13] p-2.5 rounded-xl border border-slate-800">
          <span className="text-xs font-mono text-slate-400">Format: Markdown (TLP:AMBER)</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              disabled={!report}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
            </button>
            <button
              onClick={handleDownload}
              disabled={!report}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-bold text-black transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {/* Report Content Preview */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 rounded-xl bg-[#070b13] border border-slate-800 text-xs font-mono text-slate-300 space-y-4">
          {isLoading ? (
            <div className="text-center py-16 text-slate-500">Generating forensic report...</div>
          ) : !report ? (
            <div className="text-center py-16 text-slate-500">Unable to load report.</div>
          ) : (
            <pre className="whitespace-pre-wrap leading-relaxed">{report.markdown}</pre>
          )}
        </div>

        <div className="pt-1 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
