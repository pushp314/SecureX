"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.itdrRoutes = itdrRoutes;
const engine_1 = require("./engine");
async function itdrRoutes(fastify) {
    fastify.get('/api/v1/itdr/identities', async (_req, reply) => {
        const list = (0, engine_1.getManagedIdentities)();
        return reply.send(list);
    });
    fastify.post('/api/v1/itdr/identities/:id/contain', async (request, reply) => {
        const { id } = request.params;
        const { action } = request.body || { action: 'REVOKE_SESSIONS' };
        try {
            const updated = (0, engine_1.containIdentity)(id, action);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
    fastify.post('/api/v1/itdr/stress-test', async (request, reply) => {
        const { scenario, targetUsername } = request.body || {};
        try {
            const result = await (0, engine_1.runIdentityStressTest)(scenario || 'MFA_FATIGUE', targetUsername);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
