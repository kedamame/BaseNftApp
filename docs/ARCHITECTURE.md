# Architecture

## System Overview

Base NFT App is a Farcaster Mini App for creating and distributing ERC-1155 NFTs on Base Mainnet. It uses a monorepo structure with pnpm workspaces.

```
base-nft-app/
├── apps/web/          Next.js 15 frontend + API routes
├── packages/
│   ├── contracts/     Foundry smart contracts (Solidity)
│   ├── db/            Prisma schema + client
│   ├── queue/         BullMQ job queue + distribution worker
│   ├── shared/        Shared ABIs, types, utilities
│   └── config/        ESLint + TypeScript configs
├── docker-compose.yml PostgreSQL + Redis (dev)
└── docs/
```

## Package Responsibilities

| Package | Runtime | Purpose |
|---------|---------|---------|
| `@base-nft/web` | Node.js (Next.js) | Frontend UI, API routes, authentication |
| `@base-nft/contracts` | EVM | CampaignNFT (ERC-1155) + CampaignFactory (clone pattern) |
| `@base-nft/db` | Node.js | Prisma ORM, database schema, migrations |
| `@base-nft/queue` | Node.js | BullMQ queues, distribution worker process |
| `@base-nft/shared` | Isomorphic | ABIs, contract addresses, type definitions |

## Authentication Flow (Farcaster Quick Auth)

```
┌──────────┐    JWT token    ┌──────────┐   verifyJwt()   ┌──────────────┐
│ Farcaster │ ─────────────→ │ Next.js  │ ──────────────→ │ Quick Auth   │
│ Client    │                │ API Route│                  │ Service      │
└──────────┘                 └──────────┘                  └──────────────┘
     │                            │
     │ sdk.quickAuth.getToken()   │ extractFarcasterAuth()
     │                            │ → { fid: number }
```

1. Client calls `sdk.quickAuth.getToken()` to get a JWT
2. JWT sent as `Authorization: Bearer <token>` header
3. Server verifies via `@farcaster/quick-auth` library
4. Extracts `fid` (Farcaster ID) from JWT `sub` claim

## Distribution Flow

```
┌────────┐  POST /api/campaigns/{id}/distribute  ┌─────────┐
│ Client │ ─────────────────────────────────────→ │ API     │
└────────┘                                        │ Route   │
                                                  └────┬────┘
                                                       │ enqueue batches
                                                       ▼
                                                  ┌─────────┐
                                                  │ BullMQ  │
                                                  │ Redis   │
                                                  └────┬────┘
                                                       │ process
                                                       ▼
                                                  ┌──────────┐  mintBatch()  ┌──────────┐
                                                  │ Worker   │ ────────────→ │ Base     │
                                                  │ Process  │               │ Mainnet  │
                                                  └──────────┘               └──────────┘
```

1. API splits recipients into batches (max 50 per batch)
2. Each batch is enqueued as a BullMQ job with idempotency key
3. Worker processes batches sequentially (concurrency: 1, rate: 1/5s)
4. Worker simulates tx → submits → persists txHash → waits for receipt
5. Circuit breaker protects against RPC failures (5 failures → 30s cooldown)
6. On crash recovery: worker checks existing txHash receipt before re-submitting

## Smart Contract Architecture

```
┌──────────────────┐     clone()     ┌──────────────────┐
│ CampaignFactory  │ ──────────────→ │ CampaignNFT      │
│ (singleton)      │                 │ (ERC-1155 clone)  │
└──────────────────┘                 └──────────────────┘
```

- **CampaignFactory**: Deploys minimal proxy clones of CampaignNFT
- **CampaignNFT**: ERC-1155 with `OPERATOR_ROLE` for server-side minting
- Clone pattern minimizes gas costs (~$0.10 per campaign deployment)

## Data Model

```
Campaign ──< Distribution (batches)
    │
    └──< Recipient (individual addresses)
```

- **Campaign**: name, status, contractAddress, tokenId, creatorFid
- **Distribution**: batchIndex, status, txHash, gasUsed, idempotencyKey
- **Recipient**: walletAddress, amount, status, txHash

## Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Auth | Farcaster Quick Auth (JWT) | Official recommendation, cryptographically verified |
| NFT Standard | ERC-1155 | Multi-recipient batch minting, lower gas |
| Deployment | Clone pattern (EIP-1167) | Minimal gas per campaign |
| Queue | BullMQ + Redis | Reliable job processing, retry, rate limiting |
| Pagination | Cursor-based | Efficient for large datasets, Prisma native |
| i18n | next-intl | App Router compatible, type-safe |
