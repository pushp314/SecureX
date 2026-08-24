"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sandboxRoutes = sandboxRoutes;
const engine_1 = require("./engine");
async function sandboxRoutes(fastify) {
    fastify.get('/api/v1/sandbox/analyses', async (_req, reply) => {
        const list = (0, engine_1.getPastSandboxAnalyses)();
        return reply.send(list);
    });
    fastify.post('/api/v1/sandbox/analyze', async (request, reply) => {
        const body = request.body;
        if (!body || !body.sampleName) {
            return reply.status(400).send({ error: 'Missing sampleName' });
        }
        const result = (0, engine_1.analyzeMalwareSample)(body.sampleName, body.fileHash);
        return reply.status(201).send(result);
    });
}
