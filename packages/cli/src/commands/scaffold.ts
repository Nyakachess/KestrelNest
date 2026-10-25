import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CONTRIBUTORS_DIR, explainHandle, isTemplateDir, listCohortIds, validateCohort } from '@nest/schema'
import { UsageError } from '../args.js'
import { BANK, defectByNumberOrId, pickDefect, type Defect } from '../defects.js'
import { NO_COHORT } from '../issue-body.js'
import type { RepoConfig } from '../root.js'
import { defaultPlan, renderAll, type ScaffoldFiles } from '../templates.js'

export type ScaffoldOptions = {
  handle: string
  /** A cohort id, "none" for an individual joiner, or omitted to use the only cohort. */
  cohort?: string | undefined
  /** A defect number or id, or "none". Omitted: chosen from the handle. */
  defect?: string | undefined
  /** Allow an underscore name and force the page private: the repository's own template. */
  template?: boolean | undefined
  force?: boolean | undefined
  /** YYYY-MM-DD used when the cohort has no start date. Defaults to today. */
  today?: string | undefined
}

export type ScaffoldResult = {
  dir: string
  files: ScaffoldFiles
  defect: Defect | null
  /** The cohort id, or null for an individual joiner. */
  cohort: string | null
}

function resolveCohort(
  config: RepoConfig,
  wanted: string | undefined,
): { id: string | null; starts: string | undefined } {
  if (wanted === NO_COHORT) return { id: null, starts: undefined }
  const ids = listCohortIds(config.root)
  if (wanted === undefined) {
    if (ids.length === 1) wanted = ids[0]
    else if (ids.length === 0)
      throw new UsageError(
        'No cohort exists yet. Pass --cohort <id>, for example --cohort 2027-01, or --cohort none.',
      )
    else throw new UsageError(`Several cohorts exist (${ids.join(', ')}). Pass --cohort <id>.`)
  }
  const id = wanted as string
  if (!ids.includes(id)) return { id, starts: undefined }
  return { id, starts: validateCohort(config.root, id).cohort?.starts }
}

/** Builds the files for a contributor directory without touching the disk. */
export function planScaffold(config: RepoConfig, opts: ScaffoldOptions): ScaffoldResult {
  const { handle } = opts
  const template = opts.template === true
  if (template) {
    if (!isTemplateDir(handle))
      throw new UsageError('A template directory name must start with an underscore, for example _example.')
  } else {
    const why = explainHandle(handle)
    if (why) throw new UsageError(`The handle ${why}`)
  }
  const cohort = resolveCohort(config, opts.cohort)
  const joined = cohort.starts ?? opts.today ?? new Date().toISOString().slice(0, 10)
  const plan = defaultPlan(handle, cohort.id, joined)

  let defect: Defect | null = null
  if (template || opts.defect === 'none') defect = null
  else if (opts.defect === undefined) defect = pickDefect(handle, cohort.id === null)
  else {
    defect = defectByNumberOrId(opts.defect) ?? null
    if (!defect)
      throw new UsageError(`Unknown defect "${opts.defect}". Use 1 to ${BANK.length}, an id, or none.`)
  }
  if (defect) defect.apply(plan)

  return {
    dir: join(config.root, CONTRIBUTORS_DIR, handle),
    files: renderAll(plan, config.repoUrl),
    defect,
    cohort: cohort.id,
  }
}

/** Writes the contributor directory. Refuses to overwrite unless force is set. */
export function scaffold(config: RepoConfig, opts: ScaffoldOptions): ScaffoldResult {
  const result = planScaffold(config, opts)
  if (existsSync(result.dir) && !opts.force) {
    throw new UsageError(`contributors/${opts.handle}/ already exists. Pass --force to overwrite its files.`)
  }
  mkdirSync(result.dir, { recursive: true })
  for (const [name, content] of Object.entries(result.files)) writeFileSync(join(result.dir, name), content)
  return result
}
