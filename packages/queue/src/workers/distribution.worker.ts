import { Worker, Job, DelayedError } from 'bullmq';
import { prisma } from '@base-nft/db';
import { campaignNftAbi } from '@base-nft/shared';
import { getPublicClient, getWalletClient, getDeployerAccount } from '@base-nft/shared/server';
import { redisConnection } from '../connection';
import { QUEUE_NAMES } from '../queues';
import type { DistributionJobData } from '../jobs';
import { CircuitBreaker } from '../lib/circuit-breaker';

// Initialize clients once at module scope for reuse across jobs
const publicClient = getPublicClient();
const walletClient = getWalletClient();
const account = getDeployerAccount();

// Circuit breaker: 5 consecutive RPC failures → OPEN for 30s
const rpcBreaker = new CircuitBreaker(5, 30_000);

async function processDistribution(job: Job<DistributionJobData>) {
  const {
    campaignId,
    batchIndex,
    recipientAddresses,
    amounts,
    contractAddress,
    tokenId,
    idempotencyKey,
  } = job.data;

  console.log(
    `[worker] Processing batch ${batchIndex} for campaign ${campaignId} (${recipientAddresses.length} recipients)`,
  );

  // Circuit breaker check — delay job if RPC is unavailable
  if (!rpcBreaker.canExecute()) {
    console.warn(`[worker] Circuit breaker OPEN, delaying batch ${batchIndex}`);
    await job.moveToDelayed(Date.now() + 30_000, job.token);
    throw new DelayedError();
  }

  // Idempotency check — skip if already completed
  const existing = await prisma.distribution.findFirst({
    where: { idempotencyKey, status: 'COMPLETED' },
  });
  if (existing) {
    console.log(`[worker] Batch already completed (idempotency: ${idempotencyKey}), skipping`);
    return;
  }

  // Mark as PROCESSING
  const distribution = await prisma.distribution.findFirst({
    where: { campaignId, batchIndex, idempotencyKey },
  });

  await prisma.distribution.updateMany({
    where: { campaignId, batchIndex, idempotencyKey },
    data: { status: 'PROCESSING' },
  });

  if (distribution) {
    await prisma.recipient.updateMany({
      where: { id: { in: distribution.recipientIds } },
      data: { status: 'PROCESSING' },
    });
  }

  // txHash recovery: if a previous attempt already submitted, check its receipt
  if (distribution?.txHash) {
    console.log(`[worker] Found existing txHash ${distribution.txHash}, checking receipt`);
    try {
      const receipt = await publicClient.getTransactionReceipt({ hash: distribution.txHash as `0x${string}` });
      if (receipt && receipt.status === 'success') {
        const now = new Date();
        await prisma.distribution.updateMany({
          where: { campaignId, batchIndex, idempotencyKey },
          data: { status: 'COMPLETED', gasUsed: receipt.gasUsed, completedAt: now },
        });
        if (distribution) {
          await prisma.recipient.updateMany({
            where: { id: { in: distribution.recipientIds } },
            data: { status: 'COMPLETED', txHash: distribution.txHash, distributedAt: now },
          });
        }
        rpcBreaker.recordSuccess();
        console.log(`[worker] Batch ${batchIndex} recovered from existing tx: ${distribution.txHash}`);
        await checkCampaignCompletion(campaignId);
        return;
      }
      if (receipt && receipt.status === 'reverted') {
        console.warn(`[worker] Existing tx ${distribution.txHash} reverted, re-submitting`);
      }
    } catch {
      console.warn(`[worker] Could not fetch receipt for ${distribution.txHash}, re-submitting`);
    }
  }

  const tokenIdBigInt = BigInt(tokenId);
  const amountsBigInt = amounts.map((a) => BigInt(a));

  try {
    // Simulate first to catch reverts before spending gas
    await publicClient.simulateContract({
      address: contractAddress,
      abi: campaignNftAbi,
      functionName: 'mintBatch',
      args: [recipientAddresses, tokenIdBigInt, amountsBigInt],
      account,
    });

    // Execute transaction — persist txHash immediately for crash recovery
    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: campaignNftAbi,
      functionName: 'mintBatch',
      args: [recipientAddresses, tokenIdBigInt, amountsBigInt],
    });

    // Persist txHash before waiting for receipt
    await prisma.distribution.updateMany({
      where: { campaignId, batchIndex, idempotencyKey },
      data: { txHash },
    });

    // Wait for confirmation
    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 2,
    });

    if (receipt.status === 'reverted') {
      throw new Error(`Transaction reverted: ${txHash}`);
    }

    // Mark success
    const now = new Date();
    await prisma.distribution.updateMany({
      where: { campaignId, batchIndex, idempotencyKey },
      data: {
        status: 'COMPLETED',
        gasUsed: receipt.gasUsed,
        completedAt: now,
      },
    });

    if (distribution) {
      await prisma.recipient.updateMany({
        where: { id: { in: distribution.recipientIds } },
        data: { status: 'COMPLETED', txHash, distributedAt: now },
      });
    }

    rpcBreaker.recordSuccess();
    console.log(`[worker] Batch ${batchIndex} completed. TX: ${txHash}`);

    await checkCampaignCompletion(campaignId);
  } catch (err) {
    rpcBreaker.recordFailure();
    throw err;
  }
}

async function checkCampaignCompletion(campaignId: string) {
  const distributions = await prisma.distribution.findMany({
    where: { campaignId },
  });

  const allDone = distributions.every(
    (d) => d.status === 'COMPLETED' || d.status === 'FAILED',
  );
  if (!allDone) return;

  const anyFailed = distributions.some((d) => d.status === 'FAILED');
  const newStatus = anyFailed ? 'FAILED' : 'COMPLETED';

  await prisma.campaign.update({
    where: { id: campaignId },
    data: { status: newStatus },
  });

  console.log(`[worker] Campaign ${campaignId} status -> ${newStatus}`);
}

async function handleFailed(job: Job<DistributionJobData> | undefined, err: Error) {
  if (!job) return;
  const { campaignId, batchIndex, idempotencyKey } = job.data;
  const isFinalAttempt = job.attemptsMade >= (job.opts.attempts ?? 3);

  console.error(
    `[worker] Batch ${batchIndex} failed for campaign ${campaignId} (attempt ${job.attemptsMade}/${job.opts.attempts ?? 3}):`,
    err.message,
  );

  // Only mark as FAILED on the final attempt
  if (!isFinalAttempt) return;

  const distribution = await prisma.distribution.findFirst({
    where: { campaignId, batchIndex, idempotencyKey },
  });

  await prisma.distribution.updateMany({
    where: { campaignId, batchIndex, idempotencyKey },
    data: { status: 'FAILED', error: err.message.slice(0, 500) },
  });

  if (distribution) {
    await prisma.recipient.updateMany({
      where: { id: { in: distribution.recipientIds } },
      data: { status: 'FAILED', error: err.message.slice(0, 500) },
    });
  }

  await checkCampaignCompletion(campaignId);
}

// Start worker
const worker = new Worker<DistributionJobData>(
  QUEUE_NAMES.DISTRIBUTION,
  processDistribution,
  {
    connection: redisConnection,
    concurrency: 1,
    limiter: {
      max: 1,
      duration: 5000,
    },
  },
);

worker.on('failed', handleFailed);
worker.on('error', (err) => console.error('[worker] Worker error:', err));

console.log('[worker] Distribution worker started');

// Graceful shutdown: close worker (waits for in-flight jobs), then exit
const shutdown = async () => {
  console.log('[worker] Shutting down — closing worker...');
  await worker.close();
  console.log('[worker] Shutdown complete');
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
