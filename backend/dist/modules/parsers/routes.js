"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parserRoutes = parserRoutes;
const engine_1 = require("./engine");
async function parserRoutes(fastify) {
    fastify.get('/api/v1/parsers', async (request, reply) => {
        const parsers = engine_1.logParserEngine.getParsers();
        return reply.send(parsers);
    });
    fastify.post('/api/v1/parsers/test', async (request, reply) => {
        const { rawLog, parserId } = request.body || {};
        if (!rawLog) {
            return reply.status(400).send({ error: 'rawLog string is required' });
        }
        const result = engine_1.logParserEngine.parseRawLog(rawLog, parserId);
        return reply.send(result);
    });
    fastify.post('/api/v1/parsers/ingest', async (request, reply) => {
        const { rawLog, parserId } = request.body || {};
        if (!rawLog) {
            return reply.status(400).send({ error: 'rawLog string is required' });
        }
        try {
            const event = await engine_1.logParserEngine.ingestParsedLog(rawLog, parserId);
            return reply.status(201).send({ status: 'INGESTED', event });
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
