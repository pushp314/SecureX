import { SecureXClient } from '../../sdk/src/client';

export async function runAptAttackCampaign(client: SecureXClient) {
  const attackerIp = '198.51.100.77';
  const targetUser = 'sarah.connor@corp.internal';
  console.log(`\n[Simulator] 🔥 Launching Multi-Stage APT Attack Campaign from ${attackerIp}...`);

  // Stage 1: Port Scan & Recon
  console.log('[Simulator] [Stage 1/5] Executing Reconnaissance Port Scanning (T1046)...');
  for (let i = 1; i <= 7; i++) {
    client.record({
      category: 'network_traffic',
      eventType: 'network.port_scan_probe',
      outcome: 'denied',
      severity: 'low',
      network: { sourceIp: attackerIp, destinationPort: 20 + i * 10 },
      metadata: { probeType: 'SYN_STEALTH', port: 20 + i * 10 },
    });
  }
  await client.flush();
  await sleep(400);

  // Stage 2: Credential Stuffing / Brute Force (T1110.001)
  console.log('[Simulator] [Stage 2/5] Executing Brute Force Login Storm (T1110.001)...');
  for (let i = 1; i <= 6; i++) {
    client.record({
      category: 'authentication',
      eventType: 'auth.login_failed',
      outcome: 'failure',
      severity: 'medium',
      identity: { username: targetUser, email: targetUser },
      network: { sourceIp: attackerIp, userAgent: 'Hydra/9.5 (Kali Linux)' },
      metadata: { reason: 'INVALID_CREDENTIALS', attemptNumber: i },
    });
  }
  await client.flush();
  await sleep(400);

  // Stage 3: Compromised Account Login
  console.log('[Simulator] [Stage 3/5] Simulating Compromised Account Access (T1078)...');
  client.record({
    category: 'authentication',
    eventType: 'auth.login_success',
    outcome: 'success',
    severity: 'info',
    identity: { username: targetUser, role: 'support_staff' },
    network: { sourceIp: attackerIp, userAgent: 'Mozilla/5.0 (X11; Linux x86_64)' },
    metadata: { authMethod: 'PASSWORD_OVERRIDE' },
  });
  await client.flush();
  await sleep(300);

  // Stage 4: Privilege Escalation (T1098)
  console.log('[Simulator] [Stage 4/5] Executing IAM Role Escalation to Administrator (T1098)...');
  client.record({
    category: 'privilege_change',
    eventType: 'iam.role_escalation',
    outcome: 'success',
    severity: 'critical',
    identity: { username: targetUser, role: 'GlobalAdmin' },
    network: { sourceIp: attackerIp },
    resource: { resourceType: 'iam_policy', resourceName: 'AdminAccessPolicy', action: 'attach_policy' },
    metadata: { previousRole: 'support_staff', escalatedRole: 'GlobalAdmin' },
  });
  await client.flush();
  await sleep(300);

  // Stage 5: S3 Bulk Data Exfiltration (T1567)
  console.log('[Simulator] [Stage 5/5] Executing Bulk Cloud Data Exfiltration (T1567)...');
  for (let i = 1; i <= 4; i++) {
    client.record({
      category: 'data_access',
      eventType: 'data.s3_bulk_download',
      outcome: 'success',
      severity: 'critical',
      identity: { username: targetUser },
      network: { sourceIp: attackerIp },
      resource: { resourceType: 's3_bucket', resourceName: `customer-pii-vault-${i}`, action: 'bulk_get_object' },
      metadata: { bytesTransferred: 524288000 * i, objectCount: 4500 },
    });
  }
  await client.flush();
  console.log('[Simulator] ✅ Multi-Stage APT Attack Campaign successfully delivered.');
}

export async function runRansomwareCampaign(client: SecureXClient) {
  const hostIp = '10.0.4.112';
  console.log(`\n[Simulator] ☣️ Launching Ransomware Encryption Storm from ${hostIp}...`);

  for (let i = 1; i <= 10; i++) {
    client.record({
      category: 'system_integrity',
      eventType: 'system.file_encrypted',
      outcome: 'success',
      severity: 'critical',
      network: { sourceIp: hostIp },
      resource: { resourceType: 'filesystem', resourceName: `/var/data/finance/record_${i}.enc`, action: 'encrypt' },
      metadata: { entropyScore: 7.98, extension: '.lockbit' },
    });
  }
  await client.flush();
  console.log('[Simulator] ✅ Ransomware Simulation delivered.');
}

export async function runApiExploitCampaign(client: SecureXClient) {
  const attackerIp = '203.0.113.45';
  console.log(`\n[Simulator] 💉 Launching API Exploit & Token Hijack from ${attackerIp}...`);

  // Web exploit probe
  client.record({
    category: 'api_activity',
    eventType: 'api.exploit_probe',
    outcome: 'denied',
    severity: 'high',
    network: { sourceIp: attackerIp, userAgent: 'sqlmap/1.7' },
    resource: { resourceType: 'http_api', resourceName: '/api/v1/users?id=1%27%20OR%201=1--', action: 'GET' },
    metadata: { attackSignature: 'SQL_INJECTION_TAUTOLOGY' },
  });

  // Stolen token replay
  client.record({
    category: 'authentication',
    eventType: 'auth.token_replay',
    outcome: 'denied',
    severity: 'high',
    network: { sourceIp: attackerIp, geoCountry: 'Unknown Proxy' },
    identity: { username: 'devops-lead' },
    metadata: { tokenFingerprint: 'jwt_hash_98a7bc', reason: 'REPLAY_FROM_UNAUTHORIZED_CIDR' },
  });

  await client.flush();
  console.log('[Simulator] ✅ API Exploit & Token Replay delivered.');
}

export async function generateBenignTraffic(client: SecureXClient) {
  const users = ['alice.smith', 'bob.jones', 'charlie.davis', 'emma.watson', 'david.miller'];
  const ips = ['192.168.1.15', '192.168.1.22', '192.168.1.30', '192.168.1.45', '192.168.1.58'];
  const routes = ['/api/v1/dashboard', '/api/v1/reports', '/api/v1/profile', '/api/v1/products', '/api/v1/invoices'];

  const randomUser = users[Math.floor(Math.random() * users.length)];
  const randomIp = ips[Math.floor(Math.random() * ips.length)];
  const randomRoute = routes[Math.floor(Math.random() * routes.length)];

  client.record({
    category: 'api_activity',
    eventType: 'api.request_success',
    outcome: 'success',
    severity: 'info',
    identity: { username: randomUser },
    network: { sourceIp: randomIp, userAgent: 'Mozilla/5.0' },
    resource: { resourceType: 'api_endpoint', resourceName: randomRoute, action: 'GET' },
    metadata: { statusCode: 200, responseTimeMs: Math.floor(Math.random() * 45) + 10 },
  });

  await client.flush();
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
