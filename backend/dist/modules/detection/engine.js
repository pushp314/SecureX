"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processIncomingTelemetry = processIncomingTelemetry;
const client_1 = require("../../db/client");
const server_1 = require("../websocket/server");
const engine_1 = require("../correlation/engine");
// In-memory sliding time window tracker
// entityKey -> ruleId -> timestamps[]
const slidingWindows = new Map();
async function processIncomingTelemetry(event) {
    // 1. Broadcast live telemetry pulse to SOC frontend
    (0, server_1.broadcastTelemetryPulse)(event);
    // 2. Fetch all enabled detection rules
    const rules = await client_1.prisma.detectionRule.findMany({
        where: { isEnabled: true },
    });
    const sourceIp = event.network?.sourceIp || '127.0.0.1';
    const username = event.identity?.username || event.identity?.userId || 'unknown_user';
    const now = new Date(event.timestamp).getTime() || Date.now();
    for (const rule of rules) {
        try {
            const condition = JSON.parse(rule.conditionJson || '{}');
            let isMatch = false;
            let matchedEntity = `ip:${sourceIp}`;
            if (rule.ruleType === 'threshold') {
                // Check if event type matches rule condition
                if (condition.eventTypes && condition.eventTypes.includes(event.eventType)) {
                    const entityKey = condition.groupBy === 'user' ? `user:${username}` : `ip:${sourceIp}`;
                    matchedEntity = entityKey;
                    if (!slidingWindows.has(entityKey)) {
                        slidingWindows.set(entityKey, new Map());
                    }
                    const ruleMap = slidingWindows.get(entityKey);
                    if (!ruleMap.has(rule.ruleId)) {
                        ruleMap.set(rule.ruleId, []);
                    }
                    const timestamps = ruleMap.get(rule.ruleId);
                    // Filter out timestamps outside window
                    const cutoff = now - (rule.windowSeconds * 1000);
                    const validTimestamps = timestamps.filter((t) => t >= cutoff);
                    validTimestamps.push(now);
                    ruleMap.set(rule.ruleId, validTimestamps);
                    if (validTimestamps.length >= rule.thresholdCount) {
                        isMatch = true;
                        // Clear or reset window to avoid duplicate spamming
                        ruleMap.set(rule.ruleId, []);
                    }
                }
            }
            else if (rule.ruleType === 'pattern') {
                // Pattern match on eventType + metadata/outcome
                if (condition.eventType === event.eventType) {
                    if (!condition.outcome || condition.outcome === event.outcome) {
                        if (condition.fieldChecks) {
                            let allPass = true;
                            for (const [key, val] of Object.entries(condition.fieldChecks)) {
                                if (event.metadata?.[key] !== val && event[key] !== val) {
                                    allPass = false;
                                    break;
                                }
                            }
                            if (allPass)
                                isMatch = true;
                        }
                        else {
                            isMatch = true;
                        }
                    }
                }
            }
            if (isMatch) {
                const alertId = `alt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
                const alert = await client_1.prisma.alert.create({
                    data: {
                        alertId,
                        ruleId: rule.ruleId,
                        ruleName: rule.name,
                        severity: rule.severity,
                        mitreTactic: rule.mitreTactic,
                        mitreTechnique: rule.mitreTechnique,
                        description: `${rule.name}: Detected suspicious behavior on ${matchedEntity}`,
                        entityKey: matchedEntity,
                        detailsJson: JSON.stringify({
                            triggerEvent: event,
                            ruleConfig: condition,
                        }),
                        timestamp: new Date(),
                    },
                });
                console.log(`[Detection Engine] 🚨 ALERT TRIGGERED: ${rule.name} on ${matchedEntity}`);
                (0, server_1.broadcastAlert)(alert);
                // Correlate into Incident Workspace
                await (0, engine_1.correlateAlert)(alert, event);
            }
        }
        catch (err) {
            console.error(`[Detection Engine] Error evaluating rule ${rule.ruleId}:`, err);
        }
    }
}
