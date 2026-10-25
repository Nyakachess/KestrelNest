import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { UsageError } from './args.js'
import { runDefectRequest } from './commands/defect-request.js'
import { DEFECTS } from './defects.js'
import {
  buildRequests,
  CONTEXT_FILES,
  estimateTokens,
  PROMPT_VERSION,
  readRunnerOutput,
  slots,
} from './defect-bank/request.js'
import { collectIo } from './io.js'
import { readConfig } from './root.js'
import { REAL_ROOT } from './test-support.js'

const dirs: string[] = []
const scratch = () => {
  const d = mkdtempSync(join(tmpdir(), 'nest-bank-'))
  dirs.push(d)
  return d
}
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true })
})

describe('defect requests', () => {
  it('builds twenty lines in the runner input shape, each with the current repository material', () => {
    const lines = buildRequests(
      REAL_ROOT,
      1,
      DEFECTS.map((d) => d.id),
    )
    expect(lines).toHaveLength(20)
    expect(lines[0]!.id).toBe('r1-01')
    expect(lines[19]!.id).toBe('r1-20')
    for (const line of lines) {
      expect(Object.keys(line).sort()).toEqual(['id', 'inputs', 'prompt_version'])
      expect(line.prompt_version).toBe(PROMPT_VERSION)
      const inputs = line.inputs as { context: Record<string, string>; existing_ids: string[] }
      expect(Object.keys(inputs.context).sort()).toEqual(Object.keys(CONTEXT_FILES).sort())
      expect(inputs.context.adr_0004).toContain('planted defect')
      expect(inputs.existing_ids).toEqual(expect.arrayContaining(DEFECTS.map((d) => d.id)))
    }
  })

  it('spreads a round over the three tiers and several fields', () => {
    const round1 = slots(1)
    const tiers = round1.map((s) => s.tier)
    expect(tiers.filter((t) => t === 1)).toHaveLength(7)
    expect(tiers.filter((t) => t === 2)).toHaveLength(8)
    expect(tiers.filter((t) => t === 3)).toHaveLength(5)
    expect(new Set(round1.map((s) => s.field)).size).toBeGreaterThanOrEqual(5)
    expect(
      slots(2)
        .map((s) => s.tier)
        .filter((t) => t === 3).length,
    ).toBeGreaterThan(5)
  })

  it('writes the file, estimates it and calls no model', () => {
    const out = join(scratch(), 'round-1.jsonl')
    const io = collectIo()
    expect(runDefectRequest(readConfig(REAL_ROOT), { round: 1, out }, io)).toBe(0)
    const lines = readFileSync(out, 'utf8').trim().split('\n')
    expect(lines).toHaveLength(20)
    expect(JSON.parse(lines[0]!).id).toBe('r1-01')
    expect(io.lines.join('\n')).toMatch(/Estimate: about [\d,]+ tokens/)
    expect(io.lines.join('\n')).toContain('api/app/prompts/')
    expect(estimateTokens([], 'x')).toBe(0)
  })

  it('rejects a round that is not a whole number from 1', () => {
    expect(() => buildRequests(REAL_ROOT, 0, [])).toThrow(UsageError)
  })
})

describe('runner output', () => {
  it('reads the runner output file and names a bad line', () => {
    const path = join(scratch(), 'out.jsonl')
    writeFileSync(
      path,
      [
        JSON.stringify({
          id: 'r1-01',
          output: '{}',
          model: 'claude-opus-5-5',
          prompt_version: PROMPT_VERSION,
          tokens: 900,
          generated_at: '2026-10-27T10:00:00+00:00',
          ok: true,
          error: null,
        }),
        JSON.stringify({
          id: 'r1-02',
          output: null,
          model: 'm',
          prompt_version: PROMPT_VERSION,
          ok: false,
          error: 'errored',
        }),
        '',
      ].join('\n'),
    )
    const rows = readRunnerOutput(path)
    expect(rows.map((r) => [r.id, r.ok, r.tokens])).toEqual([
      ['r1-01', true, 900],
      ['r1-02', false, 0],
    ])
    writeFileSync(path, '{"id": "x"}\n')
    expect(() => readRunnerOutput(path)).toThrow(/Line 1 .* needs id, model and prompt_version/)
    writeFileSync(path, 'not json\n')
    expect(() => readRunnerOutput(path)).toThrow(/Line 1 .* is not JSON/)
  })
})
