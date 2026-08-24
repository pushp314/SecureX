"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replayRoutes = replayRoutes;
const service_1 = require("./service");
async function replayRoutes(fastify) {
    // Backtest draft rule against historical events
    fastify.post('/api/v1/rules/backtest', async (request, reply) => {
        const body = request.body;
        try {
            const result = await (0, service_1.backtestRuleAgainstHistory)(body);
            return reply.send(result);
        }
        catch (err) {
            return reply.status(400).send({ error: err.message });
        }
    });
}
