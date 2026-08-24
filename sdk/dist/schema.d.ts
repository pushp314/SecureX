/**
 * SecureX Telemetry Schema Specification
 * Formal event definitions matching SecureX platform standards
 */
export type EventCategory = 'authentication' | 'api_activity' | 'privilege_change' | 'network_traffic' | 'data_access' | 'system_integrity' | 'threat_signal';
export type EventOutcome = 'success' | 'failure' | 'denied' | 'blocked' | 'unknown';
export type TelemetrySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export interface TelemetryIdentity {
    userId?: string;
    username?: string;
    email?: string;
    role?: string;
    sessionId?: string;
    apiKeyId?: string;
}
export interface TelemetryNetwork {
    sourceIp: string;
    destinationIp?: string;
    sourcePort?: number;
    destinationPort?: number;
    userAgent?: string;
    geoCountry?: string;
    geoCity?: string;
}
export interface TelemetryResource {
    resourceId?: string;
    resourceType?: string;
    resourceName?: string;
    action?: string;
}
export interface TelemetryEvent {
    eventId?: string;
    tenantId?: string;
    timestamp: string;
    category: EventCategory;
    eventType: string;
    outcome: EventOutcome;
    severity: TelemetrySeverity;
    sourceService: string;
    identity?: TelemetryIdentity;
    network?: TelemetryNetwork;
    resource?: TelemetryResource;
    metadata?: Record<string, any>;
    traceId?: string;
}
export interface TelemetryBatchPayload {
    events: TelemetryEvent[];
    sentAt: string;
    clientVersion: string;
}
