import { FastifyInstance } from 'fastify';
import { threatIntelEngine, ThreatIndicator } from './engine';

export async function threatIntelRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/threatintel/indicators', async (request, reply) => {
    const list = threatIntelEngine.getIndicators();
    return reply.send(list);
  });

  fastify.get<{
    Querystring: { value?: string };
  }>('/api/v1/threatintel/lookup', async (request, reply) => {
    const { value } = request.query;
    if (!value) {
      return reply.status(400).send({ error: 'Indicator value is required' });
    }
    const result = threatIntelEngine.checkIndicator(value);
    return reply.send(result);
  });

  fastify.post<{
    Body: Omit<ThreatIndicator, 'id' | 'lastObserved'>;
  }>('/api/v1/threatintel/indicators', async (request, reply) => {
    const body = request.body;
    if (!body?.value || !body?.indicatorType) {
      return reply.status(400).send({ error: 'Value and indicatorType are required' });
    }
    const created = threatIntelEngine.addIndicator(body);
    return reply.status(201).send(created);
  });
}
