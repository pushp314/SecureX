import { FastifyInstance } from 'fastify';
import { logParserEngine } from './engine';

export async function parserRoutes(fastify: FastifyInstance) {
  fastify.get('/api/v1/parsers', async (request, reply) => {
    const parsers = logParserEngine.getParsers();
    return reply.send(parsers);
  });

  fastify.post<{
    Body: { rawLog: string; parserId?: string };
  }>('/api/v1/parsers/test', async (request, reply) => {
    const { rawLog, parserId } = request.body || {};
    if (!rawLog) {
      return reply.status(400).send({ error: 'rawLog string is required' });
    }
    const result = logParserEngine.parseRawLog(rawLog, parserId);
    return reply.send(result);
  });

  fastify.post<{
    Body: { rawLog: string; parserId?: string };
  }>('/api/v1/parsers/ingest', async (request, reply) => {
    const { rawLog, parserId } = request.body || {};
    if (!rawLog) {
      return reply.status(400).send({ error: 'rawLog string is required' });
    }
    try {
      const event = await logParserEngine.ingestParsedLog(rawLog, parserId);
      return reply.status(201).send({ status: 'INGESTED', event });
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
