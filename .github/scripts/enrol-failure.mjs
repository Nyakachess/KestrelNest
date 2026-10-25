// report: open or update the issue "Enrolment failed for @<handle>", labelled maintainers.
// close: close that issue after a later run for the same handle succeeded.
import { execFileSync } from 'node:child_process'

const [action] = process.argv.slice(2)
const { HANDLE, COHORT, RUN_URL, GITHUB_REPOSITORY: repo } = process.env
if (!action || !HANDLE || !repo) {
  console.error('Usage: enrol-failure.mjs report|close, with HANDLE, GITHUB_REPOSITORY and RUN_URL set.')
  process.exit(2)
}
const gh = (args, input) =>
  execFileSync('gh', args, { encoding: 'utf8', ...(input === undefined ? {} : { input }) }).trim()
const title = `Enrolment failed for @${HANDLE}`
const open = JSON.parse(
  gh([
    'issue',
    'list',
    '--repo',
    repo,
    '--state',
    'open',
    '--label',
    'maintainers',
    '--limit',
    '100',
    '--json',
    'number,title',
  ]),
).filter((i) => i.title === title)

if (action === 'report') {
  const body = [
    `Enrolment for @${HANDLE} (cohort ${COHORT ?? 'none'}) failed.`,
    '',
    `Job log: ${RUN_URL}`,
    '',
    'Every step of enrolment is idempotent. Once the cause is fixed, run the Enrol workflow again for the same handle from the Actions tab; it performs only what is still missing and closes this issue when it succeeds.',
    '',
  ].join('\n')
  if (open.length > 0) {
    gh(
      ['issue', 'comment', String(open[0].number), '--repo', repo, '--body-file', '-'],
      `Failed again.\n\n${body}`,
    )
    console.log(`Updated #${open[0].number}`)
  } else {
    gh([
      'label',
      'create',
      'maintainers',
      '--repo',
      repo,
      '--color',
      'B3401E',
      '--description',
      'Needs a maintainer',
      '--force',
    ])
    const url = gh(
      ['issue', 'create', '--repo', repo, '--title', title, '--label', 'maintainers', '--body-file', '-'],
      body,
    )
    console.log(`Opened ${url}`)
  }
} else if (action === 'close') {
  for (const issue of open) {
    gh([
      'issue',
      'close',
      String(issue.number),
      '--repo',
      repo,
      '--comment',
      `A later run for @${HANDLE} succeeded: ${RUN_URL}`,
    ])
    console.log(`Closed #${issue.number}`)
  }
  if (open.length === 0) console.log('No failure issue to close.')
} else {
  console.error(`Unknown action "${action}".`)
  process.exit(2)
}
