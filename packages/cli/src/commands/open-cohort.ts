import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CONTRIBUTORS_DIR, PERSONAL_STAGES, SHARED_STAGE, validateCohort } from '@nest/schema'
import { UsageError } from '../args.js'
import type { Gh } from '../gh.js'
import type { Io } from '../io.js'
import { renderIssue } from '../issue-body.js'
import type { RepoConfig } from '../root.js'
import { ensureIssueLabels } from './new-task.js'
import { scaffold } from './scaffold.js'

export type OpenCohortMode = 'print' | 'dry-run' | 'apply'

export type OpenCohortOptions = {
  id: string
  mode: OpenCohortMode
  today?: string | undefined
}

export type OpenCohortReport = {
  scaffolded: string[]
  scaffoldSkipped: string[]
  issuesCreated: string[]
  issuesSkipped: string[]
}

export const scaffoldBranch = (handle: string) => `scaffold/${handle}`
export const scaffoldPrTitle = (handle: string) => `Scaffold for @${handle}`

function scaffoldPrBody(handle: string, cohort: string, repoUrl: string): string {
  return [
    `Starter directory for @${handle}, cohort ${cohort}.`,
    '',
    'One defect is planted on purpose. Finding and fixing it is Stage 3, so please do not fix it here.',
    `Merge when CI is green. The owner then starts with their Stage 1 issue: ${repoUrl}/issues?q=is%3Aopen+label%3Astage%3A1+assignee%3A${handle}`,
    '',
  ].join('\n')
}

/**
 * Opens a cohort: a scaffold pull request for every member without a directory, then the
 * personal issues for stages 1, 2, 3, 4, 6 and 7. Stage 5 is claimed from the
 * good-shared-issue pool and is never created here. Safe to run again: anything that already
 * exists is skipped.
 */
export function openCohort(config: RepoConfig, opts: OpenCohortOptions, gh: Gh, io: Io): OpenCohortReport {
  const report: OpenCohortReport = {
    scaffolded: [],
    scaffoldSkipped: [],
    issuesCreated: [],
    issuesSkipped: [],
  }
  const { cohort, issues } = validateCohort(config.root, opts.id)
  if (!cohort) {
    throw new UsageError(
      `cohorts/${opts.id}/cohort.yml is missing or invalid. Run nest validate for details. ${issues[0]?.message ?? ''}`.trim(),
    )
  }
  const apply = opts.mode === 'apply'
  const would = apply ? '' : 'Would '
  const verb = (s: string) => (apply ? s : would + s.charAt(0).toLowerCase() + s.slice(1))

  if (opts.mode === 'print') {
    for (const handle of cohort.members) {
      io.out(`# @${handle}`)
      for (const n of PERSONAL_STAGES) {
        const issue = renderIssue(config, n, { handle, cohort: cohort.id })
        io.out('')
        io.out(`## ${issue.title}`)
        io.out(`Labels: ${issue.labels.join(', ')}`)
        io.out('')
        io.out(issue.body.trimEnd())
      }
      io.out('')
      io.out(
        `Stage ${SHARED_STAGE} is not a personal issue. @${handle} claims one labelled good-shared-issue.`,
      )
      io.out('')
    }
    return report
  }

  if (apply) {
    if (gh.ensureMilestone(cohort.id) === 'created') io.out(`Created milestone ${cohort.id}`)
  } else
    io.out(
      `${would}ensure milestone ${cohort.id} and labels onboarding, cohort:${cohort.id}, stage:1 to stage:7 exist.`,
    )

  for (const handle of cohort.members) {
    const dir = join(config.root, CONTRIBUTORS_DIR, handle)
    const branch = scaffoldBranch(handle)
    const existingPr = gh.findPr(branch)
    if (existsSync(dir)) {
      report.scaffoldSkipped.push(handle)
      io.out(`Skipped scaffold for @${handle}: contributors/${handle}/ exists.`)
    } else if (existingPr) {
      report.scaffoldSkipped.push(handle)
      io.out(`Skipped scaffold for @${handle}: ${existingPr} is already open from ${branch}.`)
    } else if (apply) {
      const result = scaffold(config, { handle, cohort: cohort.id, today: opts.today })
      const url = gh.createDraftPr({
        handle,
        branch,
        title: scaffoldPrTitle(handle),
        body: scaffoldPrBody(handle, cohort.id, config.repoUrl),
        paths: [`${CONTRIBUTORS_DIR}/${handle}`],
      })
      report.scaffolded.push(handle)
      io.out(`Opened ${url} (planted defect: ${result.defect?.id ?? 'none'})`)
    } else {
      report.scaffolded.push(handle)
      io.out(
        `${verb(`Scaffold contributors/${handle}/ and open a draft PR "${scaffoldPrTitle(handle)}" from ${branch}.`)}`,
      )
    }

    const existing = gh.listIssueTitles(handle).map((t) => t.toLowerCase())
    for (const n of PERSONAL_STAGES) {
      const issue = renderIssue(config, n, { handle, cohort: cohort.id })
      if (existing.includes(issue.title.toLowerCase())) {
        report.issuesSkipped.push(issue.title)
        io.out(`Skipped "${issue.title}": already exists.`)
        continue
      }
      if (apply) {
        ensureIssueLabels(gh, issue, io)
        const url = gh.createIssue({
          title: issue.title,
          body: issue.body,
          labels: issue.labels,
          assignee: handle,
          milestone: cohort.id,
        })
        io.out(`Created ${url} "${issue.title}"`)
      } else
        io.out(
          `${verb(`Create "${issue.title}" with labels ${issue.labels.join(', ')}, assignee ${handle}, milestone ${cohort.id}.`)}`,
        )
      report.issuesCreated.push(issue.title)
    }
  }
  io.out(
    `${apply ? 'Done' : 'Dry run'}: ${report.scaffolded.length} scaffold${report.scaffolded.length === 1 ? '' : 's'}, ${report.issuesCreated.length} issue${report.issuesCreated.length === 1 ? '' : 's'}${apply ? ' created' : ' to create'}, ${report.scaffoldSkipped.length + report.issuesSkipped.length} skipped.`,
  )
  return report
}
