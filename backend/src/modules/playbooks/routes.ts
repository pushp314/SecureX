import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AVAILABLE_PLAYBOOKS, executePlaybook } from './engine';

export async function playbooksRoutes(fastify: FastifyInstance) {
  // List available playbooks
  fastify.get('/api/v1/playbooks', async (_req, reply) => {
    return reply.send(AVAILABLE_PLAYBOOKS);
  });

  // Execute a playbook on an incident
  fastify.post('/api/v1/playbooks/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const { playbookId, incidentId, executedBy } = body;

    if (!playbookId || !incidentId) {
      return reply.status(400).send({ error: 'Missing playbookId or incidentId' });
    }

    try {
      const result = await executePlaybook(playbookId, incidentId, executedBy);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
