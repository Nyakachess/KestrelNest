import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDefectCheck } from './commands/defect-check.js'
import { importCandidates, readChecks } from './defect-bank/candidates.js'
import { checkCandidate } from './defect-bank/check.js'
import { CANDIDATES_DIR } from './defect-bank/request.js'
import { GOOD_MODULE, GOOD_OUTPUT, GOOD_TEST, runnerRow } from './defect-bank/test-fixtures.js'
import { collectIo } from './io.js'
import { cleanup, tempRepo } from './test-support.js'

afterEach(cleanup)

/** Writes a candidate straight into the directory, the way a bad one could end up there. */
function writeCandidate(root: string, id: string, module: string, test = GOOD_TEST): void {
  const dir = join(root, CANDIDATES_DIR)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, `${id}.ts`), module.split("'skill-is-placeholder'").join(`'${id}'`))
  writeFileSync(join(dir, `${id}.test.ts`), test)
}

describe('defect-check', () => {
  it('passes a candidate that validates, is detected, shows on the page and has a red-green test', async () => {
    const config = tempRepo()
    importCandidates(config.root, [runnerRow(GOOD_OUTPUT)], [])
    const outcome = await checkCandidate(config.root, 'skill-is-placeholder')
    expect(outcome).toEqual({ id: 'skill-is-placeholder', pass: true, reason: '', visible: true })
  }, 120_000)

  it('fails each broken candidate with the reason, and writes the results into the README', async () => {
    const config = tempRepo()
    importCandidates(config.root, [runnerRow(GOOD_OUTPUT)], [])
    writeCandidate(
      config.root,
      'breaks-validation',
      GOOD_MODULE.replace("plan.skills = ['Replace this with a skill']", "plan.joined = 'soon'"),
    )
    writeCandidate(
      config.root,
      'fires-on-clean',
      GOOD_MODULE.replace(
        "c.profile.skills_developing.some(isPlaceholder) ? 'skills_developing still has the template text.' : null",
        "'always'",
      ),
    )
    writeCandidate(
      config.root,
      'weak-test',
      GOOD_MODULE,
      GOOD_TEST.replace('.some(isPlaceholder)).toBe(false)', '.length).toBeGreaterThanOrEqual(0)'),
    )
    writeCandidate(
      config.root,
      'wrong-id',
      GOOD_MODULE.replace("id: 'skill-is-placeholder'", "id: 'other-id'"),
    )
    const io = collectIo()
    expect(await runDefectCheck(config, { all: true }, io)).toBe(1)
    const out = io.lines.join('\n')
    expect(out).toContain('skill-is-placeholder: pass')
    expect(out).toMatch(/breaks-validation: fail, nest validate fails: .*joined/)
    expect(out).toContain('fires-on-clean: fail, the detector fires on a clean scaffold')
    expect(out).toContain('weak-test: fail, the test passes with the defect planted')
    expect(out).toContain('wrong-id: fail, the module\'s id is "other-id", not "wrong-id"')
    expect(out).toContain('1 of 5 passed.')
    const checks = readChecks(config.root)
    expect(checks['skill-is-placeholder']).toMatchObject({ result: 'pass', visible: true })
    expect(checks['weak-test']).toMatchObject({ result: 'fail' })
    const readme = readFileSync(join(config.root, CANDIDATES_DIR, 'README.md'), 'utf8')
    expect(readme).toMatch(/\| skill-is-placeholder +\|.*\| pass +\|/)
    expect(readme).toMatch(/\| weak-test +\|.*\| fail: the test passes with the defect planted +\|/)
  }, 300_000)

  it('refuses an id that is not a candidate', async () => {
    await expect(runDefectCheck(tempRepo(), { id: 'nothing-here' }, collectIo())).rejects.toThrow(
      /no candidate nothing-here/,
    )
  })
})
