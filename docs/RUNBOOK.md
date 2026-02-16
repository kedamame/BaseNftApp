# Operations Runbook

## Service Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Next.js  │────→│PostgreSQL│     │  Redis   │
│ (Vercel) │     └──────────┘     └────┬─────┘
└────┬─────┘                           │
     │ enqueue                         │
     └────────────────────────────→ BullMQ
                                       │
                                  ┌────┴─────┐
                                  │  Worker  │────→ Base RPC
                                  └──────────┘
```

## Health Checks

### Docker (Local Dev)
```bash
docker compose ps   # Check health status
docker compose logs postgres --tail 20
docker compose logs redis --tail 20
```

### PostgreSQL
```bash
# Connection test
pnpm db:studio   # Opens Prisma Studio

# Check pending migrations
pnpm --filter @base-nft/db exec prisma migrate status
```

### Redis / BullMQ
```bash
redis-cli -h $REDIS_HOST -p $REDIS_PORT ping
redis-cli -h $REDIS_HOST -p $REDIS_PORT LLEN bull:distribution:wait
redis-cli -h $REDIS_HOST -p $REDIS_PORT LLEN bull:distribution:active
```

### Worker
The worker logs to stdout. Key log messages:
- `[worker] Distribution worker started` — healthy startup
- `[worker] Circuit breaker OPEN` — RPC failures exceeded threshold
- `[worker] Shutting down` — graceful shutdown initiated

## Common Issues

### 1. RPC Failures / Circuit Breaker Open

**Symptoms**: Worker logs `[worker] Circuit breaker OPEN, delaying batch`.

**Cause**: 5+ consecutive RPC failures (Base node down, rate limited, network issues).

**Resolution**:
1. Check Base RPC status (check your RPC provider's status page)
2. Jobs are automatically delayed by 30s and retried
3. After 30s cooldown, circuit breaker enters HALF_OPEN state
4. One successful call resets to CLOSED
5. If using a public RPC, consider switching to a paid provider (Alchemy, QuickNode)

### 2. Worker Stopped / Crashed

**Symptoms**: Distributions stuck in `PROCESSING` status.

**Resolution**:
1. Restart the worker process
2. The worker has txHash recovery — if a tx was already submitted, it checks the receipt before re-submitting
3. Idempotency keys prevent duplicate mints
4. Check for stuck jobs:
```bash
redis-cli LLEN bull:distribution:active
redis-cli LLEN bull:distribution:failed
```

### 3. Distribution Batch Failed

**Symptoms**: Campaign or recipients in `FAILED` status.

**Resolution**:
1. Check the distribution record's `error` field in the database
2. Common causes:
   - Transaction reverted (insufficient gas, contract paused, role not granted)
   - RPC timeout after all retries exhausted (3 attempts)
3. Use the "Retry Failed" button in the campaign detail page
4. This calls `POST /api/campaigns/{id}/retry` which re-enqueues failed batches

### 4. Database Connection Issues

**Symptoms**: API returns 500 errors, Prisma connection errors in logs.

**Resolution**:
1. Verify `DATABASE_URL` is correct
2. Check PostgreSQL is running and accepting connections
3. Prisma uses a connection pool — if connections are exhausted, restart the app
4. Check for long-running queries or locks

### 5. Authentication Failures

**Symptoms**: API returns 401 for all requests.

**Resolution**:
1. Verify `NEXT_PUBLIC_APP_DOMAIN` matches your actual domain
2. Check Quick Auth service status
3. In development, ensure `ALLOW_DEV_AUTH=true` and `NODE_ENV=development`
4. JWT tokens expire — client should request fresh tokens per request

### 6. Contract Deployment Fails

**Symptoms**: Wizard deploy step fails.

**Resolution**:
1. Verify the user's wallet is connected to Base Mainnet
2. Check the user has enough ETH for gas
3. Verify `NEXT_PUBLIC_FACTORY_ADDRESS` points to a valid deployed factory
4. Verify `NEXT_PUBLIC_DEPLOYER_ADDRESS` matches the factory's expected deployer

## Log Monitoring

Key log patterns to monitor:

| Pattern | Meaning | Action |
|---------|---------|--------|
| `Circuit breaker OPEN` | RPC failures | Check RPC provider |
| `Batch already completed (idempotency)` | Duplicate processing avoided | No action |
| `Found existing txHash, checking receipt` | Crash recovery working | No action |
| `Campaign status -> FAILED` | Distribution failed | Check error field, retry |
| `Worker error:` | Unexpected worker error | Investigate immediately |
| `Verification error:` | Quick Auth non-token error | Check auth service |

## Escalation

1. **RPC issues**: Switch to backup RPC URL, contact provider
2. **Stuck distributions**: Check Redis queue state, restart worker
3. **Data inconsistency**: Use Prisma Studio to inspect, manually update status if needed
4. **Contract issues**: Check on Basescan, verify roles and ownership
