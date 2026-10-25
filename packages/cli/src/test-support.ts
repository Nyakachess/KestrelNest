import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readConfig, type RepoConfig } from './root.js'

const roots: string[] = []

/** The real repository root, so tests can borrow its stage files. */
export const REAL_ROOT = fileURLToPath(new URL('../../../', import.meta.url))

export const COHORT_YML = [
  'id: 2027-01',
  'name: January 2027 cohort',
  'starts: 2027-01-12',
  'ends: 2027-04-30',
  'members:',
  '  - test-one',
  '  - test-two',
  '',
].join('\n')

/** A throwaway repository: package.json, the real stage files, one cohort, and any extra files. */
export function tempRepo(files: Record<string, string> = {}, opts: { cohort?: boolean } = {}): RepoConfig {
  const root = mkdtempSync(join(tmpdir(), 'nest-cli-'))
  roots.push(root)
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({
      name: 'fixture',
      version: '0.1.0',
      repository: 'github:example-org/nest',
      homepage: 'https://nest.example.test',
    }),
  )
  cpSync(join(REAL_ROOT, 'stages'), join(root, 'stages'), { recursive: true })
  mkdirSync(join(root, 'contributors'), { recursive: true })
  if (opts.cohort !== false) {
    mkdirSync(join(root, 'cohorts', '2027-01'), { recursive: true })
    writeFileSync(join(root, 'cohorts', '2027-01', 'cohort.yml'), COHORT_YML)
  }
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  return readConfig(root)
}

export function cleanup(): void {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
}
