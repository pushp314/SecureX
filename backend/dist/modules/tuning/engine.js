"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tuningEngine = exports.AdaptiveTuningEngine = void 0;
const client_1 = require("../../db/client");
// Simulated detection rule performance metrics
const RULE_METRICS = {
    'RULE-001': { firings: 847, escalated: 12, dismissed: 835, threshold: 3 },
    'RULE-002': { firings: 234, escalated: 89, dismissed: 145, threshold: 5 },
    'RULE-003': { firings: 156, escalated: 134, dismissed: 22, threshold: 2 },
    'RULE-004': { firings: 67, escalated: 61, dismissed: 6, threshold: 1 },
    'RULE-005': { firings: 1203, escalated: 8, dismissed: 1195, threshold: 3 },
    'RULE-006': { firings: 312, escalated: 278, dismissed: 34, threshold: 4 },
    'RULE-007': { firings: 89, escalated: 76, dismissed: 13, threshold: 2 },
    'RULE-008': { firings: 445, escalated: 15, dismissed: 430, threshold: 5 },
};
const RULE_NAMES = {
    'RULE-001': 'High-Velocity Login Failure Detection',
    'RULE-002': 'Suspicious Process Execution Chain',
    'RULE-003': 'Cloud IAM Privilege Escalation',
    'RULE-004': 'Mass Data Exfiltration Anomaly',
    'RULE-005': 'Internal Port Scan & Reconnaissance Probe',
    'RULE-006': 'Unauthorized API Token Generation',
    'RULE-007': 'Lateral Movement via RDP/SSH',
    'RULE-008': 'DNS Tunneling & Beaconing Detection',
};
class AdaptiveTuningEngine {
    async analyzeRuleNoise() {
        // Augment with live PostgreSQL incident data
        const openIncidents = await client_1.prisma.incident.count({ where: { status: 'OPEN' } });
        const profiles = [];
        for (const [ruleId, metrics] of Object.entries(RULE_METRICS)) {
            const fpr = Math.round((metrics.dismissed / (metrics.firings || 1)) * 100);
            let status = 'HEALTHY';
            let suppressionRecommendation = 'No changes needed. Rule performance is optimal.';
            let recommendedThreshold = metrics.threshold;
            if (fpr > 80) {
                status = 'NOISY';
                recommendedThreshold = Math.max(metrics.threshold + 3, Math.ceil(metrics.threshold * 2.5));
                suppressionRecommendation = `Increase sliding-window threshold from ${metrics.threshold} to ${recommendedThreshold} events. Add suppression filter for internal RFC1918 source IPs to reduce noise by ~${Math.min(fpr - 15, 85)}%.`;
            }
            else if (fpr > 40) {
                status = 'NOISY';
                recommendedThreshold = metrics.threshold + 2;
                suppressionRecommendation = `Moderate noise detected. Consider raising threshold to ${recommendedThreshold} and adding user-agent allowlist for known scanners.`;
            }
            else if (fpr < 15 && metrics.escalated > 50) {
                status = 'CRITICAL_COVERAGE';
                suppressionRecommendation = 'High-value detection rule with excellent precision. DO NOT suppress — consider lowering threshold for broader catch radius.';
                recommendedThreshold = Math.max(1, metrics.threshold - 1);
            }
            profiles.push({
                ruleId,
                ruleName: RULE_NAMES[ruleId] || ruleId,
                totalFirings: metrics.firings,
                escalatedCount: metrics.escalated,
                dismissedCount: metrics.dismissed,
                falsePositiveRate: fpr,
                currentThreshold: metrics.threshold,
                recommendedThreshold,
                status,
                suppressionRecommendation,
                lastAnalyzedAt: new Date().toISOString(),
            });
        }
        return profiles.sort((a, b) => b.falsePositiveRate - a.falsePositiveRate);
    }
    applyTuning(ruleId) {
        const metrics = RULE_METRICS[ruleId];
        if (!metrics)
            throw new Error(`Rule not found: ${ruleId}`);
        const fpr = Math.round((metrics.dismissed / (metrics.firings || 1)) * 100);
        const previousThreshold = metrics.threshold;
        let newThreshold = previousThreshold;
        const suppressionFilters = [];
        let estimatedNoiseReduction = 0;
        if (fpr > 80) {
            newThreshold = Math.max(previousThreshold + 3, Math.ceil(previousThreshold * 2.5));
            suppressionFilters.push('Suppress alerts from RFC1918 internal IPs (10.0.0.0/8, 192.168.0.0/16)');
            suppressionFilters.push('Exclude known vulnerability scanner user-agents (Qualys, Nessus, Tenable)');
            suppressionFilters.push(`Minimum event count raised from ${previousThreshold} to ${newThreshold} within sliding window`);
            estimatedNoiseReduction = Math.min(fpr - 12, 88);
        }
        else if (fpr > 40) {
            newThreshold = previousThreshold + 2;
            suppressionFilters.push(`Threshold adjusted from ${previousThreshold} to ${newThreshold}`);
            suppressionFilters.push('User-agent allowlist filter applied');
            estimatedNoiseReduction = Math.round(fpr * 0.6);
        }
        else {
            suppressionFilters.push('No tuning needed — rule is performing within acceptable parameters.');
            estimatedNoiseReduction = 0;
        }
        // Apply the tuning
        metrics.threshold = newThreshold;
        // Simulate reducing dismissed count after tuning
        metrics.dismissed = Math.round(metrics.dismissed * (1 - estimatedNoiseReduction / 100));
        metrics.firings = metrics.escalated + metrics.dismissed;
        return {
            ruleId,
            previousThreshold,
            newThreshold,
            suppressionFilters,
            appliedAt: new Date().toISOString(),
            estimatedNoiseReduction,
        };
    }
    getSummary() {
        const profiles = Object.entries(RULE_METRICS);
        const totalFirings = profiles.reduce((acc, [, m]) => acc + m.firings, 0);
        const totalDismissed = profiles.reduce((acc, [, m]) => acc + m.dismissed, 0);
        const overallFpr = Math.round((totalDismissed / (totalFirings || 1)) * 100);
        const noisyRules = profiles.filter(([, m]) => (m.dismissed / (m.firings || 1)) > 0.8).length;
        return {
            totalRulesAnalyzed: profiles.length,
            noisyRules,
            healthyRules: profiles.length - noisyRules,
            overallFalsePositiveRate: overallFpr,
            totalAlertsFired: totalFirings,
            totalDismissed,
            estimatedHoursSavedPerWeek: Math.round(totalDismissed * 0.08),
        };
    }
}
exports.AdaptiveTuningEngine = AdaptiveTuningEngine;
exports.tuningEngine = new AdaptiveTuningEngine();
