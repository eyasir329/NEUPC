/**
 * @file Circuit breaker for external dependencies (Phase 3 — resilience).
 *
 * Wraps calls to a flaky external dependency (a judge API, LLM, Google) so that
 * once it starts failing, we **fail fast** instead of piling up slow/timing-out
 * requests — the classic cascading-failure guard. Composes with the existing
 * `fetchWithTimeout` retry/timeout logic; this adds the *breaker* on top.
 *
 * States:
 *   CLOSED    — calls pass through. Failures are counted.
 *   OPEN      — threshold exceeded → calls rejected immediately for `cooldownMs`.
 *   HALF_OPEN — after cooldown, one trial call is allowed; success closes the
 *               breaker, failure re-opens it.
 *
 * In-process (per serverless instance). That's the correct scope for a breaker:
 * each instance protects its own worker pool from a dead dependency. For
 * cross-instance coordination you'd back it with Redis — not needed at this scale.
 *
 * Docs: docs/architecture/system-design/05-async-and-resilience.md
 *
 * @module utils/circuit-breaker
 */

const STATE = { CLOSED: 'closed', OPEN: 'open', HALF_OPEN: 'half_open' };

export class CircuitBreakerOpenError extends Error {
  constructor(name) {
    super(`Circuit breaker "${name}" is open — failing fast.`);
    this.name = 'CircuitBreakerOpenError';
    this.breaker = name;
    this.retryable = true; // caller may retry later / serve stale
  }
}

export class CircuitBreaker {
  /**
   * @param {string} name  dependency name (for logs/metrics)
   * @param {object} [opts]
   * @param {number} [opts.failureThreshold=5]  consecutive failures before opening
   * @param {number} [opts.cooldownMs=30000]    how long to stay open
   * @param {(err:Error)=>boolean} [opts.isFailure]  which errors count as failures
   */
  constructor(name, opts = {}) {
    this.name = name;
    this.failureThreshold = opts.failureThreshold ?? 5;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
    // By default, rate-limit responses do NOT trip the breaker (they're the
    // dependency working as intended, just throttling us).
    this.isFailure = opts.isFailure ?? ((err) => err?.name !== 'RateLimitError');

    this.state = STATE.CLOSED;
    this.failures = 0;
    this.openedAt = 0;
  }

  /** Current state, resolving OPEN→HALF_OPEN when the cooldown has elapsed. */
  currentState() {
    if (this.state === STATE.OPEN && Date.now() - this.openedAt >= this.cooldownMs) {
      this.state = STATE.HALF_OPEN;
    }
    return this.state;
  }

  _onSuccess() {
    this.failures = 0;
    this.state = STATE.CLOSED;
  }

  _onFailure() {
    this.failures += 1;
    if (this.failures >= this.failureThreshold || this.state === STATE.HALF_OPEN) {
      this.state = STATE.OPEN;
      this.openedAt = Date.now();
    }
  }

  /**
   * Run `fn` under the breaker. Throws CircuitBreakerOpenError immediately when
   * open. On HALF_OPEN it lets a single trial through.
   *
   * @template T
   * @param {() => Promise<T>} fn
   * @returns {Promise<T>}
   */
  async run(fn) {
    const state = this.currentState();
    if (state === STATE.OPEN) {
      throw new CircuitBreakerOpenError(this.name);
    }
    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      if (this.isFailure(err)) this._onFailure();
      throw err;
    }
  }
}

// ── Registry: one breaker per named dependency, shared across the instance ────
const _breakers = new Map();

/**
 * Get (or lazily create) the shared breaker for a dependency.
 * @param {string} name
 * @param {object} [opts] — applied only on first creation
 * @returns {CircuitBreaker}
 */
export function getBreaker(name, opts) {
  let b = _breakers.get(name);
  if (!b) {
    b = new CircuitBreaker(name, opts);
    _breakers.set(name, b);
  }
  return b;
}

/**
 * Convenience: run `fn` under the named dependency's breaker.
 * @template T
 * @param {string} name
 * @param {() => Promise<T>} fn
 * @param {object} [opts]
 * @returns {Promise<T>}
 */
export function withBreaker(name, fn, opts) {
  return getBreaker(name, opts).run(fn);
}

/** Snapshot of all breaker states — for the health/readiness endpoint. */
export function breakerStates() {
  const out = {};
  for (const [name, b] of _breakers) {
    out[name] = { state: b.currentState(), failures: b.failures };
  }
  return out;
}
