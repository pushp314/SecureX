"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.blastRadiusRoutes = blastRadiusRoutes;
const engine_1 = require("./engine");
async function blastRadiusRoutes(fastify) {
    fastify.get('/api/v1/blast-radius/analyze/:entityKey', async (request, reply) => {
        const { entityKey } = request.params;
        try {
            const result = await engine_1.blastRadiusEngine.analyzeEntity(entityKey);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    fastify.post('/api/v1/blast-radius/lock/:entityKey', async (request, reply) => {
        const { entityKey } = request.params;
        try {
            const result = await engine_1.blastRadiusEngine.lockPerimeter(entityKey);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
