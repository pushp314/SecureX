"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.tuningRoutes = tuningRoutes;
const engine_1 = require("./engine");
async function tuningRoutes(fastify) {
    fastify.get('/api/v1/tuning/rules', async (_req, reply) => {
        const profiles = await engine_1.tuningEngine.analyzeRuleNoise();
        return reply.send(profiles);
    });
    fastify.get('/api/v1/tuning/summary', async (_req, reply) => {
        return reply.send(engine_1.tuningEngine.getSummary());
    });
    fastify.post('/api/v1/tuning/apply/:ruleId', async (request, reply) => {
        const { ruleId } = request.params;
        try {
            const result = engine_1.tuningEngine.applyTuning(ruleId);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
}
