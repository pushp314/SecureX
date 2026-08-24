"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.kqlRoutes = kqlRoutes;
const engine_1 = require("./engine");
async function kqlRoutes(fastify) {
    fastify.post('/api/v1/siem/query', async (request, reply) => {
        const { query } = request.body || {};
        if (!query) {
            return reply.status(400).send({ error: 'Query string is required' });
        }
        try {
            const result = await engine_1.siemQueryEngine.executeQuery(query);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
