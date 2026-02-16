import { NextRequest } from 'next/server';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '@base-nft/db';
import { createDistributionQueue } from '@base-nft/queue';
import type { DistributionJobData } from '@base-nft/queue';
import { extractFarcasterAuth, unauthorized } from '@/lib/auth';
import { success, error, serverError } from '@/lib/api';

const BATCH_SIZE = 100;

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await extractFarcasterAuth(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { recipients: { where: { status: 'PENDING' } } },
    });

    if (!campaign) return error('NOT_FOUND', undefined, 404);
    if (campaign.creatorFid !== auth.fid) return error('FORBIDDEN', undefined, 403);
    if (!campaign.contractAddress || campaign.tokenId === null) {
      return error('CONTRACT_NOT_DEPLOYED', 'Contract must be deployed first', 400);
    }
    if (campaign.status !== 'ACTIVE' && campaign.status !== 'DRAFT') {
      return error('INVALID_STATUS', `Cannot distribute in ${campaign.status} status`, 400);
    }
    if (campaign.recipients.length === 0) {
      return error('NO_RECIPIENTS', 'No pending recipients to distribute to', 400);
    }

    let eligibleRecipients = campaign.recipients;

    // Random draw for RANDOM distribution mode
    if (campaign.distributionMode === 'RANDOM' && campaign.randomCount) {
      const serverSeed = randomBytes(32).toString('hex');
      const candidates = [...eligibleRecipients];
      const selectedCount = Math.min(campaign.randomCount, candidates.length);

      // Fisher-Yates shuffle with deterministic seed
      for (let i = candidates.length - 1; i > 0; i--) {
        const hashInput = `${serverSeed}:${i}`;
        const hash = createHash('sha256').update(hashInput).digest();
        const j = hash.readUInt32BE(0) % (i + 1);
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
      }

      const selected = candidates.slice(0, selectedCount);
      const selectedAddresses = selected.map((r) => r.address);
      const resultHash = createHash('sha256')
        .update(serverSeed + JSON.stringify(selectedAddresses))
        .digest('hex');

      await prisma.randomDraw.create({
        data: {
          campaignId: id,
          serverSeed,
          blockHash: '',
          nonce: 0,
          resultHash,
          selectedAddresses,
          totalCandidates: candidates.length,
          selectedCount,
        },
      });

      eligibleRecipients = selected;
    }

    // Split into batches
    const batches: (typeof eligibleRecipients)[] = [];
    for (let i = 0; i < eligibleRecipients.length; i += BATCH_SIZE) {
      batches.push(eligibleRecipients.slice(i, i + BATCH_SIZE));
    }

    const queue = createDistributionQueue();

    await prisma.$transaction(async (tx) => {
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const idempotencyKey = crypto.randomUUID();

        await tx.distribution.create({
          data: {
            campaignId: id,
            batchIndex,
            recipientIds: batch.map((r) => r.id),
            status: 'QUEUED',
            idempotencyKey,
          },
        });

        await tx.recipient.updateMany({
          where: { id: { in: batch.map((r) => r.id) } },
          data: { status: 'QUEUED' },
        });

        const jobData: DistributionJobData = {
          campaignId: id,
          batchIndex,
          recipientAddresses: batch.map((r) => r.address as `0x${string}`),
          amounts: batch.map((r) => r.amount),
          contractAddress: campaign.contractAddress as `0x${string}`,
          tokenId: campaign.tokenId!.toString(),
          idempotencyKey,
        };

        await queue.add(`distribute-${id}-${batchIndex}`, jobData, {
          jobId: idempotencyKey,
        });
      }

      await tx.campaign.update({
        where: { id },
        data: { status: 'DISTRIBUTING' },
      });
    });

    await queue.close();

    await prisma.auditLog.create({
      data: {
        campaignId: id,
        action: 'DISTRIBUTION_STARTED',
        actor: String(auth.fid),
        actorFid: auth.fid,
        details: {
          totalRecipients: eligibleRecipients.length,
          batchCount: batches.length,
          batchSize: BATCH_SIZE,
        },
      },
    });

    return success({
      campaignId: id,
      batchCount: batches.length,
      totalRecipients: eligibleRecipients.length,
    });
  } catch (err) {
    return serverError(err);
  }
}
