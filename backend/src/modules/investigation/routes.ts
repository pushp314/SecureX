import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../../db/client';
import { reconstructIncidentTimeline } from '../timeline/service';
import { logAudit } from '../audit/service';
import { broadcastIncidentUpdate } from '../websocket/server';

export async function investigationRoutes(fastify: FastifyInstance) {
  // List Incidents
  fastify.get('/api/v1/incidents', async (request: FastifyRequest<{ Querystring: { status?: string; severity?: string } }>, reply) => {
    const { status, severity } = request.query;
    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: {
          select: { alerts: true, evidences: true, notes: true },
        },
      },
    });

    return reply.send(incidents);
  });

  // Get Incident Details
  fastify.get('/api/v1/incidents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        alerts: {
          orderBy: { timestamp: 'desc' },
        },
        evidences: {
          orderBy: { addedAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!incident) {
      return reply.status(404).send({ error: 'Incident not found' });
    }

    return reply.send(incident);
  });

  // Update Incident Status / Summary
  fastify.patch('/api/v1/incidents/:id', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const body = request.body as any;

    const updated = await prisma.incident.update({
      where: { id },
      data: {
        status: body.status,
        summary: body.summary,
        severity: body.severity,
        updatedAt: new Date(),
      },
    });

    await logAudit('INCIDENT_STATUS_CHANGED', 'SOC Analyst', { id, status: body.status });
    broadcastIncidentUpdate(updated);
    return reply.send(updated);
  });

  // Add Incident Note
  fastify.post('/api/v1/incidents/:id/notes', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body as any;

    const note = await prisma.incidentNote.create({
      data: {
        incidentId: id,
        author: body.author || 'SOC Analyst',
        content: body.content,
        createdAt: new Date(),
      },
    });

    await logAudit('INCIDENT_NOTE_ADDED', body.author || 'SOC Analyst', { id });
    return reply.status(201).send(note);
  });

  // Add Incident Evidence
  fastify.post('/api/v1/incidents/:id/evidence', async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
    const { id } = request.params;
    const body = request.body as any;

    const evidence = await prisma.incidentEvidence.create({
      data: {
        incidentId: id,
        type: body.type || 'indicator',
        title: body.title,
        value: body.value,
        notes: body.notes,
        addedAt: new Date(),
      },
    });

    await logAudit('INCIDENT_EVIDENCE_ATTACHED', 'SOC Analyst', { id, evidenceId: evidence.id });
    return reply.status(201).send(evidence);
  });

  // Chronological Attack Timeline Reconstruction
  fastify.get('/api/v1/incidents/:id/timeline', async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
    const { id } = request.params;
    const timeline = await reconstructIncidentTimeline(id);
    return reply.send(timeline);
  });

  // List Alerts
  fastify.get('/api/v1/alerts', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply) => {
    const limit = parseInt(request.query.limit || '50', 10);
    const alerts = await prisma.alert.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: { incident: true },
    });
    return reply.send(alerts);
  });

  // List Audit Logs
  fastify.get('/api/v1/audit', async (request: FastifyRequest<{ Querystring: { limit?: string } }>, reply) => {
    const limit = parseInt(request.query.limit || '50', 10);
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return reply.send(logs);
  });
}
