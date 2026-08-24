export interface ThreatIndicator {
  id: string;
  indicatorType: 'ip' | 'domain' | 'sha256' | 'url';
  value: string;
  threatActor?: string;
  malwareFamily?: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  confidence: number; // 0 - 100
  sourceFeed: string;
  description: string;
  tags: string[];
  lastObserved: string;
}

export interface ThreatMatchResult {
  isMatch: boolean;
  indicator?: ThreatIndicator;
  enrichment?: {
    country: string;
    asn: string;
    reverseDns?: string;
    abuseConfidenceScore: number;
    mitreTechnique: string;
  };
}

export class ThreatIntelligenceEngine {
  private indicators: ThreatIndicator[] = [
    {
      id: 'IOC-001',
      indicatorType: 'ip',
      value: '198.51.100.77',
      threatActor: 'APT29 (Cozy Bear)',
      malwareFamily: 'CobaltStrike / WellMess',
      severity: 'CRITICAL',
      confidence: 98,
      sourceFeed: 'AlienVault OTX / AbuseIPDB',
      description: 'Active C2 node associated with credential stuffing and cloud IAM escalation.',
      tags: ['apt', 'c2', 'tor_exit', 'brute_force'],
      lastObserved: new Date().toISOString(),
    },
    {
      id: 'IOC-002',
      indicatorType: 'ip',
      value: '203.0.113.45',
      threatActor: 'Lazarus Group',
      malwareFamily: 'HermeticWiper',
      severity: 'CRITICAL',
      confidence: 94,
      sourceFeed: 'MISP Threat Sharing',
      description: 'Web API exploitation source performing SQLi probing and token reuse attacks.',
      tags: ['sqli', 'exploit_probe', 'token_replay'],
      lastObserved: new Date().toISOString(),
    },
    {
      id: 'IOC-003',
      indicatorType: 'ip',
      value: '10.0.4.112',
      threatActor: 'LockBit 3.0 Affiliate',
      malwareFamily: 'LockBit Black Ransomware',
      severity: 'CRITICAL',
      confidence: 99,
      sourceFeed: 'CISA Alert / AbuseIPDB',
      description: 'Internal compromised workstation staging high-velocity ransomware file encryption.',
      tags: ['ransomware', 'mass_encryption', 'shadow_copy_delete'],
      lastObserved: new Date().toISOString(),
    },
    {
      id: 'IOC-004',
      indicatorType: 'domain',
      value: 'c2-sync-payload.darkweb.onion.to',
      threatActor: 'FIN7',
      malwareFamily: 'Carbanak',
      severity: 'HIGH',
      confidence: 89,
      sourceFeed: 'EmergingThreats Pro',
      description: 'Dynamic DNS beaconing endpoint for exfiltration of S3 credentials.',
      tags: ['exfiltration', 'dns_tunnel'],
      lastObserved: new Date().toISOString(),
    },
    {
      id: 'IOC-005',
      indicatorType: 'sha256',
      value: 'a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
      threatActor: 'Wizard Spider',
      malwareFamily: 'BazarLoader / Conti',
      severity: 'CRITICAL',
      confidence: 100,
      sourceFeed: 'VirusTotal Enterprise',
      description: 'Malicious payload loader used to stage secondary ransomware payloads.',
      tags: ['trojan', 'ransomware_loader'],
      lastObserved: new Date().toISOString(),
    },
  ];

  public getIndicators(): ThreatIndicator[] {
    return this.indicators;
  }

  public checkIndicator(value: string): ThreatMatchResult {
    const match = this.indicators.find(
      (i) => i.value.toLowerCase() === value.trim().toLowerCase()
    );

    if (match) {
      return {
        isMatch: true,
        indicator: match,
        enrichment: {
          country: match.value.startsWith('198.') ? 'RU' : match.value.startsWith('203.') ? 'KP' : 'CN',
          asn: match.value.startsWith('198.') ? 'AS9009 (M247 Global)' : 'AS13335 (Cloudflare / Bulletproof)',
          reverseDns: `host-${match.value.replace(/\./g, '-')}.threatnet.xyz`,
          abuseConfidenceScore: match.confidence,
          mitreTechnique: 'T1071.001 (Web Protocols C2)',
        },
      };
    }

    return {
      isMatch: false,
    };
  }

  public addIndicator(indicator: Omit<ThreatIndicator, 'id' | 'lastObserved'>): ThreatIndicator {
    const newIndicator: ThreatIndicator = {
      ...indicator,
      id: `IOC-${Date.now().toString(36).toUpperCase()}`,
      lastObserved: new Date().toISOString(),
    };
    this.indicators.unshift(newIndicator);
    return newIndicator;
  }
}

export const threatIntelEngine = new ThreatIntelligenceEngine();
