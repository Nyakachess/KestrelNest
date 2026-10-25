import { describe, expect, it } from 'vitest'
import { parsePage, publishIssues } from './page.js'

const template = `## Where I started

Replace this paragraph with how you got here.

## What I learned

Replace this paragraph with one thing you learned.

## What I built

Replace this paragraph with what you built.

## What I am working on next

Replace this paragraph with what comes next.
`

describe('parsePage', () => {
  it('reads the four template sections and marks them as placeholders', () => {
    const { page, issues } = parsePage(template, 'contributors/x/page.md')
    expect(issues).toEqual([])
    expect(page.sections.map((s) => s.title)).toEqual([
      'Where I started',
      'What I learned',
      'What I built',
      'What I am working on next',
    ])
    expect(page.sections.every((s) => s.placeholder)).toBe(true)
    expect(page.sections[1]?.line).toBe(5)
  })

  it('names a misspelled heading with its line', () => {
    const { issues } = parsePage('## What I learnt\n\nWords.\n', 'contributors/x/page.md')
    expect(issues).toHaveLength(1)
    expect(issues[0]).toMatchObject({ line: 1, field: 'heading' })
    expect(issues[0]?.message).toMatch(/not a section/)
  })

  it('points at the exact spelling when only the case differs', () => {
    const { issues } = parsePage('## where i started\n\nWords.\n', 'contributors/x/page.md')
    expect(issues[0]?.message).toContain('"## Where I started"')
  })

  it('rejects a heading with the wrong number of hashes', () => {
    const { issues } = parsePage('### Where I started\n\nWords.\n', 'contributors/x/page.md')
    expect(issues[0]?.message).toMatch(/two hashes/)
  })

  it('reports text before the first heading once per line', () => {
    const { issues } = parsePage('Hello.\n\n## Where I started\n\nWords.\n', 'contributors/x/page.md')
    expect(issues).toHaveLength(1)
    expect(issues[0]?.line).toBe(1)
  })
})

describe('publishIssues', () => {
  it('flags every placeholder section on a public page', () => {
    const { page } = parsePage(template, 'contributors/x/page.md')
    const issues = publishIssues(page, 'contributors/x/page.md')
    expect(issues).toHaveLength(4)
    expect(issues[0]).toMatchObject({ line: 1, field: 'Where I started' })
  })

  it('requires the opening section', () => {
    const { page } = parsePage('## What I built\n\nA thing.\n', 'contributors/x/page.md')
    const issues = publishIssues(page, 'contributors/x/page.md')
    expect(issues.map((i) => i.message)).toContainEqual(expect.stringContaining('Where I started'))
  })

  it('is quiet for a filled page', () => {
    const { page } = parsePage('## Where I started\n\nA real sentence.\n', 'contributors/x/page.md')
    expect(publishIssues(page, 'contributors/x/page.md')).toEqual([])
  })
})
