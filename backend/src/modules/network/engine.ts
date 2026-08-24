import { prisma } from '../../db/client';

export interface NetworkFlowRecord {
  id: string;
  sourceIp: string;
  destinationIp: string;
  sourcePort: number;
  destinationPort: number;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'DNS' | 'HTTPS';
  bytesIn: number;
  bytesOut: number;
  packets: number;
  dnsQuery?: string;
  timestamp: string;
  isAnomalous?: boolean;
}

export interface NetworkAnomaly {
  id: string;
  type: 'C2_BEACONING' | 'DNS_TUNNELING' | 'EGRESS_SPIKE' | 'PORT_SWEEP';
  severity: 'critical' | 'high' | 'medium';
  sourceIp: string;
  destinationIp: string;
  description: string;
  mitreTactic: string;
  mitreTechnique: string;
  detectedAt: string;
}

// In-Memory Flow Cache
const NETWORK_FLOWS: NetworkFlowRecord[] = [];
const NETWORK_ANOMALIES: NetworkAnomaly[] = [];

// Seed initial baseline traffic
function seedInitialFlows() {
  const protocols: ('TCP' | 'UDP' | 'HTTPS' | 'DNS')[] = ['HTTPS', 'TCP', 'DNS', 'HTTPS', 'TCP'];
  const internalIps = ['192.168.1.15', '192.168.1.22', '192.168.1.30', '10.0.4.112', '10.0.8.44'];
  const externalIps = ['142.250.190.46', '104.16.132.229', '151.101.65.140', '198.51.100.77', '203.0.113.45'];

  for (let i = 0; i < 25; i++) {
    const src = internalIps[i % internalIps.length];
    const dst = externalIps[i % externalIps.length];
    const proto = protocols[i % protocols.length];
    const bytesIn = Math.floor(Math.random() * 45000) + 1200;
    const bytesOut = Math.floor(Math.random() * 25000) + 800;

    NETWORK_FLOWS.push({
      id: `flow-${Date.now()}-${i}`,
      sourceIp: src,
      destinationIp: dst,
      sourcePort: 40000 + i * 12,
      destinationPort: proto === 'HTTPS' ? 443 : proto === 'DNS' ? 53 : 80,
      protocol: proto,
      bytesIn,
      bytesOut,
      packets: Math.floor(bytesIn / 1200) + 2,
      timestamp: new Date(Date.now() - (25 - i) * 60000).toISOString(),
    });
  }

  // Seed sample detected anomalies
  NETWORK_ANOMALIES.push(
    {
      id: 'anom-01',
      type: 'C2_BEACONING',
      severity: 'high',
      sourceIp: '10.0.4.112',
      destinationIp: '198.51.100.77',
      description: 'Periodic heartbeats detected every 5.0s ± 2% with fixed payload size (480 bytes) indicative of Cobalt Strike beacon.',
      mitreTactic: 'Command and Control',
      mitreTechnique: 'T1071.001',
      detectedAt: new Date(Date.now() - 10 * 60000).toISOString(),
    },
    {
      id: 'anom-02',
      type: 'DNS_TUNNELING',
      severity: 'critical',
      sourceIp: '192.168.1.58',
      destinationIp: '8.8.8.8',
      description: 'High-entropy TXT records (>7.4 Shannon entropy) resolving through `*.tunnel.adversary-c2.net`. Data exfiltration confirmed.',
      mitreTactic: 'Exfiltration',
      mitreTechnique: 'T1071.004',
      detectedAt: new Date(Date.now() - 5 * 60000).toISOString(),
    }
  );
}

seedInitialFlows();

