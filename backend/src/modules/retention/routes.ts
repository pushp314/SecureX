import { FastifyInstance } from 'fastify';
import { dataRetentionEngine } from './engine';

export async function retentionRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/retention/tiers', async (request, reply) => {
    const tiers = await dataRetentionEngine.getStorageTierStatus();
    return reply.send(tiers);
  });

  fastify.get('/api/v1/retention/policies', async (request, reply) => {
    const policies = dataRetentionEngine.getPolicies();
    return reply.send(policies);
  });

  fastify.post('/api/v1/retention/archive', async (request, reply) => {
    const result = await dataRetentionEngine.triggerArchivalCycle();
    return reply.send(result);
  });
}
