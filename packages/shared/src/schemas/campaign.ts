import { z } from 'zod';
import { getAddress, isAddress } from 'viem';

export const ethereumAddressSchema = z
  .string()
  .refine(isAddress, 'Invalid Ethereum address')
  .transform((addr) => getAddress(addr) as `0x${string}`);

export const recipientEntrySchema = z.object({
  address: ethereumAddressSchema,
  amount: z.number().int().positive().default(1),
});

export const createCampaignSchema = z
  .object({
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    metadataUri: z
      .string()
      .refine(
        (val) => {
          if (val.startsWith('data:application/json;base64,')) return true;
          try {
            const url = new URL(val);
            return ['https:', 'http:', 'ipfs:'].includes(url.protocol);
          } catch {
            return false;
          }
        },
        'Must be a valid https, http, ipfs, or data URI',
      )
      .refine(
        (val) => !val.startsWith('data:') || val.length <= 100_000,
        'Data URI is too large (max ~100KB)',
      ),
    distributionMode: z.enum(['manual', 'random', 'all']),
    randomCount: z.number().int().positive().optional(),
    recipients: z.array(recipientEntrySchema).min(1).max(10000),
    contractAddress: ethereumAddressSchema.optional(),
    tokenId: z.string().regex(/^\d+$/, 'tokenId must be a non-negative integer string').optional(),
  })
  .refine(
    (data) => {
      if (data.distributionMode === 'random') {
        return data.randomCount != null && data.randomCount <= data.recipients.length;
      }
      return true;
    },
    {
      message: 'randomCount is required and must be <= recipients count when mode is random',
      path: ['randomCount'],
    },
  );

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const idempotencyKeySchema = z
  .string()
  .uuid('Idempotency key must be a valid UUID');
