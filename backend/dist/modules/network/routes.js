"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.networkRoutes = networkRoutes;
const engine_1 = require("./engine");
async function networkRoutes(fastify) {
    fastify.get('/api/v1/network/flows', async (request, reply) => {
        const limit = parseInt(request.query.limit || '100', 10);
        return reply.send((0, engine_1.getNetworkFlows)(limit));
    });
    fastify.get('/api/v1/network/anomalies', async (_req, reply) => {
        return reply.send((0, engine_1.getNetworkAnomalies)());
    });
    fastify.get('/api/v1/network/stats', async (_req, reply) => {
        return reply.send((0, engine_1.getNetworkStats)());
    });
    fastify.get('/api/v1/network/geo-radar', async (_req, reply) => {
        const data = await (0, engine_1.getGeoRadarOrigins)();
        return reply.send(data);
    });
    fastify.post('/api/v1/network/flows/simulate', async (request, reply) => {
        const body = request.body;
        const flow = (0, engine_1.recordNetworkFlow)(body);
        return reply.status(201).send(flow);
    });
}
