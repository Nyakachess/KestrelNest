import { UsageError } from './args.js'
import type { CollaboratorState, FilePrResult, FilePrSpec, Gh, IssueSpec, PrSpec } from './gh.js'

type Method = keyof Gh

/** In-memory GitHub for tests. Reads answer from what was seeded or created. */
export class FakeGh implements Gh {
  issues: IssueSpec[] = []
  prs: PrSpec[] = []
  filePrs = new Map<string, FilePrSpec>()
  labels = new Set<string>()
  milestones = new Set<string>()
  collaborators = new Set<string>()
  invitations = new Set<string>()
  calls: string[] = []
  private counter = 0
  private failures = new Map<Method, number>()

  constructor(
    seed: {
      issueTitles?: Record<string, string[]>
      prBranches?: string[]
      collaborators?: string[]
      invited?: string[]
    } = {},
  ) {
    for (const [assignee, titles] of Object.entries(seed.issueTitles ?? {})) {
      for (const title of titles) this.issues.push({ title, body: '', labels: [], assignee })
    }
    for (const branch of seed.prBranches ?? [])
      this.prs.push({ handle: '', branch, title: '', body: '', paths: [] })
    for (const c of seed.collaborators ?? []) this.collaborators.add(c.toLowerCase())
    for (const i of seed.invited ?? []) this.invitations.add(i.toLowerCase())
  }

  /** Make the next n calls of a method throw, then succeed. */
  failNext(method: Method, times: number): void {
    this.failures.set(method, times)
  }

  private record(method: Method, detail: string): void {
    this.calls.push(`${method} ${detail}`.trim())
    const left = this.failures.get(method) ?? 0
    if (left > 0) {
      this.failures.set(method, left - 1)
      throw new Error(`fake ${method} failure (${left} left)`)
    }
  }

  listIssueTitles(assignee: string): string[] {
    this.record('listIssueTitles', assignee)
    return this.issues.filter((i) => i.assignee.toLowerCase() === assignee.toLowerCase()).map((i) => i.title)
  }

  findPr(branch: string): string | null {
    this.record('findPr', branch)
    if (this.prs.some((p) => p.branch === branch) || this.filePrs.has(branch))
      return `https://example.test/pr/${branch}`
    return null
  }

  ensureLabel(name: string): 'created' | 'exists' {
    this.record('ensureLabel', name)
    if (this.labels.has(name)) return 'exists'
    this.labels.add(name)
    return 'created'
  }

  ensureMilestone(title: string): 'created' | 'exists' {
    this.record('ensureMilestone', title)
    if (this.milestones.has(title)) return 'exists'
    this.milestones.add(title)
    return 'created'
  }

  createIssue(spec: IssueSpec): string {
    this.record('createIssue', spec.title)
    this.issues.push(spec)
    return `https://example.test/issues/${++this.counter}`
  }

  createDraftPr(spec: PrSpec): string {
    this.record('createDraftPr', spec.branch)
    this.prs.push(spec)
    return `https://example.test/pr/${spec.branch}`
  }

  upsertFilePr(spec: FilePrSpec): FilePrResult {
    this.record('upsertFilePr', spec.branch)
    const existing = this.filePrs.get(spec.branch)
    this.filePrs.set(spec.branch, spec)
    const url = `https://example.test/pr/${spec.branch}`
    if (!existing) return { url, action: 'created' }
    return {
      url,
      action: JSON.stringify(existing.files) === JSON.stringify(spec.files) ? 'unchanged' : 'updated',
    }
  }

  collaboratorState(handle: string): CollaboratorState {
    this.record('collaboratorState', handle)
    const h = handle.toLowerCase()
    return this.collaborators.has(h) ? 'collaborator' : this.invitations.has(h) ? 'invited' : 'none'
  }

  inviteCollaborator(handle: string): void {
    this.record('inviteCollaborator', handle)
    this.invitations.add(handle.toLowerCase())
  }
}

const NOT_INSTALLED = 'gh is not installed, so nothing can be created. Install GitHub CLI or drop --gh.'

/** Answers every read with "nothing exists" and refuses writes. Used for dry runs and print mode. */
export class NullGh implements Gh {
  listIssueTitles(): string[] {
    return []
  }
  findPr(): null {
    return null
  }
  ensureLabel(): 'created' {
    return 'created'
  }
  ensureMilestone(): 'created' {
    return 'created'
  }
  createIssue(): never {
    throw new UsageError(NOT_INSTALLED)
  }
  createDraftPr(): never {
    throw new UsageError(NOT_INSTALLED)
  }
  upsertFilePr(): never {
    throw new UsageError(NOT_INSTALLED)
  }
  collaboratorState(): CollaboratorState {
    return 'none'
  }
  inviteCollaborator(): never {
    throw new UsageError(NOT_INSTALLED)
  }
}
