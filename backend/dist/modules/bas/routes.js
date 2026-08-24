"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.basRoutes = basRoutes;
const engine_1 = require("./engine");
async function basRoutes(fastify) {
    fastify.get('/api/v1/bas/tests', async (_req, reply) => {
        return reply.send(engine_1.basEngine.getTests());
    });
    fastify.post('/api/v1/bas/run/:testId', async (request, reply) => {
        const { testId } = request.params;
        try {
            const result = await engine_1.basEngine.runTest(testId);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
    fastify.get('/api/v1/bas/matrix', async (_req, reply) => {
        return reply.send(engine_1.basEngine.getMatrixSummary());
    });
}
