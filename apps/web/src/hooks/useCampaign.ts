'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Recipient {
  id: string;
  address: string;
  amount: number;
  status: string;
  txHash: string | null;
  error: string | null;
}

export interface Distribution {
  id: string;
  batchIndex: number;
  status: string;
  txHash: string | null;
  error: string | null;
  recipientIds: string[];
}

export interface CampaignDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  distributionMode: string;
  metadataUri: string;
  contractAddress: string | null;
  tokenId: string | null;
  totalSupply: number;
  creatorFid: number;
  createdAt: string;
  recipients: Recipient[];
  distributions: Distribution[];
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ['campaign', id],
    queryFn: () => apiClient.get<CampaignDetail>(`/api/campaigns/${encodeURIComponent(id)}`),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'DISTRIBUTING' ? 5000 : false;
    },
  });
}
