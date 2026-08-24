/**
 * SecureX Telemetry Schema Specification
 * Formal event definitions matching SecureX platform standards
 */

export type EventCategory = 
  | 'authentication'
  | 'api_activity'
  | 'privilege_change'
  | 'network_traffic'
  | 'data_access'
  | 'system_integrity'
  | 'threat_signal';

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
  resourceType?: string; // e.g. 'user_account', 'database_table', 'api_endpoint', 's3_bucket'
  resourceName?: string;
  action?: string;       // e.g. 'read', 'update', 'delete', 'execute', 'escalate'
}

export interface TelemetryEvent {
  eventId?: string;
  tenantId?: string;
  timestamp: string; // ISO 8601
  category: EventCategory;
  eventType: string; // e.g. 'auth.login_failed', 'api.token_abuse', 'iam.role_escalation'
  outcome: EventOutcome;
  severity: TelemetrySeverity;
  sourceService: string; // e.g. 'auth-service', 'payment-gateway', 'api-gateway'
  
  // Contextual Sub-blocks
  identity?: TelemetryIdentity;
  network?: TelemetryNetwork;
  resource?: TelemetryResource;
  
  // Custom operational metadata
  metadata?: Record<string, any>;
  
  // Diagnostic tracing
  traceId?: string;
}

export interface TelemetryBatchPayload {
  events: TelemetryEvent[];
  sentAt: string;
  clientVersion: string;
}