export function recordNetworkFlow(flow: Omit<NetworkFlowRecord, 'id' | 'timestamp'>): NetworkFlowRecord {
  const completeFlow: NetworkFlowRecord = {
    id: `flow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...flow,
    timestamp: new Date().toISOString(),
  };

  NETWORK_FLOWS.unshift(completeFlow);
  if (NETWORK_FLOWS.length > 500) NETWORK_FLOWS.pop();

  // Behavioral Anomaly Checks
  // Check 1: DNS Tunneling check
  if (flow.dnsQuery && flow.dnsQuery.length > 45) {
    completeFlow.isAnomalous = true;
    NETWORK_ANOMALIES.unshift({
      id: `anom-${Date.now()}`,
      type: 'DNS_TUNNELING',
      severity: 'critical',
      sourceIp: flow.sourceIp,
      destinationIp: flow.destinationIp,
      description: `Suspicious long/encoded DNS query: ${flow.dnsQuery}`,
      mitreTactic: 'Exfiltration',
      mitreTechnique: 'T1071.004',
      detectedAt: new Date().toISOString(),
    });
  }

  // Check 2: High Egress Volume check
  if (flow.bytesOut > 50000000) {
    completeFlow.isAnomalous = true;
    NETWORK_ANOMALIES.unshift({
      id: `anom-${Date.now()}`,
      type: 'EGRESS_SPIKE',
      severity: 'high',
      sourceIp: flow.sourceIp,
      destinationIp: flow.destinationIp,
      description: `Abnormal large egress transfer (${Math.round(flow.bytesOut / 1024 / 1024)} MB) to external host`,
      mitreTactic: 'Exfiltration',
      mitreTechnique: 'T1567',
      detectedAt: new Date().toISOString(),
    });
  }

  return completeFlow;
}

export function getNetworkFlows(limit = 100): NetworkFlowRecord[] {
  return NETWORK_FLOWS.slice(0, limit);
}

export function getNetworkAnomalies(): NetworkAnomaly[] {
  return NETWORK_ANOMALIES.slice(0, 50);
}

export function getNetworkStats() {
  let totalBytesIn = 0;
  let totalBytesOut = 0;
  const protocolCounts: Record<string, number> = {};
  const topTalkers: Record<string, number> = {};

  for (const f of NETWORK_FLOWS) {
    totalBytesIn += f.bytesIn;
    totalBytesOut += f.bytesOut;
    protocolCounts[f.protocol] = (protocolCounts[f.protocol] || 0) + 1;
    topTalkers[f.sourceIp] = (topTalkers[f.sourceIp] || 0) + f.bytesOut;
  }

  const sortedTalkers = Object.entries(topTalkers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([ip, bytes]) => ({ ip, bytesOutMb: Math.round(bytes / 1024 / 1024 * 10) / 10 }));

  return {
    totalFlows: NETWORK_FLOWS.length,
    totalBytesInMb: Math.round(totalBytesIn / 1024 / 1024 * 10) / 10,
    totalBytesOutMb: Math.round(totalBytesOut / 1024 / 1024 * 10) / 10,
    anomaliesCount: NETWORK_ANOMALIES.length,
    protocolBreakdown: Object.entries(protocolCounts).map(([proto, count]) => ({ protocol: proto, count })),
    topTalkers: sortedTalkers,
  };
}

export async function getGeoRadarOrigins() {
  const events = await prisma.telemetryEvent.findMany({
    where: { sourceIp: { not: null } },
    take: 300,
    orderBy: { timestamp: 'desc' },
  });

  const incidents = await prisma.incident.findMany({
    include: { alerts: true },
  });

  // Group by distinct source IP
  const ipMap: Record<string, { count: number; lastSeen: Date; sampleEvent: any }> = {};
  for (const e of events) {
    if (!e.sourceIp) continue;
    if (!ipMap[e.sourceIp]) {
      ipMap[e.sourceIp] = { count: 0, lastSeen: e.timestamp, sampleEvent: e };
    }
    ipMap[e.sourceIp].count++;
  }

  // Predefined geo profiles for realistic SIEM enrichment
  const geoLookup: Record<string, any> = {
    '198.51.100.77': {
      countryCode: 'RU',
      countryName: 'Russia',
      city: 'Moscow',
      asn: 'AS9009 (M247 Global / Bulletproof)',
      threatActor: 'APT29 (Cozy Bear)',
      attackType: 'Credential Stuffing & IAM Privilege Escalation',
      severity: 'CRITICAL',
      coordinates: [55.7558, 37.6173],
    },
    '203.0.113.45': {
      countryCode: 'KP',
      countryName: 'North Korea',
      city: 'Pyongyang',
      asn: 'AS13335 (Star Joint Venture)',
      threatActor: 'Lazarus Group',
      attackType: 'SQL Injection Probing & Web API Exploit',
      severity: 'CRITICAL',
      coordinates: [39.0392, 125.7625],
    },
    '10.0.4.112': {
      countryCode: 'US',
      countryName: 'United States (Compromised Host)',
      city: 'Ashburn, VA',
      asn: 'AS14618 (AWS Infrastructure)',
      threatActor: 'LockBit 3.0 Affiliate',
      attackType: 'Internal Ransomware Mass Modification',
      severity: 'CRITICAL',
      coordinates: [39.0438, -77.4874],
    },
  };

  const results: any[] = [];
  let idx = 1;

  for (const [ip, info] of Object.entries(ipMap)) {
    const geo = geoLookup[ip] || {
      countryCode: 'BG',
      countryName: 'Bulgaria',
      city: 'Sofia',
      asn: 'AS200052 (Tor Exit Node Operator)',
      threatActor: 'Unknown Adversary Group',
      attackType: info.sampleEvent.eventType || 'Suspicious Ingress Signal',
      severity: info.sampleEvent.severity?.toUpperCase() || 'HIGH',
      coordinates: [42.6977, 23.3219],
    };

    results.push({
      id: `GEO-ORIGIN-0${idx++}`,
      ipAddress: ip,
      countryCode: geo.countryCode,
      countryName: geo.countryName,
      city: geo.city,
      asn: geo.asn,
      threatActor: geo.threatActor,
      attackType: geo.attackType,
      eventCount: info.count,
      severity: geo.severity,
      coordinates: geo.coordinates,
      lastSeen: info.lastSeen,
    });
  }

  // If no dynamic events yet, return standard fallback
  if (results.length === 0) {
    return Object.entries(geoLookup).map(([ip, g], i) => ({
      id: `GEO-0${i + 1}`,
      ipAddress: ip,
      eventCount: 24,
      ...g,
    }));
  }

  return results;
}
