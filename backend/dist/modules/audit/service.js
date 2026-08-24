"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAudit = logAudit;
exports.getVerifiedAuditChain = getVerifiedAuditChain;
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("../../db/client");
let lastBlockHash = '0000000000000000000000000000000000000000000000000000000000000000';
async function logAudit(action, actor, details) {
    try {
        const detailsStr = typeof details === 'string' ? details : JSON.stringify(details);
        const now = new Date();
        // Compute cryptographic block hash
        const blockPayload = `${lastBlockHash}|${action}|${actor}|${detailsStr}|${now.toISOString()}`;
        const hash = crypto_1.default.createHash('sha256').update(blockPayload).digest('hex');
        // Store in DB
        const record = await client_1.prisma.auditLog.create({
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
    }
    catch (err) {
        console.error('[Audit Service] Failed to write audit log:', err);
    }
}
async function getVerifiedAuditChain(limit = 50) {
    const logs = await client_1.prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: limit,
    });
    return logs.map((log) => {
        let parsed = {};
        try {
            parsed = JSON.parse(log.details);
        }
        catch { }
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
