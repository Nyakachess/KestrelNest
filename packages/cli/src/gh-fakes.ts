import { UsageError } from './args.js'
import type { Gh, IssueSpec, PrSpec } from './gh.js'

/** In-memory GitHub for tests. Reads answer from what was seeded or created. */
export class FakeGh implements Gh {
  issues: IssueSpec[] = []
  prs: PrSpec[] = []
  labels = new Set<string>()
  milestones = new Set<string>()
  calls: string[] = []
  private counter = 0

  constructor(seed: { issueTitles?: Record<string, string[]>; prBranches?: string[] } = {}) {
    for (const [assignee, titles] of Object.entries(seed.issueTitles ?? {})) {
      for (const title of titles) this.issues.push({ title, body: '', labels: [], assignee, milestone: '' })
    }
    for (const branch of seed.prBranches ?? [])
      this.prs.push({ handle: '', branch, title: '', body: '', paths: [] })
  }

  listIssueTitles(assignee: string): string[] {
    this.calls.push(`listIssueTitles ${assignee}`)
    return this.issues.filter((i) => i.assignee.toLowerCase() === assignee.toLowerCase()).map((i) => i.title)
  }

  findPr(branch: string): string | null {
    this.calls.push(`findPr ${branch}`)
    return this.prs.some((p) => p.branch === branch) ? `https://example.test/pr/${branch}` : null
  }

  ensureLabel(name: string): 'created' | 'exists' {
    this.calls.push(`ensureLabel ${name}`)
    if (this.labels.has(name)) return 'exists'
    this.labels.add(name)
    return 'created'
  }

  ensureMilestone(title: string): 'created' | 'exists' {
    this.calls.push(`ensureMilestone ${title}`)
    if (this.milestones.has(title)) return 'exists'
    this.milestones.add(title)
    return 'created'
  }

  createIssue(spec: IssueSpec): string {
    this.calls.push(`createIssue ${spec.title}`)
    this.issues.push(spec)
    return `https://example.test/issues/${++this.counter}`
  }

  createDraftPr(spec: PrSpec): string {
    this.calls.push(`createDraftPr ${spec.branch}`)
    this.prs.push(spec)
    return `https://example.test/pr/${spec.branch}`
  }
}

const NOT_INSTALLED = 'gh is not installed, so nothing can be created. Install GitHub CLI or drop --gh.'

/** Answers every read with "nothing exists" and refuses writes. Used for --dry-run without gh. */
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
}
