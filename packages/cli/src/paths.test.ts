import { describe, expect, it } from 'vitest'
import { checkOwnDirectoryChange } from './paths.js'

describe('checkOwnDirectoryChange', () => {
  it('accepts changes limited to the author directory, ignoring login case', () => {
    const r = checkOwnDirectoryChange(
      ['contributors/test-one/profile.yml', 'contributors/test-one/page.md'],
      'Test-One',
    )
    expect(r).toEqual({ ok: true, handle: 'test-one' })
  })

  it('accepts a new test file in the directory', () => {
    expect(checkOwnDirectoryChange(['contributors/test-one/dates.test.ts'], 'test-one').ok).toBe(true)
  })

  it.each([
    [['CONTRIBUTORS.md'], 'outside'],
    [['contributors/test-two/profile.yml'], 'outside'],
    [['contributors/test-one/profile.yml', 'README.md'], 'outside'],
    [['contributors/test-one/.practice.json'], 'written by a workflow'],
    [['contributors/test-one/photo.png'], 'not a file that belongs'],
    [['contributors/test-one/sub/page.md'], 'subdirectory'],
    [[], 'no files'],
  ])('rejects %j (%s)', (files, reason) => {
    const r = checkOwnDirectoryChange(files, 'test-one')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain(reason)
  })

  it('rejects an author whose login cannot be a handle', () => {
    const r = checkOwnDirectoryChange(['contributors/_example/profile.yml'], '_example')
    expect(r.ok).toBe(false)
  })
})

describe('checkOwnDirectoryChange for the enrolment bot', () => {
  it('accepts a bot pull request that touches only a cohort file and CODEOWNERS', () => {
    const r = checkOwnDirectoryChange(
      ['cohorts/2027-01/cohort.yml', '.github/CODEOWNERS'],
      'github-actions[bot]',
    )
    expect(r).toEqual({ ok: true, handle: 'github-actions[bot]' })
  })

  it('rejects a bot pull request that touches anything else', () => {
    const r = checkOwnDirectoryChange(['cohorts/2027-01/cohort.yml', 'README.md'], 'github-actions[bot]')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toContain('README.md')
  })

  it('does not give a human author the bot rule', () => {
    expect(checkOwnDirectoryChange(['.github/CODEOWNERS'], 'test-one').ok).toBe(false)
  })
})
