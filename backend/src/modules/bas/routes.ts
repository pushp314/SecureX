import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { basEngine } from './engine';

export async function basRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/bas/tests', async (_req, reply) => {
    return reply.send(basEngine.getTests());
  });

  fastify.post<{ Params: { testId: string } }>('/api/v1/bas/run/:testId', async (request, reply) => {
    const { testId } = request.params;
    try {
      const result = await basEngine.runTest(testId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.get('/api/v1/bas/matrix', async (_req, reply) => {
    return reply.send(basEngine.getMatrixSummary());
  });
}
