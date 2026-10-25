import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../', import.meta.url))
const read = (p: string) => readFileSync(join(ROOT, p), 'utf8')
const version = (JSON.parse(read('package.json')) as { version: string }).version

describe('release', () => {
  it('uses one version everywhere', () => {
    for (const pkg of ['packages/schema/package.json', 'packages/cli/package.json', 'site/package.json']) {
      expect((JSON.parse(read(pkg)) as { version: string }).version, pkg).toBe(version)
    }
    expect(read('packages/schema/src/index.ts')).toContain(`SCHEMA_VERSION = '${version}'`)
    expect(read('packages/cli/src/index.ts')).toContain(`CLI_VERSION = '${version}'`)
    const cli = JSON.parse(read('packages/cli/package.json')) as { dependencies: Record<string, string> }
    expect(cli.dependencies['@nest/schema']).toBe(version)
  })

  it('has a dated changelog entry for the current version', () => {
    const heading = read('CHANGELOG.md')
      .split('\n')
      .find((line) => line.startsWith(`## ${version}, `))
    expect(heading, `## ${version}, YYYY-MM-DD`).toBeDefined()
    expect(heading ?? '').toMatch(
      new RegExp('^## ' + version.split('.').join('[.]') + ', [0-9]{4}-[0-9]{2}-[0-9]{2}$'),
    )
  })
})
