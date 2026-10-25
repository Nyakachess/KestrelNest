import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { buildFeed, formatIssue, validateRepo } from '@nest/schema'
import type { Io } from '../io.js'
import type { RepoConfig } from '../root.js'

/** Prints the feed, or writes it with --out. Refuses to build a feed from a repository with problems. */
export function runFeed(config: RepoConfig, opts: { out?: string | undefined }, io: Io): number {
  const result = validateRepo(config.root)
  if (result.issues.length > 0) {
    for (const issue of result.issues) io.err(formatIssue(issue))
    io.err('The feed was not generated because the repository has problems. Fix them first.')
    return 1
  }
  const feed = buildFeed(result.contributors, { release: config.version, siteUrl: config.siteUrl })
  const json = `${JSON.stringify(feed, null, 2)}\n`
  if (opts.out) {
    const target = resolve(config.root, opts.out)
    writeFileSync(target, json)
    io.out(`Wrote ${feed.pages.length} page${feed.pages.length === 1 ? '' : 's'} to ${target}`)
  } else io.out(json.trimEnd())
  return 0
}
