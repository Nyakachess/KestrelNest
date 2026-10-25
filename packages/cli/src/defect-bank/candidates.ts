import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { join } from 'node:path'
import { CANDIDATES_DIR, type RunnerOutput } from './request.js'
import { COMPETENCIES, isDefectId, TIERS, type Competency, type Tier } from './types.js'

/**
 * P2 item 2: candidate defects from the runner's output. A candidate is two files in
 * packages/cli/src/defects/candidates/: <id>.ts (the defect, default export) and <id>.test.ts
 * (the Stage 4 test, skipped unless the gate points it at a scaffold). Candidates are left out of
 * the build and are not in the bank until `nest defect-promote` moves them.
 */
const EM_DASH = String.fromCharCode(0x2014)
const README = 'README.md'
export const CHECKS_FILE = 'checks.json'

export type CandidateOutput = {
  id: string
  tier: Tier
  competency: Competency
  symptom: string
  needs_cohort: boolean
  module: string
  test: string
  notes: string
}

/** Which modules a candidate may import: type imports of the bank's own files, values from the schema. */
const TYPE_ONLY = new Set(['@nest/schema', '../../defect-bank/types.js', '../../templates.js'])
const VALUE_OK = new Set(['@nest/schema'])

function importProblems(source: string, what: 'module' | 'test'): string[] {
  const problems: string[] = []
  for (const m of source.matchAll(/^\s*import\s+(type\s+)?[^'"]*?from\s+['"]([^'"]+)['"]/gm)) {
    const typeOnly = Boolean(m[1])
    const from = m[2]!
    if (what === 'test') {
      if (!['@nest/schema', 'vitest'].includes(from)) problems.push(`the test imports ${from}`)
    } else if (!(typeOnly ? TYPE_ONLY.has(from) : VALUE_OK.has(from))) {
      problems.push(`the module ${typeOnly ? 'type-imports' : 'imports'} ${from}`)
    }
  }
  if (/\brequire\(|\bimport\(/.test(source)) problems.push(`the ${what} loads code at run time`)
  if (/Math\.random/.test(source)) problems.push(`the ${what} uses randomness`)
  return problems
}

/** Parses and checks one output. Returns the candidate, or the reasons it was refused. */
export function parseCandidate(
  text: string | null,
  taken: ReadonlySet<string>,
): { candidate?: CandidateOutput; problems: string[] } {
  let obj: Record<string, unknown>
  try {
    obj = JSON.parse((text ?? '').trim().replace(/^```(?:json)?\s*|\s*```$/g, '')) as Record<string, unknown>
  } catch {
    return { problems: ['the output is not JSON'] }
  }
  const problems: string[] = []
  const str = (k: string) => (typeof obj[k] === 'string' ? (obj[k] as string) : '')
  const id = str('id')
  if (!isDefectId(id))
    problems.push(`id "${id}" is not lower case words joined by hyphens, 3 to 40 characters`)
  else if (taken.has(id)) problems.push(`id "${id}" is already taken`)
  if (!TIERS.includes(obj.tier as Tier)) problems.push('tier must be 1, 2 or 3')
  if (!COMPETENCIES.includes(obj.competency as Competency))
    problems.push(`competency must be one of ${COMPETENCIES.join(', ')}`)
  if (!str('symptom') || str('symptom').length > 200) problems.push('symptom must be one sentence')
  if (typeof obj.needs_cohort !== 'boolean') problems.push('needs_cohort must be true or false')
  const module = str('module')
  const test = str('test')
  if (!module.includes('export default')) problems.push('the module has no default export')
  if (id && !module.includes(`'${id}'`) && !module.includes(`"${id}"`))
    problems.push('the module does not use its id')
  if (!test.includes('NEST_DEFECT_ROOT') || !test.includes('describe.skipIf'))
    problems.push('the test does not follow the shape in the prompt (NEST_DEFECT_ROOT, describe.skipIf)')
  if (id && new RegExp(`from\\s+['"][^'"]*${id}`).test(test)) problems.push('the test imports the defect')
  problems.push(...importProblems(module, 'module'), ...importProblems(test, 'test'))
  if (problems.length > 0) return { problems }
  return {
    candidate: {
      id,
      tier: obj.tier as Tier,
      competency: obj.competency as Competency,
      symptom: str('symptom'),
      needs_cohort: obj.needs_cohort as boolean,
      module,
      test,
      notes: str('notes'),
    },
    problems: [],
  }
}

export type Provenance = {
  model: string
  prompt_version: string
  generated_at: string | null
  request: string
}

/** The header every bank file carries (D-39 in Kestrel: provenance on every asset). */
export function header(p: Provenance, extra: Record<string, string> = {}): string {
  const lines = {
    model: p.model,
    prompt_version: p.prompt_version,
    generated_at: p.generated_at ?? 'unknown',
    request: p.request,
    ...extra,
  }
  return [
    '// A planted defect from the P2 bank (docs/P2-defect-bank.md, ADR 0009).',
    ...Object.entries(lines).map(([k, v]) => `// ${k}: ${v}`),
    '',
  ].join('\n')
}

/** Reads the `// key: value` provenance lines at the top of a bank file. */
export function readHeader(source: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const line of source.split(/\r?\n/)) {
    if (!line.startsWith('//')) break
    const m = /^\/\/ ([a-z_]+): (.*)$/.exec(line)
    if (m) out[m[1]!] = m[2]!
  }
  return out
}

const noDashes = (s: string) => s.split(EM_DASH).join(', ')

/** Formats files with the repository's Prettier. False when a file does not parse. */
export function prettierWrite(root: string, files: readonly string[]): boolean {
  const require = createRequire(import.meta.url)
  try {
    execFileSync(process.execPath, [require.resolve('prettier/bin/prettier.cjs'), '--write', ...files], {
      cwd: root,
      stdio: 'pipe',
    })
    return true
  } catch {
    return false
  }
}

export type ImportResult = { written: string[]; refused: { request: string; problems: string[] }[] }

/** Writes every acceptable output as a candidate. Nothing in the bank changes. */
export function importCandidates(
  root: string,
  rows: readonly RunnerOutput[],
  bankIds: readonly string[],
): ImportResult {
  const dir = join(root, CANDIDATES_DIR)
  mkdirSync(dir, { recursive: true })
  const taken = new Set([...bankIds, ...candidateIds(root)])
  const result: ImportResult = { written: [], refused: [] }
  for (const row of rows) {
    if (!row.ok) {
      result.refused.push({
        request: row.id,
        problems: [`the request failed: ${row.error ?? 'no reason given'}`],
      })
      continue
    }
    const { candidate, problems } = parseCandidate(row.output, taken)
    if (!candidate) {
      result.refused.push({ request: row.id, problems })
      continue
    }
    const head = header(
      {
        model: row.model,
        prompt_version: row.prompt_version,
        generated_at: row.generated_at,
        request: row.id,
      },
      { status: 'candidate', notes: noDashes(candidate.notes).replace(/\s+/g, ' ').slice(0, 300) },
    )
    const modulePath = join(dir, `${candidate.id}.ts`)
    const testPath = join(dir, `${candidate.id}.test.ts`)
    writeFileSync(modulePath, head + noDashes(candidate.module).trim() + '\n')
    writeFileSync(testPath, head + noDashes(candidate.test).trim() + '\n')
    if (!prettierWrite(root, [modulePath, testPath])) {
      rmSync(modulePath, { force: true })
      rmSync(testPath, { force: true })
      result.refused.push({ request: row.id, problems: ['the module or the test is not valid TypeScript'] })
      continue
    }
    taken.add(candidate.id)
    result.written.push(candidate.id)
  }
  writeReadme(root)
  return result
}

export function candidateIds(root: string): string[] {
  const dir = join(root, CANDIDATES_DIR)
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .filter((f) => f.endsWith('.ts') && !f.endsWith('.test.ts'))
    .map((f) => f.slice(0, -3))
    .sort()
}

export type CheckRecord = { result: 'pass' | 'fail'; reason: string; visible: boolean; checked_at: string }

export function readChecks(root: string): Record<string, CheckRecord> {
  const path = join(root, CANDIDATES_DIR, CHECKS_FILE)
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as Record<string, CheckRecord>) : {}
}

/** A literal field of a bank file's defect object: a whole number, or a quoted string. */
export function field(source: string, key: string): string {
  const m = new RegExp(`\\b${key}:\\s*(?:'((?:\\\\.|[^'\\\\])*)'|"((?:\\\\.|[^"\\\\])*)"|(\\d+))`).exec(
    source,
  )
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : ''
}

/** candidates/README.md: one row per candidate, with the gate's last result. */
export function writeReadme(root: string): void {
  const dir = join(root, CANDIDATES_DIR)
  mkdirSync(dir, { recursive: true })
  const checks = readChecks(root)
  const rows = candidateIds(root).map((id) => {
    const src = readFileSync(join(dir, `${id}.ts`), 'utf8')
    const head = readHeader(src)
    const check = checks[id]
    const status = check
      ? `${check.result}${check.reason ? `: ${check.reason}` : ''}`
      : (head.status ?? 'candidate')
    const symptom = field(src, 'symptom').replace(/\|/g, '/')
    return `| ${id} | ${field(src, 'tier')} | ${field(src, 'competency')} | ${symptom} | ${status.replace(/\|/g, '/')} |`
  })
  const text = [
    '# Candidate defects',
    '',
    'Written by `nest defect-import` from the model output of a P2 round (docs/P2-defect-bank.md). Nothing here is in the bank: `nest defect-check` runs the gate and fills the status, and a maintainer promotes the ones that pass with `nest defect-promote <id>`.',
    '',
    '| Id | Tier | Competency | Symptom | Status |',
    '| --- | --- | --- | --- | --- |',
    ...(rows.length > 0 ? rows : ['| (none yet) | | | | |']),
    '',
  ].join('\n')
  writeFileSync(join(dir, README), text)
  prettierWrite(root, [join(dir, README)])
}
