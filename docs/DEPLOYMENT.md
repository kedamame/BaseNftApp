# Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 10+
- Docker (for local dev: PostgreSQL + Redis)
- Foundry (for contract deployment)
- A Farcaster account (for account association)

## 1. Local Development Setup

```bash
# Install dependencies
pnpm install

# Start PostgreSQL + Redis
docker compose up -d

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Start dev server
pnpm dev

# Start worker (separate terminal)
pnpm worker
```

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in values:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_HOST` | Yes | Redis host |
| `REDIS_PORT` | Yes | Redis port (default: 6379) |
| `REDIS_PASSWORD` | Prod | Redis password |
| `NEXT_PUBLIC_BASE_RPC_URL` | Yes | Base Mainnet RPC URL (public) |
| `BASE_RPC_URL` | Yes | Base RPC URL (server-side, can be private) |
| `DEPLOYER_PRIVATE_KEY` | Yes | Private key for server-side minting |
| `NEXT_PUBLIC_WC_PROJECT_ID` | Yes | WalletConnect project ID |
| `NEXT_PUBLIC_FACTORY_ADDRESS` | Yes | Deployed CampaignFactory address |
| `NEXT_PUBLIC_DEPLOYER_ADDRESS` | Yes | Address corresponding to DEPLOYER_PRIVATE_KEY |
| `NEXT_PUBLIC_APP_DOMAIN` | Yes | App domain (e.g., `myapp.vercel.app`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Full app URL (e.g., `https://myapp.vercel.app`) |
| `FC_ACCOUNT_ASSOCIATION_HEADER` | Prod | Farcaster account association header |
| `FC_ACCOUNT_ASSOCIATION_PAYLOAD` | Prod | Farcaster account association payload |
| `FC_ACCOUNT_ASSOCIATION_SIGNATURE` | Prod | Farcaster account association signature |
| `BASESCAN_API_KEY` | Optional | For contract verification |
| `ALLOW_DEV_AUTH` | Dev only | Set to `true` for local dev auth bypass |

## 3. Contract Deployment

```bash
# Build contracts
pnpm forge:build

# Deploy to Base Sepolia (testnet)
cd packages/contracts
forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify

# Deploy to Base Mainnet
forge script script/Deploy.s.sol --rpc-url $BASE_RPC_URL --broadcast --verify
```

After deployment, update `NEXT_PUBLIC_FACTORY_ADDRESS` in your environment.

## 4. Database Migration (Production)

```bash
# Apply migrations to production database
pnpm db:deploy
```

This runs `prisma migrate deploy` which applies pending migrations without generating new ones.

## 5. Vercel Deployment

1. Connect the repository to Vercel
2. Set root directory to `apps/web`
3. Set build command: `pnpm build`
4. Add all environment variables from the table above
5. Set `ALLOW_DEV_AUTH` to empty or omit it entirely
6. Set `NEXT_PUBLIC_APP_DOMAIN` to your Vercel domain

## 6. Farcaster Account Association

After deploying to a public URL:

1. Go to the [Warpcast Manifest Tool](https://warpcast.com/~/developers/manifest-tool)
2. Enter your app URL
3. Sign the association with your Farcaster account
4. Copy the `header`, `payload`, and `signature` values
5. Set `FC_ACCOUNT_ASSOCIATION_HEADER`, `FC_ACCOUNT_ASSOCIATION_PAYLOAD`, `FC_ACCOUNT_ASSOCIATION_SIGNATURE` in your environment
6. Verify: `curl https://yourapp.com/.well-known/farcaster.json`

## 7. Worker Deployment

The distribution worker runs as a separate process:

```bash
# Production
NODE_ENV=production pnpm worker
```

The worker needs access to:
- `DATABASE_URL` (PostgreSQL)
- `REDIS_HOST` / `REDIS_PORT` / `REDIS_PASSWORD`
- `BASE_RPC_URL` (server-side RPC)
- `DEPLOYER_PRIVATE_KEY`

For production, run the worker as a long-lived process (e.g., via PM2, systemd, or a container).

## 8. Verify Deployment

- [ ] App loads at your domain
- [ ] `/.well-known/farcaster.json` returns valid manifest
- [ ] Farcaster Quick Auth login works
- [ ] Campaign creation + contract deployment succeeds
- [ ] Distribution worker processes batches
- [ ] PostgreSQL and Redis health checks pass (`docker compose ps`)
