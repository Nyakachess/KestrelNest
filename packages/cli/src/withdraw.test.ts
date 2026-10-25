import { afterEach, describe, expect, it } from 'vitest'
import { enroll, type EnrollOptions } from './commands/enroll.js'
import { LEFT_IN_PLACE, withdraw, type WithdrawOptions } from './commands/withdraw.js'
import { FakeGh } from './gh-fakes.js'
import { collectIo } from './io.js'
import { cleanup, tempRepo } from './test-support.js'

afterEach(cleanup)

const quiet = { sleep: () => {}, baseMs: 0 }
const enrollOpts = (over: Partial<EnrollOptions> = {}): EnrollOptions => ({
  handle: 'test-three',
  name: 'Test Three',
  cohort: 'none',
  mode: 'apply',
  today: '2027-01-12',
  retry: quiet,
  ...over,
})
const withdrawOpts = (over: Partial<WithdrawOptions> = {}): WithdrawOptions => ({
  handle: 'test-three',
  mode: 'apply',
  today: '2027-02-01',
  retry: quiet,
  ...over,
})
const stageTitles = (gh: FakeGh, handle: string) =>
  gh.issues.filter((i) => i.title.toLowerCase().endsWith(`(@${handle})`)).map((i) => i.title)

/** A fake repository with test-three (a collaborator) and test-two enrolled as individual joiners. */
function enrolled() {
  const config = tempRepo()
  const gh = new FakeGh({ collaborators: ['test-three'] })
  enroll(config, enrollOpts(), gh, collectIo())
  enroll(config, enrollOpts({ handle: 'test-two', name: 'Test Two' }), gh, collectIo())
  return { config, gh }
}

describe('withdraw', () => {
  it('closes the open stage issues, renames every one, and closes the open pull requests', () => {
    const { gh } = enrolled()
    gh.closedIssues.add(1) // Stage 1, completed earlier
    gh.closedIssues.add(2) // Stage 2, closed as not planned earlier
    const io = collectIo()
    const r = withdraw(withdrawOpts(), gh, io)

    expect(r.failed).toBe(false)
    expect(r.renamed).toEqual([1, 2, 3, 4, 5, 6])
    expect(r.closed).toEqual([3, 4, 5, 6]) // only the ones still open
    expect(stageTitles(gh, 'test-three')).toEqual([])
    expect(
      gh.issues.slice(0, 6).every((i) => i.title.endsWith(' (@test-three) [withdrawn 2027-02-01]')),
    ).toBe(true)
    expect(gh.comments.get(3)?.[0]).toContain('Withdrawn on 2027-02-01')
    expect(gh.comments.has(1)).toBe(false) // a closed issue gets no second comment
    expect(gh.closedBranches.has('scaffold/test-three')).toBe(true)
    expect(io.lines).toContain(LEFT_IN_PLACE.replace('<handle>', 'test-three'))
  })

  it('touches nothing outside that handle', () => {
    const { gh } = enrolled()
    const before = stageTitles(gh, 'test-two')
    withdraw(withdrawOpts(), gh, collectIo())
    expect(stageTitles(gh, 'test-two')).toEqual(before)
    expect(before).toHaveLength(6)
    expect([...gh.closedIssues].every((n) => n <= 6)).toBe(true)
    expect(gh.closedBranches.has('scaffold/test-two')).toBe(false)
    expect(gh.collaborators.has('test-three')).toBe(true) // access is left in place
  })

  it('is idempotent: a second run finds nothing to do', () => {
    const { gh } = enrolled()
    withdraw(withdrawOpts(), gh, collectIo())
    const io = collectIo()
    const again = withdraw(withdrawOpts(), gh, io)
    expect(again.failed).toBe(false)
    expect(again.renamed).toEqual([])
    expect(again.closed).toEqual([])
    expect(io.lines).toContain('stage issues: skipped, none titled "(@test-three)"')
    expect(io.lines).toContain('pull request from scaffold/test-three: skipped, none open')
  })

  it('lets a later enrolment create all six stage issues again', () => {
    const { config, gh } = enrolled()
    withdraw(withdrawOpts(), gh, collectIo())
    const r = enroll(config, enrollOpts(), gh, collectIo())
    expect(r.failed).toBe(false)
    expect(r.issuesCreated).toHaveLength(6)
    expect(stageTitles(gh, 'test-three')).toHaveLength(6)
  })

  it('cancels a pending invitation, and says so when it cannot', () => {
    const config = tempRepo()
    const gh = new FakeGh()
    enroll(config, enrollOpts(), gh, collectIo())
    expect(gh.invitations.has('test-three')).toBe(true)
    const io = collectIo()
    withdraw(withdrawOpts(), gh, io)
    expect(gh.invitations.has('test-three')).toBe(false)
    expect(io.lines).toContain('invitation: cancelled')

    const noAdmin = new FakeGh({ invited: ['test-three'] })
    noAdmin.adminToken = false
    const io2 = collectIo()
    withdraw(withdrawOpts(), noAdmin, io2)
    expect(noAdmin.invitations.has('test-three')).toBe(true)
    expect(io2.lines.some((l) => l.startsWith('invitation: skipped, NEST_ADMIN_TOKEN is not set'))).toBe(true)
  })

  it('reports a step that still fails after retries, and carries on', () => {
    const { gh } = enrolled()
    gh.failNext('renameIssue', 3)
    const r = withdraw(withdrawOpts(), gh, collectIo())
    expect(r.failed).toBe(true)
    expect(r.lines.find((l) => l.outcome === 'failed')?.what).toBe('#1')
    expect(r.renamed).toEqual([2, 3, 4, 5, 6])
  })

  it('makes no GitHub call on a dry run', () => {
    const gh = new FakeGh()
    const io = collectIo()
    withdraw(withdrawOpts({ mode: 'dry-run' }), gh, io)
    expect(gh.calls).toEqual([])
    expect(io.lines[0]).toMatch(/^stage issues: would do/)
  })
})
