// Upkeep of the personal stage issues (see packages/cli/src/stage-upkeep.ts):
//   1. assign each open, unassigned stage issue to its owner once they are a collaborator
//      (enrolment creates the issues while the invitation is pending, and GitHub drops an
//      assignee who has no access yet; Kestrel only reserves a ticket for the assignee);
//   2. with REFRESH_BLOCKS=true, put the current kestrel-ticket block from stages/ into
//      every open stage issue whose block differs (after a template change).
import { execFileSync } from 'node:child_process'
import { readdirSync, readFileSync } from 'node:fs'
import {
  handleFromTitle,
  issuesToAssign,
  refreshBody,
  renderBlock,
  stageOf,
  templateBlock,
} from '../../packages/cli/dist/stage-upkeep.js'

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

const issues = JSON.parse(
  gh([
    'issue',
    'list',
    '--repo',
    repo,
    '--state',
    'open',
    '--label',
    'onboarding',
    '--limit',
    '500',
    '--json',
    'number,title,body,labels,assignees',
  ]),
).map((i) => ({
  number: i.number,
  title: i.title,
  body: i.body ?? '',
  labels: i.labels.map((l) => l.name),
  assignees: i.assignees.map((a) => a.login),
}))

const known = new Map()
const isCollaborator = (handle) => {
  if (!known.has(handle)) {
    try {
      gh(['api', `repos/${repo}/collaborators/${handle}`])
      known.set(handle, true)
    } catch {
      known.set(handle, false) // 404: not a collaborator yet (the invitation is still pending)
    }
  }
  return known.get(handle)
}

for (const { number, handle } of issuesToAssign(issues, isCollaborator)) {
  gh(['issue', 'edit', String(number), '--repo', repo, '--add-assignee', handle])
  console.log(`Assigned #${number} to @${handle}`)
}

if (process.env.REFRESH_BLOCKS === 'true') {
  const templates = new Map()
  for (const name of readdirSync('stages').filter((n) => /^\d\d-.*\.md$/.test(n)))
    templates.set(Number(name.slice(0, 2)), templateBlock(readFileSync(`stages/${name}`, 'utf8')))
  for (const issue of issues) {
    const stage = stageOf(issue.labels)
    const handle = handleFromTitle(issue.title)
    const block = stage === null ? null : templates.get(stage)
    if (!block || !handle) continue
    const body = refreshBody(issue.body, renderBlock(block, { handle, repoUrl }))
    if (body === null) continue
    gh(['issue', 'edit', String(issue.number), '--repo', repo, '--body-file', '-'], body)
    console.log(`Refreshed the kestrel-ticket block on #${issue.number}`)
  }
}
