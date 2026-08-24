import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getDevSecOpsEvents,
  getDevSecOpsStats,
  recordDevSecOpsEvent,
  resolveDevSecOpsFinding,
} from './engine';

export async function devsecopsRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/devsecops/events', async (_req, reply) => {
    return reply.send(getDevSecOpsEvents());
  });

  fastify.get('/api/v1/devsecops/stats', async (_req, reply) => {
    return reply.send(getDevSecOpsStats());
  });

  fastify.post('/api/v1/devsecops/events', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    try {
      const created = recordDevSecOpsEvent(body);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  fastify.patch<{
    Params: { id: string };
    Body: { status: 'RESOLVED' | 'SUPPRESSED' };
  }>('/api/v1/devsecops/events/:id/status', async (request, reply) => {
    const { id } = request.params;
    const { status } = request.body || {};
    try {
      const updated = resolveDevSecOpsFinding(id, status || 'RESOLVED');
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
