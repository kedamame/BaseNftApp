import { createClient, type Errors } from '@farcaster/quick-auth';

const client = createClient();

const domain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? '';

export interface QuickAuthResult {
  fid: number;
}

/**
 * Verify a Farcaster Quick Auth JWT token.
 * Returns the user's FID or null if verification fails.
 */
export async function verifyQuickAuthToken(
  token: string,
): Promise<QuickAuthResult | null> {
  if (!domain) {
    console.error('[quick-auth] NEXT_PUBLIC_APP_DOMAIN is not set');
    return null;
  }

  try {
    const payload = await client.verifyJwt({ token, domain });
    if (typeof payload.sub !== 'number' || payload.sub <= 0) return null;
    return { fid: payload.sub };
  } catch (err) {
    // Fail closed: all errors (invalid token, network, service down) → reject auth.
    // InvalidTokenError is expected for expired/malformed tokens (no log needed).
    // Other errors (network, service unavailable) are logged for observability.
    if ((err as Errors.InvalidTokenError).name !== 'InvalidToken') {
      console.error('[quick-auth] Verification error:', err);
    }
    return null;
  }
}
