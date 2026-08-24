"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeysRoutes = apiKeysRoutes;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../../db/client");
const service_1 = require("../audit/service");
async function apiKeysRoutes(fastify) {
    // List all API keys
    fastify.get('/api/v1/apikeys', async (_req, reply) => {
        const keys = await client_1.prisma.apiKey.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return reply.send(keys);
    });
    // Create new scoped API key
    fastify.post('/api/v1/apikeys', async (request, reply) => {
        const body = request.body;
        const rawKey = `secx_live_${crypto_1.default.randomBytes(16).toString('hex')}`;
        const created = await client_1.prisma.apiKey.create({
            data: {
                key: rawKey,
                name: body.name || 'Custom Ingestion Key',
                tenantId: body.tenantId || 'tenant-enterprise-01',
                isActive: true,
            },
        });
        await (0, service_1.logAudit)('API_KEY_CREATED', 'Admin', { keyId: created.id, name: created.name });
        return reply.status(201).send(created);
    });
    // Revoke API key
    fastify.post('/api/v1/apikeys/:id/revoke', async (request, reply) => {
        const { id } = request.params;
        const updated = await client_1.prisma.apiKey.update({
            where: { id },
            data: { isActive: false },
        });
        await (0, service_1.logAudit)('API_KEY_REVOKED', 'Admin', { keyId: id, name: updated.name });
        return reply.send(updated);
    });
    // Get Cryptographically Verified Audit Chain
    fastify.get('/api/v1/audit/chain', async (_req, reply) => {
        const chain = await (0, service_1.getVerifiedAuditChain)(50);
        return reply.send(chain);
    });
}
