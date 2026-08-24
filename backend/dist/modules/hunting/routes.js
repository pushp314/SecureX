"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.huntingRoutes = huntingRoutes;
const engine_1 = require("./engine");
async function huntingRoutes(fastify) {
    // List hunt templates
    fastify.get('/api/v1/hunting/templates', async (_req, reply) => {
        return reply.send(engine_1.HUNT_TEMPLATES);
    });
    // Execute a hunt query
    fastify.post('/api/v1/hunting/execute', async (request, reply) => {
        const body = request.body;
        try {
            const result = await (0, engine_1.executeThreatHunt)(body.filter || {});
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
    // Convert a successful hunt into a permanent detection rule
    fastify.post('/api/v1/hunting/convert-to-rule', async (request, reply) => {
        const body = request.body;
        try {
            const rule = await (0, engine_1.convertHuntToDetectionRule)(body);
            return reply.status(201).send(rule);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
