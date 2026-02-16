export type CampaignStatus = 'draft' | 'active' | 'distributing' | 'completed' | 'failed';

export type DistributionMode = 'manual' | 'random' | 'all';

export interface CampaignSummary {
  id: string;
  name: string;
  contractAddress: `0x${string}` | null;
  tokenId: bigint | null;
  status: CampaignStatus;
  distributionMode: DistributionMode;
  totalRecipients: number;
  distributedCount: number;
  createdAt: Date;
}
