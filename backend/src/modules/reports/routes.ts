import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { generateIncidentForensicReport } from './service';

export async function reportsRoutes(fastify: FastifyInstance) {
  // Generate forensic incident report
  fastify.get('/api/v1/incidents/:id/report', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const report = await generateIncidentForensicReport(id);
      return reply.send(report);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });
}
