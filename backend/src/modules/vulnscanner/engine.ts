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
  riskScore: number; // 0 - 100
  lastScannedAt: string;
  vulnerabilities: VulnerabilityFinding[];
}

// In-memory Asset Repository & Vulnerability Database
const ASSETS_STORE: MonitoredAsset[] = [
  {
    id: 'asset-01',
    name: 'prod-api-gateway-01',
    type: 'host',
    ipAddress: '198.51.100.77',
    environment: 'production',
    riskScore: 92,
    lastScannedAt: new Date().toISOString(),
    vulnerabilities: [
      {
        id: 'vuln-101',
        cveId: 'CVE-2023-38606',
        title: 'OpenSSL Memory Corruption / RCE Potential',
        severity: 'critical',
        cvssScore: 9.8,
        description: 'Vulnerability in TLS handshake parser permitting arbitrary code execution.',
        affectedComponent: 'openssl@1.1.1u',
        remediation: 'Upgrade to OpenSSL 3.0.12+ and restart proxy daemon.',
        discoveredAt: new Date().toISOString(),
      },
      {
        id: 'vuln-102',
        cveId: 'CVE-2024-21626',
        title: 'Container Runtime File Descriptor Leak (runc)',
        severity: 'high',
        cvssScore: 8.6,
        description: 'Container breakout flaw allowing containerized process to access host filesystem.',
        affectedComponent: 'runc@1.1.11',
        remediation: 'Patch containerd/runc packages to 1.1.12+.',
        discoveredAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'asset-02',
    name: 'finance-db-host-04',
    type: 'database',
    ipAddress: '10.0.4.112',
    environment: 'internal',
    riskScore: 84,
    lastScannedAt: new Date().toISOString(),
    vulnerabilities: [
      {
        id: 'vuln-103',
        cveId: 'CVE-2023-4863',
        title: 'Libwebp Heap Buffer Overflow',
        severity: 'high',
        cvssScore: 8.8,
        description: 'Buffer overflow in WebP lossless decoding resulting in denial of service or code execution.',
        affectedComponent: 'libwebp@1.3.1',
        remediation: 'Update libwebp to latest stable package.',
        discoveredAt: new Date().toISOString(),
      },
      {
        id: 'vuln-104',
        cveId: 'MISCONFIG-PORT-5432',
        title: 'PostgreSQL Port Open to Internal Subnet',
        severity: 'medium',
        cvssScore: 6.5,
        description: 'Direct database listening port exposed without mTLS transport requirement.',
        affectedComponent: 'pg_hba.conf',
        remediation: 'Require SSL certificate authentication in pg_hba.conf.',
        discoveredAt: new Date().toISOString(),
      },
    ],
  },
  {
    id: 'asset-03',
    name: 'customer-identity-vault',
    type: 'cloud_resource',
    ipAddress: '10.0.8.44',
    environment: 'production',
    riskScore: 28,
    lastScannedAt: new Date().toISOString(),
    vulnerabilities: [
      {
        id: 'vuln-105',
        cveId: 'CONFIG-TLS-1.1',
        title: 'Deprecated TLS 1.1 Protocol Enabled',
        severity: 'low',
        cvssScore: 3.7,
        description: 'Legacy encryption protocol cipher suite enabled on public listener.',
        affectedComponent: 'nginx.conf',
        remediation: 'Enforce minimum TLSv1.2 in SSL policy.',
        discoveredAt: new Date().toISOString(),
      },
    ],
  },
];

export async function getAssetsList(): Promise<MonitoredAsset[]> {
  return ASSETS_STORE;
}

export async function runAssetVulnerabilityScan(assetId: string): Promise<MonitoredAsset> {
  const asset = ASSETS_STORE.find((a) => a.id === assetId);
  if (!asset) {
    throw new Error(`Asset not found: ${assetId}`);
  }

  asset.lastScannedAt = new Date().toISOString();
  // Recalculate composite risk score
  const maxScore = Math.max(...asset.vulnerabilities.map((v) => v.cvssScore * 10), 20);
  asset.riskScore = Math.round(maxScore);

  return asset;
}

export async function addMonitoredAsset(newAsset: Omit<MonitoredAsset, 'id' | 'lastScannedAt' | 'vulnerabilities'>): Promise<MonitoredAsset> {
  const asset: MonitoredAsset = {
    id: `asset-${Date.now().toString().slice(-4)}`,
    name: newAsset.name,
    type: newAsset.type,
    ipAddress: newAsset.ipAddress,
    environment: newAsset.environment,
    riskScore: newAsset.riskScore || 35,
    lastScannedAt: new Date().toISOString(),
    vulnerabilities: [],
  };

  ASSETS_STORE.push(asset);
  return asset;
}
