"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.observabilityRoutes = observabilityRoutes;
const engine_1 = require("./engine");
async function observabilityRoutes(fastify) {
    fastify.get('/api/v1/observability/metrics', async (_req, reply) => {
        const diagnostics = await (0, engine_1.getPlatformDiagnostics)();
        return reply.send(diagnostics);
    });
    fastify.post('/api/v1/observability/self-test', async (_req, reply) => {
        const testResults = await (0, engine_1.runSelfDiagnosticSuite)();
        return reply.send(testResults);
    });
}
