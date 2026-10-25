// Comments once, ever, on each open Stage 1 issue older than a week whose assignee has no commits here.
import { execFileSync } from 'node:child_process'
import { NUDGE_AFTER_DAYS, NUDGE_MARKER, nudgeComment, selectNudges } from '../../packages/cli/dist/nudge.js'

const repo = process.env.GITHUB_REPOSITORY
if (!repo) {
  console.error('GITHUB_REPOSITORY is required.')
  process.exit(2)
}
const gh = (args, input) =>
  execFileSync('gh', args, {
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    ...(input === undefined ? {} : { input }),
  }).trim()
const repoUrl = `https://github.com/${repo}`

const open = JSON.parse(
  gh([
    'issue',
    'list',
    '--repo',
    repo,
    '--state',
    'open',
    '--label',
    'stage:1',
    '--limit',
    '200',
    '--json',
    'number,createdAt,assignees',
  ]),
)
const issues = open.map((i) => {
  const assignee = i.assignees?.[0]?.login ?? null
  const comments = gh([
    'api',
    `repos/${repo}/issues/${i.number}/comments?per_page=100`,
    '--paginate',
    '--jq',
    '.[].body',
  ])
  const commitCount = assignee
    ? Number(gh(['api', `search/commits?q=repo:${repo}+author:${assignee}`, '--jq', '.total_count']) || 0)
    : 0
  return {
    number: i.number,
    createdAt: i.createdAt,
    assignee,
    commitCount,
    nudged: comments.includes(NUDGE_MARKER),
  }
})

const due = selectNudges(issues, Date.now())
for (const issue of due) {
  gh(
    ['issue', 'comment', String(issue.number), '--repo', repo, '--body-file', '-'],
    nudgeComment(issue.assignee, repoUrl),
  )
  console.log(`Nudged #${issue.number} (@${issue.assignee})`)
}
console.log(`${open.length} open Stage 1 issue(s), ${due.length} nudged after ${NUDGE_AFTER_DAYS} days.`)
