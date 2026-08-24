import { prisma } from '../../db/client';

export interface TimelineEntry {
  id: string;
  timestamp: string;
  type: 'telemetry' | 'alert' | 'analyst_note';
  title: string;
  category: string;
  severity: string;
  description: string;
  entityKey?: string;
  mitreTactic?: string;
  mitreTechnique?: string;
  metadata?: any;
}

export async function reconstructIncidentTimeline(incidentId: string): Promise<TimelineEntry[]> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      alerts: true,
      notes: true,
    },
  });

  if (!incident) return [];

  const timeline: TimelineEntry[] = [];

  // 1. Add alerts
  for (const alert of incident.alerts) {
    let details: any = {};
    try {
      details = JSON.parse(alert.detailsJson);
    } catch {}

    timeline.push({
      id: alert.id,
      timestamp: alert.timestamp.toISOString(),
      type: 'alert',
      title: `🚨 ${alert.ruleName}`,
      category: 'detection_alert',
      severity: alert.severity,
      description: alert.description,
      entityKey: alert.entityKey,
      mitreTactic: alert.mitreTactic,
      mitreTechnique: alert.mitreTechnique,
      metadata: details,
    });
  }

  // 2. Fetch raw telemetry matching the entity within a reasonable time window
  const entityParts = incident.entityKey.split(':');
  const entityType = entityParts[0];
  const entityValue = entityParts.slice(1).join(':');

  let telemetryEvents: any[] = [];
  if (entityType === 'ip') {
    telemetryEvents = await prisma.telemetryEvent.findMany({
      where: { sourceIp: entityValue },
      orderBy: { timestamp: 'asc' },
      take: 100,
    });
  } else if (entityType === 'user') {
    telemetryEvents = await prisma.telemetryEvent.findMany({
      where: {
        OR: [
          { userId: entityValue },
          { username: entityValue },
        ],
      },
      orderBy: { timestamp: 'asc' },
      take: 100,
    });
  }

  for (const tel of telemetryEvents) {
    let meta: any = {};
    try {
      meta = tel.metadataJson ? JSON.parse(tel.metadataJson) : {};
    } catch {}

    timeline.push({
      id: tel.id,
      timestamp: tel.timestamp.toISOString(),
      type: 'telemetry',
      title: `📡 Event: ${tel.eventType}`,
      category: tel.category,
      severity: tel.severity,
      description: `Outcome: ${tel.outcome} on service [${tel.sourceService}]`,
      entityKey: tel.sourceIp ? `ip:${tel.sourceIp}` : undefined,
      metadata: { ...meta, raw: tel },
    });
  }

  // 3. Add analyst notes
  for (const note of incident.notes) {
    timeline.push({
      id: note.id,
      timestamp: note.createdAt.toISOString(),
      type: 'analyst_note',
      title: `📝 Note from ${note.author}`,
      category: 'investigation_note',
      severity: 'info',
      description: note.content,
    });
  }

  // Sort strictly by timestamp ascending
  timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return timeline;
}
