"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
exports.config = {
    port: parseInt(process.env.PORT || '3000', 10),
    databaseUrl: process.env.DATABASE_URL || 'file:./securex.db',
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    defaultApiKey: process.env.DEFAULT_API_KEY || 'secx_live_k8v92mqp019842a7bc',
    nodeEnv: process.env.NODE_ENV || 'development',
};
