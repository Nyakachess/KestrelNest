import { DEFECTS } from '../defects.js'
import { importCandidates } from '../defect-bank/candidates.js'
import { readRunnerOutput } from '../defect-bank/request.js'
import type { Io } from '../io.js'
import type { RepoConfig } from '../root.js'

/** Writes the runner's acceptable outputs as candidates and says why the rest were refused. */
export function runDefectImport(
  config: RepoConfig,
  file: string,
  io: Io,
  bankIds?: readonly string[],
): number {
  const rows = readRunnerOutput(file)
  const result = importCandidates(config.root, rows, bankIds ?? DEFECTS.map((d) => d.id))
  for (const id of result.written) io.out(`Candidate ${id} written to packages/cli/src/defects/candidates/.`)
  for (const r of result.refused) io.err(`Request ${r.request} refused: ${r.problems.join('; ')}.`)
  io.out(
    `Imported ${result.written.length} of ${rows.length}; ${result.refused.length} refused. Run nest defect-check --all next.`,
  )
  return 0
}
