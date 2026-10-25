import { describe, expect, it } from 'vitest'
import { explainHandle, isCohortId, isHandle, isTemplateDir } from './handle.js'

describe('isHandle', () => {
  it.each(['a', 'ab', 'a1', 'test-one', 'test-two', 'abc-def-ghi', 'x'.repeat(39)])('accepts %s', (h) => {
    expect(isHandle(h)).toBe(true)
  })

  it.each([
    ['_example', 'leading underscore'],
    ['_anything', 'leading underscore'],
    ['', 'empty'],
    ['-lead', 'leading hyphen'],
    ['trail-', 'trailing hyphen'],
    ['Upper', 'upper case'],
    ['has space', 'space'],
    ['two--hyphens', 'double hyphen'],
    ['dot.name', 'dot'],
    ['under_score', 'underscore inside'],
    ['x'.repeat(40), 'too long'],
  ])('rejects %s (%s)', (h) => {
    expect(isHandle(h)).toBe(false)
    expect(explainHandle(h)).not.toBeNull()
  })

  it('explains a leading underscore in terms of templates', () => {
    expect(explainHandle('_example')).toMatch(/underscore/)
    expect(explainHandle('_example')).toMatch(/template/)
  })

  it('returns null for a valid handle', () => {
    expect(explainHandle('test-one')).toBeNull()
  })
})

describe('isTemplateDir', () => {
  it('treats a leading underscore as a template', () => {
    expect(isTemplateDir('_example')).toBe(true)
    expect(isTemplateDir('example')).toBe(false)
  })
})

describe('isCohortId', () => {
  it.each(['2027-01', '2030-12'])('accepts %s', (id) => expect(isCohortId(id)).toBe(true))
  it.each(['2027-13', '2027-1', '27-01', '2027/01', 'january'])('rejects %s', (id) =>
    expect(isCohortId(id)).toBe(false),
  )
  it.each(['2026-11-02', '2028-02-29', '2027-12-31'])('accepts the start date %s', (id) =>
    expect(isCohortId(id)).toBe(true),
  )
  it.each(['2026-11-2', '2027-02-29', '2027-04-31', '2027-01-00', '2027-01-12-1'])('rejects %s', (id) =>
    expect(isCohortId(id)).toBe(false),
  )
})
