import { describe, expect, it } from 'vitest'
import { retryDelayMs, withRetry } from './retry.js'

describe('withRetry', () => {
  it('returns after transient failures and backs off exponentially', () => {
    const sleeps: number[] = []
    let calls = 0
    const value = withRetry(
      'thing',
      () => {
        calls += 1
        if (calls < 3) throw new Error('flaky')
        return 'ok'
      },
      { attempts: 3, baseMs: 100, sleep: (ms) => sleeps.push(ms) },
    )
    expect(value).toBe('ok')
    expect(calls).toBe(3)
    expect(sleeps).toEqual([100, 200])
  })

  it('gives up after the configured attempts with the last error in the message', () => {
    let calls = 0
    expect(() =>
      withRetry(
        'thing',
        () => {
          calls += 1
          throw new Error('still broken')
        },
        { attempts: 3, baseMs: 0, sleep: () => {} },
      ),
    ).toThrow('thing failed after 3 attempts: still broken')
    expect(calls).toBe(3)
  })

  it('says how many attempts it made when an error is not worth retrying', () => {
    let calls = 0
    const setting = Object.assign(new Error('a setting is off'), { retryable: false })
    expect(() =>
      withRetry(
        'thing',
        () => {
          calls += 1
          throw setting
        },
        { attempts: 3, baseMs: 0, sleep: () => {} },
      ),
    ).toThrow('thing failed after 1 attempt: a setting is off')
    expect(calls).toBe(1)
  })
})

describe('retryDelayMs', () => {
  it('doubles from the base', () => {
    expect(retryDelayMs(1, new Error('x'), 500, 0)).toBe(500)
    expect(retryDelayMs(2, new Error('x'), 500, 0)).toBe(1000)
    expect(retryDelayMs(3, new Error('x'), 500, 0)).toBe(2000)
  })

  it('waits for a rate-limit reset when the error names one', () => {
    const now = 1_800_000_000_000
    const reset = 1_800_000_030
    const delay = retryDelayMs(1, new Error(`API rate limit exceeded. x-ratelimit-reset: ${reset}`), 500, now)
    expect(delay).toBe(31_000)
  })
})
