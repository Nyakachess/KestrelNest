export type IssueSpec = {
  title: string
  body: string
  labels: string[]
  assignee: string
  milestone?: string | undefined
}
export type PrSpec = {
  handle: string
  branch: string
  title: string
  body: string
  paths: string[]
  assignee?: string | undefined
}
export type FilePrSpec = { branch: string; title: string; body: string; files: Record<string, string> }
export type FilePrResult = { url: string; action: 'created' | 'updated' | 'unchanged' }
export type CollaboratorState = 'collaborator' | 'invited' | 'none'

/** Everything enroll, open-cohort and new-task need from GitHub. Synchronous on purpose: it is a CLI. */
export interface Gh {
  /** Titles of every issue, open or closed, assigned to the handle. */
  listIssueTitles(assignee: string): string[]
  /** URL of a pull request from the branch, open or closed, or null. */
  findPr(branch: string): string | null
  ensureLabel(name: string, color: string, description: string): 'created' | 'exists'
  ensureMilestone(title: string): 'created' | 'exists'
  /** Returns the issue URL. */
  createIssue(spec: IssueSpec): string
  /** Commits the paths on a new branch, pushes it, opens a draft PR and returns to the original branch. */
  createDraftPr(spec: PrSpec): string
  /** Makes the branch hold exactly these files on top of main, pushes it, and opens a PR if none exists. */
  upsertFilePr(spec: FilePrSpec): FilePrResult
  collaboratorState(handle: string): CollaboratorState
  inviteCollaborator(handle: string, permission: 'push'): void
}

export const LABEL_COLORS: Record<string, string> = {
  onboarding: '0E5450',
  stage: '569289',
  cohort: '9FD9CF',
  maintainers: 'B3401E',
}

/** The login GitHub gives pull requests and issues created with the workflow token. */
export const BOT_LOGIN = 'github-actions[bot]'
