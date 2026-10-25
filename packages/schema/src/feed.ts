import { isPublishable, type Contributor } from './contributor.js'
import { stagesDone } from './practice.js'

/** One published page as the landing site reads it. Field names are a contract: do not rename. */
export type NestFeedPage = {
  handle: string
  name: string
  intro: string
  cohort: string
  /** Number of stages completed, 0 to 7. */
  stage: number
  counts: { external: number; shared: number; practice: number }
  url: string
}

export type NestFeed = {
  generated_at: string
  release: string
  pages: NestFeedPage[]
}

export const FEED_PATH = '/api/pages.json'

export function pageUrl(siteUrl: string, handle: string): string {
  return `${siteUrl.replace(/\/+$/, '')}/p/${handle}/`
}

/** Builds the feed from already validated contributors. Only publishable pages appear, sorted by handle. */
export function buildFeed(
  contributors: readonly Contributor[],
  opts: { release: string; siteUrl: string; generatedAt?: string },
): NestFeed {
  const pages = contributors
    .filter(isPublishable)
    .sort((a, b) => a.handle.localeCompare(b.handle))
    .map((c) => ({
      handle: c.handle,
      name: c.profile.name,
      intro: c.profile.intro,
      cohort: c.profile.cohort,
      stage: stagesDone(c.practice),
      counts: {
        external: c.profile.projects.length,
        shared: c.practice.shared,
        practice: c.practice.practice,
      },
      url: pageUrl(opts.siteUrl, c.handle),
    }))
  return { generated_at: opts.generatedAt ?? new Date().toISOString(), release: opts.release, pages }
}
