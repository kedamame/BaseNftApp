import { NextRequest } from 'next/server';
import { prisma, Prisma } from '@base-nft/db';
import { createDistributionQueue } from '@base-nft/queue';
import type { DistributionJobData } from '@base-nft/queue';
import { extractFarcasterAuth, unauthorized } from '@/lib/auth';
import { success, error, serverError } from '@/lib/api';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await extractFarcasterAuth(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return error('NOT_FOUND', undefined, 404);
    if (campaign.creatorFid !== auth.fid) return error('FORBIDDEN', undefined, 403);
    if (campaign.status !== 'FAILED' && campaign.status !== 'DISTRIBUTING') {
      return error('INVALID_STATUS', 'Can only retry failed or distributing campaigns', 400);
    }

    // Atomically fetch and update FAILED distributions to prevent double-retry
    const failedDistributions = await prisma.distribution.findMany({
      where: { campaignId: id, status: 'FAILED' },
    });

    if (failedDistributions.length === 0) {
      return error('NO_FAILED_BATCHES', 'No failed batches to retry', 400);
    }

    // Prepare job data inside transaction, enqueue after commit
    const jobsToEnqueue: { name: string; data: DistributionJobData; jobId: string }[] = [];

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      for (const dist of failedDistributions) {
        // Re-check status inside transaction to prevent race condition
        const current = await tx.distribution.findUnique({ where: { id: dist.id } });
        if (!current || current.status !== 'FAILED') continue;

        const recipients = await tx.recipient.findMany({
          where: { id: { in: dist.recipientIds } },
        });

        const newIdempotencyKey = crypto.randomUUID();

        await tx.distribution.update({
          where: { id: dist.id },
          data: {
            status: 'QUEUED',
            idempotencyKey: newIdempotencyKey,
            retryCount: { increment: 1 },
            error: null,
          },
        });

        await tx.recipient.updateMany({
          where: { id: { in: dist.recipientIds } },
          data: { status: 'QUEUED', error: null },
        });

        jobsToEnqueue.push({
          name: `retry-${id}-${dist.batchIndex}`,
          data: {
            campaignId: id,
            batchIndex: dist.batchIndex,
            recipientAddresses: recipients.map((r) => r.address as `0x${string}`),
            amounts: recipients.map((r) => r.amount),
            contractAddress: campaign.contractAddress as `0x${string}`,
            tokenId: campaign.tokenId!.toString(),
            idempotencyKey: newIdempotencyKey,
          },
          jobId: newIdempotencyKey,
        });
      }

      await tx.campaign.update({
        where: { id },
        data: { status: 'DISTRIBUTING' },
      });
    });

    // Enqueue jobs after DB transaction succeeds
    const queue = createDistributionQueue();
    for (const job of jobsToEnqueue) {
      await queue.add(job.name, job.data, { jobId: job.jobId });
    }
    await queue.close();

    await prisma.auditLog.create({
      data: {
        campaignId: id,
        action: 'DISTRIBUTION_RETRIED',
        actor: String(auth.fid),
        actorFid: auth.fid,
        details: { retriedBatches: jobsToEnqueue.length },
      },
    });

    return success({ retriedBatches: jobsToEnqueue.length });
  } catch (err) {
    return serverError(err);
  }
}
