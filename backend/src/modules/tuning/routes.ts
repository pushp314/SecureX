import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { tuningEngine } from './engine';

export async function tuningRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/tuning/rules', async (_req, reply) => {
    const profiles = await tuningEngine.analyzeRuleNoise();
    return reply.send(profiles);
  });

  fastify.get('/api/v1/tuning/summary', async (_req, reply) => {
    return reply.send(tuningEngine.getSummary());
  });

  fastify.post<{ Params: { ruleId: string } }>('/api/v1/tuning/apply/:ruleId', async (request, reply) => {
    const { ruleId } = request.params;
    try {
      const result = tuningEngine.applyTuning(ruleId);
      return reply.send(result);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
