import { explainHandle } from '@nest/schema'
import { UsageError } from '../args.js'
import type { Gh } from '../gh.js'
import type { Io } from '../io.js'
import { withRetry, type RetryOptions } from '../retry.js'
import { enrollBranch, scaffoldBranch, type EnrollMode } from './enroll.js'

export type WithdrawOptions = {
  handle: string
  mode: EnrollMode
  /** YYYY-MM-DD for the title suffix; today by default. */
  today?: string | undefined
  retry?: RetryOptions | undefined
}

export type WithdrawOutcome = 'closed' | 'renamed' | 'cancelled' | 'skipped' | 'failed' | 'would do'
export type WithdrawReport = {
  handle: string
  lines: { what: string; outcome: WithdrawOutcome; detail: string }[]
  failed: boolean
  renamed: number[]
  closed: number[]
}

/** The suffix that takes an issue out of the person's ladder: its title no longer ends "(@handle)". */
export const withdrawnSuffix = (today: string) => ` [withdrawn ${today}]`

export const LEFT_IN_PLACE =
  'Left in place on purpose: collaborator access, contributors/<handle>/ and the CONTRIBUTORS.md line.'

/**
 * Takes a person out of the onboarding ladder so a later enrolment starts them afresh:
 * closes their open personal stage issues as not planned with one comment, renames every
 * personal stage issue of theirs (open or closed) so its title no longer ends "(@handle)",
 * closes their open scaffold and cohort pull requests, and cancels a pending invitation when
 * the admin token is there. Every step is idempotent: a second run finds nothing to do.
 * Collaborator access, their directory and their CONTRIBUTORS.md line are left alone.
 */
export function withdraw(opts: WithdrawOptions, gh: Gh, io: Io): WithdrawReport {
  const handle = opts.handle.toLowerCase()
  const why = explainHandle(handle)
  if (why) throw new UsageError(`The handle ${why}`)
  const today = opts.today ?? new Date().toISOString().slice(0, 10)
  const report: WithdrawReport = { handle, lines: [], failed: false, renamed: [], closed: [] }
  const line = (what: string, outcome: WithdrawOutcome, detail = '') => {
    report.lines.push({ what, outcome, detail })
    if (outcome === 'failed') report.failed = true
    io.out(`${what}: ${outcome}${detail ? `, ${detail}` : ''}`)
  }
  const retry = <T>(label: string, fn: () => T): T =>
    withRetry(label, fn, {
      ...opts.retry,
      onRetry: (attempt, error, delay) => {
        const message = error instanceof Error ? error.message : String(error)
        io.err(`  ${label}: attempt ${attempt} failed (${message}); retrying in ${delay} ms`)
      },
    })
  const attempt = (what: string, fn: () => void) => {
    try {
      fn()
    } catch (error) {
      if (error instanceof UsageError) throw error
      line(what, 'failed', error instanceof Error ? error.message : String(error))
    }
  }

  if (opts.mode !== 'apply') {
    line('stage issues', 'would do', `close the open ones as not planned and rename every "(@${handle})" one`)
    line(
      'pull requests',
      'would do',
      `close open ones from ${scaffoldBranch(handle)} and ${enrollBranch(handle)}`,
    )
    line('invitation', 'would do', 'cancel a pending one when NEST_ADMIN_TOKEN is set')
    io.out(LEFT_IN_PLACE.replace('<handle>', handle))
    return report
  }

  const comment =
    `Withdrawn on ${today}: @${handle}'s onboarding was reset. ` +
    'A new enrolment opens fresh stage issues, so this one is closed and renamed.'
  attempt('stage issues', () => {
    const issues = retry('stage issue lookup', () => gh.listStageIssues(handle))
    if (issues.length === 0) return line('stage issues', 'skipped', `none titled "(@${handle})"`)
    for (const issue of issues) {
      attempt(`#${issue.number}`, () => {
        if (issue.state === 'open') {
          retry(`close #${issue.number}`, () => gh.closeIssueNotPlanned(issue.number, comment))
          report.closed.push(issue.number)
          line(`#${issue.number}`, 'closed', 'as not planned')
        }
        const title = `${issue.title}${withdrawnSuffix(today)}`
        retry(`rename #${issue.number}`, () => gh.renameIssue(issue.number, title))
        report.renamed.push(issue.number)
        line(`#${issue.number}`, 'renamed', title)
      })
    }
  })
  for (const branch of [scaffoldBranch(handle), enrollBranch(handle)]) {
    attempt(`pull request from ${branch}`, () => {
      const url = retry(`pull request from ${branch}`, () =>
        gh.closeOpenPr(branch, `Closed on ${today}: @${handle}'s onboarding was withdrawn.`),
      )
      line(`pull request from ${branch}`, url ? 'closed' : 'skipped', url ?? 'none open')
    })
  }
  attempt('invitation', () => {
    if (!gh.canManageInvitations())
      return line(
        'invitation',
        'skipped',
        'NEST_ADMIN_TOKEN is not set, so a pending invitation is left as it is',
      )
    const result = retry('invitation', () => gh.cancelInvitation(handle))
    line(
      'invitation',
      result === 'cancelled' ? 'cancelled' : 'skipped',
      result === 'none' ? 'none pending' : '',
    )
  })
  io.out(LEFT_IN_PLACE.replace('<handle>', handle))
  return report
}
