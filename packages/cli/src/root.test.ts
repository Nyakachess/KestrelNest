import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { readConfig } from './root.js'

function repoWith(repository: string): string {
  const root = mkdtempSync(join(tmpdir(), 'nest-root-'))
  writeFileSync(
    join(root, 'package.json'),
    JSON.stringify({ repository, homepage: 'https://nest.example.org/' }),
  )
  return root
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('readConfig', () => {
  it('names the repository from package.json outside GitHub Actions', () => {
    vi.stubEnv('GITHUB_REPOSITORY', '')
    const c = readConfig(repoWith('github:kestrel-collective/nest'))
    expect(c.slug).toBe('kestrel-collective/nest')
    expect(c.repoUrl).toBe('https://github.com/kestrel-collective/nest')
    expect(c.siteUrl).toBe('https://nest.example.org')
  })

  it('uses the repository a workflow runs in, so a fork acts on itself', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'someone/nest-dev')
    const c = readConfig(repoWith('github:kestrel-collective/nest'))
    expect(c.slug).toBe('someone/nest-dev')
    expect(c.repoUrl).toBe('https://github.com/someone/nest-dev')
  })

  it('ignores a malformed GITHUB_REPOSITORY', () => {
    vi.stubEnv('GITHUB_REPOSITORY', 'not a slug')
    expect(readConfig(repoWith('github:kestrel-collective/nest')).slug).toBe('kestrel-collective/nest')
  })
})
