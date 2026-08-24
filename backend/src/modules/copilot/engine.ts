import { prisma } from '../../db/client';
import { reconstructIncidentTimeline } from '../timeline/service';
import { lookupThreatIntelligence } from '../threatintel/service';

export interface CopilotAnalysisResult {
  incidentId: string;
  generatedAt: string;
  confidenceScore: number; // 0 - 100
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

export async function analyzeIncidentWithCopilot(incidentId: string): Promise<CopilotAnalysisResult> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      alerts: true,
      evidences: true,
      notes: true,
    },
  });

  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }

  const timeline = await reconstructIncidentTimeline(incidentId);
  const threatIntel = lookupThreatIntelligence(incident.entityKey.replace('ip:', '').replace('user:', ''));

  const tactics = incident.mitreTactics.split(',').map((t) => t.trim());
  const alertCount = incident.alerts.length;

  // Compute confidence score based on signal convergence
  let confidenceScore = 65;
  if (alertCount >= 3) confidenceScore += 20;
  if (threatIntel.isMalicious) confidenceScore += 10;
  if (tactics.length >= 3) confidenceScore += 5;
  confidenceScore = Math.min(confidenceScore, 98);

  // Derive entry vector & adversary intent
  let entryVector = 'Unauthenticated Remote Exploitation';
  if (tactics.includes('Credential Access')) {
    entryVector = 'High-velocity Credential Stuffing / Password Guessing (T1110)';
  } else if (tactics.includes('Initial Access')) {
    entryVector = 'Web Application Exploit & API Injection (T1190)';
  }

  let adversaryIntent = 'Data Exfiltration and Asset Compromise';
  if (tactics.includes('Impact')) {
    adversaryIntent = 'System Disruption and Cryptographic Ransomware Extortion';
  } else if (tactics.includes('Privilege Escalation')) {
    adversaryIntent = 'Administrative IAM Takeover and Bulk Cloud Data Theft';
  }

  // Citations
  const evidenceCitations = [
    {
      fact: `Attack originates from ${incident.entityKey}`,
      sourceEvidence: `Threat Intel: ${threatIntel.reputationSummary}`,
      confidence: 'HIGH' as const,
    },
    ...incident.alerts.map((a) => ({
      fact: `Adversary triggered detection rule: ${a.ruleName}`,
      sourceEvidence: `Alert ID: ${a.alertId} (${a.mitreTactic} / ${a.mitreTechnique})`,
      confidence: 'HIGH' as const,
    })),
    ...incident.evidences.slice(0, 3).map((e) => ({
      fact: `Compromised asset identified: ${e.title}`,
      sourceEvidence: `Evidence Artifact: ${e.value}`,
      confidence: 'HIGH' as const,
    })),
  ];

  // Containment Checklist
  const containmentChecklist = [
    {
      step: `Enforce Edge WAF Drop Rule on ${incident.entityKey} to isolate adversary network ingress.`,
      priority: 'IMMEDIATE' as const,
      suggestedPlaybookId: 'PB-101',
    },
    {
      step: 'Revoke active OAuth & JWT refresh sessions across all identities observed in attack chain.',
      priority: 'IMMEDIATE' as const,
      suggestedPlaybookId: 'PB-102',
    },
    {
      step: 'Audit IAM role attachments for unauthorized administrator privilege grants.',
      priority: 'HIGH' as const,
      suggestedPlaybookId: 'PB-103',
    },
    {
      step: 'Inspect object egress logs on sensitive cloud storage buckets to verify blast radius.',
      priority: 'STANDARD' as const,
    },
  ];

  // Hunting Queries
  const huntingQueries = [
    {
      name: 'Search for Subnet Lateral Movement',
      query: `SELECT * FROM telemetry WHERE source_ip = '${incident.entityKey.replace('ip:', '')}' AND category = 'network_traffic'`,
      rationale: 'Identifies internal scanning probes to other RFC1918 database hosts.',
    },
    {
      name: 'Audit Token Replay Attempts',
      query: `SELECT * FROM telemetry WHERE category = 'authentication' AND outcome = 'failure' AND timestamp >= NOW() - INTERVAL '6 HOURS'`,
      rationale: 'Detects secondary credentials compromised during the same session.',
    },
  ];

  return {
    incidentId: incident.incidentId,
    generatedAt: new Date().toISOString(),
    confidenceScore,
    executiveNarrative: `Automated analysis confirms an active multi-stage attack on ${incident.entityKey}. The adversary transitioned from ${entryVector} through ${tactics.join(' -> ')}, with an ultimate objective of ${adversaryIntent}. Threat intelligence attributes this activity to ${threatIntel.threatActor || 'an automated threat cluster'} with a confidence score of ${confidenceScore}%.`,
    attackHypothesis: {
      entryVector,
      adversaryIntent,
      estimatedDwellTime: '< 15 minutes (Rapid automated progression)',
      killChainProgression: tactics,
    },
    evidenceCitations,
    containmentChecklist,
    huntingQueries,
  };
}
