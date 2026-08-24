"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.devsecopsRoutes = devsecopsRoutes;
const engine_1 = require("./engine");
async function devsecopsRoutes(fastify) {
    fastify.get('/api/v1/devsecops/events', async (_req, reply) => {
        return reply.send((0, engine_1.getDevSecOpsEvents)());
    });
    fastify.get('/api/v1/devsecops/stats', async (_req, reply) => {
        return reply.send((0, engine_1.getDevSecOpsStats)());
    });
    fastify.post('/api/v1/devsecops/events', async (request, reply) => {
        const body = request.body;
        try {
            const created = (0, engine_1.recordDevSecOpsEvent)(body);
            return reply.status(201).send(created);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.patch('/api/v1/devsecops/events/:id/status', async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body || {};
        try {
            const updated = (0, engine_1.resolveDevSecOpsFinding)(id, status || 'RESOLVED');
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
