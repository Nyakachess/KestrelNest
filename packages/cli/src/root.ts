import { existsSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { UsageError } from './args.js'

export type RepoConfig = {
  root: string
  /** owner/name on GitHub, from the root package.json repository field. */
  slug: string
  repoUrl: string
  /** Public origin of the site, from the root package.json homepage field, no trailing slash. */
  siteUrl: string
  /** The release string the feed reports: the root package.json version. */
  version: string
}

function looksLikeRoot(dir: string): boolean {
  return (
    existsSync(join(dir, 'package.json')) &&
    (existsSync(join(dir, 'contributors')) || existsSync(join(dir, 'packages', 'schema')))
  )
}

/** Walks up from start until it finds the repository root. */
export function findRoot(start: string = process.cwd()): string {
  let dir = resolve(start)
  for (;;) {
    if (looksLikeRoot(dir)) return dir
    const parent = dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  throw new UsageError(
    `Could not find the Nest repository from ${start}. Run this inside the repository or pass --root.`,
  )
}

export function readConfig(root: string): RepoConfig {
  const pkgPath = join(root, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8')) as {
    repository?: string | { url?: string }
    homepage?: string
    version?: string
  }
  const repository = typeof pkg.repository === 'string' ? pkg.repository : (pkg.repository?.url ?? '')
  const slug = repository
    .replace(/^github:/, '')
    .replace(/^git\+/, '')
    .replace(/^https?:\/\/github\.com\//, '')
    .replace(/\.git$/, '')
  if (!/^[^/\s]+\/[^/\s]+$/.test(slug)) {
    throw new UsageError(
      `package.json needs a repository field like "github:owner/name" (found "${repository}").`,
    )
  }
  return {
    root,
    slug,
    repoUrl: `https://github.com/${slug}`,
    siteUrl: (pkg.homepage ?? '').replace(/\/+$/, ''),
    version: pkg.version ?? '0.0.0',
  }
}
