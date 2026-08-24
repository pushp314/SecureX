export interface CloudResourcePosture {
  id: string;
  provider: 'AWS' | 'Azure' | 'GCP' | 'Kubernetes';
  resourceType: string;
  resourceId: string;
  region: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  remediation: string;
  status: 'NON_COMPLIANT' | 'COMPLIANT' | 'REMEDIATING';
  lastEvaluatedAt: string;
}

const CLOUD_RESOURCES: CloudResourcePosture[] = [
  {
    id: 'cloud-01',
    provider: 'AWS',
    resourceType: 'S3 Bucket',
    resourceId: 'arn:aws:s3:::customer-pii-vault-1',
    region: 'us-east-1',
    severity: 'critical',
    title: 'S3 Bucket Lacks Restrictive Public Access Block',
    description: 'Bucket policy allows anonymous Read access to objects containing customer records.',
    remediation: 'Enable S3 Block Public Access setting and enforce SSE-KMS customer-managed key encryption.',
    status: 'NON_COMPLIANT',
    lastEvaluatedAt: new Date().toISOString(),
  },
  {
    id: 'cloud-02',
    provider: 'AWS',
    resourceType: 'IAM Role',
    resourceId: 'arn:aws:iam::123456789012:role/DeveloperAccessRole',
    region: 'global',
    severity: 'critical',
    title: 'Over-Permissive Wildcard Administrator IAM Policy',
    description: 'Attached IAM policy contains Action: "*" and Resource: "*" granting unrestricted account privileges.',
    remediation: 'Refactor role to implement least-privilege permissions based on Access Advisor usage data.',
    status: 'NON_COMPLIANT',
    lastEvaluatedAt: new Date().toISOString(),
  },
  {
    id: 'cloud-03',
    provider: 'Kubernetes',
    resourceType: 'Deployment',
    resourceId: 'k8s://prod-cluster/ns-core/payment-gateway-pod',
    region: 'us-east-1',
    severity: 'high',
    title: 'Container Pod Running in Privileged Mode',
    description: 'SecurityContext has `privileged: true` allowing host kernel manipulation and container escape.',
    remediation: 'Set `privileged: false` and restrict capabilities to `CAP_NET_BIND_SERVICE`.',
    status: 'NON_COMPLIANT',
    lastEvaluatedAt: new Date().toISOString(),
  },
  {
    id: 'cloud-04',
    provider: 'Azure',
    resourceType: 'Storage Account',
    resourceId: 'azure://subscriptions/sub-99/resourceGroups/rg-prod/storageAccounts/stfinancerecords',
    region: 'eastus',
    severity: 'high',
    title: 'Anonymous Blob Public Access Enabled',
    description: 'Storage account permits anonymous read access to financial data containers.',
    remediation: 'Disable `allowBlobPublicAccess` property on the storage account.',
    status: 'NON_COMPLIANT',
    lastEvaluatedAt: new Date().toISOString(),
  },
  {
    id: 'cloud-05',
    provider: 'GCP',
    resourceType: 'Compute Firewall',
    resourceId: 'projects/securex-prod/global/firewalls/allow-all-ssh',
    region: 'us-central1',
    severity: 'medium',
    title: 'SSH Port 22 Open to Public Internet (0.0.0.0/0)',
    description: 'Firewall rule permits unauthenticated SSH connections from any IP on the internet.',
    remediation: 'Restrict source CIDR ranges to corporate VPN IP pool and require Identity-Aware Proxy (IAP).',
    status: 'NON_COMPLIANT',
    lastEvaluatedAt: new Date().toISOString(),
  },
];

export function getCloudPostureList(): CloudResourcePosture[] {
  return CLOUD_RESOURCES;
}

export function getCloudPostureSummary() {
  const nonCompliant = CLOUD_RESOURCES.filter((r) => r.status === 'NON_COMPLIANT');
  const criticalCount = nonCompliant.filter((r) => r.severity === 'critical').length;
  const highCount = nonCompliant.filter((r) => r.severity === 'high').length;

  const total = CLOUD_RESOURCES.length;
  const compliantCount = total - nonCompliant.length;
  const postureScore = Math.round((compliantCount / (total || 1)) * 100);

  return {
    postureScore: postureScore,
    totalResources: total,
    criticalMisconfigurations: criticalCount,
    highMisconfigurations: highCount,
    remediatedCount: CLOUD_RESOURCES.filter((r) => r.status === 'COMPLIANT').length,
    byProvider: {
      AWS: CLOUD_RESOURCES.filter((r) => r.provider === 'AWS').length,
      Kubernetes: CLOUD_RESOURCES.filter((r) => r.provider === 'Kubernetes').length,
      Azure: CLOUD_RESOURCES.filter((r) => r.provider === 'Azure').length,
      GCP: CLOUD_RESOURCES.filter((r) => r.provider === 'GCP').length,
    },
  };
}

export function remediateCloudResource(resourceId: string): CloudResourcePosture {
  const res = CLOUD_RESOURCES.find((r) => r.id === resourceId || r.resourceId === resourceId);
  if (!res) throw new Error('Cloud resource not found');

  res.status = 'COMPLIANT';
  res.lastEvaluatedAt = new Date().toISOString();
  return res;
}
