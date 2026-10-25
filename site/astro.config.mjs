import { readFileSync } from 'node:fs'
import { defineConfig } from 'astro/config'

// The public origin lives in the root package.json so the CLI, the feed and the site agree.
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))

export default defineConfig({
  site: pkg.homepage,
  output: 'static',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
})
