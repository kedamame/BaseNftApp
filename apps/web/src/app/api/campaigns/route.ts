import { NextRequest } from 'next/server';
import { prisma } from '@base-nft/db';
import { createCampaignSchema } from '@base-nft/shared';
import { extractFarcasterAuth, unauthorized } from '@/lib/auth';
import { success, error, handleZodError, serverError } from '@/lib/api';

export async function POST(request: NextRequest) {
  try {
    const auth = await extractFarcasterAuth(request);
    if (!auth) return unauthorized();

    const body = await request.json();
    const parsed = createCampaignSchema.safeParse(body);
    if (!parsed.success) return handleZodError(parsed.error);

    const {
      name,
      description,
      metadataUri,
      distributionMode,
      randomCount,
      recipients,
      contractAddress,
      tokenId,
    } = parsed.data;

    const campaign = await prisma.campaign.create({
      data: {
        name,
        description,
        metadataUri,
        distributionMode: distributionMode.toUpperCase() as 'MANUAL' | 'RANDOM' | 'ALL',
        randomCount: distributionMode === 'random' ? randomCount : null,
        creatorFid: auth.fid,
        creatorAddress: auth.address ?? '',
        totalSupply: recipients.reduce((sum, r) => sum + r.amount, 0),
        contractAddress: contractAddress ?? null,
        tokenId: tokenId ? BigInt(tokenId) : null,
        status: contractAddress ? 'ACTIVE' : 'DRAFT',
        recipients: {
          create: recipients.map((r) => ({
            address: r.address,
            amount: r.amount,
            source: 'MANUAL' as const,
          })),
        },
      },
      include: { recipients: true },
    });

    await prisma.auditLog.create({
      data: {
        campaignId: campaign.id,
        action: 'CAMPAIGN_CREATED',
        actor: String(auth.fid),
        actorFid: auth.fid,
        details: { name, distributionMode, recipientCount: recipients.length },
      },
    });

    return success(campaign, 201);
  } catch (err) {
    return serverError(err);
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await extractFarcasterAuth(request);
    if (!auth) return unauthorized();

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);

    const campaigns = await prisma.campaign.findMany({
      where: { creatorFid: auth.fid },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { recipients: true } },
      },
    });

    const hasMore = campaigns.length > limit;
    if (hasMore) campaigns.pop();

    return success({
      campaigns,
      nextCursor: hasMore ? campaigns.at(-1)?.id ?? null : null,
    });
  } catch (err) {
    return serverError(err);
  }
}
