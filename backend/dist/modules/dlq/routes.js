"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dlqRoutes = dlqRoutes;
const engine_1 = require("./engine");
async function dlqRoutes(fastify) {
    fastify.get('/api/v1/dlq/events', async (_req, reply) => {
        const list = (0, engine_1.getDeadLetterEvents)();
        return reply.send(list);
    });
    fastify.post('/api/v1/dlq/reprocess/:id', async (request, reply) => {
        const { id } = request.params;
        const { category } = request.body || {};
        try {
            const updated = await (0, engine_1.reprocessDeadLetterEvent)(id, category);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
    fastify.post('/api/v1/dlq/simulate-failure', async (request, reply) => {
        const { reason, payload } = request.body || {};
        const item = (0, engine_1.captureDeadLetterEvent)(reason || 'Simulated unparseable byte sequence in event payload stream', payload || '{"unmatched_delimiter": 0xDEADBEEF}');
        return reply.status(201).send(item);
    });
    fastify.delete('/api/v1/dlq/purge', async (_req, reply) => {
        const res = (0, engine_1.purgeDeadLetterQueue)();
        return reply.send(res);
    });
}
