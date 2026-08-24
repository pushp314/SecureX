"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uebaRoutes = uebaRoutes;
const engine_1 = require("./engine");
async function uebaRoutes(fastify) {
    fastify.get('/api/v1/ueba/profiles', async (request, reply) => {
        const profiles = engine_1.uebaEngine.getProfiles();
        return reply.send(profiles);
    });
    fastify.get('/api/v1/ueba/anomalies', async (request, reply) => {
        const anomalies = engine_1.uebaEngine.getAnomalousProfiles();
        return reply.send(anomalies);
    });
}
