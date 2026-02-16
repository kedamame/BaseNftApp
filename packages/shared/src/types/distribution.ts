export type RecipientStatus = 'pending' | 'queued' | 'processing' | 'completed' | 'failed';

export type RecipientSource =
  | 'manual'
  | 'csv'
  | 'nft_holders'
  | 'token_balance'
  | 'farcaster';

export interface RecipientEntry {
  address: `0x${string}`;
  amount: number;
  source: RecipientSource;
}

export interface DistributionResult {
  campaignId: string;
  batchIndex: number;
  txHash: `0x${string}` | null;
  status: RecipientStatus;
  recipientCount: number;
  error?: string;
}
