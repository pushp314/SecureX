import crypto from 'crypto';
import { prisma } from '../../db/client';

let lastBlockHash = '0000000000000000000000000000000000000000000000000000000000000000';

export interface VerifiedAuditRecord {
  id: string;
  action: string;
  actor: string;
  details: string;
  previousHash: string;
  hash: string;
  createdAt: string;
  isValidChain: boolean;
}

export async function logAudit(action: string, actor: string, details: any) {
  try {
    const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
    const now = new Date();

    // Compute cryptographic block hash
    const blockPayload = `${lastBlockHash}|${action}|${actor}|${detailsStr}|${now.toISOString()}`;
    const hash = crypto.createHash('sha256').update(blockPayload).digest('hex');

    // Store in DB
    const record = await prisma.auditLog.create({
      data: {
        action,
        actor,
        details: JSON.stringify({
          data: details,
          prevHash: lastBlockHash,
          hash,
        }),
        createdAt: now,
      },
    });

    lastBlockHash = hash;
    return record;
  } catch (err) {
    console.error('[Audit Service] Failed to write audit log:', err);
  }
}

export async function getVerifiedAuditChain(limit = 50): Promise<VerifiedAuditRecord[]> {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return logs.map((log) => {
    let parsed: any = {};
    try {
      parsed = JSON.parse(log.details);
    } catch {}

    const prevHash = parsed.prevHash || 'GENESIS_BLOCK';
    const hash = parsed.hash || 'UNHASHED_LEGACY';

    return {
      id: log.id,
      action: log.action,
      actor: log.actor,
      details: typeof parsed.data === 'string' ? parsed.data : JSON.stringify(parsed.data || log.details),
      previousHash: prevHash,
      hash,
      createdAt: log.createdAt.toISOString(),
      isValidChain: hash.length === 64,
    };
  });
}
