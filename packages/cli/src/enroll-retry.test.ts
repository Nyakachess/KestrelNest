import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { enroll, type EnrollOptions } from './commands/enroll.js'
import { openCohort } from './commands/open-cohort.js'
import { FakeGh } from './gh-fakes.js'
import { collectIo } from './io.js'
import { cleanup, cohortYml, tempRepo } from './test-support.js'

afterEach(cleanup)

const OWNERS = '* @Nyakachess\n'
const quiet = { sleep: () => {}, baseMs: 0 }
const opts = (over: Partial<EnrollOptions> = {}): EnrollOptions => ({
  handle: 'test-three',
  name: 'Test Three',
  cohort: '2027-01',
  mode: 'apply',
  today: '2027-01-12',
  retry: quiet,
  ...over,
})
const outcomes = (r: { steps: { step: string; outcome: string }[] }) =>
  r.steps.map((s) => `${s.step}:${s.outcome}`)
const count = (gh: FakeGh, method: string) => gh.calls.filter((c) => c.startsWith(`${method} `)).length

describe('enroll retries and modes', () => {
  it('retries step d after transient failures without repeating a, b or c', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    gh.failNext('createIssue', 2)
    const r = enroll(config, opts(), gh, collectIo())
    expect(r.failed).toBe(false)
    expect(outcomes(r)).toEqual(['a:created', 'b:created', 'c:created', 'd:created'])
    expect(gh.issues).toHaveLength(6)
    expect(count(gh, 'createIssue')).toBe(8)
    expect(count(gh, 'commitToMain')).toBe(1)
    expect(count(gh, 'createDraftPr')).toBe(1)
    expect(count(gh, 'inviteCollaborator')).toBe(1)
  })

  it('reports a hard failure in step d, and a later run completes d only', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    gh.failNext('createIssue', 3)
    const first = enroll(config, opts(), gh, collectIo())
    expect(first.failed).toBe(true)
    expect(outcomes(first)).toEqual(['a:created', 'b:created', 'c:created', 'd:failed'])
    expect(gh.issues).toHaveLength(0)
    const second = enroll(config, opts(), gh, collectIo())
    expect(second.failed).toBe(false)
    expect(outcomes(second)).toEqual(['a:skipped', 'b:skipped', 'c:skipped', 'd:created'])
    expect(gh.issues).toHaveLength(6)
    expect(count(gh, 'createDraftPr')).toBe(1)
    expect(count(gh, 'inviteCollaborator')).toBe(1)
  })

  it('dry run makes no GitHub calls and prints what it would do', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    const io = collectIo()
    const r = enroll(config, opts({ mode: 'dry-run' }), gh, io)
    expect(gh.calls).toEqual([])
    expect(outcomes(r)).toEqual(['a:would create', 'b:would create', 'c:would create', 'd:would create'])
    expect(io.lines.filter((l) => l.startsWith('Would create "Stage '))).toHaveLength(6)
    expect(existsSync(join(config.root, 'contributors', 'test-three'))).toBe(false)
  })

  it('print mode prints the PR bodies and the issue bodies and makes no GitHub calls', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    const io = collectIo()
    enroll(config, opts({ mode: 'print' }), gh, io)
    expect(gh.calls).toEqual([])
    const text = io.lines.join('\n')
    expect(text).toContain('# chore(cohort): add @test-three to 2027-01')
    expect(text).toContain('# Scaffold for @test-three')
    expect(io.lines.filter((l) => l.startsWith('## Stage '))).toHaveLength(6)
  })
})

describe('open-cohort through enroll', () => {
  it('enrols three members, one enroll each', () => {
    const config = tempRepo({
      '.github/CODEOWNERS': OWNERS,
      'cohorts/2027-01/cohort.yml': cohortYml(['test-one', 'test-two', 'test-three']),
    })
    const gh = new FakeGh()
    const report = openCohort(
      config,
      { id: '2027-01', mode: 'apply', today: '2027-01-12', retry: quiet },
      gh,
      collectIo(),
    )
    expect(report.enrolled.map((r) => r.handle)).toEqual(['test-one', 'test-two', 'test-three'])
    expect(report.scaffolded).toEqual(['test-one', 'test-two', 'test-three'])
    expect(gh.prs).toHaveLength(3)
    expect(gh.issues).toHaveLength(18)
    expect(count(gh, 'inviteCollaborator')).toBe(3)
    expect(report.failed).toEqual([])
  })
})
