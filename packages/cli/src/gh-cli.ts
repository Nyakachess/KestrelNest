import { execFileSync, type ExecFileSyncOptionsWithStringEncoding } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { UsageError } from './args.js'
import type { CollaboratorState, FilePrResult, FilePrSpec, Gh, IssueSpec, PrSpec } from './gh.js'

type Json = { title?: string; url?: string; name?: string; invitee?: { login?: string } }[]

/** The real thing, through the GitHub CLI and git. */
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
      throw new Error(`gh ${args.slice(0, 2).join(' ')} failed: ${(err.stderr ?? err.message).trim()}`)
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

  private requireCleanTree(except: string[]): void {
    if (this.git(['status', '--porcelain', '--', ...except.map((p) => `:!${p}`)]) !== '') {
      throw new UsageError(
        'The working tree has uncommitted changes. Commit or stash them before opening pull requests.',
      )
    }
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
    ]
    if (spec.milestone) args.push('--milestone', spec.milestone)
    for (const label of spec.labels) args.push('--label', label)
    return this.gh(args, spec.body)
  }

  createDraftPr(spec: PrSpec): string {
    this.requireCleanTree(spec.paths)
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
      if (spec.assignee) args.push('--assignee', spec.assignee)
      return this.gh(args, spec.body)
    } finally {
      this.git(['checkout', original])
    }
  }

  upsertFilePr(spec: FilePrSpec): FilePrResult {
    const paths = Object.keys(spec.files)
    this.requireCleanTree(paths)
    const original = this.git(['rev-parse', '--abbrev-ref', 'HEAD'])
    this.git(['fetch', 'origin', 'main'])
    this.git(['checkout', '-B', spec.branch, 'origin/main'])
    try {
      for (const [path, content] of Object.entries(spec.files)) {
        mkdirSync(dirname(join(this.root, path)), { recursive: true })
        writeFileSync(join(this.root, path), content)
      }
      this.git(['add', '--', ...paths])
      const existing = this.findPr(spec.branch)
      if (this.git(['status', '--porcelain', '--', ...paths]) === '') {
        return { url: existing ?? '', action: 'unchanged' }
      }
      this.git(['commit', '-m', spec.title])
      this.git(['push', '--force-with-lease', '-u', 'origin', spec.branch])
      if (existing) return { url: existing, action: 'updated' }
      const url = this.gh(
        [
          'pr',
          'create',
          '--repo',
          this.slug,
          '--head',
          spec.branch,
          '--title',
          spec.title,
          '--body-file',
          '-',
        ],
        spec.body,
      )
      return { url, action: 'created' }
    } finally {
      this.git(['checkout', original])
    }
  }

  collaboratorState(handle: string): CollaboratorState {
    try {
      this.gh(['api', `repos/${this.slug}/collaborators/${handle}`])
      return 'collaborator'
    } catch (e) {
      if (!/404|Not Found/i.test((e as Error).message)) throw e
    }
    const invited = this.ghJson(['api', `repos/${this.slug}/invitations?per_page=100`, '--paginate'])
    return invited.some((i) => i.invitee?.login?.toLowerCase() === handle.toLowerCase()) ? 'invited' : 'none'
  }

  inviteCollaborator(handle: string, permission: 'push'): void {
    this.gh([
      'api',
      '-X',
      'PUT',
      `repos/${this.slug}/collaborators/${handle}`,
      '-f',
      `permission=${permission}`,
    ])
  }
}
