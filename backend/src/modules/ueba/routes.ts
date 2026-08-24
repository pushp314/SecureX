import { FastifyInstance } from 'fastify';
import { uebaEngine } from './engine';

export async function uebaRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/ueba/profiles', async (request, reply) => {
    const profiles = uebaEngine.getProfiles();
    return reply.send(profiles);
  });

  fastify.get('/api/v1/ueba/anomalies', async (request, reply) => {
    const anomalies = uebaEngine.getAnomalousProfiles();
    return reply.send(anomalies);
  });
}
