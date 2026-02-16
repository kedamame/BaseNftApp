import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

export async function GET() {
  if (!process.env.FC_ACCOUNT_ASSOCIATION_HEADER) {
    console.warn('[manifest] Account association not configured — generate via Warpcast Manifest Tool');
  }

  return NextResponse.json(
    {
      accountAssociation: {
        header: process.env.FC_ACCOUNT_ASSOCIATION_HEADER ?? '',
        payload: process.env.FC_ACCOUNT_ASSOCIATION_PAYLOAD ?? '',
        signature: process.env.FC_ACCOUNT_ASSOCIATION_SIGNATURE ?? '',
      },
      miniapp: {
        version: '1',
        name: 'Base NFT Airdrop',
        homeUrl: APP_URL,
        iconUrl: `${APP_URL}/icon.png`,
        splashImageUrl: `${APP_URL}/splash.png`,
        splashBackgroundColor: '#1E40AF',
        subtitle: 'NFT Airdrop on Base',
        description: 'Create and distribute NFT airdrops on Base',
        requiredChains: ['eip155:8453'],
        requiredCapabilities: [],
      },
    },
    {
      headers: {
        'Cache-Control': 'public, max-age=3600',
      },
    },
  );
}
