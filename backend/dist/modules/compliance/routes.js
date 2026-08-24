"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.complianceRoutes = complianceRoutes;
const engine_1 = require("./engine");
async function complianceRoutes(fastify) {
    fastify.get('/api/v1/compliance/frameworks', async (_req, reply) => {
        const list = await (0, engine_1.getComplianceFrameworks)();
        return reply.send(list);
    });
    fastify.get('/api/v1/compliance/d3fend', async (_req, reply) => {
        const list = (0, engine_1.getD3FENDMatrix)();
        return reply.send(list);
    });
    fastify.get('/api/v1/compliance/report', async (_req, reply) => {
        const report = await (0, engine_1.generateExecutiveComplianceReport)();
        return reply.send(report);
    });
}
