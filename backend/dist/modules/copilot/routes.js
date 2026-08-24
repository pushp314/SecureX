"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.copilotRoutes = copilotRoutes;
const engine_1 = require("./engine");
async function copilotRoutes(fastify) {
    // Analyze incident with explainable AI copilot
    fastify.get('/api/v1/incidents/:id/copilot-analysis', async (request, reply) => {
        const { id } = request.params;
        try {
            const analysis = await (0, engine_1.analyzeIncidentWithCopilot)(id);
            return reply.send(analysis);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
    // Alias endpoint
    fastify.get('/api/v1/copilot/analyze/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const analysis = await (0, engine_1.analyzeIncidentWithCopilot)(id);
            return reply.send(analysis);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
}
