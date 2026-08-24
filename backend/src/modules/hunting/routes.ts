import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  HUNT_TEMPLATES,
  executeThreatHunt,
  convertHuntToDetectionRule,
} from './engine';

export async function huntingRoutes(fastify: FastifyInstance) {
  // List hunt templates
  fastify.get('/api/v1/hunting/templates', async (_req, reply) => {
    return reply.send(HUNT_TEMPLATES);
  });

  // Execute a hunt query
  fastify.post('/api/v1/hunting/execute', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    try {
      const result = await executeThreatHunt(body.filter || {});
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // Convert a successful hunt into a permanent detection rule
  fastify.post('/api/v1/hunting/convert-to-rule', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    try {
      const rule = await convertHuntToDetectionRule(body);
      return reply.status(201).send(rule);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
