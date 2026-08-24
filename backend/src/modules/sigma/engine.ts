import { prisma } from '../../db/client';

export interface SigmaRule {
  id: string;
  title: string;
  status: 'experimental' | 'test' | 'stable';
  description: string;
  author?: string;
  date?: string;
  logsource: {
    category?: string;
    product?: string;
    service?: string;
  };
  detection: {
    selection: Record<string, any>;
    filter?: Record<string, any>;
    condition: string;
    timeframe?: string;
  };
  level: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  rawYaml: string;
  compiledKql: string;
  isDeployed: boolean;
  deployedRuleId?: string;
}

export interface SigmaCompileResult {
  success: boolean;
  ruleId: string;
  title: string;
  compiledKql: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  mitreTags: string[];
  syntaxErrors: string[];
}

// Built-in repository of industry-standard Sigma rules (from SigmaHQ)
const SIGMA_RULES: SigmaRule[] = [
  {
    id: 'sig-01',
    title: 'Suspicious PowerShell Download & Execution (APT29)',
    status: 'stable',
    description: 'Detects encoded PowerShell commands initiating remote web payloads typical of Cozy Bear initial access.',
    author: 'SigmaHQ / Florian Roth',
    date: '2024-03-15',
    logsource: {
      category: 'process_creation',
      product: 'windows',
    },
    detection: {
      selection: {
        Image: '*\\powershell.exe',
        CommandLine: '*DownloadString*|*iex*|*-enc *',
      },
      condition: 'selection',
      timeframe: '60s',
    },
    level: 'critical',
    tags: ['attack.execution', 'attack.t1059.001', 'apt29'],
    rawYaml: `title: Suspicious PowerShell Download & Execution (APT29)
id: sig-01
status: stable
description: Detects encoded PowerShell commands initiating remote web payloads typical of Cozy Bear initial access.
author: SigmaHQ / Florian Roth
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\powershell.exe'
    CommandLine|contains:
      - 'DownloadString'
      - 'iex'
      - '-enc '
  condition: selection
  timeframe: 60s
level: critical
tags:
  - attack.execution
  - attack.t1059.001
  - apt29`,
    compiledKql: `category == "process_creation" | where commandLine contains "powershell" and (commandLine contains "DownloadString" or commandLine contains "iex" or commandLine contains "-enc")`,
    isDeployed: true,
    deployedRuleId: 'RULE-001',
  },
  {
    id: 'sig-02',
    title: 'LSASS Memory Dump & Credential Dumping (Mimikatz)',
    status: 'stable',
    description: 'Detects process accessing LSASS process handle with PROCESS_VM_READ permissions indicative of credential harvesting.',
    author: 'SigmaHQ / SOC Team',
    date: '2024-04-10',
    logsource: {
      category: 'process_access',
      product: 'windows',
    },
    detection: {
      selection: {
        TargetImage: '*\\lsass.exe',
        GrantedAccess: '0x1010|0x1038|0x143a',
      },
      condition: 'selection',
    },
    level: 'critical',
    tags: ['attack.credential_access', 'attack.t1003.001'],
    rawYaml: `title: LSASS Memory Dump & Credential Dumping (Mimikatz)
id: sig-02
status: stable
description: Detects process accessing LSASS process handle with PROCESS_VM_READ permissions indicative of credential harvesting.
logsource:
  category: process_access
  product: windows
detection:
  selection:
    TargetImage|endswith: '\\lsass.exe'
    GrantedAccess:
      - '0x1010'
      - '0x1038'
      - '0x143a'
  condition: selection
level: critical
tags:
  - attack.credential_access
  - attack.t1003.001`,
    compiledKql: `category == "system_integrity" | where resource.resourceName contains "lsass" and eventType == "system.process_access"`,
    isDeployed: false,
  },
  {
    id: 'sig-03',
    title: 'Cloud IAM Policy Modification to Administrator',
    status: 'stable',
    description: 'Detects unauthorized attaching of AdministratorAccess policy to IAM roles or users in AWS CloudTrail.',
    author: 'SigmaHQ / Cloud Threat Research',
    date: '2024-05-01',
    logsource: {
      service: 'cloudtrail',
      product: 'aws',
    },
    detection: {
      selection: {
        eventName: 'AttachRolePolicy|AttachUserPolicy',
        policyArn: '*AdministratorAccess*',
      },
      condition: 'selection',
    },
    level: 'critical',
    tags: ['attack.privilege_escalation', 'attack.t1098', 'aws'],
    rawYaml: `title: Cloud IAM Policy Modification to Administrator
id: sig-03
status: stable
description: Detects unauthorized attaching of AdministratorAccess policy to IAM roles or users in AWS CloudTrail.
logsource:
  service: cloudtrail
  product: aws
detection:
  selection:
    eventName:
      - 'AttachRolePolicy'
      - 'AttachUserPolicy'
    requestParameters.policyArn|contains: 'AdministratorAccess'
  condition: selection
level: critical
tags:
  - attack.privilege_escalation
  - attack.t1098
  - aws`,
    compiledKql: `category == "privilege_change" | where eventType == "iam.role_escalation" and resource.action == "attach_policy"`,
    isDeployed: true,
    deployedRuleId: 'RULE-003',
  },
  {
    id: 'sig-04',
    title: 'Mass S3 Cloud Storage Exfiltration Anomaly',
    status: 'stable',
    description: 'Detects high volume of S3 GetObject operations across short time windows exceeding data exfiltration thresholds.',
    author: 'SecureX Research Labs',
    date: '2024-06-12',
    logsource: {
      service: 's3',
      product: 'aws',
    },
    detection: {
      selection: {
        eventName: 'GetObject',
        bytesTransferred: '>500000000',
      },
      condition: 'selection',
      timeframe: '5m',
    },
    level: 'critical',
    tags: ['attack.exfiltration', 'attack.t1567.002'],
    rawYaml: `title: Mass S3 Cloud Storage Exfiltration Anomaly
id: sig-04
status: stable
description: Detects high volume of S3 GetObject operations across short time windows exceeding data exfiltration thresholds.
logsource:
  service: s3
  product: aws
detection:
  selection:
    eventName: 'GetObject'
    bytes: '>500000000'
  condition: selection
  timeframe: 5m
level: critical
tags:
  - attack.exfiltration
  - attack.t1567.002`,
    compiledKql: `category == "data_access" | where eventType == "data.s3_bulk_download" | stats sum(metadata.bytes) by identity.username`,
    isDeployed: true,
    deployedRuleId: 'RULE-004',
  },
  {
    id: 'sig-05',
    title: 'Linux Sudoers File Tampering',
    status: 'stable',
    description: 'Detects modifications to /etc/sudoers or /etc/sudoers.d/ indicating persistence or local privilege escalation.',
    author: 'SigmaHQ / Linux Security',
    date: '2024-07-20',
    logsource: {
      category: 'file_event',
      product: 'linux',
    },
    detection: {
      selection: {
        TargetFilename: '/etc/sudoers|/etc/sudoers.d/*',
      },
      condition: 'selection',
    },
    level: 'high',
    tags: ['attack.persistence', 'attack.privilege_escalation', 'attack.t1548.003'],
    rawYaml: `title: Linux Sudoers File Tampering
id: sig-05
status: stable
description: Detects modifications to /etc/sudoers or /etc/sudoers.d/ indicating persistence or local privilege escalation.
logsource:
  category: file_event
  product: linux
detection:
  selection:
    TargetFilename|startswith:
      - '/etc/sudoers'
      - '/etc/sudoers.d/'
  condition: selection
level: high
tags:
  - attack.persistence
  - attack.privilege_escalation
  - attack.t1548.003`,
    compiledKql: `category == "system_integrity" | where resource.resourceName contains "/etc/sudoers"`,
    isDeployed: false,
  },
];

