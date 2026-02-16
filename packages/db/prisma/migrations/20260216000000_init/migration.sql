-- CreateEnum
CREATE TYPE "CampaignStatus" AS ENUM ('DRAFT', 'ACTIVE', 'DISTRIBUTING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DistributionMode" AS ENUM ('MANUAL', 'RANDOM', 'ALL');

-- CreateEnum
CREATE TYPE "RecipientSource" AS ENUM ('MANUAL', 'CSV', 'NFT_HOLDERS', 'TOKEN_BALANCE', 'FARCASTER');

-- CreateEnum
CREATE TYPE "RecipientStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('PENDING', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "creatorFid" INTEGER NOT NULL,
    "creatorAddress" TEXT NOT NULL,
    "contractAddress" TEXT,
    "tokenId" BIGINT,
    "metadataUri" TEXT NOT NULL,
    "metadataFrozen" BOOLEAN NOT NULL DEFAULT false,
    "distributionMode" "DistributionMode" NOT NULL DEFAULT 'MANUAL',
    "randomSeed" TEXT,
    "randomCount" INTEGER,
    "status" "CampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "totalSupply" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipient" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "amount" INTEGER NOT NULL DEFAULT 1,
    "source" "RecipientSource" NOT NULL DEFAULT 'MANUAL',
    "status" "RecipientStatus" NOT NULL DEFAULT 'PENDING',
    "txHash" TEXT,
    "error" TEXT,
    "distributedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Recipient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "batchIndex" INTEGER NOT NULL,
    "txHash" TEXT,
    "status" "DistributionStatus" NOT NULL DEFAULT 'PENDING',
    "recipientIds" TEXT[],
    "gasUsed" BIGINT,
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "idempotencyKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RandomDraw" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "serverSeed" TEXT NOT NULL,
    "blockHash" TEXT,
    "nonce" INTEGER NOT NULL,
    "resultHash" TEXT NOT NULL,
    "selectedAddresses" TEXT[],
    "totalCandidates" INTEGER NOT NULL,
    "selectedCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RandomDraw_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT,
    "action" TEXT NOT NULL,
    "actor" TEXT NOT NULL,
    "actorFid" INTEGER,
    "ipAddress" TEXT,
    "details" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Campaign_creatorFid_idx" ON "Campaign"("creatorFid");

-- CreateIndex
CREATE INDEX "Campaign_status_idx" ON "Campaign"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Recipient_campaignId_address_key" ON "Recipient"("campaignId", "address");

-- CreateIndex
CREATE INDEX "Recipient_campaignId_idx" ON "Recipient"("campaignId");

-- CreateIndex
CREATE INDEX "Recipient_status_idx" ON "Recipient"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Distribution_idempotencyKey_key" ON "Distribution"("idempotencyKey");

-- CreateIndex
CREATE INDEX "Distribution_campaignId_idx" ON "Distribution"("campaignId");

-- CreateIndex
CREATE INDEX "Distribution_status_idx" ON "Distribution"("status");

-- CreateIndex
CREATE INDEX "RandomDraw_campaignId_idx" ON "RandomDraw"("campaignId");

-- CreateIndex
CREATE INDEX "AuditLog_campaignId_idx" ON "AuditLog"("campaignId");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_actor_idx" ON "AuditLog"("actor");

-- AddForeignKey
ALTER TABLE "Recipient" ADD CONSTRAINT "Recipient_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Distribution" ADD CONSTRAINT "Distribution_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RandomDraw" ADD CONSTRAINT "RandomDraw_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
