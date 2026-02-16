'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CampaignListItem {
  id: string;
  name: string;
  status: string;
  distributionMode: string;
  createdAt: string;
  _count: { recipients: number };
}

interface CampaignsPage {
  campaigns: CampaignListItem[];
  nextCursor: string | null;
}

export function useCampaigns() {
  return useInfiniteQuery({
    queryKey: ['campaigns'],
    queryFn: ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : '';
      return apiClient.get<CampaignsPage>(`/api/campaigns${params}`);
    },
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });
}
