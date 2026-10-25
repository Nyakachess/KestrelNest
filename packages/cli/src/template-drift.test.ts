import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { planScaffold } from './commands/scaffold.js'
import { readConfig } from './root.js'
import { REAL_ROOT } from './test-support.js'

/**
 * contributors/_example/ is generated from the scaffold, never edited by hand. This test fails
 * when the two drift apart, so a template change is always followed by regenerating the example.
 */
describe('contributors/_example', () => {
  it('matches what the scaffold produces today', () => {
    const config = readConfig(REAL_ROOT)
    const plan = planScaffold(config, {
      handle: '_example',
      template: true,
      cohort: '2027-01',
      today: '2027-01-12',
    })
    for (const [name, content] of Object.entries(plan.files)) {
      expect(readFileSync(join(REAL_ROOT, 'contributors', '_example', name), 'utf8'), name).toBe(content)
    }
  })
})
