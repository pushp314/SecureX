"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDevSecOpsEvents = getDevSecOpsEvents;
exports.recordDevSecOpsEvent = recordDevSecOpsEvent;
exports.resolveDevSecOpsFinding = resolveDevSecOpsFinding;
exports.getDevSecOpsStats = getDevSecOpsStats;
const DEVSECOPS_EVENTS = [
    {
        id: 'dso-01',
        type: 'SECRET_LEAK',
        severity: 'critical',
        repository: 'securex-core/payment-gateway',
        branch: 'feature/stripe-v3',
        commitHash: '7b98a2f4',
        author: 'alex.developer@corp.internal',
        title: 'Live Stripe Secret API Key Committed to Git',
        description: 'Found unencrypted API secret `sk_live_51Mz...48a` hardcoded in `src/config/stripe.ts:14`.',
        remediation: 'Immediately revoke key in Stripe Dashboard, rotate credentials, and scrub commit with git-filter-repo.',
        detectedAt: new Date(Date.now() - 15 * 60000).toISOString(),
        status: 'OPEN',
    },
    {
        id: 'dso-02',
        type: 'CONTAINER_MISCONFIG',
        severity: 'high',
        repository: 'securex-core/auth-service',
        branch: 'main',
        commitHash: '3a1c9e82',
        author: 'ci-bot@corp.internal',
        title: 'Dockerfile Configured to Run as Root User',
        description: 'Container base image `node:18` lacks `USER node` non-root directive. Container breakout risk.',
        remediation: 'Add `USER node` directive before ENTRYPOINT in Dockerfile.',
        detectedAt: new Date(Date.now() - 45 * 60000).toISOString(),
        status: 'OPEN',
    },
    {
        id: 'dso-03',
        type: 'PIPELINE_BYPASS',
        severity: 'high',
        repository: 'securex-core/backend-api',
        branch: 'main',
        commitHash: 'e92f811a',
        author: 'lead-devops@corp.internal',
        title: 'Production Deployment Triggered Without Required Branch Protection Approval',
        description: 'Direct push to `main` triggered automatic Kubernetes roll-out without 2-person code review.',
        remediation: 'Enforce branch protection rules on `main` requiring minimum 2 code owners approvals.',
        detectedAt: new Date(Date.now() - 90 * 60000).toISOString(),
        status: 'OPEN',
    },
];
function getDevSecOpsEvents() {
    return DEVSECOPS_EVENTS;
}
function recordDevSecOpsEvent(event) {
    const completeEvent = {
        id: `dso-${Date.now().toString().slice(-4)}`,
        ...event,
        detectedAt: new Date().toISOString(),
        status: 'OPEN',
    };
    DEVSECOPS_EVENTS.unshift(completeEvent);
    return completeEvent;
}
function resolveDevSecOpsFinding(id, status) {
    const event = DEVSECOPS_EVENTS.find((e) => e.id === id);
    if (!event)
        throw new Error(`DevSecOps event not found: ${id}`);
    event.status = status;
    return event;
}
function getDevSecOpsStats() {
    const openCount = DEVSECOPS_EVENTS.filter((e) => e.status === 'OPEN').length;
    const criticalCount = DEVSECOPS_EVENTS.filter((e) => e.severity === 'critical' && e.status === 'OPEN').length;
    const secretsCount = DEVSECOPS_EVENTS.filter((e) => e.type === 'SECRET_LEAK' && e.status === 'OPEN').length;
    return {
        totalEvents: DEVSECOPS_EVENTS.length,
        openIssues: openCount,
        criticalIssues: criticalCount,
        secretsDetected: secretsCount,
    };
}
