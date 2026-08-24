"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vulnScannerRoutes = vulnScannerRoutes;
const engine_1 = require("./engine");
async function vulnScannerRoutes(fastify) {
    // List all monitored assets and their vulnerability posture
    fastify.get('/api/v1/vulnerabilities/assets', async (_req, reply) => {
        const assets = await (0, engine_1.getAssetsList)();
        return reply.send(assets);
    });
    // Run on-demand scan on an asset
    fastify.post('/api/v1/vulnerabilities/scan/:id', async (request, reply) => {
        const { id } = request.params;
        try {
            const updated = await (0, engine_1.runAssetVulnerabilityScan)(id);
            return reply.send(updated);
        }
        catch (err) {
            return reply.status(404).send({ error: err.message });
        }
    });
    // Add new asset to scan catalog
    fastify.post('/api/v1/vulnerabilities/assets', async (request, reply) => {
        const body = request.body;
        try {
            const asset = await (0, engine_1.addMonitoredAsset)(body);
            return reply.status(201).send(asset);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
