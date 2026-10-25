import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { CohortSchema, type Cohort } from './cohort.js'
import { validateContributor, type Contributor } from './contributor.js'
import {
  COHORT_FILE,
  COHORTS_DIR,
  CONTRIBUTORS_DIR,
  listCohortIds,
  listContributorDirs,
  PROFILE_FILE,
  rel,
} from './files.js'
import { explainHandle, isCohortId } from './handle.js'
import { fromZodError, type ValidationIssue } from './issues.js'
import { readYaml } from './yaml.js'

export type CohortResult = { cohort?: Cohort; issues: ValidationIssue[] }

export type RepoResult = {
  contributors: Contributor[]
  cohorts: Cohort[]
  issues: ValidationIssue[]
}

/** Validates one cohort directory. Never throws on bad content. */
export function validateCohort(root: string, id: string): CohortResult {
  const issues: ValidationIssue[] = []
  const file = rel(COHORTS_DIR, id, COHORT_FILE)
  const path = join(root, COHORTS_DIR, id, COHORT_FILE)
  if (!isCohortId(id)) {
    issues.push({
      file: rel(COHORTS_DIR, id),
      field: 'directory',
      message: 'must be named as a year and month, for example cohorts/2027-01/.',
    })
  }
  if (!existsSync(path)) {
    issues.push({ file, field: '(file)', message: 'is missing. Every cohort directory needs one.' })
    return { issues }
  }
  const yaml = readYaml(readFileSync(path, 'utf8'), file)
  issues.push(...yaml.syntaxIssues)
  if (yaml.data === undefined) return { issues }
  const parsed = CohortSchema.safeParse(yaml.data)
  if (!parsed.success) {
    issues.push(...fromZodError(parsed.error, file, yaml.lineOf, yaml.keyLineOf))
    return { issues }
  }
  const cohort = parsed.data
  const push = (path: PropertyKey[], field: string, message: string) => {
    const line = yaml.lineOf(path)
    issues.push({ file, ...(line === undefined ? {} : { line }), field, message })
  }
  if (cohort.id !== id) push(['id'], 'id', `must match the directory name exactly: "${id}".`)
  if (cohort.ends < cohort.starts) push(['ends'], 'ends', 'must not be before starts.')
  const seen = new Map<string, number>()
  cohort.members.forEach((member, i) => {
    const why = explainHandle(member)
    if (why) push(['members', i], `members[${i}]`, why)
    const first = seen.get(member)
    if (first === undefined) seen.set(member, i)
    else push(['members', i], `members[${i}]`, `repeats "${member}" from item ${first + 1}.`)
  })
  return { cohort, issues }
}

/** Validates every contributor and cohort directory. Never throws on bad content. */
export function validateRepo(root: string): RepoResult {
  const issues: ValidationIssue[] = []
  const contributors: Contributor[] = []
  const cohorts: Cohort[] = []

  for (const id of listCohortIds(root)) {
    const r = validateCohort(root, id)
    issues.push(...r.issues)
    if (r.cohort) cohorts.push(r.cohort)
  }
  const cohortIds = new Set(cohorts.map((c) => c.id))

  for (const dir of listContributorDirs(root)) {
    const r = validateContributor(root, dir)
    issues.push(...r.issues)
    if (!r.contributor) continue
    contributors.push(r.contributor)
    const cohort = r.contributor.profile.cohort
    if (cohort !== undefined && !r.contributor.isTemplate && cohortIds.size > 0 && !cohortIds.has(cohort)) {
      issues.push({
        file: rel(CONTRIBUTORS_DIR, dir, PROFILE_FILE),
        field: 'cohort',
        message: `"${cohort}" has no cohorts/${cohort}/cohort.yml. Check the id with your cohort lead.`,
      })
    }
  }
  return { contributors, cohorts, issues }
}
