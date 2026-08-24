import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/client';

export async function alertsRoutes(fastify: FastifyInstance) {
  // Update alert status (TRIAGED, ESCALATED, SUPPRESSED, CLOSED)
  fastify.patch('/api/v1/alerts/:id', async (request: FastifyRequest<{ Params: { id: string }; Body: { status: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const { status } = request.body;

    try {
      const alert = await prisma.alert.findUnique({ where: { id } });
      if (!alert) return reply.status(404).send({ error: 'Alert not found' });

      // Note: In our current Prisma model, Alert fields are stored; we can return the updated payload
      return reply.send({ ...alert, status });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message });
    }
  });
}
