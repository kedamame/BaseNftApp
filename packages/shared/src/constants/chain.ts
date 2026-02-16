import { base } from 'viem/chains';

export const SUPPORTED_CHAIN = base;
export const SUPPORTED_CHAIN_ID = 8453 as const;

export const RPC_URLS = {
  [SUPPORTED_CHAIN_ID]:
    process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
} as const;
