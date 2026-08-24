import React, { useState, useEffect } from 'react';
import { WebhookSubscription, WebhookDeliveryLog } from '../types';
import { api } from '../services/api';
import { Webhook, Plus, Send, X, Terminal } from 'lucide-react';

interface WebhookModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WebhookModal: React.FC<WebhookModalProps> = ({ isOpen, onClose }) => {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([]);
  const [logs, setLogs] = useState<WebhookDeliveryLog[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'subs' | 'logs'>('subs');
  const [testResult, setTestResult] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      const [subs, deliveryLogs] = await Promise.all([
        api.getWebhooks(),
        api.getWebhookLogs(),
      ]);
      setWebhooks(subs);
      setLogs(deliveryLogs);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl || !newName) return;
    setIsCreating(true);
    try {
      await api.createWebhook({
        name: newName,
        targetUrl: newUrl,
        events: ['incident.created', 'alert.triggered', 'playbook.executed'],
        isActive: true,
      });
      setNewUrl('');
      setNewName('');
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      const res = await api.testWebhook(id);
      setTestResult(res.message);
      loadData();
      setTimeout(() => setTestResult(null), 4000);
    } catch (err: any) {
      console.error(err);
      setTestResult(`Error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0b1320] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        <button onClick={onClose} className="absolute right-5 top-5 p-1 rounded-lg text-slate-500 hover:text-white">
          <X className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center space-x-2 text-indigo-400 font-sans text-xs uppercase font-semibold">
            <Webhook className="w-4 h-4" />
            <span>Outbound Webhook Delivery Engine</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Webhook Subscriptions & Delivery Logs</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Dispatch authenticated HMAC-SHA256 event payloads to downstream SIEM, SOAR, or Slack webhooks.
          </p>
        </div>

        {testResult && (
          <div className="p-3 bg-indigo-950/40 border border-indigo-500/40 rounded-xl text-xs font-mono text-indigo-300 flex items-center space-x-2">
            <Terminal className="w-4 h-4 shrink-0" />
            <span>{testResult}</span>
          </div>
        )}

        {/* Tab Selector */}
        <div className="flex items-center space-x-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('subs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'subs' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
            }`}
          >
            Subscribers ({webhooks.length})
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
              activeTab === 'logs' ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40' : 'text-slate-400'
            }`}
          >
            Delivery Logs ({logs.length})
          </button>
        </div>

        {/* Tab 1: Webhook Subscriptions */}
        {activeTab === 'subs' && (
          <div className="space-y-4 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {/* Create Webhook Form */}
            <form onSubmit={handleCreateWebhook} className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Webhook Name (e.g. SOC Slack Alerts)..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-sans focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="bg-[#090e1a] border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm transition-all whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Registering...' : 'Add Endpoint'}</span>
                </button>
              </div>
            </form>

            {/* List */}
            <div className="space-y-2">
              {webhooks.map((wh) => (
                <div key={wh.id} className="p-3.5 rounded-xl bg-[#090e1a] border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-white">{wh.name}</h4>
                      <p className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-sm">{wh.targetUrl}</p>
                    </div>

                    <button
                      onClick={() => handleTestWebhook(wh.id)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                    >
                      <Send className="w-3 h-3" />
                      <span>Ping</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Delivery Logs */}
        {activeTab === 'logs' && (
          <div className="space-y-2 overflow-y-auto custom-scrollbar flex-1 pr-1">
            {logs.map((log) => (
              <div key={log.id} className="p-3 rounded-xl bg-[#090e1a] border border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white font-mono">{log.eventType}</span>
                  <span className="text-[9px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {log.status} ({log.attemptDurationMs}ms)
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono">{log.targetUrl}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
