import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  getWebhookSubscriptions,
  getWebhookDeliveryLogs,
  createWebhookSubscription,
  testWebhook,
} from './dispatcher';

export async function webhooksRoutes(fastify: FastifyInstance) {
  // List all webhook subscriptions
  fastify.get('/api/v1/webhooks', async (_req, reply) => {
    const list = getWebhookSubscriptions();
    return reply.send(list);
  });

  // Create new webhook subscription
  fastify.post('/api/v1/webhooks', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    try {
      const created = createWebhookSubscription(body);
      return reply.status(201).send(created);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });

  // List delivery logs
  fastify.get('/api/v1/webhooks/logs', async (_req, reply) => {
    const logs = getWebhookDeliveryLogs();
    return reply.send(logs);
  });

  // Test webhook dispatch
  fastify.post('/api/v1/webhooks/test/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const result = await testWebhook(id);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
