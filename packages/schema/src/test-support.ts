import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const roots: string[] = []

/** Writes the given files into a fresh temp directory and returns its path. */
export function repo(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'nest-schema-'))
  roots.push(root)
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true })
    writeFileSync(join(root, path), content)
  }
  return root
}

export function cleanup(): void {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true })
}

/** A valid profile.yml for a clearly fake handle, with optional overrides. */
export const profile = (overrides: Record<string, string> = {}): string =>
  [
    `handle: ${overrides.handle ?? 'test-one'}`,
    `name: ${overrides.name ?? 'Test One'}`,
    `cohort: ${overrides.cohort ?? '2027-01'}`,
    `joined: ${overrides.joined ?? '2027-01-12'}`,
    `intro: ${overrides.intro ?? 'Fixture text, not a real contributor.'}`,
    'skills_developing:',
    '  - debugging',
    `  - ${overrides.secondSkill ?? 'pytest'}`,
    'visibility:',
    `  page: ${overrides.page ?? 'public'}`,
    '',
  ].join('\n')

export const page = '## Where I started\n\nA real sentence.\n'

export const cohortYml = (members: string[], id = '2027-01'): string =>
  [
    `id: ${id}`,
    'name: January 2027 cohort',
    'starts: 2027-01-12',
    'ends: 2027-04-30',
    members.length === 0 ? 'members: []' : 'members:',
    ...members.map((m) => `  - ${m}`),
    '',
  ].join('\n')
