"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhooksRoutes = webhooksRoutes;
const dispatcher_1 = require("./dispatcher");
async function webhooksRoutes(fastify) {
    // List all webhook subscriptions
    fastify.get('/api/v1/webhooks', async (_req, reply) => {
        const list = (0, dispatcher_1.getWebhookSubscriptions)();
        return reply.send(list);
    });
    // Create new webhook subscription
    fastify.post('/api/v1/webhooks', async (request, reply) => {
        const body = request.body;
        try {
            const created = (0, dispatcher_1.createWebhookSubscription)(body);
            return reply.status(201).send(created);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    // List delivery logs
    fastify.get('/api/v1/webhooks/logs', async (_req, reply) => {
        const logs = (0, dispatcher_1.getWebhookDeliveryLogs)();
        return reply.send(logs);
    });
    // Test webhook dispatch
    fastify.post('/api/v1/webhooks/test/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const result = await (0, dispatcher_1.testWebhook)(id);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
}
