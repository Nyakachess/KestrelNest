import { afterEach, describe, expect, it } from 'vitest'
import { isPublishable } from './contributor.js'
import { formatIssue } from './issues.js'
import { validateRepo } from './repo.js'
import { cleanup, page, profile, repo } from './test-support.js'

afterEach(cleanup)

const messages = (root: string) => validateRepo(root).issues.map(formatIssue)

describe('validateRepo: contributors', () => {
  it('accepts a valid public contributor and marks it publishable', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile(),
      'contributors/test-one/page.md': page,
    })
    const r = validateRepo(root)
    expect(r.issues).toEqual([])
    expect(r.contributors).toHaveLength(1)
    expect(isPublishable(r.contributors[0]!)).toBe(true)
  })

  it('accepts a private template directory but never publishes it', () => {
    const root = repo({
      'contributors/_example/profile.yml': profile({ handle: '_example', page: 'private' }),
      'contributors/_example/page.md': page,
    })
    const r = validateRepo(root)
    expect(r.issues).toEqual([])
    expect(isPublishable(r.contributors[0]!)).toBe(false)
  })

  it('refuses a template directory that tries to go public', () => {
    const root = repo({
      'contributors/_example/profile.yml': profile({ handle: '_example', page: 'public' }),
      'contributors/_example/page.md': page,
    })
    expect(messages(root)).toContain(
      'contributors/_example/profile.yml:10 visibility.page: must stay "private" in a template directory.',
    )
    expect(validateRepo(root).contributors.some(isPublishable)).toBe(false)
  })

  it('names the file, line, field and a plain sentence for a bad date', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile({ joined: '12/01/2027' }),
      'contributors/test-one/page.md': page,
    })
    expect(messages(root)).toEqual([
      'contributors/test-one/profile.yml:4 joined: must be a date written as YYYY-MM-DD, for example 2027-01-12.',
    ])
  })

  it('names a misspelled field with its line', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile().replace('intro:', 'inrto:'),
      'contributors/test-one/page.md': page,
    })
    const out = messages(root)
    expect(out).toContain(
      'contributors/test-one/profile.yml:5 inrto: is not a field in profile.yml. Check the spelling.',
    )
    expect(out).toContain('contributors/test-one/profile.yml:1 intro: is required.')
  })

  it('requires the handle to match the directory name', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile({ handle: 'Test-One' }),
      'contributors/test-one/page.md': page,
    })
    expect(messages(root)).toEqual([
      'contributors/test-one/profile.yml:1 handle: must match the directory name exactly: "test-one".',
    ])
  })

  it('rejects an underscore inside a directory name', () => {
    const root = repo({
      'contributors/test_one/profile.yml': profile({ handle: 'test_one' }),
      'contributors/test_one/page.md': page,
    })
    expect(messages(root)[0]).toMatch(
      /^contributors\/test_one directory: the directory name may only contain/,
    )
  })

  it('flags a repeated skill with its line', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile({ secondSkill: 'Debugging' }),
      'contributors/test-one/page.md': page,
    })
    expect(messages(root)).toEqual([
      'contributors/test-one/profile.yml:8 skills_developing[1]: repeats "Debugging" from item 1. List each skill once.',
    ])
  })

  it('flags a public page that still has template text, and allows it on a private one', () => {
    const files = (visibility: string) => ({
      'contributors/test-one/profile.yml': profile({
        intro: 'Replace this with one or two sentences.',
        page: visibility,
      }),
      'contributors/test-one/page.md': '## Where I started\n\nReplace this paragraph.\n',
    })
    const pub = messages(repo(files('public')))
    expect(pub).toHaveLength(2)
    expect(pub[0]).toMatch(/^contributors\/test-one\/profile.yml:5 intro: still has the template text/)
    expect(pub[1]).toMatch(/^contributors\/test-one\/page.md:1 Where I started: still has the template text/)
    expect(messages(repo(files('private')))).toEqual([])
  })

  it('rejects files that do not belong in a contributor directory but allows tests', () => {
    const root = repo({
      'contributors/test-one/profile.yml': profile(),
      'contributors/test-one/page.md': page,
      'contributors/test-one/photo.png': 'x',
      'contributors/test-one/dates.test.ts': 'export {}',
    })
    const out = messages(root)
    expect(out).toHaveLength(1)
    expect(out[0]).toMatch(/^contributors\/test-one\/photo.png file: does not belong here/)
  })

  it('reports YAML that cannot be read, with a line', () => {
    const root = repo({
      'contributors/test-one/profile.yml': 'handle: test-one\nname: [unclosed\n',
      'contributors/test-one/page.md': page,
    })
    const issue = validateRepo(root).issues[0]
    expect(issue).toMatchObject({ file: 'contributors/test-one/profile.yml', field: '(file)' })
    expect(issue?.message).toMatch(/could not be read as YAML/)
  })
})
