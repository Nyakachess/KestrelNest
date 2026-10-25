import { isPlaceholder, PAGE_SECTIONS, type Cohort, type Contributor } from '@nest/schema'
import type { ScaffoldPlan } from './templates.js'

/**
 * Every scaffold ships with one planted defect. All five pass `nest validate`, so the scaffold
 * pull request is green, and all five are visible on the live page once it is public. Stage 3
 * is finding and fixing it. Stage 4 is writing the test that would have caught it.
 *
 * Detectors compare against the cohort window, never against today, because scaffolds are
 * opened before a cohort starts.
 */
export type Defect = {
  id: string
  number: 1 | 2 | 3 | 4 | 5
  /** What the owner sees on the live page. Used in maintainer output only. */
  symptom: string
  apply: (plan: ScaffoldPlan) => void
  /** One sentence naming the problem when present, or null. This is what a Stage 4 test asserts. */
  detect: (c: Contributor, cohort: Cohort | undefined) => string | null
}

const shiftYear = (date: string, years: number) => `${Number(date.slice(0, 4)) + years}${date.slice(4)}`

export const DEFECTS: readonly Defect[] = [
  {
    id: 'joined-after-cohort',
    number: 1,
    symptom: 'The page says the owner joined fifty years from now.',
    apply: (plan) => {
      plan.joined = shiftYear(plan.joined, 50)
    },
    detect: (c, cohort) => {
      const limit = cohort ? cohort.ends : `${new Date().getUTCFullYear() + 1}-12-31`
      if (c.profile.joined <= limit) return null
      return cohort
        ? `joined is ${c.profile.joined}, after cohort ${cohort.id} ended on ${cohort.ends}.`
        : `joined is ${c.profile.joined}, which is in the future.`
    },
  },
  {
    id: 'joined-before-cohort',
    number: 2,
    symptom: 'The page says the owner joined a year before their cohort started.',
    apply: (plan) => {
      plan.joined = shiftYear(plan.joined, -1)
    },
    detect: (c, cohort) => {
      if (!cohort || c.profile.joined >= cohort.starts) return null
      return `joined is ${c.profile.joined}, before cohort ${cohort.id} started on ${cohort.starts}.`
    },
  },
  {
    id: 'sections-out-of-order',
    number: 3,
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

export function defectByNumberOrId(value: string): Defect | undefined {
  return DEFECTS.find((d) => d.id === value || String(d.number) === value)
}

/** The same handle always gets the same defect, so a re-run of the scaffold is reproducible. */
export function pickDefect(handle: string): Defect {
  let hash = 0
  for (const ch of handle) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0
  return DEFECTS[hash % DEFECTS.length] as Defect
}

/** Runs every detector. A clean directory returns an empty list. */
export function detectDefects(
  c: Contributor,
  cohort: Cohort | undefined,
): { defect: Defect; finding: string }[] {
  const out: { defect: Defect; finding: string }[] = []
  for (const defect of DEFECTS) {
    const finding = defect.detect(c, cohort)
    if (finding) out.push({ defect, finding })
  }
  return out
}
