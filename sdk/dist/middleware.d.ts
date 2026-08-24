import { SecureXClient } from './client';
export interface AuditMiddlewareOptions {
    client: SecureXClient;
    extractUser?: (req: any) => {
        userId?: string;
        username?: string;
        role?: string;
    } | undefined;
    serviceName?: string;
}
/**
 * Express / Node HTTP middleware for automated API audit telemetry
 */
export declare function secureXExpressMiddleware(options: AuditMiddlewareOptions): (req: any, res: any, next: any) => void;
