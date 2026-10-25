import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { stageByNumber, type Stage } from '@nest/schema'
import { UsageError } from './args.js'
import type { RepoConfig } from './root.js'

export const STAGES_DIR = 'stages'

export type IssueVars = {
  handle: string
  name?: string | undefined
  cohort: string
}

export type RenderedIssue = {
  stage: Stage
  title: string
  body: string
  labels: string[]
}

/** The title every personal stage issue gets. open-cohort uses it to spot issues that already exist. */
export function issueTitle(stage: Stage, handle: string): string {
  return `Stage ${stage.number}: ${stage.title} (@${handle})`
}

export function stageLabels(stage: Stage, cohort: string): string[] {
  return ['onboarding', `cohort:${cohort}`, `stage:${stage.number}`]
}

/** Finds stages/0N-*.md for a stage number. */
export function stageFile(root: string, n: number): string {
  const dir = join(root, STAGES_DIR)
  if (!existsSync(dir)) throw new UsageError(`The ${STAGES_DIR}/ directory is missing.`)
  const prefix = `${String(n).padStart(2, '0')}-`
  const file = readdirSync(dir).find((f) => f.startsWith(prefix) && f.endsWith('.md'))
  if (!file)
    throw new UsageError(`No issue body for stage ${n} in ${STAGES_DIR}/ (expected ${prefix}<slug>.md).`)
  return join(dir, file)
}

export function fillTemplate(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key: string) => vars[key] ?? match)
}

export function renderIssue(config: RepoConfig, stageNumber: number, vars: IssueVars): RenderedIssue {
  const stage = stageByNumber(stageNumber)
  if (!stage) throw new UsageError(`Stage must be a number from 1 to 7, not "${stageNumber}".`)
  const template = readFileSync(stageFile(config.root, stage.number), 'utf8')
  const body = fillTemplate(template, {
    handle: vars.handle,
    name: vars.name ?? `@${vars.handle}`,
    cohort: vars.cohort,
    repo: config.slug,
    repo_url: config.repoUrl,
    site: config.siteUrl,
    stage_title: stage.title,
    stage_number: String(stage.number),
  })
  return { stage, title: issueTitle(stage, vars.handle), body, labels: stageLabels(stage, vars.cohort) }
}
