"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.threatIntelRoutes = threatIntelRoutes;
const engine_1 = require("./engine");
async function threatIntelRoutes(fastify) {
    fastify.get('/api/v1/threatintel/indicators', async (request, reply) => {
        const list = engine_1.threatIntelEngine.getIndicators();
        return reply.send(list);
    });
    fastify.get('/api/v1/threatintel/lookup', async (request, reply) => {
        const { value } = request.query;
        if (!value) {
            return reply.status(400).send({ error: 'Indicator value is required' });
        }
        const result = engine_1.threatIntelEngine.checkIndicator(value);
        return reply.send(result);
    });
    fastify.post('/api/v1/threatintel/indicators', async (request, reply) => {
        const body = request.body;
        if (!body?.value || !body?.indicatorType) {
            return reply.status(400).send({ error: 'Value and indicatorType are required' });
        }
        const created = engine_1.threatIntelEngine.addIndicator(body);
        return reply.status(201).send(created);
    });
}
