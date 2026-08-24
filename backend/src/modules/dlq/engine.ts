import { eventBus } from '../queue/eventBus';

export interface DeadLetterEvent {
  id: string;
  failedAt: string;
  errorReason: string;
  rawPayload: string;
  sourceIp: string;
  sourceService: string;
  retryCount: number;
  status: 'QUARANTINED' | 'REPROCESSED' | 'DISCARDED';
}

const DLQ_STORE: DeadLetterEvent[] = [
  {
    id: 'dlq-01',
    failedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    errorReason: 'Invalid enum category: "crypto_mining_alert" not recognized in TelemetryEventSchema',
    rawPayload: JSON.stringify({
      category: 'crypto_mining_alert',
      eventType: 'process.high_cpu_miner',
      sourceService: 'k8s-worker-node-04',
      network: { sourceIp: '10.0.12.88' },
      metadata: { hashRateMhs: 420 },
    }),
    sourceIp: '10.0.12.88',
    sourceService: 'k8s-worker-node-04',
    retryCount: 0,
    status: 'QUARANTINED',
  },
  {
    id: 'dlq-02',
    failedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    errorReason: 'Malformed JSON payload: unexpected token at position 44',
    rawPayload: '{"category":"api_activity","eventType":"api.probe",sourceService:unquoted_value}',
    sourceIp: '198.51.100.99',
    sourceService: 'legacy-gateway',
    retryCount: 1,
    status: 'QUARANTINED',
  },
  {
    id: 'dlq-03',
    failedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    errorReason: 'Validation error: outcome must be one of [success, failure, denied, blocked, unknown]',
    rawPayload: JSON.stringify({
      category: 'authentication',
      eventType: 'auth.saml_post',
      outcome: 'INVALID_STATUS_CODE_99',
      sourceService: 'idp-relay',
      network: { sourceIp: '192.168.1.50' },
    }),
    sourceIp: '192.168.1.50',
    sourceService: 'idp-relay',
    retryCount: 0,
    status: 'QUARANTINED',
  },
];

export function getDeadLetterEvents(): DeadLetterEvent[] {
  return DLQ_STORE;
}

export function captureDeadLetterEvent(errorReason: string, rawPayload: any, sourceIp = '127.0.0.1', sourceService = 'ingestion-gateway'): DeadLetterEvent {
  const dlqItem: DeadLetterEvent = {
    id: `dlq-${Date.now()}`,
    failedAt: new Date().toISOString(),
    errorReason,
    rawPayload: typeof rawPayload === 'string' ? rawPayload : JSON.stringify(rawPayload),
    sourceIp,
    sourceService,
    retryCount: 0,
    status: 'QUARANTINED',
  };

  DLQ_STORE.unshift(dlqItem);
  return dlqItem;
}

export async function reprocessDeadLetterEvent(id: string, repairedCategory = 'threat_signal'): Promise<DeadLetterEvent> {
  const item = DLQ_STORE.find((i) => i.id === id);
  if (!item) throw new Error(`Dead letter event not found: ${id}`);

  let parsed: any;
  try {
    parsed = JSON.parse(item.rawPayload);
  } catch {
    parsed = {
      category: repairedCategory,
      eventType: 'repaired.raw_event',
      outcome: 'unknown',
      severity: 'info',
      metadata: { originalCorruptedPayload: item.rawPayload },
    };
  }

  // Force valid schema
  const repairedEvent = {
    timestamp: new Date().toISOString(),
    category: repairedCategory,
    eventType: parsed.eventType || 'telemetry.reprocessed_event',
    outcome: 'unknown' as const,
    severity: 'medium' as const,
    sourceService: item.sourceService || 'dlq-recovery-service',
    network: { sourceIp: item.sourceIp || '127.0.0.1' },
    metadata: { reprocessedFromDlqId: item.id, ...parsed.metadata },
  };

  await eventBus.publishTelemetry(repairedEvent);

  item.status = 'REPROCESSED';
  item.retryCount += 1;
  return item;
}

export function purgeDeadLetterQueue() {
  DLQ_STORE.length = 0;
  return { purgedCount: 0, status: 'PURGED' };
}
