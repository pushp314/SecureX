import { prisma } from '../../db/client';

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

export const HUNT_TEMPLATES: ThreatHuntTemplate[] = [
  {
    id: 'hunt-01',
    name: 'Shadow Administrator IAM Role Escalation Hunter',
    category: 'privilege_change',
    mitreTactic: 'Privilege Escalation',
    mitreTechnique: 'T1098',
    hypothesis: 'Adversaries attempting to assign administrative privileges to compromised standard user accounts.',
    filter: {
      category: 'privilege_change',
      eventType: 'iam.role_escalation',
    },
  },
  {
    id: 'hunt-02',
    name: 'Mass Egress Cloud Storage Exfiltration Hunter',
    category: 'data_access',
    mitreTactic: 'Exfiltration',
    mitreTechnique: 'T1567',
    hypothesis: 'Anomalous bulk downloads of sensitive PII vaults exceeding 100MB in single operations.',
    filter: {
      category: 'data_access',
      eventType: 'data.s3_bulk_download',
    },
  },
  {
    id: 'hunt-03',
    name: 'High-Velocity Authentication Failure / Brute Force Hunter',
    category: 'authentication',
    mitreTactic: 'Credential Access',
    mitreTechnique: 'T1110',
    hypothesis: 'Multiple rapid login failures from the same source IP attempting credential stuffing.',
    filter: {
      category: 'authentication',
      eventType: 'auth.login_failed',
      outcome: 'failure',
    },
  },
  {
    id: 'hunt-04',
    name: 'Web Application Exploit & SQL Injection Probe Hunter',
    category: 'api_activity',
    mitreTactic: 'Initial Access',
    mitreTechnique: 'T1190',
    hypothesis: 'Probing of web APIs with SQL injection or command injection payloads.',
    filter: {
      category: 'api_activity',
      eventType: 'api.exploit_probe',
    },
  },
];

export async function executeThreatHunt(filter: ThreatHuntTemplate['filter']): Promise<ThreatHuntResult> {
  const startTime = Date.now();

  const whereClause: any = {};
  if (filter.category) whereClause.category = filter.category;
  if (filter.eventType) whereClause.eventType = filter.eventType;
  if (filter.outcome) whereClause.outcome = filter.outcome;
  if (filter.severity) whereClause.severity = filter.severity;

  const events = await prisma.telemetryEvent.findMany({
    where: whereClause,
    orderBy: { timestamp: 'desc' },
    take: 100,
  });

  const entities = new Set<string>();
  for (const e of events) {
    if (e.sourceIp) entities.add(`ip:${e.sourceIp}`);
    if (e.username) entities.add(`user:${e.username}`);
  }

  return {
    queryId: `hunt-exec-${Date.now()}`,
    executedAt: new Date().toISOString(),
    executionDurationMs: Date.now() - startTime,
    totalEventsMatched: events.length,
    uniqueEntities: Array.from(entities),
    matchedEvents: events,
  };
}

export async function convertHuntToDetectionRule(data: {
  name: string;
  category: string;
  mitreTactic: string;
  mitreTechnique: string;
  filter: ThreatHuntTemplate['filter'];
  thresholdCount?: number;
  windowSeconds?: number;
}) {
  const ruleId = `SECX-R-HUNT-${Date.now().toString().slice(-4)}`;
  const createdRule = await prisma.detectionRule.create({
    data: {
      ruleId,
      name: data.name,
      description: `Automated detection rule promoted from Threat Hunt workbench: ${data.name}`,
      category: data.category,
      severity: 'high',
      ruleType: 'threshold',
      mitreTactic: data.mitreTactic,
      mitreTechnique: data.mitreTechnique,
      conditionJson: JSON.stringify({
        eventTypes: [data.filter.eventType || data.filter.category],
        groupBy: 'ip',
      }),
      windowSeconds: data.windowSeconds || 60,
      thresholdCount: data.thresholdCount || 3,
      isEnabled: true,
    },
  });

  return createdRule;
}
