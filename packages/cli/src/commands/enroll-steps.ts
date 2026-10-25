import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { COHORT_FILE, COHORTS_DIR, CONTRIBUTORS_DIR, PERSONAL_STAGES } from '@nest/schema'
import { addCodeownersLine, addCohortMember } from '../enroll-files.js'
import { fillTemplate, NO_COHORT, renderIssue, templateVars } from '../issue-body.js'
import { planScaffold, scaffold } from './scaffold.js'
import {
  enrollBranch,
  enrollPrTitle,
  readRepoFile,
  scaffoldBranch,
  scaffoldPrTitle,
  type EnrollContext,
} from './enroll.js'
import { ensureIssueLabels } from './new-task.js'

const CODEOWNERS = '.github/CODEOWNERS'
const SCAFFOLD_TEMPLATE = '.github/PR_TEMPLATE_SCAFFOLD.md'

/** a. The handle is in the cohort member list and owns its directory in CODEOWNERS, through one bot PR. */
export function stepCohortFiles(ctx: EnrollContext): void {
  const { config, opts, gh, io, report } = ctx
  const { handle, cohort, mode } = opts
  if (cohort === NO_COHORT) return ctx.done('a', 'skipped', 'no cohort')
  const cohortPath = `${COHORTS_DIR}/${cohort}/${COHORT_FILE}`
  const members = addCohortMember(readRepoFile(config.root, cohortPath), handle)
  const owners = addCodeownersLine(readRepoFile(config.root, CODEOWNERS), handle)
  if (!members.changed && !owners.changed) return ctx.done('a', 'skipped', 'already a member and owner')
  const files: Record<string, string> = {}
  if (members.changed) files[cohortPath] = members.text
  if (owners.changed) files[CODEOWNERS] = owners.text
  const title = enrollPrTitle(handle, cohort)
  const body = `Adds @${handle} to cohort ${cohort}: ${Object.keys(files).join(' and ')}. Opened by nest enroll. It merges on its own once CI is green.\n`
  const changed = Object.keys(files).join(', ')
  if (mode === 'print') {
    io.out(`# ${title}`)
    io.out(body.trimEnd())
    io.out('')
    return ctx.done('a', 'would create', `PR from ${enrollBranch(handle)} changing ${changed}`)
  }
  if (mode === 'dry-run')
    return ctx.done('a', 'would create', `PR "${title}" from ${enrollBranch(handle)} changing ${changed}`)
  const result = ctx.retry('cohort pull request', () =>
    gh.upsertFilePr({ branch: enrollBranch(handle), title, body, files }),
  )
  report.cohortPr = result.url || null
  ctx.done(
    'a',
    result.action === 'unchanged' ? 'skipped' : result.action,
    result.url ? `${result.url} (${changed})` : changed,
  )
}

/** b. The contributor directory exists on main or on a scaffold branch, otherwise a draft PR creates it. */
export function stepScaffold(ctx: EnrollContext): void {
  const { config, opts, gh, io, report } = ctx
  const { handle, cohort, mode } = opts
  if (existsSync(join(config.root, CONTRIBUTORS_DIR, handle)))
    return ctx.done('b', 'skipped', `contributors/${handle}/ exists on main`)
  const branch = scaffoldBranch(handle)
  const title = scaffoldPrTitle(handle)
  const template =
    readRepoFile(config.root, SCAFFOLD_TEMPLATE) || 'Starter directory for @{{handle}}{{cohort_phrase}}.\n'
  const body = fillTemplate(template, templateVars(config, { handle, name: opts.name, cohort }))
  if (mode !== 'apply') {
    const plan = planScaffold(config, { handle, cohort, today: opts.today })
    if (mode === 'print') {
      io.out(`# ${title}`)
      io.out(body.trimEnd())
      io.out('')
    }
    const detail = `draft PR "${title}" from ${branch} assigned to ${handle}, planted defect ${plan.defect?.id ?? 'none'}; open branches not checked without --gh`
    return ctx.done('b', 'would create', detail)
  }
  const existing = ctx.retry('scaffold branch lookup', () => gh.findPr(branch))
  if (existing) return ctx.done('b', 'skipped', `${existing} is already open from ${branch}`)
  const result = scaffold(config, { handle, cohort, today: opts.today })
  const url = ctx.retry('scaffold pull request', () =>
    gh.createDraftPr({
      handle,
      branch,
      title,
      body,
      paths: [`${CONTRIBUTORS_DIR}/${handle}`],
      assignee: handle,
    }),
  )
  report.scaffolded = true
  ctx.done('b', 'created', `${url} (planted defect ${result.defect?.id ?? 'none'})`)
}

