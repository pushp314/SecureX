"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blastRadiusEngine = exports.BlastRadiusEngine = void 0;
const client_1 = require("../../db/client");
// Simulated enterprise infrastructure graph
const INFRASTRUCTURE_GRAPH = {
    '198.51.100.77': {
        nodes: [
            { id: 'src-ip', label: '198.51.100.77', type: 'identity', severity: 'critical', details: 'APT29 C2 Proxy — Confirmed Malicious Adversary Infrastructure' },
            { id: 'iam-admin', label: 'GlobalAdmin IAM Role', type: 'iam_role', severity: 'critical', details: 'arn:aws:iam::123456789012:role/GlobalAdmin — Unrestricted AWS Account Access' },
            { id: 'iam-devops', label: 'DevOpsDeployerRole', type: 'iam_role', severity: 'high', details: 'arn:aws:iam::123456789012:role/DevOpsDeployer — ECS/EKS Cluster Admin' },
            { id: 'vpc-prod', label: 'VPC us-east-1 (Production)', type: 'vpc', severity: 'critical', details: 'vpc-0a1b2c3d4e — 4 subnets, 12 running EC2 instances, 3 RDS clusters' },
            { id: 'vpc-staging', label: 'VPC eu-west-1 (Staging)', type: 'vpc', severity: 'medium', details: 'vpc-5f6g7h8i — 2 subnets, 4 EC2 instances' },
            { id: 'db-primary', label: 'PostgreSQL Primary (RDS)', type: 'database', severity: 'critical', details: 'securex-prod-db.cluster-abc.us-east-1.rds.amazonaws.com — 2.4M customer records' },
            { id: 'db-finance', label: 'Finance Ledger DB', type: 'database', severity: 'critical', details: 'finance-ledger.internal:5432 — SOX-regulated financial transaction data' },
            { id: 's3-pii', label: 's3://customer-pii-vault-1', type: 's3_bucket', severity: 'critical', details: '1.8 TB encrypted PII — SSN, payment cards, health records' },
            { id: 's3-logs', label: 's3://securex-audit-logs', type: 's3_bucket', severity: 'high', details: '420 GB CloudTrail & application audit logs' },
            { id: 'token-oauth', label: 'OAuth2 Refresh Token Pool', type: 'token', severity: 'critical', details: '847 active user sessions — JWT RS256 signed tokens' },
            { id: 'key-stripe', label: 'Stripe Live API Key', type: 'api_key', severity: 'critical', details: 'sk_live_51Mz... — Production payment processing credentials' },
            { id: 'ec2-gateway', label: 'API Gateway EC2 Fleet', type: 'compute', severity: 'high', details: '4x c5.2xlarge instances behind Application Load Balancer' },
        ],
        edges: [
            { from: 'src-ip', to: 'iam-admin', relationship: 'Escalated via stolen credentials (T1098)' },
            { from: 'iam-admin', to: 'vpc-prod', relationship: 'Full network access (ec2:*)' },
            { from: 'iam-admin', to: 'vpc-staging', relationship: 'Cross-region VPC peering access' },
            { from: 'iam-admin', to: 'db-primary', relationship: 'rds:* unrestricted database admin' },
            { from: 'iam-admin', to: 'db-finance', relationship: 'Direct TCP/5432 access via VPC' },
            { from: 'iam-admin', to: 's3-pii', relationship: 's3:GetObject on all PII buckets' },
            { from: 'iam-admin', to: 's3-logs', relationship: 's3:DeleteObject (audit log tampering risk)' },
            { from: 'iam-admin', to: 'token-oauth', relationship: 'cognito:AdminInitiateAuth (session forge)' },
            { from: 'iam-admin', to: 'key-stripe', relationship: 'secretsmanager:GetSecretValue' },
            { from: 'iam-devops', to: 'ec2-gateway', relationship: 'ECS task execution & container deploy' },
            { from: 'vpc-prod', to: 'db-primary', relationship: 'Security group sg-db allows 5432 inbound' },
            { from: 'vpc-prod', to: 'ec2-gateway', relationship: 'Internal ALB target group' },
        ],
    },
    '10.0.4.112': {
        nodes: [
            { id: 'src-host', label: '10.0.4.112 (Compromised Host)', type: 'identity', severity: 'critical', details: 'LockBit 3.0 affiliate — Active ransomware encryption detected' },
            { id: 'smb-shares', label: 'SMB Finance Share (\\\\fs01\\finance)', type: 'database', severity: 'critical', details: '450 GB of encrypted financial spreadsheets & invoices' },
            { id: 'ad-domain', label: 'Active Directory Domain Controller', type: 'compute', severity: 'critical', details: 'dc01.corp.internal — NTDS.dit credential store at risk' },
            { id: 'backup-server', label: 'Veeam Backup Server', type: 'compute', severity: 'critical', details: 'backup01.corp.internal — Shadow copy deletion risk' },
            { id: 'vpn-gateway', label: 'Corporate VPN Gateway', type: 'vpc', severity: 'high', details: 'vpn.corp.internal — Lateral movement to remote workforce' },
        ],
        edges: [
            { from: 'src-host', to: 'smb-shares', relationship: 'SMB lateral movement (T1021.002)' },
            { from: 'src-host', to: 'ad-domain', relationship: 'Kerberoasting / DCSync risk (T1558)' },
            { from: 'src-host', to: 'backup-server', relationship: 'Shadow copy deletion (T1490)' },
            { from: 'ad-domain', to: 'vpn-gateway', relationship: 'Domain-joined VPN certificate auth' },
        ],
    },
    '203.0.113.45': {
        nodes: [
            { id: 'attacker-ip', label: '203.0.113.45', type: 'identity', severity: 'critical', details: 'Lazarus Group — Web application exploit & token hijacking' },
            { id: 'web-app', label: 'Checkout API Service', type: 'compute', severity: 'high', details: '/api/v1/checkout — SQL injection entry point' },
            { id: 'session-store', label: 'Redis Session Store', type: 'database', severity: 'high', details: 'redis://session-cache:6379 — 1,247 active user sessions' },
            { id: 'payment-db', label: 'Payment Transaction DB', type: 'database', severity: 'critical', details: 'PCI-DSS scoped — Cardholder data environment' },
        ],
        edges: [
            { from: 'attacker-ip', to: 'web-app', relationship: 'SQL injection probe (T1190)' },
            { from: 'web-app', to: 'session-store', relationship: 'Stolen session token replay (T1528)' },
            { from: 'web-app', to: 'payment-db', relationship: 'ORM query injection to payment tables' },
        ],
    },
};
class BlastRadiusEngine {
    async analyzeEntity(entityKey) {
        const cleanKey = entityKey.replace('ip:', '').replace('user:', '');
        // Check PostgreSQL for related incidents
        const incidents = await client_1.prisma.incident.findMany({
            where: { entityKey: { contains: cleanKey } },
            include: { alerts: true, evidences: true },
        });
        // Look up infrastructure graph
        const graph = INFRASTRUCTURE_GRAPH[cleanKey];
        if (!graph) {
            // Generate minimal graph for unknown entities
            return {
                entityKey,
                analysisTimestamp: new Date().toISOString(),
                blastSeverityIndex: 15,
                estimatedExposureUsd: 5000,
                totalReachableAssets: 1,
                nodes: [
                    { id: 'unknown', label: cleanKey, type: 'identity', severity: 'low', details: 'No direct infrastructure linkage found in asset inventory.' },
                ],
                edges: [],
                containmentActions: [
                    { action: `Monitor ${cleanKey} for additional suspicious activity`, priority: 'STANDARD' },
                ],
            };
        }
        // Calculate Blast Severity Index
        const criticalNodes = graph.nodes.filter((n) => n.severity === 'critical').length;
        const totalNodes = graph.nodes.length;
        const bsi = Math.min(98, Math.round((criticalNodes / totalNodes) * 100) + incidents.length * 5);
        // Estimate financial exposure
        const exposureMultiplier = {
            database: 2500000,
            s3_bucket: 1800000,
            api_key: 500000,
            token: 250000,
            iam_role: 1000000,
            vpc: 750000,
            compute: 200000,
            identity: 0,
        };
        const estimatedExposureUsd = graph.nodes.reduce((acc, n) => acc + (exposureMultiplier[n.type] || 50000), 0);
        // Generate containment actions
        const containmentActions = [
            { action: `Enforce Edge WAF IP block on ${cleanKey} across all ingress zones`, priority: 'IMMEDIATE' },
            { action: `Revoke all IAM session tokens and rotate compromised access keys`, priority: 'IMMEDIATE' },
            { action: `Isolate affected VPC subnets and disable cross-region peering`, priority: 'HIGH' },
            { action: `Enable S3 Object Lock (WORM) on PII buckets to prevent deletion`, priority: 'HIGH' },
            { action: `Force password reset for all identities authenticated from ${cleanKey}`, priority: 'HIGH' },
            { action: `Snapshot and preserve forensic disk images of affected EC2 instances`, priority: 'STANDARD' },
        ];
        return {
            entityKey,
            analysisTimestamp: new Date().toISOString(),
            blastSeverityIndex: bsi,
            estimatedExposureUsd,
            totalReachableAssets: totalNodes,
            nodes: graph.nodes,
            edges: graph.edges,
            containmentActions,
        };
    }
    async lockPerimeter(entityKey) {
        const cleanKey = entityKey.replace('ip:', '').replace('user:', '');
        const actionsExecuted = [
            `WAF DROP rule deployed for ${cleanKey} on edge proxies (Cloudflare + AWS WAF)`,
            `All active OAuth2/JWT sessions revoked for compromised identity`,
            `VPC Network ACL updated — DENY ALL from ${cleanKey}`,
            `S3 Object Lock enabled on sensitive PII buckets`,
            `Incident escalation notification dispatched to SOC Lead`,
        ];
        return {
            success: true,
            message: `Blast perimeter locked for ${entityKey}. ${actionsExecuted.length} containment actions executed.`,
            actionsExecuted,
        };
    }
}
exports.BlastRadiusEngine = BlastRadiusEngine;
exports.blastRadiusEngine = new BlastRadiusEngine();
