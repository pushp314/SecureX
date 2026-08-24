import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getManagedIdentities,
  containIdentity,
  runIdentityStressTest,
} from './engine';

export async function itdrRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/itdr/identities', async (_req, reply) => {
    const list = getManagedIdentities();
    return reply.send(list);
  });

  fastify.post('/api/v1/itdr/identities/:id/contain', async (request: FastifyRequest<{ Params: { id: string }; Body: { action: 'LOCK' | 'REVOKE_SESSIONS' | 'REQUIRE_MFA' } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { action } = request.body || { action: 'REVOKE_SESSIONS' };
    try {
      const updated = containIdentity(id, action);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  fastify.post('/api/v1/itdr/stress-test', async (request: FastifyRequest<{ Body: { scenario: any; targetUsername?: string } }>, reply: FastifyReply) => {
    const { scenario, targetUsername } = request.body || {};
    try {
      const result = await runIdentityStressTest(scenario || 'MFA_FATIGUE', targetUsername);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
