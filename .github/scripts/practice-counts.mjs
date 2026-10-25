// Computes .practice.json for every contributor directory from merged pull requests and
// closed onboarding issues. The only GitHub calls in the project happen here, in a workflow.
import { execFileSync } from 'node:child_process'
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { computePractice, writePracticeFile } from '../../packages/cli/dist/practice.js'

const repo = process.env.GITHUB_REPOSITORY
if (!repo) {
  console.error('GITHUB_REPOSITORY is required.')
  process.exit(2)
}
const root = process.cwd()
const gh = (args) => execFileSync('gh', ['api', ...args], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
const rows = (text) =>
  text
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line))

const prs = rows(
  gh([
    `repos/${repo}/pulls?state=closed&per_page=100`,
    '--paginate',
    '--jq',
    '.[] | select(.merged_at != null) | {number: .number, author: .user.login, mergedAt: .merged_at}',
  ]),
)
for (const pr of prs) {
  pr.files = gh([`repos/${repo}/pulls/${pr.number}/files?per_page=100`, '--paginate', '--jq', '.[].filename'])
    .split('\n')
    .filter(Boolean)
}
const issues = rows(
  gh([
    `repos/${repo}/issues?state=closed&labels=onboarding&per_page=100`,
    '--paginate',
    '--jq',
    '.[] | select(.pull_request == null) | {assignees: [.assignees[].login], labels: [.labels[].name]}',
  ]),
)
console.log(`${prs.length} merged pull request(s), ${issues.length} closed onboarding issue(s).`)

const now = new Date().toISOString()
const dirs = readdirSync(join(root, 'contributors')).filter(
  (d) => !d.startsWith('_') && statSync(join(root, 'contributors', d)).isDirectory(),
)
let written = 0
for (const handle of dirs) {
  const practice = computePractice(handle, prs, issues, now)
  const status = writePracticeFile(root, handle, practice)
  if (status === 'written') written += 1
  console.log(
    `${handle}: practice ${practice.practice}, shared ${practice.shared}, stages ${practice.stages_done.join(',') || 'none'} (${status})`,
  )
}
console.log(`${written} file(s) written for ${dirs.length} contributor(s).`)
