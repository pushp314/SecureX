import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getComplianceFrameworks,
  getD3FENDMatrix,
  generateExecutiveComplianceReport,
} from './engine';

export async function complianceRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/compliance/frameworks', async (_req, reply) => {
    const list = await getComplianceFrameworks();
    return reply.send(list);
  });

  fastify.get('/api/v1/compliance/d3fend', async (_req, reply) => {
    const list = getD3FENDMatrix();
    return reply.send(list);
  });

  fastify.get('/api/v1/compliance/report', async (_req, reply) => {
    const report = await generateExecutiveComplianceReport();
    return reply.send(report);
  });
}
