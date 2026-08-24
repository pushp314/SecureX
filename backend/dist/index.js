"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const env_1 = require("./config/env");
const server_1 = require("./modules/websocket/server");
const routes_1 = require("./modules/ingestion/routes");
const routes_2 = require("./modules/investigation/routes");
const routes_3 = require("./modules/rules/routes");
const routes_4 = require("./modules/playbooks/routes");
const routes_5 = require("./modules/replay/routes");
const routes_6 = require("./modules/reports/routes");
const routes_7 = require("./modules/copilot/routes");
const routes_8 = require("./modules/vulnscanner/routes");
const routes_9 = require("./modules/webhooks/routes");
const routes_10 = require("./modules/network/routes");
const routes_11 = require("./modules/devsecops/routes");
const routes_12 = require("./modules/apikeys/routes");
const routes_13 = require("./modules/hunting/routes");
const routes_14 = require("./modules/alerts/routes");
const routes_15 = require("./modules/observability/routes");
const routes_16 = require("./modules/cloud/routes");
const routes_17 = require("./modules/sandbox/routes");
const routes_18 = require("./modules/itdr/routes");
const routes_19 = require("./modules/compliance/routes");
const routes_20 = require("./modules/dlq/routes");
const routes_21 = require("./modules/auth/routes");
const routes_22 = require("./modules/parsers/routes");
const routes_23 = require("./modules/threatintel/routes");
const routes_24 = require("./modules/kql/routes");
const routes_25 = require("./modules/ueba/routes");
const routes_26 = require("./modules/retention/routes");
const routes_27 = require("./modules/sigma/routes");
const routes_28 = require("./modules/bas/routes");
const routes_29 = require("./modules/blastradius/routes");
const routes_30 = require("./modules/tuning/routes");
const client_1 = require("./db/client");
async function bootstrap() {
    const app = (0, fastify_1.default)({
        logger: {
            level: env_1.config.nodeEnv === 'development' ? 'info' : 'warn',
        },
    });
    // Enable CORS
    await app.register(cors_1.default, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    });
    // Health check
    app.get('/health', async () => {
        return {
            status: 'ok',
            service: 'securex-core-engine',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
        };
    });
    // Register feature routes
    await app.register(routes_21.authRoutes);
    await app.register(routes_1.ingestionRoutes);
    await app.register(routes_2.investigationRoutes);
    await app.register(routes_3.rulesRoutes);
    await app.register(routes_4.playbooksRoutes);
    await app.register(routes_5.replayRoutes);
    await app.register(routes_6.reportsRoutes);
    await app.register(routes_7.copilotRoutes);
    await app.register(routes_8.vulnScannerRoutes);
    await app.register(routes_9.webhooksRoutes);
    await app.register(routes_10.networkRoutes);
    await app.register(routes_11.devsecopsRoutes);
    await app.register(routes_12.apiKeysRoutes);
    await app.register(routes_13.huntingRoutes);
    await app.register(routes_14.alertsRoutes);
    await app.register(routes_15.observabilityRoutes);
    await app.register(routes_16.cloudRoutes);
    await app.register(routes_17.sandboxRoutes);
    await app.register(routes_18.itdrRoutes);
    await app.register(routes_19.complianceRoutes);
    await app.register(routes_20.dlqRoutes);
    await app.register(routes_22.parserRoutes);
    await app.register(routes_23.threatIntelRoutes);
    await app.register(routes_24.kqlRoutes);
    await app.register(routes_25.uebaRoutes);
    await app.register(routes_26.retentionRoutes);
    await app.register(routes_27.sigmaRoutes);
    await app.register(routes_28.basRoutes);
    await app.register(routes_29.blastRadiusRoutes);
    await app.register(routes_30.tuningRoutes);
    // Initialize WebSockets on the Fastify raw Node HTTP server
    (0, server_1.initWebSocketServer)(app.server);
    try {
        await app.listen({ port: env_1.config.port, host: '0.0.0.0' });
        console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    🛡️  SECUREX PLATFORM                     │
│         Security Operations & Threat Investigation          │
├─────────────────────────────────────────────────────────────┤
│ • Server running at: http://localhost:${env_1.config.port}                 │
│ • Health Check:      http://localhost:${env_1.config.port}/health          │
│ • Ingestion API:     http://localhost:${env_1.config.port}/api/v1/telemetry/ingest│
│ • Realtime WS:       ws://localhost:${env_1.config.port}                   │
└─────────────────────────────────────────────────────────────┘
    `);
    }
    catch (err) {
        app.log.error(err);
        process.exit(1);
    }
    // Graceful shutdown handlers
    const shutdown = async (signal) => {
        console.log(`\n[SecureX] Received ${signal}. Terminating gracefully...`);
        try {
            await app.close();
            await client_1.prisma.$disconnect();
            process.exit(0);
        }
        catch (err) {
            console.error('[SecureX] Error during shutdown:', err);
            process.exit(1);
        }
    };
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}
bootstrap().catch((err) => {
    console.error('Fatal bootstrapping error:', err);
    process.exit(1);
});
