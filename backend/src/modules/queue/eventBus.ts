import Redis from 'ioredis';
import { config } from '../../config/env';
import { processIncomingTelemetry } from '../detection/engine';

export type EventHandler = (event: any) => Promise<void>;

class EventBus {
  private redisClient: Redis | null = null;
  private inMemoryQueue: any[] = [];
  private isProcessing = false;
  private handlers: EventHandler[] = [];
  private useRedis = false;

  constructor() {
    this.init();
  }

  private async init() {
    try {
      const client = new Redis(config.redisUrl, {
        maxRetriesPerRequest: 1,
        retryStrategy: () => null, // don't hang if redis is not running
        connectTimeout: 1000,
        lazyConnect: true,
      });

      await client.connect();
      this.redisClient = client;
      this.useRedis = true;
      console.log('[EventBus] Connected to Redis Stream Queue');
    } catch {
      this.useRedis = false;
      console.log('[EventBus] Using In-Memory Ring Buffer Event Bus (Zero-latency)');
    }

    // Start background processor loop
    this.startWorker();
  }

  public registerHandler(handler: EventHandler) {
    this.handlers.push(handler);
  }

  public async publishTelemetry(event: any): Promise<void> {
    if (this.useRedis && this.redisClient) {
      try {
        await this.redisClient.xadd('securex:telemetry:stream', '*', 'payload', JSON.stringify(event));
      } catch (err) {
        // Redis optional
      }
    }

    // Direct in-process execution for registered detection handlers
    for (const handler of this.handlers) {
      handler(event).catch((err) => console.error('[EventBus Handler Error]', err));
    }
  }

  private async startWorker() {
    setInterval(async () => {
      if (this.isProcessing) return;
      this.isProcessing = true;

      try {
        while (this.inMemoryQueue.length > 0) {
          const event = this.inMemoryQueue.shift();
          if (event) {
            for (const handler of this.handlers) {
              await handler(event).catch((err) => console.error('[EventBus Handler Error]', err));
            }
          }
        }
      } finally {
        this.isProcessing = false;
      }
    }, 50); // 50ms polling loop
  }
}

export const eventBus = new EventBus();

// Wire default detection engine handler
eventBus.registerHandler(async (event) => {
  await processIncomingTelemetry(event);
});
