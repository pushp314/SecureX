"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logParserEngine = exports.UniversalLogParserEngine = void 0;
const client_1 = require("../../db/client");
const eventBus_1 = require("../queue/eventBus");
const sanitizer_1 = require("../ingestion/sanitizer");
class UniversalLogParserEngine {
    parsers = [
        {
            id: 'PARSER-SYSLOG-5424',
            name: 'RFC 5424 / RFC 3164 Standard Syslog Parser',
            sourceType: 'syslog',
            description: 'Parses standard Unix/Linux syslog daemon messages including facility, severity, hostname, and app-name.',
            sampleInput: '<134>1 2026-08-24T20:15:30.123Z auth-srv-01 sshd 4102 - - Failed password for invalid user admin from 198.51.100.77 port 48291 ssh2',
            fieldMappings: {
                eventType: 'auth.ssh_login_failed',
                category: 'authentication',
                sourceService: 'sshd',
                outcome: 'failure',
                severity: 'high',
            },
        },
        {
            id: 'PARSER-WIN-EVTX',
            name: 'Windows Security Event Log (Security.evtx)',
            sourceType: 'windows_evtx',
            description: 'Parses Windows Event ID 4624 (Logon Success), 4625 (Logon Failure), 4672 (Admin Privilege Assigned), 4688 (Process Creation).',
            sampleInput: 'EventID: 4625, Account Name: Administrator, Failure Reason: Unknown user name or bad password, Source Network Address: 203.0.113.45, Logon Type: 3, Process Name: C:\\Windows\\System32\\lsass.exe',
            fieldMappings: {
                eventType: 'auth.windows_logon_failed',
                category: 'authentication',
                sourceService: 'Windows-Security-Auditing',
                outcome: 'failure',
                severity: 'high',
            },
        },
        {
            id: 'PARSER-AWS-CLOUDTRAIL',
            name: 'AWS CloudTrail Management Event Parser',
            sourceType: 'cloudtrail',
            description: 'Parses CloudTrail JSON audit records for IAM role modifications, S3 bucket policy alterations, and Security Group changes.',
            sampleInput: '{"eventVersion":"1.08","userIdentity":{"type":"IAMUser","userName":"devops-deployer"},"eventTime":"2026-08-24T20:18:00Z","eventSource":"iam.amazonaws.com","eventName":"AttachUserPolicy","sourceIPAddress":"198.51.100.77","responseElements":{"policyArn":"arn:aws:iam::aws:policy/AdministratorAccess"}}',
            fieldMappings: {
                eventType: 'iam.role_escalation',
                category: 'privilege_change',
                sourceService: 'aws.cloudtrail',
                outcome: 'success',
                severity: 'critical',
            },
        },
        {
            id: 'PARSER-OKTA-SYSLOG',
            name: 'Okta Identity Cloud System Log Parser',
            sourceType: 'okta',
            description: 'Parses Okta single sign-on, MFA push challenges, and password reset events.',
            sampleInput: '{"eventType":"user.mfa.challenge.failed","displayMessage":"User MFA challenge failed","actor":{"alternateId":"sarah.connor@corp.internal"},"client":{"ipAddress":"10.0.4.112"},"outcome":{"result":"FAILURE"}}',
            fieldMappings: {
                eventType: 'auth.mfa_failed',
                category: 'authentication',
                sourceService: 'okta.idp',
                outcome: 'failure',
                severity: 'medium',
            },
        },
    ];
    getParsers() {
        return this.parsers;
    }
    parseRawLog(rawLog, parserId) {
        try {
            const trimmed = rawLog.trim();
            // 1. Check if JSON (CloudTrail / Okta / structured JSON)
            if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                const json = JSON.parse(trimmed);
                // AWS CloudTrail Format
                if (json.eventSource || json.eventName) {
                    const userName = json.userIdentity?.userName || json.userIdentity?.arn || 'unknown';
                    const srcIp = json.sourceIPAddress;
                    const isPrivEsc = json.eventName === 'AttachUserPolicy' || json.eventName === 'PutUserPolicy';
                    return {
                        success: true,
                        normalizedEvent: {
                            category: isPrivEsc ? 'privilege_change' : 'cloud_audit',
                            eventType: isPrivEsc ? 'iam.role_escalation' : `aws.${json.eventName || 'event'}`,
                            severity: isPrivEsc ? 'critical' : 'medium',
                            outcome: json.errorCode ? 'failure' : 'success',
                            sourceService: json.eventSource || 'aws.cloudtrail',
                            sourceIp: srcIp,
                            username: userName,
                            action: json.eventName,
                            metadata: json,
                        },
                    };
                }
                // Okta System Log Format
                if (json.eventType && json.actor) {
                    const isFailure = json.outcome?.result === 'FAILURE';
                    return {
                        success: true,
                        normalizedEvent: {
                            category: 'authentication',
                            eventType: json.eventType,
                            severity: isFailure ? 'high' : 'info',
                            outcome: isFailure ? 'failure' : 'success',
                            sourceService: 'okta.system_log',
                            sourceIp: json.client?.ipAddress,
                            username: json.actor?.alternateId || json.actor?.displayName,
                            action: json.displayMessage,
                            metadata: json,
                        },
                    };
                }
            }
            // 2. Windows Event Log Text format
            if (trimmed.includes('EventID:') || trimmed.includes('Account Name:')) {
                const ipMatch = trimmed.match(/Source Network Address:\s*([\d\.]+)/i);
                const userMatch = trimmed.match(/Account Name:\s*([^\s,]+)/i);
                const eventIdMatch = trimmed.match(/EventID:\s*(\d+)/i);
                const eventId = eventIdMatch ? eventIdMatch[1] : '4624';
                const isFailure = eventId === '4625';
                const isPrivilege = eventId === '4672';
                return {
                    success: true,
                    normalizedEvent: {
                        category: isPrivilege ? 'privilege_change' : 'authentication',
                        eventType: isFailure
                            ? 'auth.windows_logon_failed'
                            : isPrivilege
                                ? 'iam.privilege_assigned'
                                : 'auth.windows_logon_success',
                        severity: isFailure || isPrivilege ? 'high' : 'info',
                        outcome: isFailure ? 'failure' : 'success',
                        sourceService: 'Microsoft-Windows-Security-Auditing',
                        sourceIp: ipMatch ? ipMatch[1] : '127.0.0.1',
                        username: userMatch ? userMatch[1] : 'SYSTEM',
                        action: `Windows EventID ${eventId}`,
                        metadata: { rawText: trimmed, eventId },
                    },
                };
            }
            // 3. Syslog RFC 5424 / RFC 3164 Regex Parse
            const ipMatch = trimmed.match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
            const userMatch = trimmed.match(/user\s+([^\s]+)/i) || trimmed.match(/for\s+([^\s]+)/i);
            const serviceMatch = trimmed.match(/\b(sshd|sudo|kernel|nginx|systemd|dockerd)\[?\d*\]?:?/i);
            const isFailed = /failed|failure|invalid|unauthorized|denied/i.test(trimmed);
            return {
                success: true,
                normalizedEvent: {
                    category: /sshd|login|auth/i.test(trimmed) ? 'authentication' : 'system_integrity',
                    eventType: isFailed ? 'auth.login_failed' : 'system.log_event',
                    severity: isFailed ? 'high' : 'info',
                    outcome: isFailed ? 'failure' : 'success',
                    sourceService: serviceMatch ? serviceMatch[1] : 'syslog-daemon',
                    sourceIp: ipMatch ? ipMatch[0] : undefined,
                    username: userMatch ? userMatch[1] : undefined,
                    action: 'Syslog Ingest',
                    metadata: { rawText: trimmed },
                },
            };
        }
        catch (err) {
            return {
                success: false,
                error: `Log parser error: ${err.message}`,
            };
        }
    }
    async ingestParsedLog(rawLog, parserId) {
        const parseRes = this.parseRawLog(rawLog, parserId);
        if (!parseRes.success || !parseRes.normalizedEvent) {
            throw new Error(parseRes.error || 'Failed to parse raw log string');
        }
        const norm = parseRes.normalizedEvent;
        const redactedMetadata = (0, sanitizer_1.sanitizeTelemetryPayload)(norm.metadata);
        const event = await client_1.prisma.telemetryEvent.create({
            data: {
                eventId: `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                tenantId: 'tenant-enterprise-01',
                timestamp: new Date(),
                category: norm.category,
                eventType: norm.eventType,
                outcome: norm.outcome,
                severity: norm.severity,
                sourceService: norm.sourceService,
                sourceIp: norm.sourceIp,
                destinationIp: norm.destinationIp,
                userId: norm.userId,
                username: norm.username,
                action: norm.action,
                metadataJson: JSON.stringify(redactedMetadata),
                rawPayload: JSON.stringify({ ...norm, originalRawLog: rawLog }),
            },
        });
        await eventBus_1.eventBus.publishTelemetry({
            id: event.id,
            eventId: event.eventId,
            timestamp: event.timestamp.toISOString(),
            category: event.category,
            eventType: event.eventType,
            outcome: event.outcome,
            severity: event.severity,
            sourceService: event.sourceService,
            sourceIp: event.sourceIp || undefined,
            destinationIp: event.destinationIp || undefined,
            userId: event.userId || undefined,
            username: event.username || undefined,
            action: event.action || undefined,
            metadata: redactedMetadata,
        });
        return event;
    }
}
exports.UniversalLogParserEngine = UniversalLogParserEngine;
exports.logParserEngine = new UniversalLogParserEngine();
