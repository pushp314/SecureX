import { FastifyInstance } from 'fastify';
import { siemQueryEngine } from './engine';

export async function kqlRoutes(fastify: FastifyInstance) {
  fastify.post<{
    Body: { query: string };
  }>('/api/v1/siem/query', async (request, reply) => {
    const { query } = request.body || {};
    if (!query) {
      return reply.status(400).send({ error: 'Query string is required' });
    }
    try {
      const result = await siemQueryEngine.executeQuery(query);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
