import { describe, expect, it } from 'vitest'
import { NUDGE_MARKER, nudgeComment, selectNudges, type StageOneIssue } from './nudge.js'

const now = Date.parse('2027-01-20T00:00:00Z')
const issue = (over: Partial<StageOneIssue>): StageOneIssue => ({
  number: 1,
  createdAt: '2027-01-12T00:00:00Z',
  assignee: 'test-one',
  commitCount: 0,
  nudged: false,
  ...over,
})

describe('selectNudges', () => {
  it('picks week-old issues whose assignee has no commits and no nudge yet', () => {
    expect(selectNudges([issue({})], now).map((i) => i.number)).toEqual([1])
  })

  it.each([
    ['younger than a week', issue({ createdAt: '2027-01-15T00:00:00Z' })],
    ['already nudged', issue({ nudged: true })],
    ['has commits', issue({ commitCount: 2 })],
    ['no assignee', issue({ assignee: null })],
  ])('leaves out an issue that is %s', (_why, i) => {
    expect(selectNudges([i], now)).toEqual([])
  })

  it('treats exactly seven days as old enough', () => {
    expect(selectNudges([issue({ createdAt: '2027-01-13T00:00:00Z' })], now)).toHaveLength(1)
  })
})

describe('nudgeComment', () => {
  it('starts with the hidden marker and links the development guide', () => {
    const text = nudgeComment('test-one', 'https://github.com/example-org/nest')
    expect(text.startsWith(NUDGE_MARKER)).toBe(true)
    expect(text).toContain('@test-one')
    expect(text).toContain('docs/DEVELOPMENT.md')
    expect(text).toContain('invitation')
  })
})
