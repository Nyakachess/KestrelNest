import { describe, expect, it } from 'vitest'
import { initials, isPlaceholder, ProfileSchema } from './profile.js'

const valid = {
  handle: 'test-one',
  name: 'Test One',
  cohort: '2027-01',
  joined: '2027-01-12',
  intro: 'Fixture text, not a real contributor.',
  skills_developing: ['debugging'],
  visibility: { page: 'public' },
}

describe('ProfileSchema', () => {
  it('accepts a minimal valid profile and fills defaults', () => {
    const r = ProfileSchema.safeParse(valid)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.projects).toEqual([])
  })

  it('rejects an unknown field', () => {
    const r = ProfileSchema.safeParse({ ...valid, nmae: 'typo' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.code).toBe('unrecognized_keys')
  })

  it('rejects a badly formatted date', () => {
    expect(ProfileSchema.safeParse({ ...valid, joined: '12/01/2027' }).success).toBe(false)
  })

  it('rejects a visibility other than public or private', () => {
    expect(ProfileSchema.safeParse({ ...valid, visibility: { page: 'yes' } }).success).toBe(false)
  })

  it('rejects a project without a full URL', () => {
    const r = ProfileSchema.safeParse({
      ...valid,
      projects: [{ title: 'Fix', repo: 'a/b', url: 'github.com/a/b/pull/1', merged: '2027-02-01' }],
    })
    expect(r.success).toBe(false)
  })
})

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Test One')).toBe('TO')
    expect(initials('  single ')).toBe('S')
    expect(initials('a b c')).toBe('AB')
  })
})

describe('isPlaceholder', () => {
  it('matches the scaffold text only', () => {
    expect(isPlaceholder('Replace this with one or two sentences.')).toBe(true)
    expect(isPlaceholder('I replaced this already.')).toBe(false)
  })
})
