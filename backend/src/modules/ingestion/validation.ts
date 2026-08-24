import { z } from 'zod';

export const TelemetryEventSchema = z.object({
  eventId: z.string().optional(),
  tenantId: z.string().default('default-tenant'),
  timestamp: z.string().default(() => new Date().toISOString()),
  category: z.enum([
    'authentication',
    'api_activity',
    'privilege_change',
    'network_traffic',
    'data_access',
    'system_integrity',
    'threat_signal',
  ]),
  eventType: z.string().min(1),
  outcome: z.enum(['success', 'failure', 'denied', 'blocked', 'unknown']).default('unknown'),
  severity: z.enum(['info', 'low', 'medium', 'high', 'critical']).default('info'),
  sourceService: z.string().default('unknown-service'),
  
  identity: z.object({
    userId: z.string().optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    role: z.string().optional(),
    sessionId: z.string().optional(),
    apiKeyId: z.string().optional(),
  }).optional(),
  
  network: z.object({
    sourceIp: z.string().default('127.0.0.1'),
    destinationIp: z.string().optional(),
    sourcePort: z.number().optional(),
    destinationPort: z.number().optional(),
    userAgent: z.string().optional(),
    geoCountry: z.string().optional(),
    geoCity: z.string().optional(),
  }).optional(),
  
  resource: z.object({
    resourceId: z.string().optional(),
    resourceType: z.string().optional(),
    resourceName: z.string().optional(),
    action: z.string().optional(),
  }).optional(),
  
  metadata: z.record(z.any()).optional(),
  traceId: z.string().optional(),
});

export const IngestionBatchSchema = z.object({
  events: z.array(TelemetryEventSchema),
  sentAt: z.string().optional(),
  clientVersion: z.string().optional(),
});

export type ValidatedTelemetryEvent = z.infer<typeof TelemetryEventSchema>;
export type ValidatedBatch = z.infer<typeof IngestionBatchSchema>;
