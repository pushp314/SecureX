import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IngestionBatchSchema, TelemetryEventSchema } from './validation';
import { prisma } from '../../db/client';
import { eventBus } from '../queue/eventBus';
import { sanitizeTelemetryPayload } from './sanitizer';

export async function ingestionRoutes(fastify: FastifyInstance) {
  // Telemetry Ingestion Endpoint
  fastify.post('/api/v1/telemetry/ingest', async (request: FastifyRequest, reply: FastifyReply) => {
    const apiKeyHeader = request.headers['x-securex-api-key'] as string;
    
    if (!apiKeyHeader) {
      return reply.status(401).send({ error: 'Missing X-SecureX-API-Key header' });
    }

    const keyRecord = await prisma.apiKey.findUnique({
      where: { key: apiKeyHeader },
    });

    if (!keyRecord || !keyRecord.isActive) {
      return reply.status(403).send({ error: 'Invalid or revoked API Key' });
    }

    const rawBody = request.body as any;

    let eventsToProcess: any[] = [];
    if (rawBody && Array.isArray(rawBody.events)) {
      const parsed = IngestionBatchSchema.safeParse(rawBody);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid batch schema', details: parsed.error.format() });
      }
      eventsToProcess = parsed.data.events;
    } else if (rawBody) {
      const parsed = TelemetryEventSchema.safeParse(rawBody);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'Invalid event schema', details: parsed.error.format() });
      }
      eventsToProcess = [parsed.data];
    } else {
      return reply.status(400).send({ error: 'Empty payload' });
    }

    const insertedEvents = [];
    for (let rawEvt of eventsToProcess) {
      const evt = sanitizeTelemetryPayload(rawEvt);
      const eventId = evt.eventId || `evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const timestamp = new Date(evt.timestamp || Date.now());

      const dbEvent = await prisma.telemetryEvent.create({
        data: {
          eventId,
          tenantId: keyRecord.tenantId,
          timestamp,
          category: evt.category,
          eventType: evt.eventType,
          outcome: evt.outcome,
          severity: evt.severity,
          sourceService: evt.sourceService,
          sourceIp: evt.network?.sourceIp,
          destinationIp: evt.network?.destinationIp,
          userId: evt.identity?.userId,
          username: evt.identity?.username,
          resourceType: evt.resource?.resourceType,
          resourceName: evt.resource?.resourceName,
          action: evt.resource?.action,
          metadataJson: evt.metadata ? JSON.stringify(evt.metadata) : null,
          rawPayload: JSON.stringify(evt),
        },
      });

      insertedEvents.push(dbEvent);

      // Publish to event bus for asynchronous detection & correlation processing
      await eventBus.publishTelemetry(evt);
    }

    return reply.status(202).send({
      status: 'accepted',
      receivedCount: insertedEvents.length,
      processedAt: new Date().toISOString(),
    });
  });

  // Telemetry Metrics / Stats
  fastify.get('/api/v1/telemetry/stats', async (_req, reply) => {
    const totalEvents = await prisma.telemetryEvent.count();
    const totalAlerts = await prisma.alert.count();
    const totalIncidents = await prisma.incident.count();
    const openIncidents = await prisma.incident.count({ where: { status: { in: ['OPEN', 'INVESTIGATING'] } } });

    // Recent volume by category
    const eventsByCategory = await prisma.telemetryEvent.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    // Recent volume by severity
    const eventsBySeverity = await prisma.telemetryEvent.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    return reply.send({
      totalEvents,
      totalAlerts,
      totalIncidents,
      openIncidents,
      byCategory: eventsByCategory.map((c) => ({ category: c.category, count: c._count.id })),
      bySeverity: eventsBySeverity.map((s) => ({ severity: s.severity, count: s._count.id })),
    });
  });

  // Recent Telemetry Events Query
  fastify.get('/api/v1/telemetry/events', async (request: FastifyRequest<{ Querystring: { limit?: string; category?: string; search?: string } }>, reply) => {
    const limit = parseInt(request.query.limit || '50', 10);
    const { category, search } = request.query;

    const where: any = {};
    if (category) where.category = category;
    if (search) {
      where.OR = [
        { eventType: { contains: search } },
        { sourceIp: { contains: search } },
        { username: { contains: search } },
        { sourceService: { contains: search } },
      ];
    }

    const events = await prisma.telemetryEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    });

    return reply.send(events);
  });
}
