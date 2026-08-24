"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.retentionRoutes = retentionRoutes;
const engine_1 = require("./engine");
async function retentionRoutes(fastify) {
    fastify.get('/api/v1/retention/tiers', async (request, reply) => {
        const tiers = await engine_1.dataRetentionEngine.getStorageTierStatus();
        return reply.send(tiers);
    });
    fastify.get('/api/v1/retention/policies', async (request, reply) => {
        const policies = engine_1.dataRetentionEngine.getPolicies();
        return reply.send(policies);
    });
    fastify.post('/api/v1/retention/archive', async (request, reply) => {
        const result = await engine_1.dataRetentionEngine.triggerArchivalCycle();
        return reply.send(result);
    });
}
