import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { GET } from '../pages/api/pages.json.ts'
import { ROOT } from './data'

const version = (JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8')) as { version: string }).version

describe('/api/pages.json', () => {
  it('serves JSON in the agreed shape with the root package version as the release', async () => {
    const res = GET({} as never) as Response
    expect(res.headers.get('content-type')).toContain('application/json')
    const text = await res.text()
    const feed = JSON.parse(text) as { generated_at: string; release: string; pages: unknown[] }
    expect(Object.keys(feed)).toEqual(['generated_at', 'release', 'pages'])
    expect(feed.release).toBe(version)
    expect(Array.isArray(feed.pages)).toBe(true)
    expect(new Date(feed.generated_at).toISOString()).toBe(feed.generated_at)
  })

  it('is exactly the empty feed while no page is published', async () => {
    const text = await (GET({} as never) as Response).text()
    const feed = JSON.parse(text) as { pages: unknown[] }
    if (feed.pages.length === 0) {
      expect(text.replace(/"generated_at": "[^"]+"/, '"generated_at": "T"')).toBe(
        `{\n  "generated_at": "T",\n  "release": "${version}",\n  "pages": []\n}\n`,
      )
    }
  })
})
