import { describe, expect, it } from 'vitest'
import { explainPrRefusal } from './gh-cli.js'
import { withRetry } from './retry.js'

describe('a pull request GitHub refuses by setting', () => {
  const refusal = new Error(
    'gh pr create failed: pull request create failed: GraphQL: GitHub Actions is not permitted to create or approve pull requests (createPullRequest)',
  )

  it('is explained with the setting to change and marked not worth retrying', () => {
    const e = explainPrRefusal(refusal) as Error & { retryable?: boolean }
    expect(e.message).toContain('Allow GitHub Actions to create and approve pull requests')
    expect(e.message).toContain('NEST_BOT_TOKEN')
    expect(e.retryable).toBe(false)
  })

  it('leaves any other error as it was', () => {
    const other = new Error('HTTP 502')
    expect(explainPrRefusal(other)).toBe(other)
  })

  it('stops withRetry after one attempt', () => {
    let calls = 0
    expect(() =>
      withRetry(
        'scaffold pull request',
        () => {
          calls += 1
          throw explainPrRefusal(refusal)
        },
        { attempts: 3, sleep: () => undefined },
      ),
    ).toThrow(/Allow GitHub Actions/)
    expect(calls).toBe(1)
  })
})
