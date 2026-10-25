import { z } from 'zod'
import { COHORT_ID_PATTERN } from './handle.js'

export const CohortSchema = z.strictObject({
  id: z.string().regex(COHORT_ID_PATTERN),
  name: z.string().trim().min(1).max(80),
  starts: z.iso.date(),
  ends: z.iso.date(),
  members: z.array(z.string().trim().min(1)).max(200),
  /** The planted-defect tier for this cohort's scaffolds, 1 easy to 3 hard (ADR 0009). Default 1. */
  defect_tier: z.number().int().min(1).max(3).optional(),
})

export type Cohort = z.infer<typeof CohortSchema>

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

/** "2027-01" becomes "January 2027 cohort"; "2026-11-02" becomes "Cohort starting 2 November 2026". */
export function cohortDisplayName(id: string): string {
  const [year, month, day] = id.split('-')
  const name = MONTHS[Number(month) - 1]
  if (!name) return `Cohort ${id}`
  return day ? `Cohort starting ${Number(day)} ${name} ${year}` : `${name} ${year} cohort`
}
