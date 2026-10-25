import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'
import { UsageError } from './args.js'

export type IssueSpec = { title: string; body: string; labels: string[]; assignee: string; milestone: string }
export type PrSpec = { handle: string; branch: string; title: string; body: string; paths: string[] }

/** Everything open-cohort and new-task need from GitHub. Synchronous on purpose: it is a CLI. */
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
}

export const LABEL_COLORS: Record<string, string> = {
  onboarding: '0E5450',
  stage: '569289',
  cohort: '9FD9CF',
}

type Json = { title?: string; url?: string; name?: string }[]

/** The real thing, through the GitHub CLI. */
export class GhCli implements Gh {
  constructor(
    private readonly root: string,
    private readonly slug: string,
  ) {}

  static available(): boolean {
    try {
      execFileSync('gh', ['--version'], { stdio: 'ignore' })
      return true
    } catch {
      return false
    }
  }

  private gh(args: string[], input?: string): string {
    try {
      const opts: ExecFileSyncOptionsWithStringEncoding = {
        cwd: this.root,
        encoding: 'utf8',
        stdio: 'pipe',
        ...(input === undefined ? {} : { input }),
      }
      return execFileSync('gh', args, opts).trim()
    } catch (e) {
      const err = e as { stderr?: string; message: string }
      throw new UsageError(`gh ${args.slice(0, 2).join(' ')} failed: ${(err.stderr ?? err.message).trim()}`)
    }
  }

  private ghJson(args: string[]): Json {
    return JSON.parse(this.gh(args) || '[]') as Json
  }

  private git(args: string[]): string {
    return execFileSync('git', args, {
      cwd: this.root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim()
  }

  listIssueTitles(assignee: string): string[] {
    const args = [
      'issue',
      'list',
      '--repo',
      this.slug,
      '--assignee',
      assignee,
      '--state',
      'all',
      '--limit',
      '500',
      '--json',
      'title',
    ]
    return this.ghJson(args).map((i) => i.title ?? '')
  }

  findPr(branch: string): string | null {
    const args = [
      'pr',
      'list',
      '--repo',
      this.slug,
      '--head',
      branch,
      '--state',
      'all',
      '--limit',
      '1',
      '--json',
      'url',
    ]
    return this.ghJson(args)[0]?.url ?? null
  }

  ensureLabel(name: string, color: string, description: string): 'created' | 'exists' {
    const found = this.ghJson([
      'label',
      'list',
      '--repo',
      this.slug,
      '--search',
      name,
      '--limit',
      '100',
      '--json',
      'name',
    ])
    if (found.some((l) => l.name === name)) return 'exists'
    this.gh(['label', 'create', name, '--repo', this.slug, '--color', color, '--description', description])
    return 'created'
  }

  ensureMilestone(title: string): 'created' | 'exists' {
    const found = this.ghJson(['api', `repos/${this.slug}/milestones?state=all&per_page=100`])
    if (found.some((m) => m.title === title)) return 'exists'
    this.gh(['api', '-X', 'POST', `repos/${this.slug}/milestones`, '-f', `title=${title}`])
    return 'created'
  }

  createIssue(spec: IssueSpec): string {
    const args = [
      'issue',
      'create',
      '--repo',
      this.slug,
      '--title',
      spec.title,
      '--body-file',
      '-',
      '--assignee',
      spec.assignee,
      '--milestone',
      spec.milestone,
    ]
    for (const label of spec.labels) args.push('--label', label)
    return this.gh(args, spec.body)
  }

  createDraftPr(spec: PrSpec): string {
    if (this.git(['status', '--porcelain', '--', ...spec.paths.map((p) => `:!${p}`)]) !== '') {
      throw new UsageError(
        'The working tree has uncommitted changes. Commit or stash them before opening scaffold pull requests.',
      )
    }
    const original = this.git(['rev-parse', '--abbrev-ref', 'HEAD'])
    this.git(['checkout', '-b', spec.branch])
    try {
      this.git(['add', '--', ...spec.paths])
      this.git(['commit', '-m', `feat: scaffold for @${spec.handle}`])
      this.git(['push', '-u', 'origin', spec.branch])
      const args = [
        'pr',
        'create',
        '--repo',
        this.slug,
        '--draft',
        '--head',
        spec.branch,
        '--title',
        spec.title,
        '--body-file',
        '-',
      ]
      return this.gh(args, spec.body)
    } finally {
      this.git(['checkout', original])
    }
  }
}
