export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'SOC_LEAD' | 'ANALYST_TIER_2' | 'AUDITOR';
  tenantId: string;
  avatarUrl?: string;
}

export interface AuthSession {
  user: AuthUser;
  token: string;
  expiresAt: string;
}

export interface TelemetryEvent {
  id: string;
  eventId: string;
  tenantId: string;
  timestamp: string;
  category: string;
  eventType: string;
  outcome: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  sourceService: string;
  sourceIp?: string;
  destinationIp?: string;
  userId?: string;
  username?: string;
  resourceType?: string;
  resourceName?: string;
  action?: string;
  metadataJson?: string;
  rawPayload: string;
}

export interface DetectionRule {
  id: string;
  ruleId: string;
  name: string;
  description: string;
  category: string;
  severity: string;
  ruleType: string;
  mitreTactic: string;
  mitreTechnique: string;
  conditionJson: string;
  windowSeconds: number;
  thresholdCount: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface Alert {
  id: string;
  alertId: string;
  ruleId: string;
  ruleName: string;
  severity: string;
  mitreTactic: string;
  mitreTechnique: string;
  description: string;
  entityKey: string;
  detailsJson: string;
  timestamp: string;
  incidentId?: string;
}

export interface IncidentEvidence {
  id: string;
  incidentId: string;
  type: string;
  title: string;
  value: string;
  notes?: string;
  addedAt: string;
}

export interface IncidentNote {
  id: string;
  incidentId: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Incident {
  id: string;
  incidentId: string;
  title: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'OPEN' | 'INVESTIGATING' | 'CONTAINED' | 'RESOLVED';
  summary: string;
  entityKey: string;
  mitreTactics: string;
  alertsCount: number;
  createdAt: string;
  updatedAt: string;
  alerts?: Alert[];
  evidences?: IncidentEvidence[];
  notes?: IncidentNote[];
  _count?: {
    alerts: number;
    evidences: number;
    notes: number;
  };
}

export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: 'telemetry' | 'alert' | 'analyst_note';
  title: string;
  category: string;
  severity: string;
  description: string;
  entityKey?: string;
  mitreTactic?: string;
  mitreTechnique?: string;
  metadata?: any;
}

export interface TelemetryStats {
  totalEvents: number;
  totalAlerts: number;
  totalIncidents: number;
  openIncidents: number;
  byCategory: { category: string; count: number }[];
  bySeverity: { severity: string; count: number }[];
}

export interface PlaybookDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  targetType: 'ip' | 'user' | 'resource' | 'incident';
  estimatedExecutionTime: string;
}

export interface BacktestResult {
  totalEventsAnalyzed: number;
  totalMatches: number;
  matchesByEntity: Record<string, number>;
  matchedEventSamples: any[];
  estimatedAlertRatePerHour: number;
  executionDurationMs: number;
}

export interface ThreatIntelResult {
  isMalicious: boolean;
  threatScore: number;
  threatType?: string;
  threatActor?: string;
  country?: string;
  asn?: string;
  tags: string[];
  reputationSummary: string;
}

export interface CopilotAnalysisResult {
  incidentId: string;
  generatedAt: string;
  confidenceScore: number;
  executiveNarrative: string;
  attackHypothesis: {
    entryVector: string;
    adversaryIntent: string;
    estimatedDwellTime: string;
    killChainProgression: string[];
  };
  evidenceCitations: {
    fact: string;
    sourceEvidence: string;
    confidence: 'HIGH' | 'MEDIUM' | 'CORRELATED';
  }[];
  containmentChecklist: {
    step: string;
    priority: 'IMMEDIATE' | 'HIGH' | 'STANDARD';
    suggestedPlaybookId?: string;
  }[];
  huntingQueries: {
    name: string;
    query: string;
    rationale: string;
  }[];
}

export interface VulnerabilityFinding {
  id: string;
  cveId: string;
  title: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  cvssScore: number;
  description: string;
  affectedComponent: string;
  remediation: string;
  discoveredAt: string;
}

