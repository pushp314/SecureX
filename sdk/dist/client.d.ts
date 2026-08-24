import { TelemetryEvent } from './schema';
export interface SecureXConfig {
    apiKey: string;
    endpointUrl: string;
    serviceName: string;
    tenantId?: string;
    batchSize?: number;
    flushIntervalMs?: number;
    maxQueueSize?: number;
    debug?: boolean;
}
export declare class SecureXClient {
    private config;
    private queue;
    private timer;
    private isFlushing;
    constructor(config: SecureXConfig);
    record(event: Omit<TelemetryEvent, 'timestamp' | 'sourceService' | 'tenantId'> & {
        timestamp?: string;
        sourceService?: string;
        tenantId?: string;
    }): void;
    flush(): Promise<void>;
    private startAutoFlush;
    stop(): void;
    private generateUUID;
}
