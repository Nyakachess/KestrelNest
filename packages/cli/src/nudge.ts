/** Hidden marker that makes a nudge comment recognisable, so an issue is nudged once, ever. */
export const NUDGE_MARKER = '<!-- nest-nudge:stage-1 -->'

export const NUDGE_AFTER_DAYS = 7

export type StageOneIssue = {
  number: number
  createdAt: string
  assignee: string | null
  /** Commits in the repository by the assignee. */
  commitCount: number
  /** True when any comment already carries the marker. */
  nudged: boolean
}

/** The issues that get a nudge today: open for a week, an assignee with no commits, never nudged. */
export function selectNudges(
  issues: readonly StageOneIssue[],
  nowMs: number,
  days = NUDGE_AFTER_DAYS,
): StageOneIssue[] {
  const cutoff = nowMs - days * 24 * 60 * 60 * 1000
  return issues.filter(
    (i) => i.assignee !== null && !i.nudged && i.commitCount === 0 && Date.parse(i.createdAt) <= cutoff,
  )
}

export function nudgeComment(handle: string, repoUrl: string): string {
  return [
    NUDGE_MARKER,
    `Hello @${handle}. This Stage 1 issue has been open for a week with no commit from you yet, which usually means the first step is the sticking point.`,
    '',
    `1. Accept the collaborator invitation GitHub emailed you. If you cannot find the email, open ${repoUrl}/invitations or your GitHub notifications.`,
    `2. Then follow ${repoUrl}/blob/main/docs/DEVELOPMENT.md to clone, install and run the tests.`,
    '',
    'Stuck on either? Reply here with what you see. This is the only automatic reminder you will get.',
    '',
  ].join('\n')
}
