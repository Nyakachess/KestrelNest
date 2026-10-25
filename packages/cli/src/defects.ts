import { isPlaceholder, PAGE_SECTIONS, type Cohort, type Contributor } from '@nest/schema'
import type { Competency, Tier } from './defect-bank/types.js'
import { PROMOTED } from './defects/bank.js'
import type { ScaffoldPlan } from './templates.js'

/**
 * Every scaffold ships with one planted defect. All five pass `nest validate`, so the scaffold
 * pull request is green, and all five are visible on the live page once it is public. Stage 3
 * is finding and fixing it. Stage 4 is writing the test that would have caught it.
 *
 * Detectors compare against the cohort window, never against today, because scaffolds are
 * opened before a cohort starts.
 *
 * These five are tier 1 of the bank (ADR 0009). Promoted defects, numbered from 6, are added
 * from defects/bank.ts; BANK is the whole set.
 */
export type Defect = {
  id: string
  number: number
  /** 1 easy, 2 medium, 3 hard (ADR 0009). */
  tier: Tier
  competency: Competency
  /** What the owner sees on the live page. Used in maintainer output only. */
  symptom: string
  apply: (plan: ScaffoldPlan) => void
  /** One sentence naming the problem when present, or null. This is what a Stage 4 test asserts. */
  detect: (c: Contributor, cohort: Cohort | undefined) => string | null
  /** True when the detector needs a cohort, so the defect is never planted for an individual joiner. */
  needsCohort?: true
}

const shiftYear = (date: string, years: number) => `${Number(date.slice(0, 4)) + years}${date.slice(4)}`

export const DEFECTS: readonly Defect[] = [
  {
    id: 'joined-after-cohort',
    number: 1,
    tier: 1,
    competency: 'debugging',
    symptom: 'The page says the owner joined fifty years from now.',
    apply: (plan) => {
      plan.joined = shiftYear(plan.joined, 50)
    },
    detect: (c, cohort) => {
      const own = cohort && c.profile.cohort === cohort.id ? cohort : undefined
      const limit = own ? own.ends : `${new Date().getUTCFullYear() + 1}-12-31`
      if (c.profile.joined <= limit) return null
      return own
        ? `joined is ${c.profile.joined}, after cohort ${own.id} ended on ${own.ends}.`
        : `joined is ${c.profile.joined}, which is in the future.`
    },
  },
  {
    id: 'joined-before-cohort',
    number: 2,
    tier: 1,
    competency: 'debugging',
    needsCohort: true,
    symptom: 'The page says the owner joined a year before their cohort started.',
    apply: (plan) => {
      plan.joined = shiftYear(plan.joined, -1)
    },
    detect: (c, cohort) => {
      if (!cohort || c.profile.cohort !== cohort.id || c.profile.joined >= cohort.starts) return null
      return `joined is ${c.profile.joined}, before cohort ${cohort.id} started on ${cohort.starts}.`
    },
  },
  {
    id: 'sections-out-of-order',
    number: 3,
    tier: 1,
    competency: 'debugging',
    symptom: 'The page reads backwards: "What I am working on next" comes first.',
    apply: (plan) => {
      plan.sectionOrder = [...plan.sectionOrder].reverse()
    },
    detect: (c) => {
      const order = c.page.sections.map((s) => s.title)
      const expected = PAGE_SECTIONS.filter((t) => order.includes(t))
      if (order.join('|') === expected.join('|')) return null
      return `page.md sections are in the order ${order.join(', ')}; expected ${expected.join(', ')}.`
    },
  },
  {
    id: 'placeholder-next',
    number: 4,
    tier: 1,
    competency: 'debugging',
    symptom: 'The page shows template text where "What I am working on next" should be.',
    apply: (plan) => {
      plan.next = 'Replace this with the one thing you want to learn next.'
    },
    detect: (c) =>
      c.profile.next !== undefined && isPlaceholder(c.profile.next)
        ? 'next still has the template text.'
        : null,
  },
  {
    id: 'name-is-handle',
    number: 5,
    tier: 1,
    competency: 'debugging',
    symptom: 'The page shows the GitHub handle where the name should be.',
    apply: (plan) => {
      plan.name = plan.handle
    },
    detect: (c) =>
      c.profile.name.toLowerCase() === c.handle.toLowerCase()
        ? `name is "${c.profile.name}", the same as the handle.`
        : null,
  },
]

/** The whole bank: the first five, then every promoted defect in number order. */
export const BANK: readonly Defect[] = [
  ...DEFECTS,
  ...PROMOTED.map(({ number, defect }) => ({ ...defect, number })),
]

export function defectByNumberOrId(value: string): Defect | undefined {
  return BANK.find((d) => d.id === value || String(d.number) === value)
}

/**
 * The same handle always gets the same defect, so a re-run of the scaffold is reproducible.
 * Without a cohort, only defects that can be found without one are eligible.
 */
export function pickDefect(handle: string, cohortless = false): Defect {
  const eligible = cohortless ? DEFECTS.filter((d) => !d.needsCohort) : [...DEFECTS]
  let hash = 0
  for (const ch of handle) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return eligible[hash % eligible.length] as Defect
}

/** Runs every detector. A clean directory returns an empty list. */
export function detectDefects(
  c: Contributor,
  cohort: Cohort | undefined,
): { defect: Defect; finding: string }[] {
  const out: { defect: Defect; finding: string }[] = []
  for (const defect of BANK) {
    const finding = defect.detect(c, cohort)
    if (finding) out.push({ defect, finding })
  }
  return out
}
