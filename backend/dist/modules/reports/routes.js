"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reportsRoutes = reportsRoutes;
const service_1 = require("./service");
async function reportsRoutes(fastify) {
    // Generate forensic incident report
    fastify.get('/api/v1/incidents/:id/report', async (request, reply) => {
        const { id } = request.params;
        try {
            const report = await (0, service_1.generateIncidentForensicReport)(id);
            return reply.send(report);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
}
