import { describe, expect, it } from 'vitest'
import { addCodeownersLine, addCohortMember, CODEOWNERS_SECTION } from './enroll-files.js'

const cohort =
  'id: 2027-01\nname: January 2027 cohort\nstarts: 2027-01-12\nends: 2027-04-30\nmembers:\n  - test-two\n  - test-one\n'

describe('addCohortMember', () => {
  it('adds the handle and sorts the list', () => {
    const r = addCohortMember(cohort, 'test-three')
    expect(r.changed).toBe(true)
    expect(r.text).toContain('members:\n  - test-one\n  - test-three\n  - test-two\n')
    expect(r.text).toContain('name: January 2027 cohort')
  })

  it('reports no change when the handle is already a member, whatever the case', () => {
    const r = addCohortMember('id: 2027-01\nmembers:\n  - test-one\n', 'Test-One')
    expect(r.changed).toBe(false)
    expect(r.text).toBe('id: 2027-01\nmembers:\n  - test-one\n')
  })

  it('starts a list when members is empty', () => {
    expect(addCohortMember('id: 2027-01\nmembers: []\n', 'test-one').text).toContain(
      'members:\n  - test-one\n',
    )
  })
})

describe('addCodeownersLine', () => {
  const header = '# Everything is reviewed by maintainers.\n* @Nyakachess\n'

  it('adds a sorted block at the end and keeps the header', () => {
    const first = addCodeownersLine(header, 'test-two')
    expect(first.changed).toBe(true)
    const second = addCodeownersLine(first.text, 'test-one')
    expect(second.text).toBe(
      `${header}\n${CODEOWNERS_SECTION}\n/contributors/test-one/ @test-one\n/contributors/test-two/ @test-two\n`,
    )
  })

  it('does not duplicate an existing line', () => {
    const once = addCodeownersLine(header, 'test-one')
    const again = addCodeownersLine(once.text, 'test-one')
    expect(again.changed).toBe(false)
    expect(again.text).toBe(once.text)
  })

  it('works on an empty file', () => {
    expect(addCodeownersLine('', 'test-one').text).toBe(
      `\n${CODEOWNERS_SECTION}\n/contributors/test-one/ @test-one\n`,
    )
  })
})
