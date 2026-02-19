import { type WalletClient, type PublicClient, type Chain, type Transport, type Account, decodeEventLog, keccak256, toBytes } from 'viem';
import { nftFactoryAbi, campaignNftAbi } from '@base-nft/shared';

// keccak256("OPERATOR_ROLE") — matches CampaignNFT.sol constant
const OPERATOR_ROLE = keccak256(toBytes('OPERATOR_ROLE'));

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
  // Filter to logs emitted by the factory contract to avoid false matches
  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== factoryAddress.toLowerCase()) continue;
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
  // Use the pre-computed constant instead of reading from contract
  const txHash = await walletClient.writeContract({
    address: campaignAddress,
    abi: campaignNftAbi,
    functionName: 'grantRole',
    args: [OPERATOR_ROLE, operatorAddress],
  });

  await publicClient.waitForTransactionReceipt({
    hash: txHash,
    confirmations: 1,
  });
}
