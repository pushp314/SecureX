import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  databaseUrl: process.env.DATABASE_URL || 'file:./securex.db',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  defaultApiKey: process.env.DEFAULT_API_KEY || 'secx_live_k8v92mqp019842a7bc',
  nodeEnv: process.env.NODE_ENV || 'development',
};
