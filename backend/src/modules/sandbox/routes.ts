import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { analyzeMalwareSample, getPastSandboxAnalyses } from './engine';

export async function sandboxRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/sandbox/analyses', async (_req, reply) => {
    const list = getPastSandboxAnalyses();
    return reply.send(list);
  });

  fastify.post('/api/v1/sandbox/analyze', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    if (!body || !body.sampleName) {
      return reply.status(400).send({ error: 'Missing sampleName' });
    }
    const result = analyzeMalwareSample(body.sampleName, body.fileHash);
    return reply.status(201).send(result);
  });
}
