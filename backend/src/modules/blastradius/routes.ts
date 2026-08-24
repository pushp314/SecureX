import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { blastRadiusEngine } from './engine';

export async function blastRadiusRoutes(fastify: FastifyInstance) {
  fastify.get<{ Params: { entityKey: string } }>('/api/v1/blast-radius/analyze/:entityKey', async (request, reply) => {
    const { entityKey } = request.params;
    try {
      const result = await blastRadiusEngine.analyzeEntity(entityKey);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.post<{ Params: { entityKey: string } }>('/api/v1/blast-radius/lock/:entityKey', async (request, reply) => {
    const { entityKey } = request.params;
    try {
      const result = await blastRadiusEngine.lockPerimeter(entityKey);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