export class SigmaCompilerEngine {
  public getRules(): SigmaRule[] {
    return SIGMA_RULES;
  }

  public compileYaml(yamlContent: string): SigmaCompileResult {
    const lines = yamlContent.split('\n');
    let title = 'Custom Sigma Rule';
    let id = `sig-custom-${Date.now().toString().slice(-4)}`;
    let level: 'low' | 'medium' | 'high' | 'critical' = 'high';
    const tags: string[] = [];
    let inTags = false;
    let inSelection = false;
    const selections: Record<string, string> = {};

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('title:')) {
        title = trimmed.replace('title:', '').trim().replace(/^['"]|['"]$/g, '');
      } else if (trimmed.startsWith('id:')) {
        id = trimmed.replace('id:', '').trim();
      } else if (trimmed.startsWith('level:')) {
        const lvl = trimmed.replace('level:', '').trim().toLowerCase();
        if (['low', 'medium', 'high', 'critical'].includes(lvl)) {
          level = lvl as any;
        }
      } else if (trimmed.startsWith('tags:')) {
        inTags = true;
        inSelection = false;
      } else if (inTags && trimmed.startsWith('-')) {
        tags.push(trimmed.replace('-', '').trim().replace(/^['"]|['"]$/g, ''));
      } else if (trimmed.startsWith('selection:')) {
        inSelection = true;
        inTags = false;
      } else if (inSelection && trimmed.includes(':')) {
        const [k, ...v] = trimmed.split(':');
        const key = k.trim().split('|')[0];
        const val = v.join(':').trim().replace(/^['"]|['"]$/g, '');
        if (key && val) selections[key] = val;
      } else if (trimmed && !trimmed.startsWith(' ') && !trimmed.startsWith('-')) {
        inTags = false;
        inSelection = false;
      }
    }

    // Compile into SecureX KQL filter syntax
    const kqlParts: string[] = [];
    for (const [k, v] of Object.entries(selections)) {
      if (k.toLowerCase().includes('image') || k.toLowerCase().includes('process')) {
        kqlParts.push(`category == "system_integrity"`);
        kqlParts.push(`resource.resourceName contains "${v}"`);
      } else if (k.toLowerCase().includes('commandline')) {
        kqlParts.push(`metadata.command contains "${v}"`);
      } else if (k.toLowerCase().includes('eventname') || k.toLowerCase().includes('eventtype')) {
        kqlParts.push(`eventType == "${v}"`);
      } else {
        kqlParts.push(`metadata.${k} contains "${v}"`);
      }
    }

    const compiledKql = kqlParts.length > 0 ? kqlParts.join(' and ') : `category == "system_integrity" | where severity == "${level}"`;

    return {
      success: true,
      ruleId: id,
      title,
      compiledKql,
      level,
      mitreTags: tags.length > 0 ? tags : ['attack.execution', 'attack.t1059'],
      syntaxErrors: [],
    };
  }

  public async deployRule(ruleId: string): Promise<SigmaRule> {
    const rule = SIGMA_RULES.find((r) => r.id === ruleId);
    if (!rule) throw new Error(`Sigma rule not found: ${ruleId}`);

    const createdRuleId = `SIGMA-${rule.id.toUpperCase()}`;

    // Deploy to live PostgreSQL detection rule table
    const mitreTactic = rule.tags.find((t) => t.startsWith('attack.') && !t.includes('t1'))?.replace('attack.', '').replace(/_/g, ' ').toUpperCase() || 'EXECUTION';
    const mitreTechnique = rule.tags.find((t) => t.includes('t1'))?.toUpperCase() || 'T1059';

    await prisma.detectionRule.upsert({
      where: { ruleId: createdRuleId },
      update: {
        name: `[Sigma] ${rule.title}`,
        description: rule.description,
        severity: rule.level,
        isEnabled: true,
      },
      create: {
        ruleId: createdRuleId,
        name: `[Sigma] ${rule.title}`,
        description: rule.description,
        severity: rule.level,
        category: rule.logsource.category || 'system_integrity',
        ruleType: 'pattern',
        conditionJson: JSON.stringify({
          eventType: Object.keys(rule.detection.selection)[0] || '*',
          outcome: null,
          source: 'sigma_compiler',
        }),
        mitreTactic: mitreTactic,
        mitreTechnique: mitreTechnique,
        windowSeconds: 60,
        thresholdCount: 1,
        isEnabled: true,
      },
    });

    rule.isDeployed = true;
    rule.deployedRuleId = createdRuleId;
    return rule;
  }
}

export const sigmaCompiler = new SigmaCompilerEngine();
