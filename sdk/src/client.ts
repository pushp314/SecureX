import { TelemetryEvent, TelemetryBatchPayload } from './schema';

export interface SecureXConfig {
  apiKey: string;
  endpointUrl: string; // e.g. 'http://localhost:3000/api/v1/telemetry/ingest'
  serviceName: string;
  tenantId?: string;
  batchSize?: number;
  flushIntervalMs?: number;
  maxQueueSize?: number;
  debug?: boolean;
}

export class SecureXClient {
  private config: Required<SecureXConfig>;
  private queue: TelemetryEvent[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isFlushing = false;

  constructor(config: SecureXConfig) {
    this.config = {
      apiKey: config.apiKey,
      endpointUrl: config.endpointUrl.replace(/\/$/, ''),
      serviceName: config.serviceName,
      tenantId: config.tenantId || 'default-tenant',
      batchSize: config.batchSize ?? 25,
      flushIntervalMs: config.flushIntervalMs ?? 2000,
      maxQueueSize: config.maxQueueSize ?? 5000,
      debug: config.debug ?? false,
    };

    this.startAutoFlush();
  }

  public record(event: Omit<TelemetryEvent, 'timestamp' | 'sourceService' | 'tenantId'> & { timestamp?: string; sourceService?: string; tenantId?: string }): void {
    if (this.queue.length >= this.config.maxQueueSize) {
      if (this.config.debug) {
        console.warn(`[SecureX SDK] Queue overflow (${this.queue.length} events). Dropping oldest event.`);
      }
      this.queue.shift();
    }

    const completeEvent: TelemetryEvent = {
      eventId: event.eventId || this.generateUUID(),
      tenantId: event.tenantId || this.config.tenantId,
      timestamp: event.timestamp || new Date().toISOString(),
      sourceService: event.sourceService || this.config.serviceName,
      category: event.category,
      eventType: event.eventType,
      outcome: event.outcome,
      severity: event.severity || 'info',
      identity: event.identity,
      network: event.network,
      resource: event.resource,
      metadata: event.metadata,
      traceId: event.traceId,
    };

    this.queue.push(completeEvent);

    if (this.queue.length >= this.config.batchSize) {
      this.flush().catch((err) => {
        if (this.config.debug) console.error('[SecureX SDK] Batch flush failed:', err);
      });
    }
  }

  public async flush(): Promise<void> {
    if (this.queue.length === 0 || this.isFlushing) return;

    this.isFlushing = true;
    const batch = this.queue.splice(0, this.config.batchSize);

    const payload: TelemetryBatchPayload = {
      events: batch,
      sentAt: new Date().toISOString(),
      clientVersion: '1.0.0',
    };

    try {
      const response = await fetch(this.config.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SecureX-API-Key': this.config.apiKey,
          'X-SecureX-Tenant': this.config.tenantId,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ingestion failed with status ${response.status}: ${errorText}`);
      }

      if (this.config.debug) {
        console.log(`[SecureX SDK] Successfully flushed ${batch.length} events.`);
      }
    } catch (error) {
      if (this.config.debug) {
        console.error('[SecureX SDK] Error sending telemetry:', error);
      }
      // Re-insert un-sent events at the beginning of the queue with safety ceiling
      if (this.queue.length + batch.length <= this.config.maxQueueSize) {
        this.queue.unshift(...batch);
      }
    } finally {
      this.isFlushing = false;
    }
  }

  private startAutoFlush(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.flush().catch(() => {});
    }, this.config.flushIntervalMs);

    if (typeof process !== 'undefined' && process.on) {
      process.on('beforeExit', async () => {
        await this.flush();
      });
    }
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
