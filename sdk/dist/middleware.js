"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.secureXExpressMiddleware = secureXExpressMiddleware;
/**
 * Express / Node HTTP middleware for automated API audit telemetry
 */
function secureXExpressMiddleware(options) {
    return (req, res, next) => {
        const startTime = Date.now();
        const sourceIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';
        const userAgent = req.headers['user-agent'] || 'unknown';
        res.on('finish', () => {
            const durationMs = Date.now() - startTime;
            const statusCode = res.statusCode;
            const isError = statusCode >= 400;
            const isAuthFail = statusCode === 401 || statusCode === 403;
            const user = options.extractUser ? options.extractUser(req) : undefined;
            options.client.record({
                category: isAuthFail ? 'authentication' : 'api_activity',
                eventType: isAuthFail ? 'auth.access_denied' : (isError ? 'api.request_error' : 'api.request_success'),
                outcome: isError ? 'failure' : 'success',
                severity: isAuthFail ? 'medium' : (statusCode >= 500 ? 'high' : 'info'),
                identity: user,
                network: {
                    sourceIp,
                    userAgent,
                },
                resource: {
                    resourceType: 'http_endpoint',
                    resourceName: req.originalUrl || req.url,
                    action: req.method,
                },
                metadata: {
                    statusCode,
                    durationMs,
                    method: req.method,
                    path: req.baseUrl + req.path,
                },
            });
        });
        next();
    };
}
