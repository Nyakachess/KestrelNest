import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { COHORTS_DIR, listContributorDirs, validateCohort, validateContributor } from '@nest/schema'
import { BANK, defectByNumberOrId, detectDefects, pickDefect, type Defect } from '../defects.js'
import type { Tier } from './types.js'

/**
 * P2 item 5 (ADR 0009): which defect a scaffold plants. Within the tier the cohort names
 * (cohort.yml defect_tier, default 1), from the handle, never one already used in the cohort while
 * the tier has an unused one.
 *
 * "Used" is cohorts/<id>/.defects.json, the record `nest scaffold` writes (gitignored, so it never
 * dirties the tree a scaffold pull request is opened from; open-cohort fills it for a whole cohort
 * in one run), plus every bank defect still present in a cohort member's directory on main.
 */
export const DEFECTS_FILE = '.defects.json'

const recordPath = (root: string, cohort: string) => join(root, COHORTS_DIR, cohort, DEFECTS_FILE)

/** handle to defect id, as recorded for the cohort. */
export function readAssigned(root: string, cohort: string): Record<string, string> {
  const path = recordPath(root, cohort)
  if (!existsSync(path)) return {}
  try {
    const data = JSON.parse(readFileSync(path, 'utf8')) as { assigned?: Record<string, string> }
    return data.assigned ?? {}
  } catch {
    return {}
  }
}

export function recordAssigned(root: string, cohort: string, handle: string, id: string): void {
  if (!existsSync(join(root, COHORTS_DIR, cohort))) return
  const assigned = { ...readAssigned(root, cohort), [handle]: id }
  const sorted = Object.fromEntries(Object.entries(assigned).sort(([a], [b]) => a.localeCompare(b)))
  writeFileSync(recordPath(root, cohort), JSON.stringify({ assigned: sorted }, null, 2) + '\n')
}

/** Defects already planted in the cohort: recorded, or still present in a member's directory. */
export function usedInCohort(root: string, cohort: string, except: string): Set<string> {
  const used = new Set(
    Object.entries(readAssigned(root, cohort))
      .filter(([h]) => h !== except)
      .map(([, id]) => id),
  )
  const c = validateCohort(root, cohort).cohort
  for (const dir of listContributorDirs(root)) {
    if (dir === except) continue
    const member = validateContributor(root, dir).contributor
    if (!member || member.profile.cohort !== cohort) continue
    for (const { defect } of detectDefects(member, c)) used.add(defect.id)
  }
  return used
}

/** The defect for a handle in a cohort, or for an individual joiner when cohort is null. */
export function chooseDefect(
  root: string,
  handle: string,
  cohort: { id: string | null; tier: Tier; exists: boolean },
  bank: readonly Defect[] = BANK,
): Defect {
  if (cohort.id === null || !cohort.exists)
    return pickDefect(handle, cohort.id === null, { tier: cohort.tier, bank })
  const recorded = readAssigned(root, cohort.id)[handle]
  const again = recorded ? (bank.find((d) => d.id === recorded) ?? defectByNumberOrId(recorded)) : undefined
  if (again) return again
  return pickDefect(handle, false, { tier: cohort.tier, used: usedInCohort(root, cohort.id, handle), bank })
}
