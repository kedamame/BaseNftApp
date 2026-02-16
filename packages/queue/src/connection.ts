import type { ConnectionOptions } from 'bullmq';

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.REDIS_PASSWORD) {
  console.warn('[queue] WARNING: REDIS_PASSWORD is not set in production');
}

export const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null,
  tls: isProduction ? {} : undefined,
};
