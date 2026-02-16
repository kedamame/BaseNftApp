export interface DistributionJobData {
  campaignId: string;
  batchIndex: number;
  recipientAddresses: `0x${string}`[];
  amounts: number[];
  contractAddress: `0x${string}`;
  tokenId: string; // BigInt serialized as string
  idempotencyKey: string;
}

export interface MetadataUploadJobData {
  campaignId: string;
  name: string;
  description: string;
  imageUrl: string;
}

export type JobDataMap = {
  distribution: DistributionJobData;
  'metadata-upload': MetadataUploadJobData;
};
