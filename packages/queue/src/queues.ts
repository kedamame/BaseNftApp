import { Queue } from 'bullmq';
import { redisConnection } from './connection';

export const QUEUE_NAMES = {
  DISTRIBUTION: 'distribution',
  METADATA_UPLOAD: 'metadata-upload',
} as const;

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES];

export function createDistributionQueue() {
  return new Queue(QUEUE_NAMES.DISTRIBUTION, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  });
}

export function createMetadataQueue() {
  return new Queue(QUEUE_NAMES.METADATA_UPLOAD, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 2,
      backoff: { type: 'fixed', delay: 3000 },
      removeOnComplete: { count: 500 },
      removeOnFail: { count: 1000 },
    },
  });
}
