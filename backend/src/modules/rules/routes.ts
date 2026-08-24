import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/client';
import { logAudit } from '../audit/service';

export async function rulesRoutes(fastify: FastifyInstance) {
  // List all detection rules
  fastify.get('/api/v1/rules', async (_req, reply) => {
    const rules = await prisma.detectionRule.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return reply.send(rules);
  });

  // Create new detection rule
  fastify.post('/api/v1/rules', async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const ruleId = body.ruleId || `secx-rule-${Date.now()}`;

    const rule = await prisma.detectionRule.create({
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

    await logAudit('RULE_CREATED', 'SOC Admin', { ruleId, name: rule.name });
    return reply.status(201).send(rule);
  });

  // Toggle or Update Rule
  fastify.patch('/api/v1/rules/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const body = request.body as any;

    const updated = await prisma.detectionRule.update({
      where: { id },
      data: {
        isEnabled: body.isEnabled,
        severity: body.severity,
        windowSeconds: body.windowSeconds,
        thresholdCount: body.thresholdCount,
      },
    });

    await logAudit('RULE_UPDATED', 'SOC Admin', { id, isEnabled: body.isEnabled });
    return reply.send(updated);
  });

  // Delete Rule
  fastify.delete('/api/v1/rules/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    await prisma.detectionRule.delete({ where: { id } });
    await logAudit('RULE_DELETED', 'SOC Admin', { id });
    return reply.send({ success: true });
  });
}
