"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IngestionBatchSchema = exports.TelemetryEventSchema = void 0;
const zod_1 = require("zod");
exports.TelemetryEventSchema = zod_1.z.object({
    eventId: zod_1.z.string().optional(),
    tenantId: zod_1.z.string().default('default-tenant'),
    timestamp: zod_1.z.string().default(() => new Date().toISOString()),
    category: zod_1.z.enum([
        'authentication',
        'api_activity',
        'privilege_change',
        'network_traffic',
        'data_access',
        'system_integrity',
        'threat_signal',
    ]),
    eventType: zod_1.z.string().min(1),
    outcome: zod_1.z.enum(['success', 'failure', 'denied', 'blocked', 'unknown']).default('unknown'),
    severity: zod_1.z.enum(['info', 'low', 'medium', 'high', 'critical']).default('info'),
    sourceService: zod_1.z.string().default('unknown-service'),
    identity: zod_1.z.object({
        userId: zod_1.z.string().optional(),
        username: zod_1.z.string().optional(),
        email: zod_1.z.string().optional(),
        role: zod_1.z.string().optional(),
        sessionId: zod_1.z.string().optional(),
        apiKeyId: zod_1.z.string().optional(),
    }).optional(),
    network: zod_1.z.object({
        sourceIp: zod_1.z.string().default('127.0.0.1'),
        destinationIp: zod_1.z.string().optional(),
        sourcePort: zod_1.z.number().optional(),
        destinationPort: zod_1.z.number().optional(),
        userAgent: zod_1.z.string().optional(),
        geoCountry: zod_1.z.string().optional(),
        geoCity: zod_1.z.string().optional(),
    }).optional(),
    resource: zod_1.z.object({
        resourceId: zod_1.z.string().optional(),
        resourceType: zod_1.z.string().optional(),
        resourceName: zod_1.z.string().optional(),
        action: zod_1.z.string().optional(),
    }).optional(),
    metadata: zod_1.z.record(zod_1.z.any()).optional(),
    traceId: zod_1.z.string().optional(),
});
exports.IngestionBatchSchema = zod_1.z.object({
    events: zod_1.z.array(exports.TelemetryEventSchema),
    sentAt: zod_1.z.string().optional(),
    clientVersion: zod_1.z.string().optional(),
});
