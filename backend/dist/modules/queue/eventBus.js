"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventBus = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
const engine_1 = require("../detection/engine");
class EventBus {
    redisClient = null;
    inMemoryQueue = [];
    isProcessing = false;
    handlers = [];
    useRedis = false;
    constructor() {
        this.init();
    }
    async init() {
        try {
            const client = new ioredis_1.default(env_1.config.redisUrl, {
                maxRetriesPerRequest: 1,
                retryStrategy: () => null, // don't hang if redis is not running
                connectTimeout: 1000,
                lazyConnect: true,
            });
            await client.connect();
            this.redisClient = client;
            this.useRedis = true;
            console.log('[EventBus] Connected to Redis Stream Queue');
        }
        catch {
            this.useRedis = false;
            console.log('[EventBus] Using In-Memory Ring Buffer Event Bus (Zero-latency)');
        }
        // Start background processor loop
        this.startWorker();
    }
    registerHandler(handler) {
        this.handlers.push(handler);
    }
    async publishTelemetry(event) {
        if (this.useRedis && this.redisClient) {
            try {
                await this.redisClient.xadd('securex:telemetry:stream', '*', 'payload', JSON.stringify(event));
            }
            catch (err) {
                // Redis optional
            }
        }
        // Direct in-process execution for registered detection handlers
        for (const handler of this.handlers) {
            handler(event).catch((err) => console.error('[EventBus Handler Error]', err));
        }
    }
    async startWorker() {
        setInterval(async () => {
            if (this.isProcessing)
                return;
            this.isProcessing = true;
            try {
                while (this.inMemoryQueue.length > 0) {
                    const event = this.inMemoryQueue.shift();
                    if (event) {
                        for (const handler of this.handlers) {
                            await handler(event).catch((err) => console.error('[EventBus Handler Error]', err));
                        }
                    }
                }
            }
            finally {
                this.isProcessing = false;
            }
        }, 50); // 50ms polling loop
    }
}
exports.eventBus = new EventBus();
// Wire default detection engine handler
exports.eventBus.registerHandler(async (event) => {
    await (0, engine_1.processIncomingTelemetry)(event);
});
