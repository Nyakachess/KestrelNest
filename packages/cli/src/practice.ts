import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTRIBUTORS_DIR, PRACTICE_FILE, SHARED_STAGE, STAGE_COUNT, type Practice } from '@nest/schema'

export type MergedPr = { number: number; author: string; files: readonly string[]; mergedAt: string }
export type ClosedIssue = { assignees: readonly string[]; labels: readonly string[] }

const same = (a: string, b: string) => a.toLowerCase() === b.toLowerCase()

/**
 * Counts for one contributor from merged pull requests and closed stage issues.
 * practice: merged PRs by the owner that touch only their directory.
 * shared: merged PRs by the owner that touch anything outside contributors/.
 * stages_done: closed onboarding issues assigned to the owner with a stage:n label, plus
 * stage 5 as soon as one shared PR has merged.
 */
export function computePractice(
  handle: string,
  prs: readonly MergedPr[],
  issues: readonly ClosedIssue[],
  now: string,
): Practice {
  const own = `${CONTRIBUTORS_DIR}/${handle.toLowerCase()}/`
  let practice = 0
  let shared = 0
  for (const pr of prs) {
    if (!same(pr.author, handle) || pr.files.length === 0) continue
    const files = pr.files.map((f) => f.split(String.fromCharCode(92)).join('/').toLowerCase())
    if (files.every((f) => f.startsWith(own))) practice += 1
    else if (files.some((f) => !f.startsWith(`${CONTRIBUTORS_DIR}/`))) shared += 1
  }
  const done = new Set<number>()
  for (const issue of issues) {
    if (!issue.assignees.some((a) => same(a, handle))) continue
    for (const label of issue.labels) {
      const m = /^stage:([1-7])$/.exec(label)
      if (m) done.add(Number(m[1]))
    }
  }
  if (shared > 0) done.add(SHARED_STAGE)
  const stages_done = [...done].filter((n) => n >= 1 && n <= STAGE_COUNT).sort((a, b) => a - b)
  return { updated_at: now, practice, shared, stages_done }
}

/** Writes .practice.json only when the counts changed, so a nightly run with nothing new commits nothing. */
export function writePracticeFile(root: string, handle: string, practice: Practice): 'written' | 'unchanged' {
  const path = join(root, CONTRIBUTORS_DIR, handle, PRACTICE_FILE)
  if (existsSync(path)) {
    try {
      const current = JSON.parse(readFileSync(path, 'utf8')) as Practice
      const strip = (p: Practice) =>
        JSON.stringify({ practice: p.practice, shared: p.shared, stages_done: p.stages_done })
      if (strip(current) === strip(practice)) return 'unchanged'
    } catch {
      // Unreadable file: rewrite it.
    }
  }
  writeFileSync(path, `${JSON.stringify(practice, null, 2)}\n`)
  return 'written'
}
