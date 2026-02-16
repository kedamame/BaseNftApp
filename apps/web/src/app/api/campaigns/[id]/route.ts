import { NextRequest } from 'next/server';
import { prisma } from '@base-nft/db';
import { extractFarcasterAuth, unauthorized } from '@/lib/auth';
import { success, error, serverError } from '@/lib/api';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const auth = await extractFarcasterAuth(request);
    if (!auth) return unauthorized();

    const { id } = await params;

    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        recipients: { orderBy: { createdAt: 'asc' } },
        distributions: { orderBy: { batchIndex: 'asc' } },
        randomDraws: true,
      },
    });

    if (!campaign) return error('NOT_FOUND', undefined, 404);
    if (campaign.creatorFid !== auth.fid) return error('FORBIDDEN', undefined, 403);

    return success(campaign);
  } catch (err) {
    return serverError(err);
  }
}
