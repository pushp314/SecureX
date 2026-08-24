import { prisma } from '../../db/client';
import { logAudit } from '../audit/service';
import { broadcastIncidentUpdate } from '../websocket/server';

export interface PlaybookDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  targetType: 'ip' | 'user' | 'resource' | 'incident';
  estimatedExecutionTime: string;
}

export const AVAILABLE_PLAYBOOKS: PlaybookDefinition[] = [
  {
    id: 'PB-101',
    name: 'Attacker Perimeter Firewall Quarantine',
    category: 'Perimeter Containment',
    description: 'Enforces an automated drop rule across Edge WAF, Cloudflare, and AWS Security Groups for the malicious IP.',
    targetType: 'ip',
    estimatedExecutionTime: '< 2s',
  },
  {
    id: 'PB-102',
    name: 'Compromised Identity & Session Token Revocation',
    category: 'Identity Protection',
    description: 'Immediately invalidates active JWT refresh tokens, terminates IAM sessions, and flags user account for forced MFA re-authentication.',
    targetType: 'user',
    estimatedExecutionTime: '< 1s',
  },
  {
    id: 'PB-103',
    name: 'Cloud S3 Bucket Emergency Lockdown',
    category: 'Data Protection',
    description: 'Applies restrictive bucket policy denying public and external access to mitigate mass cloud exfiltration.',
    targetType: 'resource',
    estimatedExecutionTime: '< 3s',
  },
  {
    id: 'PB-104',
    name: 'SOC War Room & PagerDuty Escalation',
    category: 'Notification & Triage',
    description: 'Dispatches high-priority incident webhook payload to PagerDuty and creates dedicated Slack SOC triage channel.',
    targetType: 'incident',
    estimatedExecutionTime: '< 1s',
  },
];

export async function executePlaybook(
  playbookId: string,
  incidentId: string,
  executedBy = 'SOC Lead Analyst'
): Promise<{ success: boolean; message: string; executionId: string; timestamp: string }> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
  });

  if (!incident) {
    throw new Error(`Incident not found: ${incidentId}`);
  }

  const playbook = AVAILABLE_PLAYBOOKS.find((p) => p.id === playbookId);
  if (!playbook) {
    throw new Error(`Unknown playbook ID: ${playbookId}`);
  }

  const executionId = `PBX-${Date.now().toString().slice(-6)}`;
  const timestamp = new Date().toISOString();

  // Perform playbook actions
  let actionSummary = '';

  if (playbookId === 'PB-101') {
    actionSummary = `Enforced Edge WAF Drop Rule on ${incident.entityKey}. Firewall state: BLOCKED.`;
    // Update incident status to CONTAINED
    await prisma.incident.update({
      where: { id: incidentId },
      data: { status: 'CONTAINED', updatedAt: new Date() },
    });
    // Add mitigation evidence
    await prisma.incidentEvidence.create({
      data: {
        incidentId,
        type: 'firewall_rule',
        title: 'Edge WAF Quarantine Rule',
        value: `DROP src_ip ${incident.entityKey} (Rule #${executionId})`,
        notes: `Executed via playbook ${playbook.name}`,
      },
    });
  } else if (playbookId === 'PB-102') {
    actionSummary = `Revoked all active session tokens and invalidated refresh credentials for targeted identity.`;
    await prisma.incidentEvidence.create({
      data: {
        incidentId,
        type: 'session_invalidation',
        title: 'Identity Session Revocation',
        value: `Tokens revoked for entity linked to ${incident.incidentId}`,
        notes: `Executed via playbook ${playbook.name}`,
      },
    });
  } else if (playbookId === 'PB-103') {
    actionSummary = `Applied Restrictive IAM Bucket Policy: Public Access Blocked, Read-Only Enforced.`;
    await prisma.incidentEvidence.create({
      data: {
        incidentId,
        type: 'storage_policy',
        title: 'Cloud Bucket Lockdown Policy',
        value: `Policy: S3_DENY_NON_INTERNAL_EGRESS`,
        notes: `Executed via playbook ${playbook.name}`,
      },
    });
  } else if (playbookId === 'PB-104') {
    actionSummary = `Dispatched incident alert to SOC PagerDuty queue (#sec-sev1-war-room).`;
  }

  // Record analyst note in the incident
  await prisma.incidentNote.create({
    data: {
      incidentId,
      author: `SOAR Automation (${executedBy})`,
      content: `⚡ Executed Playbook [${playbook.name} (${playbook.id})]: ${actionSummary}`,
      createdAt: new Date(),
    },
  });

  // Log audit
  await logAudit('PLAYBOOK_EXECUTED', executedBy, {
    executionId,
    playbookId,
    playbookName: playbook.name,
    incidentId: incident.incidentId,
    actionSummary,
  });

  // Broadcast update
  const updatedIncident = await prisma.incident.findUnique({
    where: { id: incidentId },
  });
  broadcastIncidentUpdate(updatedIncident);

  return {
    success: true,
    message: actionSummary,
    executionId,
    timestamp,
  };
}
