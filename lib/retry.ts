/**
 * Retry a function with exponential backoff.
 */
export interface RetryConfig {
  /** Maximum number of attempts (including the first) */
  maxAttempts: number;
  /** Base delay in ms (doubled each retry) */
  baseDelayMs: number;
  /** Maximum delay cap in ms */
  maxDelayMs: number;
  /** Optional: only retry if this returns true for the error */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
}

const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10_000,
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute `fn` with automatic retries on failure.
 *
 * ```ts
 * const result = await withRetry(() => callExternalAPI(), {
 *   maxAttempts: 3,
 *   baseDelayMs: 500,
 *   maxDelayMs: 5000,
 * });
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const { maxAttempts, baseDelayMs, maxDelayMs, shouldRetry } = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts) break;

      // Check if we should retry this specific error
      if (shouldRetry && !shouldRetry(error, attempt)) break;

      // Exponential backoff with jitter
      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * 500,
        maxDelayMs
      );

      console.warn(
        `[retry] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${Math.round(delay)}ms...`,
        error instanceof Error ? error.message : error
      );

      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Run multiple provider functions in sequence, returning the first success.
 * This is a "circuit breaker" pattern — if one provider fails, try the next.
 */
export async function withFallback<T>(
  providers: Array<{ name: string; fn: () => Promise<T> }>,
): Promise<T> {
  const errors: Array<{ name: string; error: unknown }> = [];

  for (const provider of providers) {
    try {
      return await provider.fn();
    } catch (error) {
      console.warn(`[fallback] Provider "${provider.name}" failed:`, error instanceof Error ? error.message : error);
      errors.push({ name: provider.name, error });
    }
  }

  throw new Error(
    `All ${providers.length} providers failed: ${errors.map((e) => `${e.name}: ${e.error instanceof Error ? e.error.message : String(e.error)}`).join('; ')}`
  );
}
