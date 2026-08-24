import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getAssetsList, runAssetVulnerabilityScan, addMonitoredAsset } from './engine';

export async function vulnScannerRoutes(fastify: FastifyInstance) {
  // List all monitored assets and their vulnerability posture
  fastify.get('/api/v1/vulnerabilities/assets', async (_req, reply) => {
    const assets = await getAssetsList();
    return reply.send(assets);
  });

  // Run on-demand scan on an asset
  fastify.post('/api/v1/vulnerabilities/scan/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    try {
      const updated = await runAssetVulnerabilityScan(id);
      return reply.send(updated);
    } catch (err: any) {
      return reply.status(404).send({ error: err.message });
    }
  });

  // Add new asset to scan catalog
  fastify.post('/api/v1/vulnerabilities/assets', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    try {
      const asset = await addMonitoredAsset(body);
      return reply.status(201).send(asset);
    } catch (err: any) {
      return reply.status(400).send({ error: err.message });
    }
  });
}
