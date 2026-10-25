import { mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { computePractice, writePracticeFile, type ClosedIssue, type MergedPr } from './practice.js'
import { cleanup, tempRepo } from './test-support.js'

afterEach(cleanup)

const prs: MergedPr[] = [
  { number: 1, author: 'test-one', files: ['CONTRIBUTORS.md'], mergedAt: '2027-01-14T00:00:00Z' },
  {
    number: 2,
    author: 'test-one',
    files: ['contributors/test-one/profile.yml'],
    mergedAt: '2027-01-20T00:00:00Z',
  },
  {
    number: 3,
    author: 'Test-One',
    files: ['contributors/test-one/page.md', 'contributors/test-one/profile.test.ts'],
    mergedAt: '2027-02-01T00:00:00Z',
  },
  { number: 4, author: 'test-one', files: ['packages/schema/src/page.ts'], mergedAt: '2027-02-10T00:00:00Z' },
  {
    number: 5,
    author: 'test-two',
    files: ['contributors/test-two/profile.yml'],
    mergedAt: '2027-02-11T00:00:00Z',
  },
  {
    number: 6,
    author: 'test-one',
    files: ['contributors/test-two/profile.yml'],
    mergedAt: '2027-02-12T00:00:00Z',
  },
]

const issues: ClosedIssue[] = [
  { assignees: ['test-one'], labels: ['onboarding', 'stage:1', 'cohort:2027-01'] },
  { assignees: ['test-one'], labels: ['onboarding', 'stage:2'] },
  { assignees: ['test-two'], labels: ['onboarding', 'stage:3'] },
  { assignees: ['test-one'], labels: ['bug'] },
]

describe('computePractice', () => {
  it('counts own-directory PRs as practice and anything outside contributors as shared', () => {
    const p = computePractice('test-one', prs, issues, '2027-03-01T00:00:00Z')
    expect(p).toEqual({ updated_at: '2027-03-01T00:00:00Z', practice: 2, shared: 2, stages_done: [1, 2, 5] })
  })

  it('does not count a PR into someone else directory as anything', () => {
    const p = computePractice('test-two', prs, issues, '2027-03-01T00:00:00Z')
    expect(p).toMatchObject({ practice: 1, shared: 0, stages_done: [3] })
  })

  it('gives zeros to a handle with nothing merged', () => {
    expect(computePractice('test-three', prs, issues, 'now')).toEqual({
      updated_at: 'now',
      practice: 0,
      shared: 0,
      stages_done: [],
    })
  })
})

describe('writePracticeFile', () => {
  it('writes once and reports unchanged when only the timestamp differs', () => {
    const config = tempRepo()
    mkdirSync(join(config.root, 'contributors', 'test-one'), { recursive: true })
    const first = computePractice('test-one', prs, issues, '2027-03-01T00:00:00Z')
    expect(writePracticeFile(config.root, 'test-one', first)).toBe('written')
    const again = computePractice('test-one', prs, issues, '2027-03-02T00:00:00Z')
    expect(writePracticeFile(config.root, 'test-one', again)).toBe('unchanged')
    const onDisk = JSON.parse(
      readFileSync(join(config.root, 'contributors', 'test-one', '.practice.json'), 'utf8'),
    )
    expect(onDisk.updated_at).toBe('2027-03-01T00:00:00Z')
    expect(writePracticeFile(config.root, 'test-one', { ...again, shared: 3 })).toBe('written')
  })
})
