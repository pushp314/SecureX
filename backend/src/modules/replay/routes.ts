import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { backtestRuleAgainstHistory } from './service';

export async function replayRoutes(fastify: FastifyInstance) {
  // Backtest draft rule against historical events
  fastify.post('/api/v1/rules/backtest', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    try {
      const result = await backtestRuleAgainstHistory(body);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
