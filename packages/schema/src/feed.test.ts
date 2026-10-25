import { afterEach, describe, expect, it } from 'vitest'
import { buildFeed, pageUrl } from './feed.js'
import { validateRepo } from './repo.js'
import { cleanup, page, profile, repo } from './test-support.js'

afterEach(cleanup)

describe('buildFeed', () => {
  it('produces the agreed empty shape', () => {
    const feed = buildFeed([], {
      release: '0.1.0',
      siteUrl: 'https://nest.example.test',
      generatedAt: '2027-01-01T00:00:00.000Z',
    })
    expect(JSON.stringify(feed)).toBe(
      '{"generated_at":"2027-01-01T00:00:00.000Z","release":"0.1.0","pages":[]}',
    )
  })

  it('lists only publishable pages, sorted by handle, with counts and a page url', () => {
    const root = repo({
      'contributors/test-two/profile.yml': profile({ handle: 'test-two', name: 'Test Two' }),
      'contributors/test-two/page.md': page,
      'contributors/test-one/profile.yml': profile(),
      'contributors/test-one/page.md': page,
      'contributors/test-one/.practice.json': JSON.stringify({
        updated_at: '2027-02-01T00:00:00Z',
        practice: 4,
        shared: 1,
        stages_done: [1, 2, 3],
      }),
      'contributors/test-three/profile.yml': profile({ handle: 'test-three', page: 'private' }),
      'contributors/test-three/page.md': page,
      'contributors/_example/profile.yml': profile({ handle: '_example', page: 'private' }),
      'contributors/_example/page.md': page,
    })
    const r = validateRepo(root)
    expect(r.issues).toEqual([])
    const feed = buildFeed(r.contributors, { release: '0.1.0', siteUrl: 'https://nest.example.test/' })
    expect(feed.pages.map((p) => p.handle)).toEqual(['test-one', 'test-two'])
    expect(feed.pages[0]).toEqual({
      handle: 'test-one',
      name: 'Test One',
      intro: 'Fixture text, not a real contributor.',
      cohort: '2027-01',
      stage: 3,
      counts: { external: 0, shared: 1, practice: 4 },
      url: 'https://nest.example.test/p/test-one/',
    })
    expect(pageUrl('https://x.test', 'a')).toBe('https://x.test/p/a/')
  })
})
