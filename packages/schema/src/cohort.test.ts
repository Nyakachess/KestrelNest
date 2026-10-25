import { describe, expect, it } from 'vitest'
import { cohortDisplayName } from './cohort.js'

describe('cohortDisplayName', () => {
  it('names a monthly cohort by its month', () => {
    expect(cohortDisplayName('2027-01')).toBe('January 2027 cohort')
  })

  it('names a cohort by its start date', () => {
    expect(cohortDisplayName('2026-11-02')).toBe('Cohort starting 2 November 2026')
  })

  it('falls back to the id when the month is not one', () => {
    expect(cohortDisplayName('2027-13')).toBe('Cohort 2027-13')
  })
})
