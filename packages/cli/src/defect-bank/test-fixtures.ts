import type { RunnerOutput } from './request.js'

/** A candidate as the model would return it: passes validation, shows on the page, has a test. */
export const GOOD_MODULE = `import type { Cohort, Contributor } from '@nest/schema'
import { isPlaceholder } from '@nest/schema'
import type { BankDefect } from '../../defect-bank/types.js'
import type { ScaffoldPlan } from '../../templates.js'

const defect: BankDefect = {
  id: 'skill-is-placeholder',
  tier: 1,
  competency: 'technical-communication',
  symptom: 'The page lists "Replace this with a skill" as a skill, as a chip under the intro.',
  apply: (plan: ScaffoldPlan) => {
    plan.skills = ['Replace this with a skill']
  },
  detect: (c: Contributor, _cohort: Cohort | undefined) =>
    c.profile.skills_developing.some(isPlaceholder) ? 'skills_developing still has the template text.' : null,
}

export default defect
`

export const GOOD_TEST = `import { isPlaceholder, validateContributor } from '@nest/schema'
import { describe, expect, it } from 'vitest'

const root = process.env.NEST_DEFECT_ROOT
const handle = process.env.NEST_DEFECT_HANDLE ?? ''

describe.skipIf(!root)('skill-is-placeholder', () => {
  it('lists only real skills', () => {
    const c = validateContributor(root as string, handle).contributor
    expect(c).toBeDefined()
    expect(c!.profile.skills_developing.some(isPlaceholder)).toBe(false)
  })
})
`

export const GOOD_OUTPUT = {
  id: 'skill-is-placeholder',
  tier: 1,
  competency: 'technical-communication',
  symptom: 'The page lists "Replace this with a skill" as a skill, as a chip under the intro.',
  needs_cohort: false,
  module: GOOD_MODULE,
  test: GOOD_TEST,
  notes: 'A one-field search with a clear test.',
}

export function runnerRow(output: unknown, id = 'r1-01', ok = true): RunnerOutput {
  return {
    id,
    output: typeof output === 'string' ? output : JSON.stringify(output),
    model: 'claude-opus-5-5',
    prompt_version: 'nest_defect_v1',
    tokens: 2400,
    generated_at: '2026-10-27T10:00:00+00:00',
    ok,
    error: ok ? null : 'errored: overloaded',
  }
}
