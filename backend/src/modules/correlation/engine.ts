import { prisma } from '../../db/client';
import { broadcastIncidentUpdate } from '../websocket/server';

export async function correlateAlert(alert: any, triggerEvent: any) {
  try {
    const entityKey = alert.entityKey; // e.g. "ip:192.168.1.105" or "user:admin"
    
    // Look for active incident within the last 2 hours on this entity
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    let incident = await prisma.incident.findFirst({
      where: {
        entityKey,
        status: { in: ['OPEN', 'INVESTIGATING'] },
        updatedAt: { gte: twoHoursAgo },
      },
      include: {
        alerts: true,
        evidences: true,
      },
    });

    if (incident) {
      // Merge into existing Incident
      const existingTactics = incident.mitreTactics.split(',').map((s) => s.trim()).filter(Boolean);
      if (!existingTactics.includes(alert.mitreTactic)) {
        existingTactics.push(alert.mitreTactic);
      }

      // Upgrade severity if this alert is higher
      const severityWeights: Record<string, number> = { info: 1, low: 2, medium: 3, high: 4, critical: 5 };
      let newSeverity = incident.severity;
      if ((severityWeights[alert.severity] || 0) > (severityWeights[incident.severity] || 0)) {
        newSeverity = alert.severity;
      }

      const updatedIncident = await prisma.incident.update({
        where: { id: incident.id },
        data: {
          alertsCount: incident.alertsCount + 1,
          severity: newSeverity,
          mitreTactics: existingTactics.join(', '),
          summary: `Correlated ${incident.alertsCount + 1} attack signals across ${existingTactics.length} MITRE stages on ${entityKey}`,
          updatedAt: new Date(),
        },
      });

      // Link alert
      await prisma.alert.update({
        where: { id: alert.id },
        data: { incidentId: incident.id },
      });

      // Add evidence if not already present
      await addEvidenceIfMissing(incident.id, alert, triggerEvent);

      broadcastIncidentUpdate(updatedIncident);
      console.log(`[Correlation Engine] 🔗 Correlated Alert into existing Incident: ${incident.incidentId}`);
    } else {
      // Create new incident
      const incidentId = `INC-${Date.now().toString().slice(-6)}`;
      const newIncident = await prisma.incident.create({
        data: {
          incidentId,
          title: `Suspicious Multi-Stage Activity on ${entityKey}`,
          severity: alert.severity,
          status: 'OPEN',
          summary: `Initial detection: ${alert.ruleName} (${alert.mitreTactic} / ${alert.mitreTechnique})`,
          entityKey,
          mitreTactics: alert.mitreTactic,
          alertsCount: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      // Link alert
      await prisma.alert.update({
        where: { id: alert.id },
        data: { incidentId: newIncident.id },
      });

      // Add initial evidence
      await addEvidenceIfMissing(newIncident.id, alert, triggerEvent);

      broadcastIncidentUpdate(newIncident);
      console.log(`[Correlation Engine] ⚡ Spawned new Incident Case: ${incidentId}`);
    }
  } catch (err) {
    console.error('[Correlation Engine] Error correlating alert:', err);
  }
}

async function addEvidenceIfMissing(incidentId: string, alert: any, event: any) {
  try {
    if (event.network?.sourceIp) {
      await prisma.incidentEvidence.create({
        data: {
          incidentId,
          type: 'ip_address',
          title: 'Source IP Address',
          value: event.network.sourceIp,
          notes: `Associated with ${alert.ruleName}`,
        },
      });
    }

    if (event.identity?.username || event.identity?.userId) {
      const user = event.identity.username || event.identity.userId;
      await prisma.incidentEvidence.create({
        data: {
          incidentId,
          type: 'user_account',
          title: 'Targeted User Account',
          value: user,
          notes: `Observed in ${event.eventType}`,
        },
      });
    }

    if (event.resource?.resourceName) {
      await prisma.incidentEvidence.create({
        data: {
          incidentId,
          type: 'target_resource',
          title: 'Target Resource',
          value: `${event.resource.resourceType || 'Resource'}: ${event.resource.resourceName}`,
          notes: `Action: ${event.resource.action || 'Unknown'}`,
        },
      });
    }
  } catch {
    // Ignore duplicate evidence insert errors
  }
}
