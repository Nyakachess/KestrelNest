import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as schema from '@nest/schema'
import { validateCohort, validateContributor, validateRepo, type Contributor } from '@nest/schema'
import { defaultPlan, renderAll } from '../templates.js'
import { candidateIds, CHECKS_FILE, readChecks, writeReadme, type CheckRecord } from './candidates.js'
import { CANDIDATES_DIR } from './request.js'
import { COMPETENCIES, TIERS, type BankDefect } from './types.js'

/**
 * P2 item 3: the gate a candidate defect must pass before a maintainer may promote it.
 *
 * 1. The module loads and default-exports a defect of the bank's shape, with its own id.
 * 2. Planted in a scratch scaffold, `nest validate` still passes.
 * 3. The detector names the problem with the defect and returns null without it, so the symptom
 *    is visible; the gate also records whether the rendered page itself changes.
 * 4. The candidate's Stage 4 test fails with the defect and passes without it.
 *
 * Nothing here calls a model, and the candidate's code only ever runs on throwaway copies.
 */
const HANDLE = 'defect-check'
const COHORT = '2027-01'
const COHORT_YML = [
  `id: ${COHORT}`,
  'name: January 2027 cohort',
  'starts: 2027-01-12',
  'ends: 2027-04-30',
  'members:',
  `  - ${HANDLE}`,
  '',
].join('\n')

const require = createRequire(import.meta.url)
/** packages/schema and the repository root, found from this file in src/ or dist/. */
const SCHEMA_DIR = fileURLToPath(new URL('../../../schema/', import.meta.url))
const REPO_DIR = fileURLToPath(new URL('../../../../', import.meta.url))

/**
 * Transpiles a bank file to CommonJS and evaluates it. Its only value import, @nest/schema, is
 * handed the schema this module already loaded; anything else it asks for is refused. Works the
 * same in the built CLI and under the test runner.
 */
export function loadDefect(path: string): BankDefect {
  const ts = require('typescript') as typeof import('typescript')
  const js = ts.transpileModule(readFileSync(path, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const mod: { exports: { default?: BankDefect } } = { exports: {} }
  const load = (name: string) => {
    if (name === '@nest/schema') return schema
    throw new Error(`the module asks for ${name}`)
  }
  new Function('require', 'module', 'exports', js)(load, mod, mod.exports)
  if (!mod.exports.default) throw new Error('the module has no default export')
  return mod.exports.default
}

/** What the live page shows of a contributor (site/src/pages/p/[handle]/index.astro). */
export function pageView(c: Contributor): unknown {
  return {
    handle: c.handle,
    name: c.profile.name,
    intro: c.profile.intro,
    cohort: c.profile.cohort ?? null,
    joined: c.profile.joined,
    skills: c.profile.skills_developing,
    next: c.profile.next ?? null,
    projects: c.profile.projects,
    sections: c.page.sections.map((s) => [s.title, s.body]),
  }
}

/** A throwaway repository with one cohort and one scaffold, with or without the defect. */
function scratchRepo(defect: BankDefect | null): string {
  const root = mkdtempSync(join(tmpdir(), 'nest-gate-'))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ name: 'gate', version: '0.1.0', repository: 'github:example-org/nest' }),
  )
  mkdirSync(join(root, 'cohorts', COHORT), { recursive: true })
  writeFileSync(join(root, 'cohorts', COHORT, 'cohort.yml'), COHORT_YML)
  const plan = defaultPlan(HANDLE, COHORT, '2027-01-12')
  if (defect) defect.apply(plan)
  const dir = join(root, 'contributors', HANDLE)
  mkdirSync(dir, { recursive: true })
  for (const [name, content] of Object.entries(renderAll(plan, 'https://github.com/example-org/nest')))
    writeFileSync(join(dir, name), content)
  return root
}

type TestRun = { ran: number; failed: number; error?: string }

