"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cloudRoutes = cloudRoutes;
const engine_1 = require("./engine");
async function cloudRoutes(fastify) {
    fastify.get('/api/v1/cloud/posture', async (_req, reply) => {
        const list = (0, engine_1.getCloudPostureList)();
        return reply.send(list);
    });
    fastify.get('/api/v1/cloud/summary', async (_req, reply) => {
        const summary = (0, engine_1.getCloudPostureSummary)();
        return reply.send(summary);
    });
    fastify.post('/api/v1/cloud/remediate/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const updated = (0, engine_1.remediateCloudResource)(id);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
}
