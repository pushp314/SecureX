"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rulesRoutes = rulesRoutes;
const client_1 = require("../../db/client");
const service_1 = require("../audit/service");
async function rulesRoutes(fastify) {
    // List all detection rules
    fastify.get('/api/v1/rules', async (_req, reply) => {
        const rules = await client_1.prisma.detectionRule.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return reply.send(rules);
    });
    // Create new detection rule
    fastify.post('/api/v1/rules', async (request, reply) => {
        const body = request.body;
        const ruleId = body.ruleId || `secx-rule-${Date.now()}`;
        const rule = await client_1.prisma.detectionRule.create({
            data: {
                ruleId,
                name: body.name,
                description: body.description || '',
                category: body.category || 'threat_signal',
                severity: body.severity || 'medium',
                ruleType: body.ruleType || 'threshold',
                mitreTactic: body.mitreTactic || 'Execution',
                mitreTechnique: body.mitreTechnique || 'T1204',
                conditionJson: typeof body.conditionJson === 'string' ? body.conditionJson : JSON.stringify(body.conditionJson || {}),
                windowSeconds: body.windowSeconds || 60,
                thresholdCount: body.thresholdCount || 1,
                isEnabled: body.isEnabled !== undefined ? body.isEnabled : true,
            },
        });
        await (0, service_1.logAudit)('RULE_CREATED', 'SOC Admin', { ruleId, name: rule.name });
        return reply.status(201).send(rule);
    });
    // Toggle or Update Rule
    fastify.patch('/api/v1/rules/:id', async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        const updated = await client_1.prisma.detectionRule.update({
            where: { id },
            data: {
                isEnabled: body.isEnabled,
                severity: body.severity,
                windowSeconds: body.windowSeconds,
                thresholdCount: body.thresholdCount,
            },
        });
        await (0, service_1.logAudit)('RULE_UPDATED', 'SOC Admin', { id, isEnabled: body.isEnabled });
        return reply.send(updated);
    });
    // Delete Rule
    fastify.delete('/api/v1/rules/:id', async (request, reply) => {
        const { id } = request.params;
        await client_1.prisma.detectionRule.delete({ where: { id } });
        await (0, service_1.logAudit)('RULE_DELETED', 'SOC Admin', { id });
        return reply.send({ success: true });
    });
}
