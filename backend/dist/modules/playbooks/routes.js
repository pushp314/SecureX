"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.playbooksRoutes = playbooksRoutes;
const engine_1 = require("./engine");
async function playbooksRoutes(fastify) {
    // List available playbooks
    fastify.get('/api/v1/playbooks', async (_req, reply) => {
        return reply.send(engine_1.AVAILABLE_PLAYBOOKS);
    });
    // Execute a playbook on an incident
    fastify.post('/api/v1/playbooks/execute', async (request, reply) => {
        const body = request.body;
        const { playbookId, incidentId, executedBy } = body;
        if (!playbookId || !incidentId) {
            return reply.status(400).send({ error: 'Missing playbookId or incidentId' });
        }
        try {
            const result = await (0, engine_1.executePlaybook)(playbookId, incidentId, executedBy);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
}
