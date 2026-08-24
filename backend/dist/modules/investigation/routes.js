"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.investigationRoutes = investigationRoutes;
const client_1 = require("../../db/client");
const service_1 = require("../timeline/service");
const service_2 = require("../audit/service");
const server_1 = require("../websocket/server");
async function investigationRoutes(fastify) {
    // List Incidents
    fastify.get('/api/v1/incidents', async (request, reply) => {
        const { status, severity } = request.query;
        const where = {};
        if (status)
            where.status = status;
        if (severity)
            where.severity = severity;
        const incidents = await client_1.prisma.incident.findMany({
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
    fastify.get('/api/v1/incidents/:id', async (request, reply) => {
        const { id } = request.params;
        const incident = await client_1.prisma.incident.findUnique({
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
    fastify.patch('/api/v1/incidents/:id', async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        const updated = await client_1.prisma.incident.update({
            where: { id },
            data: {
                status: body.status,
                summary: body.summary,
                severity: body.severity,
                updatedAt: new Date(),
            },
        });
        await (0, service_2.logAudit)('INCIDENT_STATUS_CHANGED', 'SOC Analyst', { id, status: body.status });
        (0, server_1.broadcastIncidentUpdate)(updated);
        return reply.send(updated);
    });
    // Add Incident Note
    fastify.post('/api/v1/incidents/:id/notes', async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        const note = await client_1.prisma.incidentNote.create({
            data: {
                incidentId: id,
                author: body.author || 'SOC Analyst',
                content: body.content,
                createdAt: new Date(),
            },
        });
        await (0, service_2.logAudit)('INCIDENT_NOTE_ADDED', body.author || 'SOC Analyst', { id });
        return reply.status(201).send(note);
    });
    // Add Incident Evidence
    fastify.post('/api/v1/incidents/:id/evidence', async (request, reply) => {
        const { id } = request.params;
        const body = request.body;
        const evidence = await client_1.prisma.incidentEvidence.create({
            data: {
                incidentId: id,
                type: body.type || 'indicator',
                title: body.title,
                value: body.value,
                notes: body.notes,
                addedAt: new Date(),
            },
        });
        await (0, service_2.logAudit)('INCIDENT_EVIDENCE_ATTACHED', 'SOC Analyst', { id, evidenceId: evidence.id });
        return reply.status(201).send(evidence);
    });
    // Chronological Attack Timeline Reconstruction
    fastify.get('/api/v1/incidents/:id/timeline', async (request, reply) => {
        const { id } = request.params;
        const timeline = await (0, service_1.reconstructIncidentTimeline)(id);
        return reply.send(timeline);
    });
    // List Alerts
    fastify.get('/api/v1/alerts', async (request, reply) => {
        const limit = parseInt(request.query.limit || '50', 10);
        const alerts = await client_1.prisma.alert.findMany({
            orderBy: { timestamp: 'desc' },
            take: limit,
            include: { incident: true },
        });
        return reply.send(alerts);
    });
    // List Audit Logs
    fastify.get('/api/v1/audit', async (request, reply) => {
        const limit = parseInt(request.query.limit || '50', 10);
        const logs = await client_1.prisma.auditLog.findMany({
            orderBy: { createdAt: 'desc' },
            take: limit,
        });
        return reply.send(logs);
    });
}
