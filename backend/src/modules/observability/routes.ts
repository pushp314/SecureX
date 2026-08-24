import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getPlatformDiagnostics, runSelfDiagnosticSuite } from './engine';

export async function observabilityRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/observability/metrics', async (_req, reply) => {
    const diagnostics = await getPlatformDiagnostics();
    return reply.send(diagnostics);
  });

  fastify.post('/api/v1/observability/self-test', async (_req, reply) => {
    const testResults = await runSelfDiagnosticSuite();
    return reply.send(testResults);
  });
}
