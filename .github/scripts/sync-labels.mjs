// Creates or updates every label in .github/labels.json. Cohort labels are created by nest open-cohort.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const repo = process.env.GITHUB_REPOSITORY
const labels = JSON.parse(readFileSync(new URL('../labels.json', import.meta.url), 'utf8'))
for (const label of labels) {
  execFileSync(
    'gh',
    [
      'label',
      'create',
      label.name,
      '--repo',
      repo,
      '--color',
      label.color,
      '--description',
      label.description,
      '--force',
    ],
    { stdio: 'inherit' },
  )
}
console.log(`${labels.length} labels synced.`)
