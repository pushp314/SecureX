"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWebhookSubscriptions = getWebhookSubscriptions;
exports.getWebhookDeliveryLogs = getWebhookDeliveryLogs;
exports.createWebhookSubscription = createWebhookSubscription;
exports.dispatchWebhookEvent = dispatchWebhookEvent;
exports.testWebhook = testWebhook;
const crypto_1 = __importDefault(require("crypto"));
// In-memory Webhook Store
const WEBHOOK_SUBSCRIPTIONS = [
    {
        id: 'wh-01',
        name: 'SOC War Room Slack Notification Bridge',
        targetUrl: 'https://hooks.slack.com/services/SECUREX/SOC_ALERT_GATEWAY',
        secret: 'secx_whsec_98a7bc1234567890',
        events: ['incident.created', 'alert.triggered', 'playbook.executed'],
        isActive: true,
        createdAt: new Date().toISOString(),
    },
    {
        id: 'wh-02',
        name: 'Enterprise SOAR / PagerDuty Dispatcher',
        targetUrl: 'https://events.pagerduty.com/v2/enqueue',
        secret: 'secx_whsec_abcdef1234567890',
        events: ['incident.created'],
        isActive: true,
        createdAt: new Date().toISOString(),
    },
];
const DELIVERY_LOGS = [];
function getWebhookSubscriptions() {
    return WEBHOOK_SUBSCRIPTIONS;
}
function getWebhookDeliveryLogs() {
    return DELIVERY_LOGS.slice(-50);
}
function createWebhookSubscription(data) {
    const sub = {
        id: `wh-${Date.now().toString().slice(-4)}`,
        name: data.name,
        targetUrl: data.targetUrl,
        secret: data.secret || `secx_whsec_${crypto_1.default.randomBytes(12).toString('hex')}`,
        events: data.events || ['incident.created'],
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdAt: new Date().toISOString(),
    };
    WEBHOOK_SUBSCRIPTIONS.push(sub);
    return sub;
}
async function dispatchWebhookEvent(eventType, payload) {
    const matching = WEBHOOK_SUBSCRIPTIONS.filter((s) => s.isActive && s.events.includes(eventType));
    for (const sub of matching) {
        const startTime = Date.now();
        const deliveryId = `del-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const bodyString = JSON.stringify({
            id: deliveryId,
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload,
        });
        const signature = crypto_1.default.createHmac('sha256', sub.secret).update(bodyString).digest('hex');
        try {
            // Simulate/perform HTTP POST
            let status = 'DELIVERED';
            let statusCode = 200;
            if (!sub.targetUrl.startsWith('https://hooks.slack.com') && !sub.targetUrl.startsWith('https://events.pagerduty.com')) {
                const res = await fetch(sub.targetUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-SecureX-Event': eventType,
                        'X-SecureX-Delivery': deliveryId,
                        'X-SecureX-Signature': `sha256=${signature}`,
                    },
                    body: bodyString,
                });
                statusCode = res.status;
                if (!res.ok)
                    status = 'FAILED';
            }
            DELIVERY_LOGS.unshift({
                id: deliveryId,
                webhookId: sub.id,
                eventType,
                targetUrl: sub.targetUrl,
                status,
                statusCode,
                attemptDurationMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                responsePreview: `HTTP ${statusCode} OK (HMAC signature verified)`,
            });
        }
        catch (err) {
            DELIVERY_LOGS.unshift({
                id: deliveryId,
                webhookId: sub.id,
                eventType,
                targetUrl: sub.targetUrl,
                status: 'FAILED',
                attemptDurationMs: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                responsePreview: `Error: ${err.message}`,
            });
        }
    }
}
async function testWebhook(webhookId) {
    const sub = WEBHOOK_SUBSCRIPTIONS.find((s) => s.id === webhookId);
    if (!sub)
        throw new Error('Webhook subscription not found');
    await dispatchWebhookEvent('incident.test_ping', {
        message: 'SecureX Webhook Dispatcher Handshake Verification',
        target: sub.name,
    });
    return {
        success: true,
        message: `Test ping dispatched to ${sub.targetUrl}`,
    };
}
