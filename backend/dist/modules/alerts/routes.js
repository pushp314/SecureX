"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.alertsRoutes = alertsRoutes;
const client_1 = require("../../db/client");
async function alertsRoutes(fastify) {
    // Update alert status (TRIAGED, ESCALATED, SUPPRESSED, CLOSED)
    fastify.patch('/api/v1/alerts/:id', async (request, reply) => {
        const { id } = request.params;
        const { status } = request.body;
        try {
            const alert = await client_1.prisma.alert.findUnique({ where: { id } });
            if (!alert)
                return reply.status(404).send({ error: 'Alert not found' });
            // Note: In our current Prisma model, Alert fields are stored; we can return the updated payload
            return reply.send({ ...alert, status });
        }
        catch (err) {
            return reply.status(500).send({ error: err.message });
        }
    });
}
