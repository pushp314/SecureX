import { prisma } from './client';
import { config } from '../config/env';

async function seed() {
  console.log('[Seed] Seeding SecureX database...');

  // 1. Seed Default API Key
  await prisma.apiKey.upsert({
    where: { key: config.defaultApiKey },
    update: {},
    create: {
      key: config.defaultApiKey,
      name: 'Default Production Ingestion Key',
      tenantId: 'tenant-enterprise-01',
      isActive: true,
    },
  });
  console.log(`[Seed] Ingestion API Key active: ${config.defaultApiKey}`);

  // 2. Seed Default Detection Rules
  const defaultRules = [
    {
      ruleId: 'SECX-R-101',
      name: 'High-Velocity Authentication Failure (Brute Force)',
      description: 'Detects 5 or more failed login attempts on the same IP or user identity within a 60-second window.',
      category: 'authentication',
      severity: 'high',
      ruleType: 'threshold',
      mitreTactic: 'Credential Access',
      mitreTechnique: 'T1110.001',
      conditionJson: JSON.stringify({
        eventTypes: ['auth.login_failed'],
        groupBy: 'ip',
      }),
      windowSeconds: 60,
      thresholdCount: 5,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-102',
      name: 'Unauthorized Administrative IAM Privilege Escalation',
      description: 'Detects unauthorized role escalation or assignment of administrator rights.',
      category: 'privilege_change',
      severity: 'critical',
      ruleType: 'pattern',
      mitreTactic: 'Privilege Escalation',
      mitreTechnique: 'T1098',
      conditionJson: JSON.stringify({
        eventType: 'iam.role_escalation',
      }),
      windowSeconds: 60,
      thresholdCount: 1,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-103',
      name: 'Geographically Impossible Travel Anomaly',
      description: 'Detects concurrent logins or token usage across physically impossible geographical distances.',
      category: 'threat_signal',
      severity: 'high',
      ruleType: 'pattern',
      mitreTactic: 'Initial Access',
      mitreTechnique: 'T1078',
      conditionJson: JSON.stringify({
        eventType: 'threat.impossible_travel',
      }),
      windowSeconds: 300,
      thresholdCount: 1,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-104',
      name: 'Rapid File Encryption / Mass Modification Anomaly',
      description: 'Detects abnormal rate of file modifications indicative of ransomware execution.',
      category: 'system_integrity',
      severity: 'critical',
      ruleType: 'threshold',
      mitreTactic: 'Impact',
      mitreTechnique: 'T1486',
      conditionJson: JSON.stringify({
        eventTypes: ['system.file_modified', 'system.file_encrypted'],
        groupBy: 'ip',
      }),
      windowSeconds: 30,
      thresholdCount: 8,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-105',
      name: 'Reconnaissance Network Port Scan Spike',
      description: 'Detects rapid multi-port probing from external IP address.',
      category: 'network_traffic',
      severity: 'medium',
      ruleType: 'threshold',
      mitreTactic: 'Reconnaissance',
      mitreTechnique: 'T1046',
      conditionJson: JSON.stringify({
        eventTypes: ['network.port_scan_probe'],
        groupBy: 'ip',
      }),
      windowSeconds: 30,
      thresholdCount: 6,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-106',
      name: 'Mass Sensitive S3 Cloud Data Exfiltration',
      description: 'Detects bulk download attempts of sensitive objects from storage repositories.',
      category: 'data_access',
      severity: 'critical',
      ruleType: 'threshold',
      mitreTactic: 'Exfiltration',
      mitreTechnique: 'T1567',
      conditionJson: JSON.stringify({
        eventTypes: ['data.s3_bulk_download', 'data.sensitive_export'],
        groupBy: 'ip',
      }),
      windowSeconds: 60,
      thresholdCount: 3,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-107',
      name: 'Web Application Exploit & Injection Probe',
      description: 'Detects SQL injection, command injection, or path traversal patterns in API requests.',
      category: 'api_activity',
      severity: 'high',
      ruleType: 'pattern',
      mitreTactic: 'Initial Access',
      mitreTechnique: 'T1190',
      conditionJson: JSON.stringify({
        eventType: 'api.exploit_probe',
      }),
      windowSeconds: 60,
      thresholdCount: 1,
      isEnabled: true,
    },
    {
      ruleId: 'SECX-R-108',
      name: 'Stolen Authentication Token Replay',
      description: 'Detects revoked or duplicated JWT session token reuse from unauthorized client.',
      category: 'authentication',
      severity: 'high',
      ruleType: 'pattern',
      mitreTactic: 'Credential Access',
      mitreTechnique: 'T1528',
      conditionJson: JSON.stringify({
        eventType: 'auth.token_replay',
      }),
      windowSeconds: 60,
      thresholdCount: 1,
      isEnabled: true,
    },
  ];

  for (const rule of defaultRules) {
    await prisma.detectionRule.upsert({
      where: { ruleId: rule.ruleId },
      update: rule,
      create: rule,
    });
  }

  console.log(`[Seed] Seeded ${defaultRules.length} MITRE ATT&CK detection rules.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