export interface MonitoredAsset {
  id: string;
  name: string;
  type: 'host' | 'api_service' | 'cloud_resource' | 'database';
  ipAddress: string;
  environment: 'production' | 'staging' | 'internal';
  riskScore: number;
  lastScannedAt: string;
  vulnerabilities: VulnerabilityFinding[];
}

export interface WebhookSubscription {
  id: string;
  name: string;
  targetUrl: string;
  secret: string;
  events: string[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  eventType: string;
  targetUrl: string;
  status: 'DELIVERED' | 'FAILED' | 'TEST';
  statusCode?: number;
  attemptDurationMs: number;
  timestamp: string;
  responsePreview?: string;
}

export interface NetworkFlowRecord {
  id: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTPS';
  bytesIn: number;
  bytesOut: number;
  packets: number;
  dnsQuery?: string;
  timestamp: string;
  isAnomalous?: boolean;
}

export interface NetworkAnomaly {
  id: string;
  type: 'C2_BEACONING' | 'DNS_TUNNELING' | 'EGRESS_SPIKE' | 'PORT_SWEEP';
  severity: 'critical' | 'high' | 'medium';
  sourceIp: string;
  destinationIp: string;
  description: string;
  mitreTactic: string;
  mitreTechnique: string;
  detectedAt: string;
}

export interface DevSecOpsEvent {
  id: string;
  type: 'SECRET_LEAK' | 'CONTAINER_MISCONFIG' | 'PIPELINE_BYPASS' | 'DEPENDENCY_ALERT';
  severity: 'critical' | 'high' | 'medium' | 'low';
  repository: string;
  branch: string;
  commitHash: string;
  author: string;
  title: string;
  description: string;
  remediation: string;
  detectedAt: string;
  status: 'OPEN' | 'RESOLVED' | 'SUPPRESSED';
}

export interface ScopedApiKey {
  id: string;
  key: string;
  name: string;
  tenantId: string;
  isActive: boolean;
  createdAt: string;
}

export interface VerifiedAuditRecord {
  id: string;
  action: string;
  actor: string;
  details: string;
  previousHash: string;
  hash: string;
  createdAt: string;
  isValidChain: boolean;
}

export interface ThreatHuntTemplate {
  id: string;
  name: string;
  category: string;
  mitreTactic: string;
  mitreTechnique: string;
  hypothesis: string;
  filter: {
    category?: string;
    eventType?: string;
    outcome?: string;
    severity?: string;
    minBytes?: number;
  };
}

export interface ThreatHuntResult {
  queryId: string;
  executedAt: string;
  executionDurationMs: number;
  totalEventsMatched: number;
  uniqueEntities: string[];
  matchedEvents: any[];
}

export interface SystemDiagnostics {
  status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
  integrityScore: number;
  uptimeSeconds: number;
  memoryHeapMb: number;
  systemLoadAvg: number[];
  pipelineMetrics: {
    eventsPerSecond: number;
    detectionP99LatencyMs: number;
    queueLagMs: number;
    databaseResponseTimeMs: number;
    activeWebSocketClients: number;
    totalEventsStored: number;
    totalIncidentsCorrelated: number;
  };
  componentHealth: {
    name: string;
    status: 'HEALTHY' | 'WARNING' | 'FAILED';
    latencyMs: number;
    message: string;
  }[];
}

export interface CloudResourcePosture {
  id: string;
  provider: 'AWS' | 'Azure' | 'GCP' | 'Kubernetes';
  resourceType: string;
  resourceId: string;
  region: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  remediation: string;
  status: 'NON_COMPLIANT' | 'COMPLIANT' | 'REMEDIATING';
  lastEvaluatedAt: string;
}

export interface MalwareSandboxAnalysis {
  analysisId: string;
  sampleName: string;
  fileHashSha256: string;
  fileSizeBytes: number;
  verdict: 'MALICIOUS' | 'SUSPICIOUS' | 'CLEAN';
  threatScore: number;
  malwareFamily: string;
  detonationDurationMs: number;
  analyzedAt: string;
  mitreTactics: string[];
  processTree: {
    pid: number;
    parentPid: number;
    processName: string;
    commandLine: string;
    integrityLevel: string;
  }[];
  interceptedApiCalls: {
    apiName: string;
    dll: string;
    category: string;
    arguments: string;
    threatWeight: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  }[];
  networkCallbacks: {
    destinationIp: string;
    destinationPort: number;
    protocol: string;
    domain?: string;
    bytesSent: number;
  }[];
  droppedFiles: {
    filePath: string;
    sha256: string;
    sizeBytes: number;
  }[];
}

export interface ManagedIdentity {
  id: string;
  username: string;
  type: 'HUMAN_USER' | 'SERVICE_ACCOUNT' | 'CLOUD_IAM_ROLE' | 'K8S_WORKLOAD';
  role: 'GlobalAdmin' | 'DevOpsAdmin' | 'SecurityAnalyst' | 'StandardUser' | 'AutomatedService';
  mfaEnabled: boolean;
  riskScore: number;
  status: 'ACTIVE' | 'CONTAINED' | 'FROZEN' | 'SUSPICIOUS';
  activeSessions: number;
  lastLoginIp: string;
  lastLoginAt: string;
  riskFactors: string[];
}

export interface IdentityStressTestResult {
  testId: string;
  scenarioName: string;
  executedAt: string;
  targetIdentity: string;
  eventsInjected: number;
  detectionTriggered: boolean;
  mitreTechnique: string;
  responseLatencyMs: number;
}

export interface ComplianceControl {
  id: string;
  controlCode: string;
  title: string;
  category: string;
  status: 'PASSED' | 'WARNING' | 'FAILED';
  description: string;
  evidencedBy: string;
  lastAuditedAt: string;
}

export interface ComplianceFramework {
  id: string;
  name: string;
  version: string;
  overallScore: number;
  controlsPassed: number;
  totalControls: number;
  description: string;
  controls: ComplianceControl[];
}

export interface D3FENDCountermeasure {
  id: string;
  d3fendCode: string;
  technique: string;
  category: 'Model' | 'Detect' | 'Isolate' | 'Deceive' | 'Evict' | 'Protect';
  countersMitreAttack: string;
  implementationStatus: 'ACTIVE_ENFORCED' | 'RECOMMENDED' | 'PARTIALLY_DEPLOYED';
  description: string;
}

export interface DeadLetterEvent {
  id: string;
  failedAt: string;
  errorReason: string;
  rawPayload: string;
  sourceIp: string;
  sourceService: string;
  retryCount: number;
  status: 'QUARANTINED' | 'REPROCESSED' | 'DISCARDED';
}

// 6 Core SIEM Machine Types
export interface LogParserRule {
  id: string;
  name: string;
  sourceType: 'syslog' | 'windows_evtx' | 'cloudtrail' | 'okta' | 'nginx_apache' | 'custom_regex';
  description: string;
  sampleInput: string;
  fieldMappings: Record<string, string>;
}

export interface ParseResult {
  success: boolean;
  normalizedEvent?: {
    category: string;
    eventType: string;
    severity: string;
    outcome: string;
    sourceService: string;
    sourceIp?: string;
    destinationIp?: string;
    userId?: string;
    username?: string;
    action?: string;
    metadata: Record<string, any>;
  };
  error?: string;
}

export interface ThreatIndicator {
  id: string;
  indicatorType: 'ip' | 'domain' | 'sha256' | 'url';
  value: string;
  threatActor?: string;
  malwareFamily?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  confidence: number;
  sourceFeed: string;
  description: string;
  tags: string[];
  lastObserved: string;
}

export interface ThreatMatchResult {
  isMatch: boolean;
  indicator?: ThreatIndicator;
  enrichment?: {
    country: string;
    asn: string;
    reverseDns?: string;
    abuseConfidenceScore: number;
    mitreTechnique: string;
  };
}

export interface KqlQueryResult {
  query: string;
  executionDurationMs: number;
  totalRecords: number;
  isAggregated: boolean;
  records: any[];
  histogram: {
    timeBucket: string;
    count: number;
  }[];
  discoveredFields: {
    name: string;
    type: string;
    distinctCount: number;
    sampleValues: string[];
  }[];
}

export interface UebaEntityProfile {
  id: string;
  entityName: string;
  entityType: 'user' | 'host' | 'service_account';
  department: string;
  baseline: {
    avgDailyLogins: number;
    stdDevDailyLogins: number;
    normalWorkingHours: string;
    avgDailyEgressMb: number;
    stdDevDailyEgressMb: number;
    typicalLocations: string[];
  };
  observedCurrent: {
    loginsToday: number;
    egressMbToday: number;
    lastActiveHour: number;
    currentLocation: string;
  };
  zScore: {
    loginZScore: number;
    egressZScore: number;
    timeZScore: number;
    compositeAnomalyScore: number;
  };
  anomalyFlag: boolean;
  anomalyReason?: string;
  riskTier: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'NORMAL';
}

export interface StorageTierStatus {
  tierName: 'HOT' | 'WARM' | 'COLD_ARCHIVE';
  storageEngine: string;
  retentionWindowDays: number;
  totalEventsStored: number;
  totalSizeBytesMb: number;
  compressionRatio: string;
  status: 'ACTIVE' | 'ARCHIVING' | 'SEALED';
}

export interface RetentionPolicy {
  id: string;
  name: string;
  regulatoryStandard: 'PCI_DSS' | 'HIPAA' | 'SOC_2' | 'GDPR' | 'CUSTOM';
  minimumRetentionDays: number;
  autoArchiveToS3: boolean;
  tamperProofSealing: boolean;
  lastRunTimestamp: string;
  complianceCertified: boolean;
}

// --- Next-Gen Differentiators ---

export interface SigmaRule {
  id: string;
  title: string;
  status: string;
  description: string;
  author?: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  rawYaml: string;
  compiledKql: string;
  isDeployed: boolean;
  deployedRuleId?: string;
}

export interface SigmaCompileResult {
  success: boolean;
  ruleId: string;
  title: string;
  compiledKql: string;
  level: string;
  mitreTags: string[];
  syntaxErrors: string[];
}

export interface BasAttackTest {
  id: string;
  name: string;
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  severity: 'critical' | 'high' | 'medium';
  platform: string;
  description: string;
  expectedRuleId: string;
  lastRunAt?: string;
  lastStatus?: 'PASSED' | 'FAILED' | 'BLOCKED';
  validationLatencyMs?: number;
}

export interface BasExecutionResult {
  testId: string;
  name: string;
  techniqueId: string;
  executedAt: string;
  success: boolean;
  status: string;
  detectionTriggered: boolean;
  ruleMatched: string;
  validationLatencyMs: number;
  summary: string;
}

export interface BlastRadiusNode {
  id: string;
  label: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  details: string;
}

export interface BlastRadiusEdge {
  from: string;
  to: string;
  relationship: string;
}

export interface BlastRadiusResult {
  entityKey: string;
  analysisTimestamp: string;
  blastSeverityIndex: number;
  estimatedExposureUsd: number;
  totalReachableAssets: number;
  nodes: BlastRadiusNode[];
  edges: BlastRadiusEdge[];
  containmentActions: { action: string; priority: string }[];
}

export interface RuleNoiseProfile {
  ruleId: string;
  ruleName: string;
  totalFirings: number;
  escalatedCount: number;
  dismissedCount: number;
  falsePositiveRate: number;
  currentThreshold: number;
  recommendedThreshold: number;
  status: 'NOISY' | 'HEALTHY' | 'CRITICAL_COVERAGE';
  suppressionRecommendation: string;
}

