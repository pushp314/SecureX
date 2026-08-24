import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getCloudPostureList,
  getCloudPostureSummary,
  remediateCloudResource,
} from './engine';

export async function cloudRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/cloud/posture', async (_req, reply) => {
    const list = getCloudPostureList();
    return reply.send(list);
  });

  fastify.get('/api/v1/cloud/summary', async (_req, reply) => {
    const summary = getCloudPostureSummary();
    return reply.send(summary);
  });

  fastify.post('/api/v1/cloud/remediate/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const updated = remediateCloudResource(id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
