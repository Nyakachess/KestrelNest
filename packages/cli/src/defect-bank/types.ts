import type { Cohort, Contributor } from '@nest/schema'
import type { ScaffoldPlan } from '../templates.js'

/** 1 easy, 2 medium, 3 hard: how much searching Stage 3 takes to find the defect. */
export type Tier = 1 | 2 | 3

/** The rubric competency the defect mostly exercises, as Kestrel names it. */
export type Competency = 'debugging' | 'automated-testing' | 'technical-communication'

export const TIERS: readonly Tier[] = [1, 2, 3]
export const COMPETENCIES: readonly Competency[] = [
  'debugging',
  'automated-testing',
  'technical-communication',
]

/**
 * A planted defect in the bank: the shape of the first five (ADR 0004) plus its tier and
 * competency. Candidate files written from the model's output default-export one of these.
 */
export type BankDefect = {
  id: string
  tier: Tier
  competency: Competency
  /** What the owner sees on the live page. Used in maintainer output only. */
  symptom: string
  apply: (plan: ScaffoldPlan) => void
  /** One sentence naming the problem when present, or null. */
  detect: (c: Contributor, cohort: Cohort | undefined) => string | null
  /** True when the detector needs a cohort, so the defect is never planted for an individual joiner. */
  needsCohort?: true
}

/** A defect id: lower case words joined by hyphens, 3 to 40 characters. */
export const DEFECT_ID_PATTERN = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/
export const isDefectId = (id: string): boolean =>
  DEFECT_ID_PATTERN.test(id) && id.length >= 3 && id.length <= 40
