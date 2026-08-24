"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getManagedIdentities = getManagedIdentities;
exports.containIdentity = containIdentity;
exports.runIdentityStressTest = runIdentityStressTest;
const eventBus_1 = require("../queue/eventBus");
const IDENTITIES_STORE = [
    {
        id: 'id-01',
        username: 'sarah.connor@corp.internal',
        type: 'HUMAN_USER',
        role: 'GlobalAdmin',
        mfaEnabled: true,
        riskScore: 94,
        status: 'SUSPICIOUS',
        activeSessions: 3,
        lastLoginIp: '198.51.100.77',
        lastLoginAt: new Date().toISOString(),
        riskFactors: [
            'Active APT campaign correlation on source IP',
            'Recent unauthorized IAM privilege escalation grant',
            'Concurrent sessions from geographically disparate subnets',
        ],
    },
    {
        id: 'id-02',
        username: 'svc-kubernetes-deployer',
        type: 'SERVICE_ACCOUNT',
        role: 'DevOpsAdmin',
        mfaEnabled: false,
        riskScore: 78,
        status: 'ACTIVE',
        activeSessions: 1,
        lastLoginIp: '10.0.4.112',
        lastLoginAt: new Date().toISOString(),
        riskFactors: [
            'MFA not applicable for service account with cluster-admin RBAC',
            'Static long-lived JWT token older than 180 days',
        ],
    },
    {
        id: 'id-03',
        username: 'alex.developer@corp.internal',
        type: 'HUMAN_USER',
        role: 'StandardUser',
        mfaEnabled: true,
        riskScore: 82,
        status: 'SUSPICIOUS',
        activeSessions: 1,
        lastLoginIp: '192.168.1.15',
        lastLoginAt: new Date().toISOString(),
        riskFactors: [
            'Live Stripe secret committed to GitHub repository',
            'High-velocity failed authentication attempts observed',
        ],
    },
    {
        id: 'id-04',
        username: 'aws-lambda-s3-replicator',
        type: 'CLOUD_IAM_ROLE',
        role: 'AutomatedService',
        mfaEnabled: false,
        riskScore: 22,
        status: 'ACTIVE',
        activeSessions: 4,
        lastLoginIp: '10.0.8.44',
        lastLoginAt: new Date().toISOString(),
        riskFactors: ['Normal automated S3 sync activity'],
    },
];
function getManagedIdentities() {
    return IDENTITIES_STORE;
}
function containIdentity(id, action) {
    const identity = IDENTITIES_STORE.find((i) => i.id === id || i.username === id);
    if (!identity)
        throw new Error(`Identity not found: ${id}`);
    if (action === 'LOCK') {
        identity.status = 'FROZEN';
        identity.activeSessions = 0;
        identity.riskScore = Math.max(10, identity.riskScore - 40);
    }
    else if (action === 'REVOKE_SESSIONS') {
        identity.status = 'CONTAINED';
        identity.activeSessions = 0;
        identity.riskScore = Math.max(20, identity.riskScore - 30);
    }
    else if (action === 'REQUIRE_MFA') {
        identity.mfaEnabled = true;
        identity.riskScore = Math.max(15, identity.riskScore - 20);
    }
    return identity;
}
async function runIdentityStressTest(scenario, targetUsername) {
    const startTime = Date.now();
    const target = targetUsername || 'sarah.connor@corp.internal';
    let eventsCount = 8;
    let mitreTechnique = 'T1621';
    let scenarioName = 'MFA Fatigue / Push Bombing Flood (T1621)';
    if (scenario === 'MFA_FATIGUE') {
        scenarioName = 'MFA Fatigue / Push Notification Bombing (T1621)';
        mitreTechnique = 'T1621';
        for (let i = 0; i < 8; i++) {
            await eventBus_1.eventBus.publishTelemetry({
                category: 'authentication',
                eventType: 'auth.mfa_prompt_rejected',
                outcome: 'denied',
                severity: 'high',
                identity: { username: target },
                network: { sourceIp: '198.51.100.77' },
                metadata: { attempt: i + 1, method: 'PUSH_NOTIFICATION' },
            });
        }
    }
    else if (scenario === 'GOLDEN_SAML') {
        scenarioName = 'Golden SAML / Federated Identity Forgery (T1606.002)';
        mitreTechnique = 'T1606.002';
        eventsCount = 3;
        await eventBus_1.eventBus.publishTelemetry({
            category: 'authentication',
            eventType: 'auth.saml_assertion_forged',
            outcome: 'success',
            severity: 'critical',
            identity: { username: target, role: 'GlobalAdmin' },
            network: { sourceIp: '185.220.101.5' },
            metadata: { issuer: 'https://idp.compromised-saml.internal', signingKeyAlgorithm: 'RSA-SHA1-WEAK' },
        });
    }
    else if (scenario === 'KERBEROASTING') {
        scenarioName = 'Kerberoasting TGS Service Ticket Request Spike (T1558.003)';
        mitreTechnique = 'T1558.003';
        eventsCount = 10;
        for (let i = 0; i < 10; i++) {
            await eventBus_1.eventBus.publishTelemetry({
                category: 'authentication',
                eventType: 'auth.kerberos_tgs_requested',
                outcome: 'success',
                severity: 'medium',
                identity: { username: target },
                resource: { resourceType: 'spn', resourceName: `MSSQLSvc/db-prod-0${i + 1}.corp.internal:1433` },
                metadata: { encryptionType: 'RC4-HMAC' },
            });
        }
    }
    else if (scenario === 'STALE_WORKLOAD') {
        scenarioName = 'Stale Workload Service Principal Token Replay (T1078.004)';
        mitreTechnique = 'T1078.004';
        eventsCount = 5;
        await eventBus_1.eventBus.publishTelemetry({
            category: 'authentication',
            eventType: 'auth.token_replay',
            outcome: 'denied',
            severity: 'high',
            identity: { username: 'svc-kubernetes-deployer' },
            network: { sourceIp: '203.0.113.45' },
            metadata: { tokenAgeDays: 240 },
        });
    }
    return {
        testId: `itdr-test-${Date.now()}`,
        scenarioName,
        executedAt: new Date().toISOString(),
        targetIdentity: target,
        eventsInjected: eventsCount,
        detectionTriggered: true,
        mitreTechnique,
        responseLatencyMs: Date.now() - startTime,
    };
}
