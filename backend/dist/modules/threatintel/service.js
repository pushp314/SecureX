"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lookupThreatIntelligence = lookupThreatIntelligence;
exports.enrichTelemetryWithThreatIntel = enrichTelemetryWithThreatIntel;
const engine_1 = require("./engine");
// Built-in Threat Intelligence IOC Repository
const KNOWN_IOC_DATABASE = {
    '198.51.100.77': {
        isMalicious: true,
        threatScore: 94,
        threatType: 'APT_INFRASTRUCTURE',
        threatActor: 'APT28 / Fancy Bear Threat Cluster',
        country: 'RU',
        asn: 'AS48227 (High Risk Hosting)',
        tags: ['APT28', 'TOR_EXIT_NODE', 'BRUTE_FORCE_SOURCE', 'C2_PROXY'],
        reputationSummary: 'Known active C2 proxy associated with credential stuffing & cloud exfiltration campaigns.',
    },
    '203.0.113.45': {
        isMalicious: true,
        threatScore: 88,
        threatType: 'BOTNET_C2',
        threatActor: 'Mirai Variant Scanner',
        country: 'RO',
        asn: 'AS9121 (Hosting Services)',
        tags: ['EXPLOIT_SCANNER', 'SQLI_PROBE_SOURCE', 'HIGH_ABUSE_CONFIDENCE'],
        reputationSummary: 'Frequent automated SQL injection scanner and exploit payload dispatcher.',
    },
    '10.0.4.112': {
        isMalicious: true,
        threatScore: 92,
        threatType: 'COMPROMISED_INTERNAL_HOST',
        threatActor: 'LockBit 3.0 Affiliate',
        country: 'INTERNAL',
        asn: 'CORP_INTERNAL_VLAN_4',
        tags: ['RANSOMWARE_ENCRYPTION_BURST', 'LATERAL_MOVEMENT_TARGET'],
        reputationSummary: 'Internal host exhibiting automated cryptographic ransomware behavior.',
    },
};
function lookupThreatIntelligence(ipOrIdentifier) {
    // Check dynamic engine indicators first
    const engineCheck = engine_1.threatIntelEngine.checkIndicator(ipOrIdentifier);
    if (engineCheck.isMatch && engineCheck.indicator) {
        const ind = engineCheck.indicator;
        return {
            isMalicious: true,
            threatScore: ind.confidence,
            threatType: ind.tags.includes('c2') ? 'APT_INFRASTRUCTURE' : 'KNOWN_SCANNER',
            threatActor: ind.threatActor || 'Adversary Threat Group',
            country: engineCheck.enrichment?.country || 'GLOBAL',
            asn: engineCheck.enrichment?.asn || 'AS9009 (Bulletproof Hosting)',
            tags: ind.tags,
            reputationSummary: ind.description,
        };
    }
    const match = KNOWN_IOC_DATABASE[ipOrIdentifier];
    if (match)
        return match;
    // Heuristic risk scoring for unseen entities
    if (ipOrIdentifier.startsWith('10.') || ipOrIdentifier.startsWith('192.168.') || ipOrIdentifier === '127.0.0.1') {
        return {
            isMalicious: false,
            threatScore: 5,
            tags: ['INTERNAL_TRUSTED_NETWORK'],
            reputationSummary: 'Private enterprise RFC1918 internal IP address.',
        };
    }
    return {
        isMalicious: false,
        threatScore: 20,
        tags: ['EXTERNAL_UNCLASSIFIED'],
        reputationSummary: 'Public IP address with neutral baseline reputation.',
    };
}
function enrichTelemetryWithThreatIntel(event) {
    const ip = event.network?.sourceIp;
    if (!ip)
        return event;
    const intel = lookupThreatIntelligence(ip);
    return {
        ...event,
        threatIntel: intel,
    };
}
