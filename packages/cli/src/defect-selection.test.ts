import { readFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { validateCohort } from '@nest/schema'
import { afterEach, describe, expect, it } from 'vitest'
import { planScaffold, scaffold } from './commands/scaffold.js'
import { DEFECTS_FILE, readAssigned } from './defect-bank/selection.js'
import type { Tier } from './defect-bank/types.js'
import { pickDefect, type Defect } from './defects.js'
import { cleanup, cohortYml, tempRepo } from './test-support.js'

afterEach(cleanup)

/** A bank of twenty: ids d01 to d20, each a no-op, spread over tiers by the given list. */
function fixtureBank(tiers: Tier[] = Array(20).fill(1) as Tier[]): Defect[] {
  return tiers.map((tier, i) => ({
    id: `d${String(i + 1).padStart(2, '0')}`,
    number: i + 1,
    tier,
    competency: 'debugging',
    symptom: 'fixture',
    apply: () => undefined,
    detect: () => null,
  }))
}

const COHORT_OF_15 = [
  'amina-k',
  'baraka-o',
  'chen-li',
  'dalia-m',
  'eze-n',
  'fatma-s',
  'gift-a',
  'hassan-y',
  'ines-r',
  'jomo-w',
  'kemi-b',
  'lwazi-t',
  'mei-h',
  'nuru-j',
  'omar-q',
]

describe('picking a defect from the bank', () => {
  it('spreads a cohort of 15 across at least 10 defects when the bank holds 20', () => {
    const bank = fixtureBank()
    const used = new Set<string>()
    for (const handle of COHORT_OF_15) used.add(pickDefect(handle, false, { bank, used }).id)
    expect(used.size).toBeGreaterThanOrEqual(10)
    expect(used.size).toBe(15) // no repeats while the bank allows it
  })

  it('stays within the tier the cohort names, and falls back when the tier is empty', () => {
    const bank = fixtureBank([1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3])
    for (const handle of COHORT_OF_15) {
      expect(pickDefect(handle, false, { bank, tier: 2 }).tier).toBe(2)
      expect(pickDefect(handle, false, { bank, tier: 3 }).tier).toBe(3)
    }
    const onlyOne = fixtureBank([1, 1, 1])
    expect(pickDefect('amina-k', false, { bank: onlyOne, tier: 3 }).tier).toBe(1)
  })

  it('repeats only once every defect in the tier is used', () => {
    const bank = fixtureBank([1, 1, 1])
    const used = new Set(['d01', 'd02', 'd03'])
    expect(['d01', 'd02', 'd03']).toContain(pickDefect('amina-k', false, { bank, used }).id)
  })

  it('gives a handle the same defect as before when nothing is used, so re-runs are stable', () => {
    expect(pickDefect('test-one')).toBe(pickDefect('test-one', false, { used: new Set() }))
  })
})

describe('defects within a cohort', () => {
  it('records each scaffold in cohorts/<id>/.defects.json and never repeats while the tier allows', () => {
    const members = ['test-one', 'test-two', 'test-three', 'test-four', 'test-five']
    const config = tempRepo({ 'cohorts/2027-01/cohort.yml': cohortYml(members) })
    const planted = members.map((handle) => scaffold(config, { handle }).defect!.id)
    expect(new Set(planted).size).toBe(5)
    const assigned = readAssigned(config.root, '2027-01')
    expect(Object.keys(assigned).sort()).toEqual([...members].sort())
    expect(
      JSON.parse(readFileSync(join(config.root, 'cohorts', '2027-01', DEFECTS_FILE), 'utf8')),
    ).toHaveProperty('assigned')
    // a re-run plans the recorded defect again
    expect(planScaffold(config, { handle: 'test-three' }).defect!.id).toBe(assigned['test-three'])
  })

  it('counts a defect still present in a member directory as used, with no record', () => {
    const config = tempRepo({ 'cohorts/2027-01/cohort.yml': cohortYml(['test-one', 'test-two']) })
    const first = scaffold(config, { handle: 'test-one' }).defect!.id
    rmSync(join(config.root, 'cohorts', '2027-01', DEFECTS_FILE))
    expect(planScaffold(config, { handle: 'test-two' }).defect!.id).not.toBe(first)
  })

  it('reads defect_tier from cohort.yml', () => {
    const config = tempRepo({
      'cohorts/2027-01/cohort.yml': cohortYml(['test-one']) + 'defect_tier: 2\n',
    })
    expect(validateCohort(config.root, '2027-01')).toMatchObject({ issues: [], cohort: { defect_tier: 2 } })
    const bad = tempRepo({ 'cohorts/2027-01/cohort.yml': cohortYml(['test-one']) + 'defect_tier: 4\n' })
    expect(validateCohort(bad.root, '2027-01').issues.map((i) => i.field)).toContain('defect_tier')
    // the bank has no tier 2 defect yet, so the scaffold falls back to the whole bank
    expect(scaffold(config, { handle: 'test-one' }).defect).not.toBeNull()
  })
})
