import { type WalletClient, type PublicClient, type Chain, type Transport, type Account, decodeEventLog } from 'viem';
import { nftFactoryAbi, campaignNftAbi } from '@base-nft/shared';

type ConnectedWalletClient = WalletClient<Transport, Chain, Account>;

export async function deployCampaign(
  walletClient: ConnectedWalletClient,
  publicClient: PublicClient,
  factoryAddress: `0x${string}`,
  uri: string,
): Promise<`0x${string}`> {
  const txHash = await walletClient.writeContract({
    address: factoryAddress,
    abi: nftFactoryAbi,
    functionName: 'createCampaign',
    args: [uri],
  });

  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });

  // Extract clone address from CampaignCreated event
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: nftFactoryAbi,
        data: log.data,
        topics: log.topics,
      });
      if (decoded.eventName === 'CampaignCreated') {
        return decoded.args.clone;
      }
    } catch {
      // Not our event, skip
    }
  }

  throw new Error('CampaignCreated event not found in transaction receipt');
}

export async function grantOperatorRole(
  walletClient: ConnectedWalletClient,
  publicClient: PublicClient,
  campaignAddress: `0x${string}`,
  operatorAddress: `0x${string}`,
): Promise<void> {
  const operatorRole = await publicClient.readContract({
    address: campaignAddress,
    abi: campaignNftAbi,
    functionName: 'OPERATOR_ROLE',
  });

  const txHash = await walletClient.writeContract({
    address: campaignAddress,
    abi: campaignNftAbi,
    functionName: 'grantRole',
    args: [operatorRole, operatorAddress],
  });

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });
}
