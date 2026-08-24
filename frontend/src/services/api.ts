import {
  Incident,
  TelemetryStats,
  TelemetryEvent,
  DetectionRule,
  Alert,
  TimelineEntry,
  PlaybookDefinition,
  BacktestResult,
  CopilotAnalysisResult,
  MonitoredAsset,
  WebhookSubscription,
  WebhookDeliveryLog,
  NetworkFlowRecord,
  NetworkAnomaly,
  DevSecOpsEvent,
  ScopedApiKey,
  VerifiedAuditRecord,
  ThreatHuntTemplate,
  ThreatHuntResult,
  SystemDiagnostics,
  CloudResourcePosture,
  MalwareSandboxAnalysis,
  ManagedIdentity,
  IdentityStressTestResult,
  ComplianceFramework,
  D3FENDCountermeasure,
  DeadLetterEvent,
  AuthUser,
  AuthSession,
} from '../types';

const API_BASE = '/api/v1';

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('secx_auth_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Authentication
  async login(email: string, password: string): Promise<AuthSession> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Authentication failed');
    }
    const session: AuthSession = await res.json();
    localStorage.setItem('secx_auth_token', session.token);
    return session;
  },

  async getProfile(): Promise<AuthUser> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Session invalid or expired');
    return res.json();
  },

  async logout(): Promise<void> {
    localStorage.removeItem('secx_auth_token');
    await fetch(`${API_BASE}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    }).catch(() => {});
  },

  // Stats
  async getStats(): Promise<TelemetryStats> {
    const res = await fetch(`${API_BASE}/telemetry/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch stats');
    return res.json();
  },

  // Dead Letter Queue (DLQ)
  async getDLQEvents(): Promise<DeadLetterEvent[]> {
    const res = await fetch(`${API_BASE}/dlq/events`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch DLQ events');
    return res.json();
  },

  async reprocessDLQEvent(id: string, category?: string): Promise<DeadLetterEvent> {
    const res = await fetch(`${API_BASE}/dlq/reprocess/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ category }),
    });
    if (!res.ok) throw new Error('Failed to reprocess DLQ event');
    return res.json();
  },

  async simulateDLQFailure(reason?: string, payload?: any): Promise<DeadLetterEvent> {
    const res = await fetch(`${API_BASE}/dlq/simulate-failure`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ reason, payload }),
    });
    if (!res.ok) throw new Error('Failed to simulate DLQ failure');
    return res.json();
  },

  async purgeDLQ(): Promise<any> {
    const res = await fetch(`${API_BASE}/dlq/purge`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to purge DLQ');
    return res.json();
  },

  // Compliance & Governance
  async getComplianceFrameworks(): Promise<ComplianceFramework[]> {
    const res = await fetch(`${API_BASE}/compliance/frameworks`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch compliance frameworks');
    return res.json();
  },

  async getD3FENDMatrix(): Promise<D3FENDCountermeasure[]> {
    const res = await fetch(`${API_BASE}/compliance/d3fend`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch D3FEND matrix');
    return res.json();
  },

  async getComplianceReport(): Promise<{ markdown: string; overallScore: number; timestamp: string }> {
    const res = await fetch(`${API_BASE}/compliance/report`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch compliance report');
    return res.json();
  },

  // ITDR & Identity Trust
  async getManagedIdentities(): Promise<ManagedIdentity[]> {
    const res = await fetch(`${API_BASE}/itdr/identities`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch identities');
    return res.json();
  },

  async containIdentity(id: string, action: 'LOCK' | 'REVOKE_SESSIONS' | 'REQUIRE_MFA'): Promise<ManagedIdentity> {
    const res = await fetch(`${API_BASE}/itdr/identities/${id}/contain`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error('Failed to contain identity');
    return res.json();
  },

  async runIdentityStressTest(scenario: string, targetUsername?: string): Promise<IdentityStressTestResult> {
    const res = await fetch(`${API_BASE}/itdr/stress-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ scenario, targetUsername }),
    });
    if (!res.ok) throw new Error('Failed to run identity stress test');
    return res.json();
  },

  // Observability & Diagnostics
  async getDiagnostics(): Promise<SystemDiagnostics> {
    const res = await fetch(`${API_BASE}/observability/metrics`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch diagnostics');
    return res.json();
  },

  async runDiagnosticSelfTest(): Promise<any> {
    const res = await fetch(`${API_BASE}/observability/self-test`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run self-test');
    return res.json();
  },

  // Cloud Posture (CSPM)
  async getCloudPosture(): Promise<CloudResourcePosture[]> {
    const res = await fetch(`${API_BASE}/cloud/posture`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cloud posture');
    return res.json();
  },

  async getCloudSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/cloud/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch cloud summary');
    return res.json();
  },

  async remediateCloudResource(id: string): Promise<CloudResourcePosture> {
    const res = await fetch(`${API_BASE}/cloud/remediate/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to remediate cloud resource');
    return res.json();
  },

  // Malware Sandbox
  async getSandboxAnalyses(): Promise<MalwareSandboxAnalysis[]> {
    const res = await fetch(`${API_BASE}/sandbox/analyses`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sandbox analyses');
    return res.json();
  },

  async analyzeMalwareSample(sampleName: string, fileHash?: string): Promise<MalwareSandboxAnalysis> {
    const res = await fetch(`${API_BASE}/sandbox/analyze`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ sampleName, fileHash }),
    });
    if (!res.ok) throw new Error('Failed to analyze malware sample');
    return res.json();
  },

  // Events
  async getEvents(limit = 100, search?: string, category?: string): Promise<TelemetryEvent[]> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (search) params.append('search', search);
    if (category) params.append('category', category);
    const res = await fetch(`${API_BASE}/telemetry/events?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch events');
    return res.json();
  },

  // Ingest manual telemetry event
  async ingestTelemetry(events: any[]): Promise<any> {
    const res = await fetch(`${API_BASE}/telemetry/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-SecureX-API-Key': 'secx_live_k8v92mqp019842a7bc',
      },
      body: JSON.stringify({
        events,
        sentAt: new Date().toISOString(),
        clientVersion: '1.0.0-ui',
      }),
    });
    if (!res.ok) throw new Error('Failed to ingest telemetry');
    return res.json();
  },

  // Incidents
  async getIncidents(status?: string, severity?: string): Promise<Incident[]> {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (severity) params.append('severity', severity);
    const res = await fetch(`${API_BASE}/incidents?${params.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch incidents');
    return res.json();
  },

  async getIncident(id: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch incident');
    return res.json();
  },

  async updateIncidentStatus(id: string, status: string): Promise<Incident> {
    const res = await fetch(`${API_BASE}/incidents/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update incident');
    return res.json();
  },

  async addIncidentNote(id: string, content: string, author = 'Analyst'): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/notes`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content, author }),
    });
    if (!res.ok) throw new Error('Failed to add note');
    return res.json();
  },

  async addIncidentEvidence(id: string, evidence: { type: string; title: string; value: string; notes?: string }): Promise<any> {
    const res = await fetch(`${API_BASE}/incidents/${id}/evidence`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(evidence),
    });
    if (!res.ok) throw new Error('Failed to add evidence');
    return res.json();
  },

  async getIncidentTimeline(id: string): Promise<TimelineEntry[]> {
    const res = await fetch(`${API_BASE}/incidents/${id}/timeline`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch timeline');
    return res.json();
  },

  async getIncidentReport(id: string): Promise<{ markdown: string; json: any }> {
    const res = await fetch(`${API_BASE}/incidents/${id}/report`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch report');
    return res.json();
  },

  // AI Copilot
  async getIncidentCopilotAnalysis(id: string): Promise<CopilotAnalysisResult> {
    const res = await fetch(`${API_BASE}/incidents/${id}/copilot-analysis`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch copilot analysis');
    return res.json();
  },

  // SOAR Playbooks
  async getPlaybooks(): Promise<PlaybookDefinition[]> {
    const res = await fetch(`${API_BASE}/playbooks`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch playbooks');
    return res.json();
  },

  async executePlaybook(playbookId: string, incidentId: string, executedBy?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/playbooks/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ playbookId, incidentId, executedBy }),
    });
    if (!res.ok) throw new Error('Failed to execute playbook');
    return res.json();
  },

  // Vulnerability Scanner
  async getMonitoredAssets(): Promise<MonitoredAsset[]> {
    const res = await fetch(`${API_BASE}/vulnerabilities/assets`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch assets');
    return res.json();
  },

  async scanAsset(assetId: string): Promise<MonitoredAsset> {
    const res = await fetch(`${API_BASE}/vulnerabilities/scan/${assetId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to scan asset');
    return res.json();
  },

  // Webhooks
  async getWebhooks(): Promise<WebhookSubscription[]> {
    const res = await fetch(`${API_BASE}/webhooks`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch webhooks');
    return res.json();
  },

  async createWebhook(sub: Partial<WebhookSubscription>): Promise<WebhookSubscription> {
    const res = await fetch(`${API_BASE}/webhooks`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sub),
    });
    if (!res.ok) throw new Error('Failed to create webhook');
    return res.json();
  },

  async getWebhookLogs(): Promise<WebhookDeliveryLog[]> {
    const res = await fetch(`${API_BASE}/webhooks/logs`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch webhook logs');
    return res.json();
  },

  async testWebhook(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/webhooks/test/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to test webhook');
    return res.json();
  },

  // Network Monitoring
  async getNetworkFlows(limit = 50): Promise<NetworkFlowRecord[]> {
    const res = await fetch(`${API_BASE}/network/flows?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch network flows');
    return res.json();
  },

  async getNetworkAnomalies(): Promise<NetworkAnomaly[]> {
    const res = await fetch(`${API_BASE}/network/anomalies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch network anomalies');
    return res.json();
  },

  async getNetworkStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/network/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch network stats');
    return res.json();
  },

  async getGeoRadarOrigins(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/network/geo-radar`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch geo radar origins');
    return res.json();
  },

  // DevSecOps
  async getDevSecOpsEvents(): Promise<DevSecOpsEvent[]> {
    const res = await fetch(`${API_BASE}/devsecops/events`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch devsecops events');
    return res.json();
  },

  async getDevSecOpsStats(): Promise<any> {
    const res = await fetch(`${API_BASE}/devsecops/stats`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch devsecops stats');
    return res.json();
  },

  async resolveDevSecOpsFinding(id: string, status: 'RESOLVED' | 'SUPPRESSED' = 'RESOLVED'): Promise<DevSecOpsEvent> {
    const res = await fetch(`${API_BASE}/devsecops/events/${id}/status`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update finding status');
    return res.json();
  },

  // Threat Hunting
  async getHuntTemplates(): Promise<ThreatHuntTemplate[]> {
    const res = await fetch(`${API_BASE}/hunting/templates`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch hunt templates');
    return res.json();
  },

  async executeThreatHunt(filter: any): Promise<ThreatHuntResult> {
    const res = await fetch(`${API_BASE}/hunting/execute`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ filter }),
    });
    if (!res.ok) throw new Error('Failed to execute hunt');
    return res.json();
  },

  async convertHuntToRule(data: any): Promise<DetectionRule> {
    const res = await fetch(`${API_BASE}/hunting/convert-to-rule`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to convert hunt to rule');
    return res.json();
  },

  // API Keys & Verified Audit
  async getApiKeys(): Promise<ScopedApiKey[]> {
    const res = await fetch(`${API_BASE}/apikeys`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch api keys');
    return res.json();
  },

  async createApiKey(name: string): Promise<ScopedApiKey> {
    const res = await fetch(`${API_BASE}/apikeys`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error('Failed to create api key');
    return res.json();
  },

  async revokeApiKey(id: string): Promise<ScopedApiKey> {
    const res = await fetch(`${API_BASE}/apikeys/${id}/revoke`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to revoke api key');
    return res.json();
  },

  async getVerifiedAuditChain(): Promise<VerifiedAuditRecord[]> {
    const res = await fetch(`${API_BASE}/audit/chain`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch audit chain');
    return res.json();
  },

  // Alerts & Rules
  async getAlerts(limit = 50): Promise<Alert[]> {
    const res = await fetch(`${API_BASE}/alerts?limit=${limit}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async getRules(): Promise<DetectionRule[]> {
    const res = await fetch(`${API_BASE}/rules`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch rules');
    return res.json();
  },

  async toggleRule(id: string, isEnabled: boolean): Promise<DetectionRule> {
    const res = await fetch(`${API_BASE}/rules/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isEnabled }),
    });
    if (!res.ok) throw new Error('Failed to update rule');
    return res.json();
  },

  async createRule(rule: Partial<DetectionRule>): Promise<DetectionRule> {
    const res = await fetch(`${API_BASE}/rules`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error('Failed to create rule');
    return res.json();
  },

  async backtestRule(rule: any): Promise<BacktestResult> {
    const res = await fetch(`${API_BASE}/rules/backtest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error('Failed to backtest rule');
    return res.json();
  },

  // 1. Universal Log Parsers
  async getParsers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/parsers`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch parsers');
    return res.json();
  },

  async testParser(rawLog: string, parserId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/parsers/test`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rawLog, parserId }),
    });
    if (!res.ok) throw new Error('Failed to test parser');
    return res.json();
  },

  async ingestParsedLog(rawLog: string, parserId?: string): Promise<any> {
    const res = await fetch(`${API_BASE}/parsers/ingest`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ rawLog, parserId }),
    });
    if (!res.ok) throw new Error('Failed to ingest parsed log');
    return res.json();
  },

  // 2. Threat Intelligence (CTI) & IOCs
  async getThreatIndicators(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/threatintel/indicators`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch threat indicators');
    return res.json();
  },

  async lookupThreatIndicator(value: string): Promise<any> {
    const res = await fetch(`${API_BASE}/threatintel/lookup?value=${encodeURIComponent(value)}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to lookup indicator');
    return res.json();
  },

  async addThreatIndicator(indicator: any): Promise<any> {
    const res = await fetch(`${API_BASE}/threatintel/indicators`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(indicator),
    });
    if (!res.ok) throw new Error('Failed to add threat indicator');
    return res.json();
  },

  // 3. SIEM Piped Query (SPL / KQL)
  async executeKqlQuery(query: string): Promise<any> {
    const res = await fetch(`${API_BASE}/siem/query`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ query }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute query');
    }
    return res.json();
  },

  // 4. UEBA Behavioral Analytics
  async getUebaProfiles(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/ueba/profiles`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch UEBA profiles');
    return res.json();
  },

  async getUebaAnomalies(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/ueba/anomalies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch UEBA anomalies');
    return res.json();
  },

  // 5. Data Retention & Storage Tiering
  async getStorageTiers(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/retention/tiers`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch storage tiers');
    return res.json();
  },

  async getRetentionPolicies(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/retention/policies`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch retention policies');
    return res.json();
  },

  async triggerArchival(): Promise<any> {
    const res = await fetch(`${API_BASE}/retention/archive`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to trigger archival');
    return res.json();
  },

  // --- Next-Gen Differentiators ---

  // Sigma Rule Compiler
  async getSigmaRules(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/sigma/rules`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch sigma rules');
    return res.json();
  },

  async compileSigmaYaml(yaml: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sigma/compile`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ yaml }),
    });
    if (!res.ok) throw new Error('Failed to compile sigma yaml');
    return res.json();
  },

  async deploySigmaRule(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/sigma/deploy/${id}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to deploy sigma rule');
    return res.json();
  },

  // Breach & Attack Simulation (BAS)
  async getBasTests(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/bas/tests`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch BAS tests');
    return res.json();
  },

  async runBasTest(testId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/bas/run/${testId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to run BAS test');
    return res.json();
  },

  async getBasMatrix(): Promise<any> {
    const res = await fetch(`${API_BASE}/bas/matrix`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch BAS matrix');
    return res.json();
  },

  // Blast Radius
  async analyzeBlastRadius(entityKey: string): Promise<any> {
    const res = await fetch(`${API_BASE}/blast-radius/analyze/${encodeURIComponent(entityKey)}`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to analyze blast radius');
    return res.json();
  },

  async lockBlastPerimeter(entityKey: string): Promise<any> {
    const res = await fetch(`${API_BASE}/blast-radius/lock/${encodeURIComponent(entityKey)}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to lock blast perimeter');
    return res.json();
  },

  // Adaptive Noise Cancellation
  async getTuningRules(): Promise<any[]> {
    const res = await fetch(`${API_BASE}/tuning/rules`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tuning rules');
    return res.json();
  },

  async getTuningSummary(): Promise<any> {
    const res = await fetch(`${API_BASE}/tuning/summary`, { headers: getAuthHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tuning summary');
    return res.json();
  },

  async applyTuning(ruleId: string): Promise<any> {
    const res = await fetch(`${API_BASE}/tuning/apply/${ruleId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to apply tuning');
    return res.json();
  },
};

