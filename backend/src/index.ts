import fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config/env';
import { initWebSocketServer } from './modules/websocket/server';
import { ingestionRoutes } from './modules/ingestion/routes';
import { investigationRoutes } from './modules/investigation/routes';
import { rulesRoutes } from './modules/rules/routes';
import { playbooksRoutes } from './modules/playbooks/routes';
import { replayRoutes } from './modules/replay/routes';
import { reportsRoutes } from './modules/reports/routes';
import { copilotRoutes } from './modules/copilot/routes';
import { vulnScannerRoutes } from './modules/vulnscanner/routes';
import { webhooksRoutes } from './modules/webhooks/routes';
import { networkRoutes } from './modules/network/routes';
import { devsecopsRoutes } from './modules/devsecops/routes';
import { apiKeysRoutes } from './modules/apikeys/routes';
import { huntingRoutes } from './modules/hunting/routes';
import { alertsRoutes } from './modules/alerts/routes';
import { observabilityRoutes } from './modules/observability/routes';
import { cloudRoutes } from './modules/cloud/routes';
import { sandboxRoutes } from './modules/sandbox/routes';
import { itdrRoutes } from './modules/itdr/routes';
import { complianceRoutes } from './modules/compliance/routes';
import { dlqRoutes } from './modules/dlq/routes';
import { authRoutes } from './modules/auth/routes';
import { parserRoutes } from './modules/parsers/routes';
import { threatIntelRoutes } from './modules/threatintel/routes';
import { kqlRoutes } from './modules/kql/routes';
import { uebaRoutes } from './modules/ueba/routes';
import { retentionRoutes } from './modules/retention/routes';
import { sigmaRoutes } from './modules/sigma/routes';
import { basRoutes } from './modules/bas/routes';
import { blastRadiusRoutes } from './modules/blastradius/routes';
import { tuningRoutes } from './modules/tuning/routes';
import { prisma } from './db/client';

async function bootstrap() {
  const app = fastify({
    logger: {
      level: config.nodeEnv === 'development' ? 'info' : 'warn',
    },
  });

  // Enable CORS
  await app.register(cors, {
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
  await app.register(authRoutes);
  await app.register(ingestionRoutes);
  await app.register(investigationRoutes);
  await app.register(rulesRoutes);
  await app.register(playbooksRoutes);
  await app.register(replayRoutes);
  await app.register(reportsRoutes);
  await app.register(copilotRoutes);
  await app.register(vulnScannerRoutes);
  await app.register(webhooksRoutes);
  await app.register(networkRoutes);
  await app.register(devsecopsRoutes);
  await app.register(apiKeysRoutes);
  await app.register(huntingRoutes);
  await app.register(alertsRoutes);
  await app.register(observabilityRoutes);
  await app.register(cloudRoutes);
  await app.register(sandboxRoutes);
  await app.register(itdrRoutes);
  await app.register(complianceRoutes);
  await app.register(dlqRoutes);
  await app.register(parserRoutes);
  await app.register(threatIntelRoutes);
  await app.register(kqlRoutes);
  await app.register(uebaRoutes);
  await app.register(retentionRoutes);
  await app.register(sigmaRoutes);
  await app.register(basRoutes);
  await app.register(blastRadiusRoutes);
  await app.register(tuningRoutes);

  // Initialize WebSockets on the Fastify raw Node HTTP server
  initWebSocketServer(app.server);

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    console.log(`
┌─────────────────────────────────────────────────────────────┐
│                    🛡️  SECUREX PLATFORM                     │
│         Security Operations & Threat Investigation          │
├─────────────────────────────────────────────────────────────┤
│ • Server running at: http://localhost:${config.port}                 │
│ • Health Check:      http://localhost:${config.port}/health          │
│ • Ingestion API:     http://localhost:${config.port}/api/v1/telemetry/ingest│
│ • Realtime WS:       ws://localhost:${config.port}                   │
└─────────────────────────────────────────────────────────────┘
    `);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown handlers
  const shutdown = async (signal: string) => {
    console.log(`\n[SecureX] Received ${signal}. Terminating gracefully...`);
    try {
      await app.close();
      await prisma.$disconnect();
      process.exit(0);
    } catch (err) {
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