/** Runs one test file with Vitest against a scaffold, through a config written for the run. */
export function runTest(testFile: string, scaffoldRoot: string): TestRun {
  const work = mkdtempSync(join(tmpdir(), 'nest-gate-test-'))
  try {
    const schemaSrc = join(SCHEMA_DIR, 'src', 'index.ts').replace(/\\/g, '/')
    const config = join(work, 'vitest.config.mjs')
    writeFileSync(
      config,
      `export default { resolve: { alias: { '@nest/schema': ${JSON.stringify(schemaSrc)} } },` +
        ` test: { include: [${JSON.stringify(basename(testFile))}] } }\n`,
    )
    const report = join(work, 'report.json')
    const run = spawnSync(
      process.execPath,
      [
        join(REPO_DIR, 'node_modules', 'vitest', 'vitest.mjs'),
        'run',
        '--config',
        config,
        '--root',
        dirname(testFile),
        '--reporter=json',
        `--outputFile=${report}`,
      ],
      {
        env: { ...process.env, NEST_DEFECT_ROOT: scaffoldRoot, NEST_DEFECT_HANDLE: HANDLE },
        encoding: 'utf8',
        timeout: 120_000,
      },
    )
    if (!existsSync(report))
      return {
        ran: 0,
        failed: 0,
        error:
          (run.stderr || run.stdout || 'vitest did not run').trim().split('\n')[0] ?? 'vitest did not run',
      }
    const r = JSON.parse(readFileSync(report, 'utf8')) as {
      numPassedTests: number
      numFailedTests: number
      testResults?: { message?: string }[]
    }
    const loadError = r.testResults?.find((t) => t.message)?.message
    return {
      ran: r.numPassedTests + r.numFailedTests,
      failed: r.numFailedTests,
      ...(loadError ? { error: loadError.split('\n')[0] ?? loadError } : {}),
    }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}

export type CheckOutcome = { id: string; pass: boolean; reason: string; visible: boolean }

const fail = (id: string, reason: string, visible = false): CheckOutcome => ({
  id,
  pass: false,
  reason,
  visible,
})

/** Runs the gate on one candidate in a repository's candidates directory. */
export async function checkCandidate(root: string, id: string): Promise<CheckOutcome> {
  const modulePath = join(root, CANDIDATES_DIR, `${id}.ts`)
  const testPath = join(root, CANDIDATES_DIR, `${id}.test.ts`)
  if (!existsSync(modulePath)) return fail(id, `no candidate ${id} in ${CANDIDATES_DIR}`)
  if (!existsSync(testPath)) return fail(id, 'the test file is missing')
  let defect: BankDefect
  try {
    defect = loadDefect(modulePath)
  } catch (e) {
    return fail(id, `the module does not load: ${(e as Error).message.split('\n')[0]}`)
  }
  if (defect.id !== id) return fail(id, `the module's id is "${defect.id}", not "${id}"`)
  if (!TIERS.includes(defect.tier)) return fail(id, 'tier must be 1, 2 or 3')
  if (!COMPETENCIES.includes(defect.competency)) return fail(id, 'the competency is not a rubric slug')
  if (typeof defect.apply !== 'function' || typeof defect.detect !== 'function')
    return fail(id, 'apply and detect must be functions')

  const roots: string[] = []
  try {
    let withRoot: string
    try {
      withRoot = scratchRepo(defect)
    } catch (e) {
      return fail(id, `apply throws: ${(e as Error).message}`)
    }
    const cleanRoot = scratchRepo(null)
    roots.push(withRoot, cleanRoot)

    const repo = validateRepo(withRoot)
    if (repo.issues.length > 0) {
      const i = repo.issues[0]!
      return fail(id, `nest validate fails: ${i.file} ${i.field} ${i.message}`)
    }
    const cohort = validateCohort(withRoot, COHORT).cohort
    const withDefect = validateContributor(withRoot, HANDLE).contributor!
    const clean = validateContributor(cleanRoot, HANDLE).contributor!
    const visible = JSON.stringify(pageView(withDefect)) !== JSON.stringify(pageView(clean))
    let found: string | null
    let cleanFound: string | null
    try {
      found = defect.detect(withDefect, cohort)
      cleanFound = defect.detect(clean, cohort)
    } catch (e) {
      return fail(id, `detect throws: ${(e as Error).message}`, visible)
    }
    if (!found) return fail(id, 'the detector returns null with the defect planted', visible)
    if (cleanFound) return fail(id, `the detector fires on a clean scaffold: "${cleanFound}"`, visible)

    const red = runTest(testPath, withRoot)
    if (red.error && red.ran === 0) return fail(id, `the test does not run: ${red.error}`, visible)
    if (red.ran === 0) return fail(id, 'the test file has no test that runs', visible)
    if (red.failed === 0) return fail(id, 'the test passes with the defect planted', visible)
    const green = runTest(testPath, cleanRoot)
    if (green.ran === 0 || green.failed > 0) return fail(id, 'the test fails without the defect', visible)
    return { id, pass: true, reason: '', visible }
  } finally {
    for (const r of roots) rmSync(r, { recursive: true, force: true })
  }
}

/** Records outcomes in candidates/checks.json and the README table. */
export function recordChecks(root: string, outcomes: readonly CheckOutcome[], now = new Date()): void {
  const checks = readChecks(root)
  for (const o of outcomes) {
    const record: CheckRecord = {
      result: o.pass ? 'pass' : 'fail',
      reason: o.reason,
      visible: o.visible,
      checked_at: now.toISOString(),
    }
    checks[o.id] = record
  }
  for (const id of Object.keys(checks)) if (!candidateIds(root).includes(id)) delete checks[id]
  const dir = join(root, CANDIDATES_DIR)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, CHECKS_FILE), JSON.stringify(checks, null, 2) + '\n')
  writeReadme(root)
}
