import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { validateCohort, validateContributor, validateRepo } from '@nest/schema'
import { afterEach, describe, expect, it } from 'vitest'
import { UsageError } from './args.js'
import { planScaffold, scaffold } from './commands/scaffold.js'
import { DEFECTS, detectDefects, pickDefect } from './defects.js'
import { cleanup, tempRepo } from './test-support.js'

afterEach(cleanup)

describe('scaffold', () => {
  it('writes a private directory that validates and uses the cohort start as the join date', () => {
    const config = tempRepo()
    const result = scaffold(config, { handle: 'test-one', defect: 'none' })
    expect(Object.keys(result.files).sort()).toEqual([
      'README.md',
      'page.md',
      'profile.test.ts',
      'profile.yml',
    ])
    expect(existsSync(join(result.dir, 'profile.yml'))).toBe(true)
    const repo = validateRepo(config.root)
    expect(repo.issues).toEqual([])
    const c = repo.contributors[0]!
    expect(c.profile.visibility.page).toBe('private')
    expect(c.profile.joined).toBe('2027-01-12')
    expect(c.profile.cohort).toBe('2027-01')
    expect(detectDefects(c, repo.cohorts[0])).toEqual([])
  })

  it('refuses to overwrite without --force', () => {
    const config = tempRepo()
    scaffold(config, { handle: 'test-one' })
    expect(() => scaffold(config, { handle: 'test-one' })).toThrow(UsageError)
    expect(() => scaffold(config, { handle: 'test-one', force: true })).not.toThrow()
  })

  it('rejects a bad handle in plain words', () => {
    const config = tempRepo()
    expect(() => scaffold(config, { handle: 'Test_One' })).toThrow(/lower case/)
    expect(() => scaffold(config, { handle: '_example' })).toThrow(/underscore/)
  })

  it('creates the repository template with --template, always private and without a defect', () => {
    const config = tempRepo()
    const result = scaffold(config, { handle: '_example', template: true })
    expect(result.defect).toBeNull()
    expect(validateContributor(config.root, '_example').issues).toEqual([])
    expect(readFileSync(join(result.dir, 'profile.yml'), 'utf8')).toContain('page: private')
  })

  it('needs a cohort when none or several exist', () => {
    expect(() => scaffold(tempRepo({}, { cohort: false }), { handle: 'test-one' })).toThrow(
      /No cohort exists yet/,
    )
    expect(() =>
      scaffold(tempRepo({}, { cohort: false }), {
        handle: 'test-one',
        cohort: '2027-03',
        today: '2027-03-01',
      }),
    ).not.toThrow()
  })

  it('picks the same defect for the same handle every time', () => {
    expect(pickDefect('test-one')).toBe(pickDefect('test-one'))
    expect(DEFECTS.map((d) => d.number)).toEqual([1, 2, 3, 4, 5])
  })

  describe.each(DEFECTS)('defect $number, $id', (defect) => {
    it('passes validation but is caught by exactly its own detector', () => {
      const config = tempRepo()
      const result = scaffold(config, { handle: 'test-one', defect: String(defect.number) })
      expect(result.defect?.id).toBe(defect.id)
      expect(validateContributor(config.root, 'test-one').issues).toEqual([])
      const c = validateContributor(config.root, 'test-one').contributor!
      const found = detectDefects(c, validateCohort(config.root, '2027-01').cohort)
      expect(found.map((f) => f.defect.id)).toEqual([defect.id])
      expect(found[0]?.finding).toMatch(/\S/)
    })
  })

  it('can plan without writing', () => {
    const config = tempRepo()
    const plan = planScaffold(config, { handle: 'test-two', defect: 'name-is-handle' })
    expect(plan.files['profile.yml']).toContain('name: test-two')
    expect(existsSync(plan.dir)).toBe(false)
  })
})
