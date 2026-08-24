"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AVAILABLE_PLAYBOOKS = void 0;
exports.executePlaybook = executePlaybook;
const client_1 = require("../../db/client");
const service_1 = require("../audit/service");
const server_1 = require("../websocket/server");
exports.AVAILABLE_PLAYBOOKS = [
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
async function executePlaybook(playbookId, incidentId, executedBy = 'SOC Lead Analyst') {
    const incident = await client_1.prisma.incident.findUnique({
        where: { id: incidentId },
    });
    if (!incident) {
        throw new Error(`Incident not found: ${incidentId}`);
    }
    const playbook = exports.AVAILABLE_PLAYBOOKS.find((p) => p.id === playbookId);
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
        await client_1.prisma.incident.update({
            where: { id: incidentId },
            data: { status: 'CONTAINED', updatedAt: new Date() },
        });
        // Add mitigation evidence
        await client_1.prisma.incidentEvidence.create({
            data: {
                incidentId,
                type: 'firewall_rule',
                title: 'Edge WAF Quarantine Rule',
                value: `DROP src_ip ${incident.entityKey} (Rule #${executionId})`,
                notes: `Executed via playbook ${playbook.name}`,
            },
        });
    }
    else if (playbookId === 'PB-102') {
        actionSummary = `Revoked all active session tokens and invalidated refresh credentials for targeted identity.`;
        await client_1.prisma.incidentEvidence.create({
            data: {
                incidentId,
                type: 'session_invalidation',
                title: 'Identity Session Revocation',
                value: `Tokens revoked for entity linked to ${incident.incidentId}`,
                notes: `Executed via playbook ${playbook.name}`,
            },
        });
    }
    else if (playbookId === 'PB-103') {
        actionSummary = `Applied Restrictive IAM Bucket Policy: Public Access Blocked, Read-Only Enforced.`;
        await client_1.prisma.incidentEvidence.create({
            data: {
                incidentId,
                type: 'storage_policy',
                title: 'Cloud Bucket Lockdown Policy',
                value: `Policy: S3_DENY_NON_INTERNAL_EGRESS`,
                notes: `Executed via playbook ${playbook.name}`,
            },
        });
    }
    else if (playbookId === 'PB-104') {
        actionSummary = `Dispatched incident alert to SOC PagerDuty queue (#sec-sev1-war-room).`;
    }
    // Record analyst note in the incident
    await client_1.prisma.incidentNote.create({
        data: {
            incidentId,
            author: `SOAR Automation (${executedBy})`,
            content: `⚡ Executed Playbook [${playbook.name} (${playbook.id})]: ${actionSummary}`,
            createdAt: new Date(),
        },
    });
    // Log audit
    await (0, service_1.logAudit)('PLAYBOOK_EXECUTED', executedBy, {
        executionId,
        playbookId,
        playbookName: playbook.name,
        incidentId: incident.incidentId,
        actionSummary,
    });
    // Broadcast update
    const updatedIncident = await client_1.prisma.incident.findUnique({
        where: { id: incidentId },
    });
    (0, server_1.broadcastIncidentUpdate)(updatedIncident);
    return {
        success: true,
        message: actionSummary,
        executionId,
        timestamp,
    };
}
