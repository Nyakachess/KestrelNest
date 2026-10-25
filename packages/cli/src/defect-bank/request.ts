import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { UsageError } from '../args.js'
import type { Competency, Tier } from './types.js'

/**
 * P2 (docs/P2-defect-bank.md): the request file for one round of candidate defects, in the input
 * shape of Kestrel's tools/ai_assets runner, one JSON object per line: {id, prompt_version, inputs}.
 * Nothing here calls a model. Kestrel's runner sends the file, and `nest defect-import` reads the
 * runner's output back.
 */
export const PROMPT_VERSION = 'nest_defect_v1'
export const BANK_DIR = 'tools/defect-bank'
export const CANDIDATES_DIR = 'packages/cli/src/defects/candidates'
export const PROMOTED_DIR = 'packages/cli/src/defects'
/** Expected output per candidate (module, test, symptom and notes), for the estimate. */
export const OUTPUT_TOKENS = 2_500
const CHARS_PER_TOKEN = 4

/** The repository material every request carries, read fresh so a round always sees the current code. */
export const CONTEXT_FILES: Record<string, string> = {
  adr_0004: 'docs/adr/0004-planted-defects.md',
  defects_ts: 'packages/cli/src/defects.ts',
  templates_ts: 'packages/cli/src/templates.ts',
  bank_types_ts: 'packages/cli/src/defect-bank/types.ts',
  schema_profile_ts: 'packages/schema/src/profile.ts',
  schema_page_ts: 'packages/schema/src/page.ts',
  schema_cohort_ts: 'packages/schema/src/cohort.ts',
  schema_contributor_ts: 'packages/schema/src/contributor.ts',
}

/** The fields a defect may edit: the ones the scaffold pre-fills (ADR 0004). */
const FIELDS = ['joined', 'sectionOrder', 'next', 'name', 'skills', 'cohort'] as const
/** Round 1 leans easy, later rounds harder, so the bank ends near eight, eight and four. */
const TIER_PLAN: Record<number, Tier[]> = {
  1: [1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3],
  2: [1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3],
}
const COMPETENCY_CYCLE: Competency[] = [
  'debugging',
  'technical-communication',
  'debugging',
  'automated-testing',
  'debugging',
]

export type Slot = { round: number; index: number; tier: Tier; competency: Competency; field: string }

export function slots(round: number, count = 20): Slot[] {
  const tiers = TIER_PLAN[round] ?? TIER_PLAN[2]!
  return Array.from({ length: count }, (_, i) => ({
    round,
    index: i + 1,
    tier: tiers[i % tiers.length]!,
    competency: COMPETENCY_CYCLE[(i + round - 1) % COMPETENCY_CYCLE.length]!,
    field: FIELDS[(i + round - 1) % FIELDS.length]!,
  }))
}

/** Ids already taken: the bank's and every candidate waiting for review. */
export function existingIds(root: string, bankIds: readonly string[]): string[] {
  const ids = new Set(bankIds)
  const dir = join(root, CANDIDATES_DIR)
  if (existsSync(dir))
    for (const f of readdirSync(dir))
      if (f.endsWith('.ts') && !f.endsWith('.test.ts')) ids.add(f.slice(0, -3))
  return [...ids].sort()
}

export function readContext(root: string): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [key, path] of Object.entries(CONTEXT_FILES)) {
    const file = join(root, path)
    if (!existsSync(file)) throw new UsageError(`${path} is missing, so the request cannot carry it.`)
    out[key] = readFileSync(file, 'utf8')
  }
  return out
}

export type RequestLine = { id: string; prompt_version: string; inputs: Record<string, unknown> }

export function buildRequests(
  root: string,
  round: number,
  bankIds: readonly string[],
  count = 20,
): RequestLine[] {
  if (!Number.isInteger(round) || round < 1) throw new UsageError('The round is a whole number from 1.')
  const context = readContext(root)
  const taken = existingIds(root, bankIds)
  return slots(round, count).map((slot) => ({
    id: `r${round}-${String(slot.index).padStart(2, '0')}`,
    prompt_version: PROMPT_VERSION,
    inputs: { slot, existing_ids: taken, context },
  }))
}

/** Input tokens from the characters sent (prompt included), plus the expected output. */
export function estimateTokens(lines: readonly RequestLine[], promptText: string): number {
  return lines.reduce(
    (sum, l) =>
      sum +
      Math.floor((promptText.length + JSON.stringify(l.inputs, null, 1).length) / CHARS_PER_TOKEN) +
      1 +
      OUTPUT_TOKENS,
    0,
  )
}

export function requestPath(root: string, round: number): string {
  return join(root, BANK_DIR, 'requests', `round-${round}.jsonl`)
}

export function writeRequests(path: string, lines: readonly RequestLine[]): void {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, lines.map((l) => JSON.stringify(l)).join('\n') + '\n')
}

/** One line of the runner's output file. */
export type RunnerOutput = {
  id: string
  output: string | null
  model: string
  prompt_version: string
  tokens: number
  generated_at: string | null
  ok: boolean
  error: string | null
}

/** Reads the runner's output JSONL, line by line, and says which line is wrong. */
export function readRunnerOutput(path: string): RunnerOutput[] {
  if (!existsSync(path)) throw new UsageError(`${path} does not exist.`)
  const rows: RunnerOutput[] = []
  readFileSync(path, 'utf8')
    .split(/\r?\n/)
    .forEach((raw, i) => {
      if (!raw.trim()) return
      let obj: Record<string, unknown>
      try {
        obj = JSON.parse(raw) as Record<string, unknown>
      } catch {
        throw new UsageError(`Line ${i + 1} of ${path} is not JSON.`)
      }
      if (
        typeof obj.id !== 'string' ||
        typeof obj.model !== 'string' ||
        typeof obj.prompt_version !== 'string'
      )
        throw new UsageError(`Line ${i + 1} of ${path} needs id, model and prompt_version.`)
      rows.push({
        id: obj.id,
        output: typeof obj.output === 'string' ? obj.output : null,
        model: obj.model,
        prompt_version: obj.prompt_version,
        tokens: typeof obj.tokens === 'number' ? obj.tokens : 0,
        generated_at: typeof obj.generated_at === 'string' ? obj.generated_at : null,
        ok: obj.ok !== false,
        error: typeof obj.error === 'string' ? obj.error : null,
      })
    })
  return rows
}
