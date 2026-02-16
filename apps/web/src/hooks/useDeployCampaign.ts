'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePublicClient, useWalletClient } from 'wagmi';
import { deployCampaign, grantOperatorRole } from '@/lib/contracts';
import { apiClient } from '@/lib/api-client';

interface DeployInput {
  name: string;
  description?: string;
  metadataUri: string;
  distributionMode: 'manual' | 'random' | 'all';
  randomCount?: number;
  recipients: { address: string; amount: number }[];
}

interface DeployResult {
  campaignId: string;
  contractAddress: string;
}

export type DeployStep = 'deploy' | 'grant-role' | 'save' | 'done';

export function useDeployCampaign(onStepChange?: (step: DeployStep) => void) {
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const queryClient = useQueryClient();

  const factoryAddress = process.env.NEXT_PUBLIC_FACTORY_ADDRESS as `0x${string}` | undefined;
  const deployerAddress = process.env.NEXT_PUBLIC_DEPLOYER_ADDRESS as `0x${string}` | undefined;

  return useMutation({
    mutationFn: async (input: DeployInput): Promise<DeployResult> => {
      if (!walletClient) throw new Error('Wallet not connected');
      if (!publicClient) throw new Error('Public client not available');
      if (!factoryAddress) throw new Error('Factory address not configured');
      if (!deployerAddress) throw new Error('Deployer address not configured');

      // Step 1: Deploy campaign contract on-chain
      onStepChange?.('deploy');
      const contractAddress = await deployCampaign(
        walletClient,
        publicClient,
        factoryAddress,
        input.metadataUri,
      );

      // Step 2: Grant OPERATOR_ROLE to deployer (server wallet) for minting
      onStepChange?.('grant-role');
      try {
        await grantOperatorRole(walletClient, publicClient, contractAddress, deployerAddress);
      } catch (err) {
        throw new Error(
          `Grant role failed. Contract deployed at ${contractAddress}. ` +
            `Please grant OPERATOR_ROLE manually. Original error: ${err instanceof Error ? err.message : err}`,
        );
      }

      // Step 3: Save campaign to DB via API
      onStepChange?.('save');
      try {
        const campaign = await apiClient.post<{ id: string }>('/api/campaigns', {
          ...input,
          contractAddress,
          tokenId: '0',
        });

        onStepChange?.('done');
        return { campaignId: campaign.id, contractAddress };
      } catch (err) {
        throw new Error(
          `API save failed. Contract deployed at ${contractAddress} with operator role granted. ` +
            `Please save campaign manually. Original error: ${err instanceof Error ? err.message : err}`,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}
