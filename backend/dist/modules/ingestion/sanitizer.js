"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeTelemetryPayload = sanitizeTelemetryPayload;
const SENSITIVE_KEY_PATTERNS = [
    /password/i,
    /secret/i,
    /token/i,
    /authorization/i,
    /credit[-_]?card/i,
    /card[-_]?number/i,
    /cvv/i,
    /ssn/i,
    /api[-_]?key/i,
    /bearer/i,
    /private[-_]?key/i,
];
const CREDIT_CARD_REGEX = /\b(?:\d{4}[ -]?){3}\d{4}\b/g;
const JWT_REGEX = /ey[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g;
function sanitizeTelemetryPayload(obj) {
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === 'string') {
        let sanitized = obj.replace(CREDIT_CARD_REGEX, '[REDACTED_CREDIT_CARD]');
        if (sanitized.startsWith('Bearer ey')) {
            sanitized = 'Bearer [REDACTED_JWT_TOKEN]';
        }
        return sanitized;
    }
    if (Array.isArray(obj)) {
        return obj.map((item) => sanitizeTelemetryPayload(item));
    }
    if (typeof obj === 'object') {
        const sanitizedObj = {};
        for (const [key, value] of Object.entries(obj)) {
            const isSensitiveKey = SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
            if (isSensitiveKey && typeof value === 'string') {
                sanitizedObj[key] = '[REDACTED_SECRET]';
            }
            else {
                sanitizedObj[key] = sanitizeTelemetryPayload(value);
            }
        }
        return sanitizedObj;
    }
    return obj;
}
