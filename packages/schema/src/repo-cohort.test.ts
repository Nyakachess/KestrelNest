import { afterEach, describe, expect, it } from 'vitest'
import { formatIssue } from './issues.js'
import { validateRepo } from './repo.js'
import { cleanup, cohortYml, page, profile, repo } from './test-support.js'

afterEach(cleanup)

const messages = (root: string) => validateRepo(root).issues.map(formatIssue)

describe('validateRepo: cohorts and practice counts', () => {
  it('checks that a cohort file exists for the profile cohort once any cohort is defined', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile({ cohort: '2027-02' }),
      'contributors/test-one/page.md': page,
      'cohorts/2027-01/cohort.yml': cohortYml(['test-one']),
    })
    expect(messages(root)).toEqual([
      'contributors/test-one/profile.yml cohort: "2027-02" has no cohorts/2027-02/cohort.yml. Check the id with your cohort lead.',
    ])
  })

  it('does not require cohorts to exist before the first one is created', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile(),
      'contributors/test-one/page.md': page,
    })
    expect(messages(root)).toEqual([])
  })

  it('validates cohort members as handles and rejects repeats', () => {
    const root = repo({ 'cohorts/2027-01/cohort.yml': cohortYml(['test-one', '_example', 'test-one']) })
    const out = messages(root)
    expect(out).toHaveLength(2)
    expect(out[0]).toMatch(/^cohorts\/2027-01\/cohort.yml:7 members\[1\]: must not start with an underscore/)
    expect(out[1]).toBe('cohorts/2027-01/cohort.yml:8 members[2]: repeats "test-one" from item 1.')
  })

  it('requires the cohort id to match its directory and the dates to be in order', () => {
    const root = repo({
      'cohorts/2027-01/cohort.yml': cohortYml([], '2027-02').replace('ends: 2027-04-30', 'ends: 2026-04-30'),
    })
    const out = messages(root)
    expect(out).toContain(
      'cohorts/2027-01/cohort.yml:1 id: must match the directory name exactly: "2027-01".',
    )
    expect(out).toContain('cohorts/2027-01/cohort.yml:4 ends: must not be before starts.')
  })

  it('rejects a cohort directory that is not a year and month', () => {
    const root = repo({ 'cohorts/january/cohort.yml': cohortYml([], 'january') })
    expect(messages(root)[0]).toMatch(/^cohorts\/january directory: must be named as a year and month/)
  })

  it('reads .practice.json and defaults to zero counts without it', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile(),
      'contributors/test-one/page.md': page,
      'contributors/test-one/.practice.json': JSON.stringify({
        updated_at: '2027-02-01T00:00:00Z',
        practice: 3,
        shared: 1,
        stages_done: [1, 2, 3],
      }),
      'contributors/test-two/profile.yml': profile({ handle: 'test-two', name: 'Test Two' }),
      'contributors/test-two/page.md': page,
    })
    const r = validateRepo(root)
    expect(r.issues).toEqual([])
    expect(r.contributors[0]?.practice.practice).toBe(3)
    expect(r.contributors[1]?.practice).toMatchObject({ practice: 0, shared: 0, stages_done: [] })
  })

  it('reports a .practice.json field in plain words', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile(),
      'contributors/test-one/page.md': page,
      'contributors/test-one/.practice.json': JSON.stringify({
        updated_at: 'yesterday',
        practice: 0,
        shared: 0,
        stages_done: [8],
      }),
    })
    const out = messages(root)
    expect(out).toContain(
      'contributors/test-one/.practice.json updated_at: must be a timestamp written like 2027-01-12T09:30:00Z.',
    )
    expect(out).toContain('contributors/test-one/.practice.json stages_done[0]: must be at most 7.')
  })
})
