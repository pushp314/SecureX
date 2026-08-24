"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sigmaRoutes = sigmaRoutes;
const engine_1 = require("./engine");
async function sigmaRoutes(fastify) {
    fastify.get('/api/v1/sigma/rules', async (_req, reply) => {
        return reply.send(engine_1.sigmaCompiler.getRules());
    });
    fastify.post('/api/v1/sigma/compile', async (request, reply) => {
        const { yaml } = request.body || {};
        if (!yaml) {
            return reply.status(400).send({ error: 'YAML content is required' });
        }
        const result = engine_1.sigmaCompiler.compileYaml(yaml);
        return reply.send(result);
    });
    fastify.post('/api/v1/sigma/deploy/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const deployed = await engine_1.sigmaCompiler.deployRule(id);
            return reply.send(deployed);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
}
