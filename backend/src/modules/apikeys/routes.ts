import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../db/client';
import { logAudit, getVerifiedAuditChain } from '../audit/service';

export async function apiKeysRoutes(fastify: FastifyInstance) {
  // List all API keys
  fastify.get('/api/v1/apikeys', async (_req, reply) => {
    const keys = await prisma.apiKey.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(keys);
  });

  // Create new scoped API key
  fastify.post('/api/v1/apikeys', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const rawKey = `secx_live_${crypto.randomBytes(16).toString('hex')}`;

    const created = await prisma.apiKey.create({
      data: {
        key: rawKey,
        name: body.name || 'Custom Ingestion Key',
        tenantId: body.tenantId || 'tenant-enterprise-01',
        isActive: true,
      },
    });

    await logAudit('API_KEY_CREATED', 'Admin', { keyId: created.id, name: created.name });
    return reply.status(201).send(created);
  });

  // Revoke API key
  fastify.post('/api/v1/apikeys/:id/revoke', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const updated = await prisma.apiKey.update({
      where: { id },
      data: { isActive: false },
    });

    await logAudit('API_KEY_REVOKED', 'Admin', { keyId: id, name: updated.name });
    return reply.send(updated);
  });

  // Get Cryptographically Verified Audit Chain
  fastify.get('/api/v1/audit/chain', async (_req, reply) => {
    const chain = await getVerifiedAuditChain(50);
    return reply.send(chain);
  });
}
