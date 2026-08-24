import { SecureXClient } from '../../sdk/src/client';
import {
  runAptAttackCampaign,
  runRansomwareCampaign,
  runApiExploitCampaign,
  generateBenignTraffic,
} from './scenarios';

async function main() {
  const client = new SecureXClient({
    apiKey: process.env.SECUREX_API_KEY || 'secx_live_k8v92mqp019842a7bc',
    endpointUrl: process.env.SECUREX_ENDPOINT || 'http://localhost:3000/api/v1/telemetry/ingest',
    serviceName: 'prod-gateway-service',
    tenantId: 'tenant-enterprise-01',
    batchSize: 10,
    debug: false,
  });

  const arg = process.argv.find((a) => a.startsWith('--scenario='))?.split('=')[1] || 'all';

  console.log(`
┌─────────────────────────────────────────────────────────────┐
│             ⚔️  SECUREX THREAT SIMULATOR CLI                │
│    Generating realistic adversary telemetry & attacks       │
└─────────────────────────────────────────────────────────────┘
  `);

  if (arg === 'bruteforce' || arg === 'apt') {
    await runAptAttackCampaign(client);
  } else if (arg === 'ransomware') {
    await runRansomwareCampaign(client);
  } else if (arg === 'exploit') {
    await runApiExploitCampaign(client);
  } else {
    // Run benign traffic + all campaigns
    console.log('[Simulator] 🌐 Emitting baseline benign traffic...');
    for (let i = 0; i < 15; i++) {
      await generateBenignTraffic(client);
      await new Promise((r) => setTimeout(r, 50));
    }

    await runAptAttackCampaign(client);
    await new Promise((r) => setTimeout(r, 600));

    await runRansomwareCampaign(client);
    await new Promise((r) => setTimeout(r, 600));

    await runApiExploitCampaign(client);
  }

  // Flush remaining
  await client.flush();
  client.stop();

  console.log('\n✨ Simulation completed! Check your SecureX SOC Threat Dashboard and Investigation Workspace.\n');
  process.exit(0);
}

main().catch((err) => {
  console.error('[Simulator Error]', err);
  process.exit(1);
});