/** c. The handle is a collaborator with push permission, or has an invitation waiting. */
export function stepInvite(ctx: EnrollContext): void {
  const { opts, gh, report } = ctx
  const { handle, mode } = opts
  if (mode !== 'apply') {
    report.invitation = 'not checked'
    return ctx.done(
      'c',
      'would create',
      'invitation with push permission; current state is not checked without --gh',
    )
  }
  const state = ctx.retry('collaborator lookup', () => gh.collaboratorState(handle))
  if (state === 'collaborator') {
    report.invitation = 'collaborator'
    return ctx.done('c', 'skipped', 'already a collaborator')
  }
  if (state === 'invited') {
    report.invitation = 'invited'
    return ctx.done('c', 'skipped', 'invitation already pending')
  }
  ctx.retry('collaborator invitation', () => gh.inviteCollaborator(handle, 'push'))
  report.invitation = 'invited'
  ctx.done('c', 'created', 'invited with push permission')
}

/** d. One personal issue per stage 1, 2, 3, 4, 6 and 7, skipping any title that already exists. */
export function stepIssues(ctx: EnrollContext): void {
  const { config, opts, gh, io, report } = ctx
  const { handle, cohort, mode } = opts
  const issues = PERSONAL_STAGES.map((n) => renderIssue(config, n, { handle, name: opts.name, cohort }))
  const milestone = cohort === NO_COHORT ? 'none' : cohort
  if (mode !== 'apply') {
    for (const issue of issues) {
      if (mode === 'print') {
        io.out(`## ${issue.title}`)
        io.out(`Labels: ${issue.labels.join(', ')}. Assignee: ${handle}. Milestone: ${milestone}.`)
        io.out('')
        io.out(issue.body.trimEnd())
        io.out('')
      } else
        io.out(
          `Would create "${issue.title}" with labels ${issue.labels.join(', ')}, assignee ${handle}, milestone ${milestone}.`,
        )
      report.issuesCreated.push(issue.title)
    }
    return ctx.done('d', 'would create', `${issues.length} issues, milestone ${milestone}`)
  }
  const existing = ctx.retry('issue lookup', () => gh.listIssueTitles(handle)).map((t) => t.toLowerCase())
  if (cohort !== NO_COHORT && ctx.retry('milestone', () => gh.ensureMilestone(cohort)) === 'created')
    io.out(`Created milestone ${cohort}`)
  for (const issue of issues) {
    if (existing.includes(issue.title.toLowerCase())) {
      report.issuesSkipped.push(issue.title)
      continue
    }
    const url = ctx.retry(`issue "${issue.title}"`, () => {
      ensureIssueLabels(gh, issue, io)
      return gh.createIssue({
        title: issue.title,
        body: issue.body,
        labels: issue.labels,
        assignee: handle,
        milestone: issue.milestone,
      })
    })
    io.out(`Created ${url} "${issue.title}"`)
    report.issuesCreated.push(issue.title)
  }
  const outcome = report.issuesCreated.length > 0 ? 'created' : 'skipped'
  ctx.done(
    'd',
    outcome,
    `${report.issuesCreated.length} created, ${report.issuesSkipped.length} already existed`,
  )
}
