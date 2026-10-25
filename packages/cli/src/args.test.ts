import { describe, expect, it } from 'vitest'
import { parseArgs } from './args.js'

describe('parseArgs', () => {
  it('separates the command, positionals and flags', () => {
    const r = parseArgs(['scaffold', 'test-one', '--cohort', '2027-01', '--force', '--defect=2'])
    expect(r.command).toBe('scaffold')
    expect(r.positionals).toEqual(['test-one'])
    expect(r.flags).toEqual({ cohort: '2027-01', force: true, defect: '2' })
  })

  it('treats a flag before another flag as boolean', () => {
    expect(parseArgs(['open-cohort', '2027-01', '--gh', '--dry-run']).flags).toEqual({
      gh: true,
      'dry-run': true,
    })
  })

  it('handles no arguments', () => {
    expect(parseArgs([])).toEqual({ command: undefined, positionals: [], flags: {} })
  })
})
