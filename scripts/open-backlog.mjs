#!/usr/bin/env node
// Opens every issue in docs/backlog-seed.md as a good-shared-issue. Dry run unless --gh is given.
// Usage: node scripts/open-backlog.mjs [--gh] [--repo owner/name]
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const args = process.argv.slice(2)
const apply = args.includes('--gh')
const repoFlag = args.indexOf('--repo')
const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
const repo = repoFlag >= 0 ? args[repoFlag + 1] : pkg.repository.replace(/^github:/, '')

const text = readFileSync(new URL('../docs/backlog-seed.md', import.meta.url), 'utf8')
const issues = []
let current = null
for (const line of text.split('\n')) {
  const m = /^## (.+)$/.exec(line)
  if (m) {
    if (current) issues.push(current)
    current = { title: m[1].trim(), body: [] }
    continue
  }
  if (current) current.body.push(line.replace(/^### /, '## '))
}
if (current) issues.push(current)

if (issues.length === 0) {
  console.error('No issues found under level-two headings in docs/backlog-seed.md.')
  process.exit(2)
}

const existing = apply
  ? JSON.parse(
      execFileSync(
        'gh',
        ['issue', 'list', '--repo', repo, '--state', 'all', '--limit', '500', '--json', 'title'],
        { encoding: 'utf8' },
      ),
    ).map((i) => i.title.toLowerCase())
  : []

let created = 0
for (const issue of issues) {
  const body = issue.body.join('\n').trim() + '\n'
  if (existing.includes(issue.title.toLowerCase())) {
    console.log(`Skipped (exists): ${issue.title}`)
    continue
  }
  if (!apply) {
    console.log(`Would create: ${issue.title} (${body.length} characters, label good-shared-issue)`)
    continue
  }
  const url = execFileSync(
    'gh',
    [
      'issue',
      'create',
      '--repo',
      repo,
      '--title',
      issue.title,
      '--label',
      'good-shared-issue',
      '--body-file',
      '-',
    ],
    { input: body, encoding: 'utf8' },
  ).trim()
  console.log(`Created ${url}: ${issue.title}`)
  created += 1
}
console.log(
  apply
    ? `${created} issue(s) created in ${repo}.`
    : `${issues.length} issue(s) would be created in ${repo}. Add --gh to create them.`,
)
