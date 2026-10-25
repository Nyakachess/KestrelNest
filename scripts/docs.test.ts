import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../', import.meta.url))

describe('documentation', () => {
  it('keeps every ADR under 25 lines', () => {
    const dir = join(ROOT, 'docs', 'adr')
    const records = readdirSync(dir).filter((f) => /^\d{4}-.*\.md$/.test(f))
    expect(records.length).toBeGreaterThan(0)
    for (const file of records) {
      const lines = readFileSync(join(dir, file), 'utf8').trimEnd().split('\n').length
      expect(lines, file).toBeLessThan(25)
    }
  })

  it('has every document the site and the stage issues link to', () => {
    for (const path of [
      'docs/CONTRIBUTING.md',
      'docs/PRIVACY.md',
      'docs/roadmap.md',
      'docs/GOVERNANCE.md',
      'CHANGELOG.md',
      'CODE_OF_CONDUCT.md',
      'SECURITY.md',
      'CONTRIBUTORS.md',
      'LICENSE',
    ]) {
      expect(existsSync(join(ROOT, path)), path).toBe(true)
    }
  })

  it('has an issue body for every stage', () => {
    const files = readdirSync(join(ROOT, 'stages'))
    for (let n = 1; n <= 7; n++) {
      expect(
        files.some((f) => f.startsWith(`0${n}-`) && f.endsWith('.md')),
        `stage ${n}`,
      ).toBe(true)
    }
  })
})
