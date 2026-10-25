import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { UsageError } from '../args.js'
import { candidateIds } from '../defect-bank/candidates.js'
import { checkCandidate, recordChecks, type CheckOutcome } from '../defect-bank/check.js'
import { CANDIDATES_DIR } from '../defect-bank/request.js'
import type { Io } from '../io.js'
import type { RepoConfig } from '../root.js'

export type DefectCheckOptions = { id?: string | undefined; all?: boolean | undefined }

/** Runs the gate on one candidate or all of them and writes the results into the README table. */
export async function runDefectCheck(config: RepoConfig, opts: DefectCheckOptions, io: Io): Promise<number> {
  const ids = opts.all ? candidateIds(config.root) : opts.id ? [opts.id] : []
  if (!opts.all && !opts.id) throw new UsageError('defect-check needs a candidate id, or --all.')
  if (opts.id && !existsSync(join(config.root, CANDIDATES_DIR, `${opts.id}.ts`)))
    throw new UsageError(`There is no candidate ${opts.id} in ${CANDIDATES_DIR}.`)
  if (ids.length === 0) {
    io.out('No candidates to check.')
    return 0
  }
  const outcomes: CheckOutcome[] = []
  for (const id of ids) {
    const o = await checkCandidate(config.root, id)
    outcomes.push(o)
    io.out(
      `${id}: ${o.pass ? 'pass' : `fail, ${o.reason}`}${o.visible ? '' : ' (the rendered page does not change)'}`,
    )
  }
  recordChecks(config.root, outcomes)
  const passed = outcomes.filter((o) => o.pass).length
  io.out(`${passed} of ${outcomes.length} passed. Results are in ${CANDIDATES_DIR}/README.md.`)
  return passed === outcomes.length ? 0 : 1
}
