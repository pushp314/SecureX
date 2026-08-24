import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getDeadLetterEvents,
  captureDeadLetterEvent,
  reprocessDeadLetterEvent,
  purgeDeadLetterQueue,
} from './engine';

export async function dlqRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/dlq/events', async (_req, reply) => {
    const list = getDeadLetterEvents();
    return reply.send(list);
  });

  fastify.post('/api/v1/dlq/reprocess/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: { category?: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { category } = request.body || {};
    try {
      const updated = await reprocessDeadLetterEvent(id, category);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/api/v1/dlq/simulate-failure', async (request: FastifyRequest<{ Body: { reason?: string; payload?: any } }>, reply: FastifyReply) => {
    const { reason, payload } = request.body || {};
    const item = captureDeadLetterEvent(
      reason || 'Simulated unparseable byte sequence in event payload stream',
      payload || '{"unmatched_delimiter": 0xDEADBEEF}'
    );
    return reply.status(201).send(item);
  });

  fastify.delete('/api/v1/dlq/purge', async (_req, reply) => {
    const res = purgeDeadLetterQueue();
    return reply.send(res);
  });
}
