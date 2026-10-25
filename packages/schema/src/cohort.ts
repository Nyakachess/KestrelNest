import { z } from 'zod'
import { COHORT_ID_PATTERN } from './handle.js'

export const CohortSchema = z.strictObject({
  id: z.string().regex(COHORT_ID_PATTERN),
  name: z.string().trim().min(1).max(80),
  starts: z.iso.date(),
  ends: z.iso.date(),
  members: z.array(z.string().trim().min(1)).max(200),
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

/** "2027-01" becomes "January 2027 cohort". */
export function cohortDisplayName(id: string): string {
  const [year, month] = id.split('-')
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year} cohort` : `Cohort ${id}`
}
