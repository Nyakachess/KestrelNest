import { flagBool, flagString, parseArgs, UsageError } from './args.js'
import { runFeed } from './commands/feed.js'
import { runNewTask } from './commands/new-task.js'
import { openCohort, type OpenCohortMode } from './commands/open-cohort.js'
import { scaffold } from './commands/scaffold.js'
import { runValidate } from './commands/validate.js'
import { GhCli, type Gh } from './gh.js'
import { NullGh } from './gh-fakes.js'
import { CLI_VERSION } from './index.js'
import { consoleIo } from './io.js'
import { findRoot, readConfig } from './root.js'

const USAGE = `nest ${CLI_VERSION}

Usage: nest <command> [options]

  validate                         Check every contributor and cohort directory.
  scaffold <handle>                Create contributors/<handle>/ from the template.
      [--cohort <id>] [--defect <1-5|id|none>] [--force] [--template]
  new-task <stage> --handle <h>    Print the issue for a stage, or create it with --gh.
      [--cohort <id>] [--gh] [--dry-run]
  feed [--out <file>]              Print the pages feed, or write it to a file.
  open-cohort <id>                 Scaffold every member and open their stage issues.
      [--gh] [--dry-run]

Every command accepts --root <dir>. Without it the repository is found from the current directory.`

function ghFor(
  config: { root: string; slug: string },
  wantGh: boolean,
  dryRun: boolean,
  io = consoleIo,
): Gh | null {
  if (!wantGh && !dryRun) return null
  if (GhCli.available()) return new GhCli(config.root, config.slug)
  if (wantGh) throw new UsageError('GitHub CLI (gh) is not installed or not on PATH, so --gh cannot be used.')
  io.err('Note: gh is not installed, so this dry run assumes nothing exists on GitHub yet.')
  return new NullGh()
}

export function main(argv: readonly string[]): number {
  const { command, positionals, flags } = parseArgs(argv)
  const io = consoleIo
  if (command === undefined || command === 'help' || flagBool(flags, 'help')) {
    io.out(USAGE)
    return 0
  }
  if (command === '--version' || command === 'version' || flagBool(flags, 'version')) {
    io.out(`nest ${CLI_VERSION}`)
    return 0
  }
  const root = flagString(flags, 'root') ?? findRoot()
  const config = readConfig(root)
  const dryRun = flagBool(flags, 'dry-run')
  const wantGh = flagBool(flags, 'gh')

  switch (command) {
    case 'validate':
      return runValidate(config, io)
    case 'scaffold': {
      const handle = positionals[0]
      if (!handle) throw new UsageError('scaffold needs a handle: nest scaffold <handle>')
      const result = scaffold(config, {
        handle,
        cohort: flagString(flags, 'cohort'),
        defect: flagString(flags, 'defect'),
        template: flagBool(flags, 'template'),
        force: flagBool(flags, 'force'),
      })
      io.out(
        `Created contributors/${handle}/ with ${Object.keys(result.files).join(', ')} (cohort ${result.cohort}).`,
      )
      if (result.defect)
        io.out(`Planted defect ${result.defect.number}, ${result.defect.id}: ${result.defect.symptom}`)
      return 0
    }
    case 'new-task': {
      const stage = Number(positionals[0])
      const handle = flagString(flags, 'handle')
      if (!positionals[0] || !Number.isInteger(stage))
        throw new UsageError('new-task needs a stage number: nest new-task <1-7> --handle <handle>')
      if (!handle) throw new UsageError('new-task needs --handle <handle>.')
      return runNewTask(
        config,
        { stage, handle, cohort: flagString(flags, 'cohort'), dryRun },
        ghFor(config, wantGh, dryRun),
        io,
      )
    }
    case 'feed':
      return runFeed(config, { out: flagString(flags, 'out') }, io)
    case 'open-cohort': {
      const id = positionals[0]
      if (!id) throw new UsageError('open-cohort needs a cohort id: nest open-cohort <id>')
      const mode: OpenCohortMode = wantGh && !dryRun ? 'apply' : dryRun ? 'dry-run' : 'print'
      const gh = ghFor(config, wantGh, dryRun) ?? new NullGh()
      openCohort(config, { id, mode }, gh, io)
      return 0
    }
    default:
      throw new UsageError(`Unknown command "${command}". Run nest help to see the commands.`)
  }
}

try {
  process.exitCode = main(process.argv.slice(2))
} catch (e) {
  if (e instanceof UsageError) {
    console.error(e.message)
    process.exitCode = 2
  } else throw e
}
