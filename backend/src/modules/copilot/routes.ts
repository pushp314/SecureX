import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyzeIncidentWithCopilot } from './engine';

export async function copilotRoutes(fastify: FastifyInstance) {
  // Analyze incident with explainable AI copilot
  fastify.get('/api/v1/incidents/:id/copilot-analysis', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const analysis = await analyzeIncidentWithCopilot(id);
      return reply.send(analysis);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  // Alias endpoint
  fastify.get('/api/v1/copilot/analyze/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const analysis = await analyzeIncidentWithCopilot(id);
      return reply.send(analysis);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
