type State = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Simple circuit breaker for RPC calls.
 *
 * CLOSED → consecutive failures hit threshold → OPEN
 * OPEN → after resetTimeMs → HALF_OPEN (allows one test call)
 * HALF_OPEN → success → CLOSED / failure → OPEN
 */
export class CircuitBreaker {
  private failures = 0;
  private state: State = 'CLOSED';
  private nextRetryTime = 0;

  constructor(
    private readonly threshold = 5,
    private readonly resetTimeMs = 30_000,
  ) {}

  get currentState(): State {
    if (this.state === 'OPEN' && Date.now() >= this.nextRetryTime) {
      this.state = 'HALF_OPEN';
    }
    return this.state;
  }

  canExecute(): boolean {
    const s = this.currentState;
    return s === 'CLOSED' || s === 'HALF_OPEN';
  }

  recordSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  recordFailure(): void {
    this.failures++;
    if (this.state === 'HALF_OPEN' || this.failures >= this.threshold) {
      this.state = 'OPEN';
      this.nextRetryTime = Date.now() + this.resetTimeMs;
      console.warn(
        `[circuit-breaker] OPEN — ${this.failures} consecutive failures, retry after ${this.resetTimeMs}ms`,
      );
    }
  }
}
