import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getNetworkFlows,
  getNetworkAnomalies,
  getNetworkStats,
  recordNetworkFlow,
  getGeoRadarOrigins,
} from './engine';

export async function networkRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/network/flows', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply) => {
    const limit = parseInt(request.query.limit || '100', 10);
    return reply.send(getNetworkFlows(limit));
  });

  fastify.get('/api/v1/network/anomalies', async (_req, reply) => {
    return reply.send(getNetworkAnomalies());
  });

  fastify.get('/api/v1/network/stats', async (_req, reply) => {
    return reply.send(getNetworkStats());
  });

  fastify.get('/api/v1/network/geo-radar', async (_req, reply) => {
    const data = await getGeoRadarOrigins();
    return reply.send(data);
  });

  fastify.post('/api/v1/network/flows/simulate', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const flow = recordNetworkFlow(body);
    return reply.status(201).send(flow);
  });
}
