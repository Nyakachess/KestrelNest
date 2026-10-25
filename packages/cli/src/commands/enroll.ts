import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { COHORT_FILE, COHORTS_DIR, explainHandle, isCohortId, SHARED_STAGE } from '@nest/schema'
import { UsageError } from '../args.js'
import type { Gh } from '../gh.js'
import type { Io } from '../io.js'
import { NO_COHORT } from '../issue-body.js'
import { withRetry, type RetryOptions } from '../retry.js'
import type { RepoConfig } from '../root.js'
import { stepCohortFiles, stepInvite, stepIssues, stepScaffold } from './enroll-steps.js'

export type EnrollMode = 'print' | 'dry-run' | 'apply'

export type EnrollOptions = {
  handle: string
  name?: string | undefined
  /** A cohort id or "none". */
  cohort: string
  mode: EnrollMode
  today?: string | undefined
  retry?: RetryOptions | undefined
}

export type StepId = 'a' | 'b' | 'c' | 'd'
export type StepOutcome = 'created' | 'updated' | 'skipped' | 'failed' | 'would create' | 'would update'
export type StepResult = { step: StepId; outcome: StepOutcome; detail: string }

export type EnrollReport = {
  handle: string
  cohort: string
  steps: StepResult[]
  failed: boolean
  scaffolded: boolean
  issuesCreated: string[]
  issuesSkipped: string[]
  invitation: string
  cohortPr: string | null
}

export type EnrollContext = {
  config: RepoConfig
  opts: EnrollOptions
  gh: Gh
  io: Io
  report: EnrollReport
  retry: <T>(label: string, fn: () => T) => T
  done: (step: StepId, outcome: StepOutcome, detail: string) => void
}

const STEP_LABELS: Record<StepId, string> = {
  a: 'cohort files',
  b: 'scaffold',
  c: 'invitation',
  d: 'stage issues',
}

export const scaffoldBranch = (handle: string) => `scaffold/${handle}`
export const scaffoldPrTitle = (handle: string) => `Scaffold for @${handle}`
export const enrollBranch = (handle: string) => `bot/enroll-${handle}`
export const enrollPrTitle = (handle: string, cohort: string) => `chore(cohort): add @${handle} to ${cohort}`

/**
 * Enrols one person: cohort files, scaffold pull request, collaborator invitation, personal
 * stage issues. Every step is idempotent, so the command can be run again after a failure
 * and performs only what is still missing. open-cohort calls this once per member.
 */
export function enroll(config: RepoConfig, opts: EnrollOptions, gh: Gh, io: Io): EnrollReport {
  const handle = opts.handle.toLowerCase()
  const why = explainHandle(handle)
  if (why) throw new UsageError(`The handle ${why}`)
  const cohort = opts.cohort
  if (cohort !== NO_COHORT) {
    if (!isCohortId(cohort))
      throw new UsageError(`The cohort must be a year and month like 2027-01, or "none", not "${cohort}".`)
    if (!existsSync(join(config.root, COHORTS_DIR, cohort, COHORT_FILE))) {
      throw new UsageError(
        `cohorts/${cohort}/${COHORT_FILE} does not exist. Create and merge it first, or pass --cohort none.`,
      )
    }
  }

  const report: EnrollReport = {
    handle,
    cohort,
    steps: [],
    failed: false,
    scaffolded: false,
    issuesCreated: [],
    issuesSkipped: [],
    invitation: 'not checked',
    cohortPr: null,
  }
  const ctx: EnrollContext = {
    config,
    opts: { ...opts, handle },
    gh,
    io,
    report,
    retry: (label, fn) =>
      withRetry(label, fn, {
        ...opts.retry,
        onRetry: (attempt, error, delay) => {
          const message = error instanceof Error ? error.message : String(error)
          io.err(`  ${label}: attempt ${attempt} failed (${message}); retrying in ${delay} ms`)
        },
      }),
    done: (step, outcome, detail) => {
      report.steps.push({ step, outcome, detail })
      if (outcome === 'failed') report.failed = true
      io.out(`${step}. ${STEP_LABELS[step]}: ${outcome}${detail ? `, ${detail}` : ''}`)
    },
  }

  const steps: [StepId, (ctx: EnrollContext) => void][] = [
    ['a', stepCohortFiles],
    ['b', stepScaffold],
    ['c', stepInvite],
    ['d', stepIssues],
  ]
  for (const [id, step] of steps) {
    try {
      step(ctx)
    } catch (error) {
      if (error instanceof UsageError) throw error
      ctx.done(id, 'failed', error instanceof Error ? error.message : String(error))
    }
  }
  io.out(`Stage ${SHARED_STAGE} is not a personal issue. @${handle} claims one labelled good-shared-issue.`)
  return report
}

export function readRepoFile(root: string, rel: string): string {
  const path = join(root, rel)
  return existsSync(path) ? readFileSync(path, 'utf8') : ''
}
