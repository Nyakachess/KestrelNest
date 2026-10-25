import { formatIssue, validateRepo, type ValidationIssue } from '@nest/schema'
import type { Io } from '../io.js'
import type { RepoConfig } from '../root.js'

/** Reading order: by file, then by line, with problems that have no line last. */
export function sortIssues(issues: readonly ValidationIssue[]): ValidationIssue[] {
  return [...issues].sort(
    (a, b) => a.file.localeCompare(b.file) || (a.line ?? Infinity) - (b.line ?? Infinity),
  )
}

/** Prints every problem as file:line field: sentence. Exit code 1 when there are any. */
export function runValidate(config: RepoConfig, io: Io): number {
  const result = validateRepo(config.root)
  for (const issue of sortIssues(result.issues)) io.err(formatIssue(issue))
  const dirs = result.contributors.length
  const templates = result.contributors.filter((c) => c.isTemplate).length
  const people = dirs - templates
  const what = `${people} contributor director${people === 1 ? 'y' : 'ies'}, ${templates} template${templates === 1 ? '' : 's'} and ${result.cohorts.length} cohort${result.cohorts.length === 1 ? '' : 's'}`
  if (result.issues.length === 0) {
    io.out(`Checked ${what}: no problems.`)
    return 0
  }
  io.err(`${result.issues.length} problem${result.issues.length === 1 ? '' : 's'} found in ${what}.`)
  return 1
}
