import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const text = readFileSync(fileURLToPath(new URL('../docs/backlog-seed.md', import.meta.url)), 'utf8')

describe('docs/backlog-seed.md', () => {
  const issues = text.split(/^## /m).slice(1)

  it('holds ten Stage 5 issues', () => {
    expect(issues).toHaveLength(10)
  })

  it.each(issues.map((i) => [i.split('\n')[0] ?? '', i]))(
    '%s has why, steps and done-when sections',
    (_title, body) => {
      expect(body).toContain('### Why')
      expect(body).toContain('### Steps')
      expect(body).toContain('### Done when')
      expect(body).toMatch(/- \[ \] /)
      expect(body).toMatch(/^1\. /m)
    },
  )
})
