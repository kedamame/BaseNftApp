import { NextRequest } from 'next/server';
import { prisma } from '@base-nft/db';
import { campaignNftAbi } from '@base-nft/shared';
import { getPublicClient, getWalletClient, getDeployerAccount } from '@base-nft/shared/server';
import { extractFarcasterAuth, unauthorized } from '@/lib/auth';
import { success, error, serverError } from '@/lib/api';

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

    const publicClient = getPublicClient();
    const walletClient = getWalletClient();
    const account = getDeployerAccount();

    const contractAddress = campaign.contractAddress as `0x${string}`;
    const tokenId = campaign.tokenId!;
    const recipients = campaign.recipients;

    // Mark campaign as distributing
    await prisma.campaign.update({
      where: { id },
      data: { status: 'DISTRIBUTING' },
    });

    // Mint directly — process all recipients in one mintBatch call
    const addresses = recipients.map((r) => r.address as `0x${string}`);
    const amounts = recipients.map((r) => BigInt(r.amount));

    // Simulate first to catch reverts early
    await publicClient.simulateContract({
      address: contractAddress,
      abi: campaignNftAbi,
      functionName: 'mintBatch',
      args: [addresses, tokenId, amounts],
      account,
    });

    const txHash = await walletClient.writeContract({
      address: contractAddress,
      abi: campaignNftAbi,
      functionName: 'mintBatch',
      args: [addresses, tokenId, amounts],
    });

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    if (receipt.status === 'reverted') {
      await prisma.campaign.update({ where: { id }, data: { status: 'FAILED' } });
      return error('TX_REVERTED', `Transaction reverted: ${txHash}`, 500);
    }

    // Mark all recipients and campaign as completed
    const now = new Date();
    await prisma.$transaction([
      prisma.recipient.updateMany({
        where: { id: { in: recipients.map((r) => r.id) } },
        data: { status: 'COMPLETED', txHash, distributedAt: now },
      }),
      prisma.campaign.update({
        where: { id },
        data: { status: 'COMPLETED' },
      }),
      prisma.auditLog.create({
        data: {
          campaignId: id,
          action: 'DISTRIBUTION_COMPLETED',
          actor: String(auth.fid),
          actorFid: auth.fid,
          details: { txHash, recipientCount: recipients.length },
        },
      }),
    ]);

    return success({ campaignId: id, txHash, recipientCount: recipients.length });
  } catch (err) {
    return serverError(err);
  }
}
