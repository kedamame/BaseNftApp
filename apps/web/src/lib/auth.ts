import { NextRequest, NextResponse } from 'next/server';
import { verifyQuickAuthToken } from './quick-auth';

export interface FarcasterAuth {
  fid: number;
  address?: string;
}

export async function extractFarcasterAuth(
  request: NextRequest,
): Promise<FarcasterAuth | null> {
  // Dev-only bypass: requires explicit ALLOW_DEV_AUTH=true env var.
  // This is never set in production deployments. Gated behind both
  // NODE_ENV and an explicit flag to prevent accidental production use.
  if (
    process.env.NODE_ENV === 'development' &&
    process.env.ALLOW_DEV_AUTH === 'true'
  ) {
    const fid = request.headers.get('X-Farcaster-FID');
    if (fid) {
      const parsed = parseInt(fid, 10);
      if (Number.isNaN(parsed) || parsed <= 0) return null;
      return {
        fid: parsed,
        address: request.headers.get('X-Farcaster-Address') || undefined,
      };
    }
  }

  // Production: verify Quick Auth JWT from Authorization header
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  if (!token) return null;

  const result = await verifyQuickAuthToken(token);
  if (!result) return null;

  return { fid: result.fid };
}

export function unauthorized(message = 'UNAUTHORIZED') {
  return NextResponse.json({ error: { code: 'UNAUTHORIZED', message } }, { status: 401 });
}
