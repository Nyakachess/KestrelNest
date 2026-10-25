import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { runDefectImport } from './commands/defect-import.js'
import { DEFECTS } from './defects.js'
import { field, parseCandidate, readHeader } from './defect-bank/candidates.js'
import { CANDIDATES_DIR } from './defect-bank/request.js'
import { GOOD_OUTPUT, runnerRow } from './defect-bank/test-fixtures.js'
import { collectIo } from './io.js'
import { cleanup, tempRepo } from './test-support.js'

afterEach(cleanup)

const writeRows = (root: string, rows: unknown[]) => {
  const path = join(root, 'out.jsonl')
  writeFileSync(path, rows.map((r) => JSON.stringify(r)).join('\n') + '\n')
  return path
}

describe('defect-import', () => {
  it('writes a good output as a candidate with its provenance, and refuses the rest with reasons', () => {
    const config = tempRepo()
    const path = writeRows(config.root, [
      runnerRow(GOOD_OUTPUT, 'r1-01'),
      runnerRow({ ...GOOD_OUTPUT, id: 'name-is-handle' }, 'r1-02'),
      runnerRow({ ...GOOD_OUTPUT, id: 'Bad Id' }, 'r1-03'),
      runnerRow(
        {
          ...GOOD_OUTPUT,
          id: 'reads-files',
          module:
            GOOD_OUTPUT.module.replace("'skill-is-placeholder'", "'reads-files'") +
            "\nimport { readFileSync } from 'node:fs'\n",
        },
        'r1-04',
      ),
      runnerRow('I could not write one.', 'r1-05'),
      runnerRow(null, 'r1-06', false),
      runnerRow(
        {
          ...GOOD_OUTPUT,
          id: 'broken-source',
          module: "const defect = { id: 'broken-source', \nexport default",
        },
        'r1-07',
      ),
    ])
    const io = collectIo()
    expect(
      runDefectImport(
        config,
        path,
        io,
        DEFECTS.map((d) => d.id),
      ),
    ).toBe(0)
    const dir = join(config.root, CANDIDATES_DIR)
    expect(existsSync(join(dir, 'skill-is-placeholder.ts'))).toBe(true)
    expect(existsSync(join(dir, 'skill-is-placeholder.test.ts'))).toBe(true)
    const source = readFileSync(join(dir, 'skill-is-placeholder.ts'), 'utf8')
    expect(readHeader(source)).toMatchObject({
      model: 'claude-opus-5-5',
      prompt_version: 'nest_defect_v1',
      generated_at: '2026-10-27T10:00:00+00:00',
      request: 'r1-01',
      status: 'candidate',
    })
    expect(field(source, 'symptom')).toContain('as a chip under the intro')
    const errors = io.errors.join('\n')
    expect(errors).toContain('r1-02 refused: id "name-is-handle" is already taken')
    expect(errors).toContain('r1-03 refused: id "Bad Id"')
    expect(errors).toContain('r1-04 refused: the module imports node:fs')
    expect(errors).toContain('r1-05 refused: the output is not JSON')
    expect(errors).toContain('r1-06 refused: the request failed')
    expect(errors).toContain('r1-07 refused: the module or the test is not valid TypeScript')
    expect(existsSync(join(dir, 'broken-source.ts'))).toBe(false)
    const readme = readFileSync(join(dir, 'README.md'), 'utf8')
    // Prettier pads the table's columns
    expect(readme).toMatch(
      /\| skill-is-placeholder +\| 1 +\| technical-communication +\| .+ \| candidate +\|/,
    )
    expect(io.lines.at(-1)).toBe('Imported 1 of 7; 6 refused. Run nest defect-check --all next.')
  })

  it('never imports the same id twice, and replaces em dashes', () => {
    const config = tempRepo()
    const dash = String.fromCharCode(0x2014)
    const path = writeRows(config.root, [
      runnerRow({ ...GOOD_OUTPUT, notes: `fair${dash}and clear` }, 'r1-01'),
      runnerRow(GOOD_OUTPUT, 'r1-02'),
    ])
    const io = collectIo()
    runDefectImport(config, path, io, [])
    expect(io.errors.join('\n')).toContain('r1-02 refused: id "skill-is-placeholder" is already taken')
    const source = readFileSync(join(config.root, CANDIDATES_DIR, 'skill-is-placeholder.ts'), 'utf8')
    expect(source).not.toContain(dash)
  })

  it('checks the shape of a test', () => {
    const { problems } = parseCandidate(
      JSON.stringify({ ...GOOD_OUTPUT, test: "import { it } from 'vitest'\nit('x', () => {})" }),
      new Set(),
    )
    expect(problems.join(' ')).toContain('the test does not follow the shape')
  })
})
