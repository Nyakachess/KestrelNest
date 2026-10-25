/** Retry policy for GitHub calls: a few attempts, exponential backoff, and respect for rate-limit resets. */
export type RetryOptions = {
  attempts?: number
  baseMs?: number
  sleep?: (ms: number) => void
  now?: () => number
  onRetry?: (attempt: number, error: unknown, delayMs: number) => void
}

export const DEFAULT_ATTEMPTS = 3

/** Blocks the thread. Fine for a CLI, never for a server. */
export function blockingSleep(ms: number): void {
  if (ms <= 0) return
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

/**
 * How long to wait before the next attempt. When the error carries a rate-limit reset time
 * (an epoch in seconds, as GitHub sends it), wait until then; otherwise double the base.
 */
export function retryDelayMs(attempt: number, error: unknown, baseMs: number, nowMs: number): number {
  const text = error instanceof Error ? error.message : String(error)
  const reset =
    /x-ratelimit-reset:?\s*(\d{9,})/i.exec(text) ?? /rate limit[^0-9]*reset[^0-9]*(\d{9,})/i.exec(text)
  if (reset) {
    const resetMs = Number(reset[1]) * 1000
    return Math.max(0, resetMs - nowMs) + 1000
  }
  return baseMs * 2 ** (attempt - 1)
}

export function withRetry<T>(label: string, fn: () => T, opts: RetryOptions = {}): T {
  const attempts = opts.attempts ?? DEFAULT_ATTEMPTS
  const baseMs = opts.baseMs ?? 1000
  const sleep = opts.sleep ?? blockingSleep
  const now = opts.now ?? Date.now
  let last: unknown
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return fn()
    } catch (error) {
      last = error
      if (attempt === attempts) break
      const delay = retryDelayMs(attempt, error, baseMs, now())
      opts.onRetry?.(attempt, error, delay)
      sleep(delay)
    }
  }
  const message = last instanceof Error ? last.message : String(last)
  throw new Error(`${label} failed after ${attempts} attempts: ${message}`)
}
