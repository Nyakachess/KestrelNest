import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateContributor } from '@nest/schema'
import { afterEach, describe, expect, it } from 'vitest'
import { enroll, type EnrollOptions } from './commands/enroll.js'
import { FakeGh } from './gh-fakes.js'
import { collectIo } from './io.js'
import { cleanup, tempRepo } from './test-support.js'

afterEach(cleanup)

const OWNERS = '* @kestrel-collective/maintainers\n'
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

describe('enroll', () => {
  it('performs steps a to d for a fresh handle', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    const r = enroll(config, opts(), gh, collectIo())
    expect(r.failed).toBe(false)
    expect(outcomes(r)).toEqual(['a:created', 'b:created', 'c:created', 'd:created'])

    const filePr = gh.filePrs.get('bot/enroll-test-three')
    expect(filePr?.title).toBe('chore(cohort): add @test-three to 2027-01')
    expect(filePr?.files['cohorts/2027-01/cohort.yml']).toContain(
      '  - test-one\n  - test-three\n  - test-two\n',
    )
    expect(filePr?.files['.github/CODEOWNERS']).toContain('* @kestrel-collective/maintainers\n')
    expect(filePr?.files['.github/CODEOWNERS']).toContain('/contributors/test-three/ @test-three')

    expect(gh.prs[0]).toMatchObject({
      branch: 'scaffold/test-three',
      title: 'Scaffold for @test-three',
      assignee: 'test-three',
    })
    expect(gh.prs[0]?.body).toContain('Stage 2')
    expect(existsSync(join(config.root, 'contributors', 'test-three', 'profile.yml'))).toBe(true)

    expect(gh.invitations.has('test-three')).toBe(true)
    expect(r.invitation).toBe('invited')

    expect(gh.issues).toHaveLength(6)
    expect(gh.issues.map((i) => i.title)).toEqual(
      [1, 2, 3, 4, 6, 7].map((n) => expect.stringMatching(`^Stage ${n}: `)),
    )
    expect(gh.issues[0]).toMatchObject({
      assignee: 'test-three',
      milestone: '2027-01',
      labels: ['onboarding', 'cohort:2027-01', 'stage:1'],
    })
    expect(gh.milestones.has('2027-01')).toBe(true)
  })

  it('performs nothing on a second run', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    enroll(config, opts(), gh, collectIo())
    const before = { issues: gh.issues.length, prs: gh.prs.length }
    const r = enroll(config, opts(), gh, collectIo())
    expect(outcomes(r)).toEqual(['a:skipped', 'b:skipped', 'c:skipped', 'd:skipped'])
    expect(gh.issues).toHaveLength(before.issues)
    expect(gh.prs).toHaveLength(before.prs)
    expect(count(gh, 'createIssue')).toBe(6)
    expect(count(gh, 'inviteCollaborator')).toBe(1)
  })

  it('does not re-invite an existing collaborator', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh({ collaborators: ['Test-Three'] })
    const r = enroll(config, opts(), gh, collectIo())
    expect(r.steps.find((s) => s.step === 'c')).toMatchObject({
      outcome: 'skipped',
      detail: 'already a collaborator',
    })
    expect(count(gh, 'inviteCollaborator')).toBe(0)
    expect(r.invitation).toBe('collaborator')
  })

  it('opens no cohort PR and no milestone for cohort none', () => {
    const config = tempRepo({ '.github/CODEOWNERS': OWNERS })
    const gh = new FakeGh()
    const r = enroll(config, opts({ cohort: 'none' }), gh, collectIo())
    expect(outcomes(r)).toEqual(['a:skipped', 'b:created', 'c:created', 'd:created'])
    expect(gh.filePrs.size).toBe(0)
    expect(gh.milestones.size).toBe(0)
    expect(
      gh.issues.every((i) => i.milestone === undefined && !i.labels.some((l) => l.startsWith('cohort:'))),
    ).toBe(true)
    const profile = readFileSync(join(config.root, 'contributors', 'test-three', 'profile.yml'), 'utf8')
    expect(profile).not.toMatch(/^cohort:/m)
    expect(validateContributor(config.root, 'test-three').issues).toEqual([])
  })
})
