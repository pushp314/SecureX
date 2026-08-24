import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { sigmaCompiler } from './engine';

export async function sigmaRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/sigma/rules', async (_req, reply) => {
    return reply.send(sigmaCompiler.getRules());
  });

  fastify.post<{ Body: { yaml: string } }>('/api/v1/sigma/compile', async (request, reply) => {
    const { yaml } = request.body || {};
    if (!yaml) {
      return reply.status(400).send({ error: 'YAML content is required' });
    }
    const result = sigmaCompiler.compileYaml(yaml);
    return reply.send(result);
  });

  fastify.post<{ Params: { id: string } }>('/api/v1/sigma/deploy/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const deployed = await sigmaCompiler.deployRule(id);
      return reply.send(deployed);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
